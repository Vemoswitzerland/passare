import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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
  res.cookies.set('passare_beta', valid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });
  return res;
}
