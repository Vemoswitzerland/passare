/**
 * POST /api/pre-reg
 * Speichert Pre-Reg-Funnel-Daten in httpOnly-Cookie (30 Min TTL).
 * Wird beim Onboarding/Inserat-Wizard wieder ausgelesen.
 *
 * GET /api/pre-reg → liefert aktuellen Stand zurück (für Resume).
 * DELETE /api/pre-reg → löscht (nach erfolgreichem Inserat-Create).
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE = 'pre_reg_draft';
const TTL_SECONDS = 30 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Defensiv: max 8KB, sonst rejecten
    const json = JSON.stringify(body);
    if (json.length > 8000) {
      return NextResponse.json({ error: 'payload too large' }, { status: 413 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, json, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TTL_SECONDS,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return NextResponse.json({ data: null });
  try {
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ data: null });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
