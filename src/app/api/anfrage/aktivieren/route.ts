/**
 * POST /api/anfrage/aktivieren
 *
 * Letzter Schritt im Anfrage-Flow:
 *   1. Token validieren (signiert + nicht abgelaufen)
 *   2. Käufer-Basic-Konto in Supabase Auth anlegen (email_confirm: true)
 *   3. Anfrage-Mail an info@passare.ch (Sammel-Inbox, da V1 ohne Verkäufer-DB)
 *   4. Welcome-Mail an Käufer (kosmetisch — bestätigt Konto-Anlage)
 *
 * Body: { token, passwort }
 * Response: { ok: true, listing_id } oder { error, status }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAnfrageToken } from '@/lib/anfrage-token';
import { sendEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/server';
import { MOCK_LISTINGS } from '@/lib/listings-mock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const Input = z.object({
  token: z.string().min(20),
  passwort: z.string().min(8).max(120),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Ungültige Eingabe';
    return NextResponse.json({ error: detail }, { status: 400 });
  }

  const payload = verifyAnfrageToken(body.token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Verifizierungs-Link ist ungültig oder abgelaufen.' },
      { status: 400 },
    );
  }

  const listing = MOCK_LISTINGS.find((l) => l.id === payload.l);

  // Käufer-Basic-Konto in Supabase Auth anlegen
  let createdUser = false;
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email: payload.e,
      password: body.passwort,
      email_confirm: true,
      user_metadata: { name: payload.n, role: 'kaeufer', tier: 'basic' },
    });
    if (error) {
      // Wenn User bereits existiert, ist das OK — Anfrage geht trotzdem raus
      const msg = error.message?.toLowerCase() ?? '';
      if (!msg.includes('already') && !msg.includes('registered')) {
        console.warn('[anfrage:aktivieren] createUser error:', error.message);
      }
    } else {
      createdUser = true;
    }
  } catch (err) {
    console.warn('[anfrage:aktivieren] admin client error:', err);
  }

  // Anfrage-Mail an Sammel-Inbox (V1 ohne Verkäufer-DB)
  await sendEmail({
    template: 'anfrage_eingegangen',
    to: 'info@passare.ch',
    vars: {
      verkaeuferName: 'Vermittlung passare',
      inseratTitel: listing?.titel ?? `Inserat ${payload.l}`,
      kaeuferTyp: `${payload.n} · ${payload.e}`,
      nachrichtSnippet: payload.m,
      anfrageId: payload.l,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare-ch.vercel.app',
    },
    subject_override: `Neue Anfrage: ${listing?.titel ?? payload.l}`,
  });

  // Welcome-Mail an Käufer (Konto-Bestätigung)
  if (createdUser) {
    await sendEmail({
      template: 'welcome',
      to: payload.e,
      vars: {
        name: payload.n,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare-ch.vercel.app'}/auth/login`,
      },
    });
  }

  return NextResponse.json({ ok: true, listing_id: payload.l });
}
