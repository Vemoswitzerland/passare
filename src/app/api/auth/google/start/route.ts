import { randomBytes, createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Initiiert eigenen Google-OAuth-Flow mit redirect_uri auf passare.ch.
 *
 * Warum eigene Route statt Supabase-OAuth:
 * → Google zeigt im Consent-Screen die Domain des redirect_uri.
 * → Mit Supabase-Default zeigt Google "ocbrjivpnsmxriyskgjx.supabase.co"
 * → Mit eigenem Callback auf passare.ch zeigt Google "passare.ch"
 *
 * Der Token-Exchange + Supabase-Session-Anlage passiert in /api/auth/google/callback.
 */

export const runtime = 'nodejs';

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function siteUrl(req: NextRequest): string {
  // Force-https für passare.ch — local-dev kann auch http sein
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const host = req.headers.get('host') ?? 'passare.ch';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') ?? '/dashboard';
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_config_missing', req.url));
  }

  // PKCE
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  const state = base64url(randomBytes(16));

  const callbackUrl = `${siteUrl(req)}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const res = NextResponse.redirect(authUrl);

  // 10 Min TTL für die OAuth-Cookies
  const cookieOpts = {
    httpOnly: true as const,
    secure: !req.url.startsWith('http://localhost'),
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
  };
  res.cookies.set('passare_oauth_pkce', verifier, cookieOpts);
  res.cookies.set('passare_oauth_state', state, cookieOpts);
  res.cookies.set('passare_oauth_next', next, cookieOpts);

  return res;
}
