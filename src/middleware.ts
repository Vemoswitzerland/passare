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

// Diese Prefixe bleiben auch hinter dem Beta-Gate erreichbar.
// /api/anfrage muss public sein, weil die Verifikations-Mail-Links externe
// Browser-Sessions öffnen (frischer Cookie-Container, kein Beta-Cookie).
// /api/auth (Google OAuth + Supabase Auth) darf NIE blockiert werden — sonst
// entsteht ein Redirect-Loop wenn Google den User zurückleitet (Cross-Site-
// Redirect kann den passare_beta-Cookie wegen SameSite-Policy verlieren).
const BETA_PUBLIC_PREFIXES = ['/_next', '/assets', '/images', '/api/anfrage', '/api/auth'];

const AUTH_PROTECTED_PREFIXES = ['/dashboard', '/admin', '/onboarding'];
const AUTH_PUBLIC_PREFIXES = ['/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // x-pathname Header für Server-Components (Layouts können
  // aktuelle URL nicht direkt lesen). Wird von verkaeufer/layout.tsx
  // verwendet um Tunnel-Mode-Routing zu prüfen.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

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

  if (!hasSupabase) return NextResponse.next({ request: { headers: requestHeaders } });

  // Session-Refresh + User-Lookup nur auf Routen, die ihn brauchen.
  const needsAuth =
    AUTH_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    AUTH_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next({ request: { headers: requestHeaders } });

  return updateSession(req, requestHeaders);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
