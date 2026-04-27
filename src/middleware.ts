import { NextRequest, NextResponse } from 'next/server';

/**
 * Beta-Gate Middleware
 *
 * Blockiert die komplette Site — ausser die Beta-Gate-Seite selbst und Assets —
 * bis der User den Beta-Code in einem Cookie hat.
 *
 * Disable: setze BETA_GATE_ENABLED=false in den Vercel Env Vars.
 */

const PUBLIC_PATHS = [
  '/beta',
  '/api/beta',
  '/status',
  '/api/status',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

const PUBLIC_PREFIXES = ['/_next', '/assets', '/images'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gate deaktiviert? Dann freier Zugriff.
  if (process.env.BETA_GATE_ENABLED !== 'true') return NextResponse.next();

  // Öffentliche Pfade immer erlauben
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Cookie prüfen
  const token = req.cookies.get('passare_beta')?.value;
  if (token && token === process.env.BETA_ACCESS_CODE) {
    return NextResponse.next();
  }

  // Sonst redirect auf Beta-Gate
  const url = req.nextUrl.clone();
  url.pathname = '/beta';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
