import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

/**
 * Setzt das Beta-Cookie als HMAC(code) — Klartext-Code wird NIE persistiert.
 * Selber HMAC-Salt wie in middleware.ts (`betaCookieValue`).
 */
function betaCookieValue(code: string): string {
  return createHmac('sha256', code).update('passare_beta_v1').digest('hex');
}

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: '' }));

  const valid = process.env.BETA_ACCESS_CODE;
  if (!valid) {
    return NextResponse.json({ error: 'Beta-Gate nicht konfiguriert' }, { status: 500 });
  }

  if (code !== valid) {
    // Kleine Verzögerung gegen Brute-Force
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Ungültiger Code' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // SECURITY: HMAC statt Klartext — Cookie-Klau enthüllt nicht den Code.
  res.cookies.set('passare_beta', betaCookieValue(valid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
