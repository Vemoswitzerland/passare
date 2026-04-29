/**
 * POST /api/anfrage/aktivieren
 *
 * Letzter Schritt im Anfrage-Flow:
 *   1. Token validieren (signiert + nicht abgelaufen)
 *   2. Käufer-Basic-Konto in Supabase Auth anlegen (email_confirm: true)
 *   3. Anfrage-Datensatz in `anfragen`-Tabelle (Service-Role) anlegen
 *   4. Anfrage-Mail an Verkäufer (aus `inserate.verkaeufer_id` → `auth.users.email`)
 *      + Sammel-Mail an info@passare.ch fürs Backoffice-Tracking
 *   5. Welcome-Mail an Käufer (kosmetisch — bestätigt Konto-Anlage)
 *
 * Body: { token, passwort }
 * Response: { ok: true, listing_id } oder { error, status }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAnfrageToken } from '@/lib/anfrage-token';
import { sendEmail } from '@/lib/email';
import { createAdminClient, createClient } from '@/lib/supabase/server';

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

  // Listing aus DB ziehen (Service-Role wegen RLS — verkaeufer_id ist in der
  // Public-View nicht enthalten, brauchen wir aber fürs Anfrage-Routing).
  const adminClient = createAdminClient();
  const { data: listing } = await adminClient
    .from('inserate')
    .select('id, titel, slug, verkaeufer_id')
    .eq('id', payload.l)
    .eq('status', 'live')
    .maybeSingle();

  // Käufer-Basic-Konto in Supabase Auth anlegen (oder existierenden User holen)
  let createdUser = false;
  let kaeuferId: string | null = null;
  try {
    const { data: createData, error } = await adminClient.auth.admin.createUser({
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
      // User existiert schon → ID via Lookup holen
      try {
        const { data: lookup } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', payload.e)
          .maybeSingle();
        if (lookup?.id) kaeuferId = lookup.id as string;
      } catch (lookupErr) {
        console.warn('[anfrage:aktivieren] profile-lookup error:', lookupErr);
      }
    } else {
      createdUser = true;
      kaeuferId = createData?.user?.id ?? null;
    }
  } catch (err) {
    console.warn('[anfrage:aktivieren] admin client error:', err);
  }

  // Auto-Login: Session-Tokens generieren UND zusätzlich an den Client zurückgeben,
  // damit dieser via supabase.auth.setSession() die Cookies sicher im Browser setzt.
  // (Die SSR-cookies()-API setzt zwar im Route-Handler — das war aber nicht zuverlässig
  // genug, weil der Hard-Redirect die fresh gesetzten Cookies nicht immer mitnimmt.)
  let session: { access_token: string; refresh_token: string } | null = null;
  try {
    const sb = await createClient();
    const { data, error: signInError } = await sb.auth.signInWithPassword({
      email: payload.e,
      password: body.passwort,
    });
    if (signInError) {
      console.warn('[anfrage:aktivieren] signInWithPassword:', signInError.message);
    } else if (data.session) {
      session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    }
  } catch (err) {
    console.warn('[anfrage:aktivieren] signIn-Exception:', err);
  }

  // Anfrage-Datensatz in `anfragen` anlegen — Service-Role bypasst die RLS-Policy
  // (auth.uid()=kaeufer_id), damit der Insert auch zuverlässig durchläuft falls die
  // Session noch nicht "richtig" am Browser ankam.
  let anfrageId: string | null = null;
  if (listing?.id && kaeuferId) {
    try {
      const { data: anfrageRow, error: anfrageErr } = await adminClient
        .from('anfragen')
        .insert({
          inserat_id: listing.id,
          kaeufer_id: kaeuferId,
          message: payload.m,
          status: 'neu',
        })
        .select('id')
        .maybeSingle();
      if (anfrageErr) {
        // UNIQUE-Verletzung (Käufer hat schon angefragt) ist OK
        const msg = anfrageErr.message?.toLowerCase() ?? '';
        if (!msg.includes('duplicate') && !msg.includes('unique')) {
          console.warn('[anfrage:aktivieren] anfragen-insert error:', anfrageErr.message);
        }
      } else {
        anfrageId = anfrageRow?.id ?? null;
      }
    } catch (err) {
      console.warn('[anfrage:aktivieren] anfragen-insert exception:', err);
    }
  }

  // Verkäufer-Email aus auth.users holen (Service-Role)
  let verkaeuferEmail: string | null = null;
  if (listing?.verkaeufer_id) {
    try {
      const { data: ownerData, error: ownerErr } = await adminClient.auth.admin.getUserById(
        listing.verkaeufer_id,
      );
      if (ownerErr) {
        console.warn('[anfrage:aktivieren] getUserById error:', ownerErr.message);
      } else {
        verkaeuferEmail = ownerData?.user?.email ?? null;
      }
    } catch (err) {
      console.warn('[anfrage:aktivieren] getUserById exception:', err);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare-ch.vercel.app';

  // Mail an Verkäufer (wenn Email vorhanden)
  if (verkaeuferEmail) {
    await sendEmail({
      template: 'anfrage_eingegangen',
      to: verkaeuferEmail,
      vars: {
        verkaeuferName: 'Verkäufer',
        inseratTitel: listing?.titel ?? `Inserat ${payload.l}`,
        kaeuferTyp: `${payload.n} · ${payload.e}`,
        nachrichtSnippet: payload.m,
        anfrageId: anfrageId ?? payload.l,
        appUrl,
        link: `${appUrl}/dashboard/verkaeufer/anfragen`,
      },
      subject_override: `Neue Anfrage: ${listing?.titel ?? payload.l}`,
      related_id: anfrageId ?? undefined,
    });
  }

  // Sammel-Mail an Backoffice
  await sendEmail({
    template: 'anfrage_eingegangen',
    to: 'info@passare.ch',
    vars: {
      verkaeuferName: 'Vermittlung passare',
      inseratTitel: listing?.titel ?? `Inserat ${payload.l}`,
      kaeuferTyp: `${payload.n} · ${payload.e}`,
      nachrichtSnippet: payload.m,
      anfrageId: anfrageId ?? payload.l,
      appUrl,
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
        loginUrl: `${appUrl}/auth/login`,
      },
    });
  }

  return NextResponse.json({ ok: true, listing_id: payload.l, session });
}
