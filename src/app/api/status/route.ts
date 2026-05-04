import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Auf nodejs umgestellt, weil das DB-basierte Rate-Limit den Service-Role-
// Client benötigt (nicht Edge-kompatibel). Status-Endpoint wird selten
// aufgerufen, kein Performance-Issue.
export const runtime = 'nodejs';

// Code aus ENV, Fallback nur für lokale Dev (Vercel sollte STATUS_CODE setzen).
const STATUS_CODE = process.env.STATUS_CODE ?? '2827';

export async function POST(req: NextRequest) {
  // Brute-Force-Schutz: max. 5 Versuche pro Minute pro IP.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, 'status-attempt', 5);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { code } = await req.json().catch(() => ({ code: '' }));

  if (code !== STATUS_CODE) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Ungültiger Code' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('passare_status', STATUS_CODE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
