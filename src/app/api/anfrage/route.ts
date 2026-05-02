/**
 * POST /api/anfrage
 *
 * Empfängt eine Käufer-Anfrage zu einem Inserat, generiert einen
 * signierten Verifikations-Token und versendet eine Bestätigungs-Mail
 * via Resend (über die Supabase Edge-Function `send-email`).
 *
 * Body: { name, email, nachricht, listing_id, listing_titel }
 *
 * Response: { ok: true } oder { error: string, status: 400|429|500 }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAnfrageToken } from '@/lib/anfrage-token';
import { sendEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const Input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  nachricht: z.string().trim().min(5).max(8000),
  listing_id: z.string().min(1).max(60),
});

export async function POST(req: NextRequest) {
  // Rate-Limit: max 5 Anfragen pro Minute pro IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'anfrage', 5);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Ungültige Eingabe';
    return NextResponse.json({ error: detail }, { status: 400 });
  }

  // Listing aus DB nachschlagen — Service-Role umgeht RLS, sodass
  // Inserate auch für anonyme User sichtbar sind (sonst 404 trotz live).
  // Akzeptiert UUID oder public_id (kurze ID aus URL).
  const admin = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.listing_id);
  const filter = isUuid ? { id: body.listing_id } : { public_id: body.listing_id };
  const { data: listing } = await admin
    .from('inserate')
    .select('id, titel, public_id, verkaeufer_id, status')
    .match(filter)
    .maybeSingle();

  if (!listing || listing.status !== 'live') {
    return NextResponse.json({ error: 'Inserat nicht gefunden' }, { status: 404 });
  }

  // ── Eingeloggten User direkt erkennen — kein Mail-Verify-Loop ──
  // Vorher: jede Anfrage ging über die Token-Mail. Eingeloggte Käufer
  // klickten nicht, weil sie schon eingeloggt waren — Anfrage landete
  // nie in der DB und nicht in der Inbox.
  const userClient = await createClient();
  const { data: authData } = await userClient.auth.getUser();
  if (authData.user) {
    const { data: anfrageRow, error: insErr } = await admin
      .from('anfragen')
      .insert({
        inserat_id: listing.id,
        kaeufer_id: authData.user.id,
        nachricht: body.nachricht,
        status: 'neu',
      })
      .select('id')
      .maybeSingle();

    if (insErr) {
      const dup = /duplicate|unique/i.test(insErr.message ?? '');
      if (!dup) {
        console.warn('[anfrage] insert error:', insErr.message);
        return NextResponse.json({ error: 'Anfrage konnte nicht gespeichert werden.' }, { status: 500 });
      }
    }

    // Erste Chat-Message anlegen — sonst zeigt die Inbox einen leeren Thread
    if (anfrageRow?.id) {
      await admin.from('anfrage_messages').insert({
        anfrage_id: anfrageRow.id,
        from_user: authData.user.id,
        from_role: 'kaeufer',
        message: body.nachricht,
      });
    }

    // Verkäufer per Mail benachrichtigen
    if (listing.verkaeufer_id) {
      const { data: ownerData } = await admin.auth.admin.getUserById(listing.verkaeufer_id);
      const verkaeuferEmail = ownerData?.user?.email ?? null;
      if (verkaeuferEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare-ch.vercel.app';
        await sendEmail({
          template: 'anfrage_eingegangen',
          to: verkaeuferEmail,
          vars: {
            verkaeuferName: 'Verkäufer',
            inseratTitel: listing.titel,
            kaeuferTyp: `${body.name} · ${body.email}`,
            nachrichtSnippet: body.nachricht,
            anfrageId: anfrageRow?.id ?? listing.id,
            appUrl,
            link: `${appUrl}/dashboard/verkaeufer/anfragen`,
          },
          subject_override: `Neue Anfrage: ${listing.titel}`,
          related_id: anfrageRow?.id ?? undefined,
        });
      }
    }

    return NextResponse.json({ ok: true, anfrageId: anfrageRow?.id ?? null, direct: true });
  }

  // ── Nicht eingeloggt: klassischer Email-Verify-Flow ─────────────
  const token = createAnfrageToken({
    n: body.name,
    e: body.email,
    l: body.listing_id,
    m: body.nachricht,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    `https://${req.headers.get('host')}`;
  const verifyUrl = `${baseUrl}/anfrage/passwort?token=${encodeURIComponent(token)}`;

  await sendEmail({
    template: 'verifizierung',
    to: body.email,
    vars: {
      name: body.name,
      verifyUrl,
    },
    subject_override: `Bitte E-Mail bestätigen — Anfrage zu «${listing.titel}»`,
  });

  return NextResponse.json({ ok: true, direct: false });
}
