import { NextRequest, NextResponse } from 'next/server';
import { betaCookieValue } from '@/lib/auth/beta-hmac';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Brute-Force-Schutz: max. 5 Versuche pro Minute pro IP.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'beta-attempt', 5);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

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
  res.cookies.set('passare_beta', await betaCookieValue(valid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
