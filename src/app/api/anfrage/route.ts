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
import { MOCK_LISTINGS } from '@/lib/listings-mock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const Input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  nachricht: z.string().trim().min(5).max(2000),
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

  // Listing nachschlagen — V1 aus Mock, später aus DB
  const listing = MOCK_LISTINGS.find((l) => l.id === body.listing_id);
  if (!listing) {
    return NextResponse.json({ error: 'Inserat nicht gefunden' }, { status: 404 });
  }

  // Signierten Token mit allen Daten erzeugen
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

  // Verifikations-Mail (fire-and-forget — sendEmail wirft nie)
  await sendEmail({
    template: 'verifizierung',
    to: body.email,
    vars: {
      name: body.name,
      verifyUrl,
    },
    subject_override: `Bitte E-Mail bestätigen — Anfrage zu «${listing.titel}»`,
  });

  return NextResponse.json({ ok: true });
}
