import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const STATUS_CODE = '2827';

export async function POST(req: NextRequest) {
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
