import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Two-stage middleware:
 *  1) Beta-Gate (Cookie passare_beta) — blockiert die ganze Site bis der
 *     Beta-Code eingegeben wurde. Auth-Pages liegen HINTER dem Beta-Gate.
 *  2) Supabase-Session-Refresh — sobald die Auth-Pages aktiv sind,
 *     muss bei jedem Request der Token erneuert werden.
 */

const BETA_PUBLIC_PATHS = new Set([
  '/beta',
  '/api/beta',
  '/status',
  '/api/status',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

const BETA_PUBLIC_PREFIXES = ['/_next', '/assets', '/images'];

const AUTH_PROTECTED_PREFIXES = ['/dashboard', '/admin', '/onboarding'];
const AUTH_PUBLIC_PREFIXES = ['/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1) Beta-Gate ──────────────────────────────────────────
  if (process.env.BETA_GATE_ENABLED === 'true') {
    const isPublic =
      BETA_PUBLIC_PATHS.has(pathname) ||
      BETA_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isPublic) {
      const beta = req.cookies.get('passare_beta')?.value;
      if (!beta || beta !== process.env.BETA_ACCESS_CODE) {
        const url = req.nextUrl.clone();
        url.pathname = '/beta';
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // ── 2) Supabase-Session ──────────────────────────────────
  // Nur wenn Supabase überhaupt konfiguriert ist (vor Etappe 2: nicht).
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) return NextResponse.next();

  // Session-Refresh + User-Lookup nur auf Routen, die ihn brauchen.
  const needsAuth =
    AUTH_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    AUTH_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  return updateSession(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
