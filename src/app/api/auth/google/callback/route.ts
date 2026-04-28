import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Empfängt den Google-OAuth-Callback und tauscht den Code gegen Tokens,
 * dann erstellt eine Supabase-Session via signInWithIdToken (offizieller
 * Supabase-Pfad für externe OAuth-Implementierungen).
 *
 * Voraussetzungen:
 * - Supabase Auth: Google Provider aktiviert + GOOGLE_CLIENT_ID in
 *   "Authorized Client IDs" eingetragen (damit signInWithIdToken durchgeht).
 * - Google Cloud Console: redirect_uri = https://passare.ch/api/auth/google/callback
 *   in der OAuth-Client-Konfig hinzugefügt.
 */

export const runtime = 'nodejs';

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const host = req.headers.get('host') ?? 'passare.ch';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

function clearCookies(res: NextResponse) {
  res.cookies.delete('passare_oauth_pkce');
  res.cookies.delete('passare_oauth_state');
  res.cookies.delete('passare_oauth_next');
}

function errorRedirect(req: NextRequest, code: string) {
  const url = new URL('/auth/login', req.url);
  url.searchParams.set('error', code);
  const res = NextResponse.redirect(url);
  clearCookies(res);
  return res;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const googleError = url.searchParams.get('error');

  if (googleError) return errorRedirect(req, `google_${googleError}`);
  if (!code || !state) return errorRedirect(req, 'oauth_missing_params');

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('passare_oauth_state')?.value;
  const verifier = cookieStore.get('passare_oauth_pkce')?.value;
  const next = cookieStore.get('passare_oauth_next')?.value ?? '/dashboard';

  if (!expectedState || state !== expectedState) return errorRedirect(req, 'oauth_state_mismatch');
  if (!verifier) return errorRedirect(req, 'oauth_pkce_missing');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return errorRedirect(req, 'oauth_config_missing');

  // ─── 1. Code → Token ───
  const callbackUrl = `${siteUrl(req)}/api/auth/google/callback`;
  let tokenJson: { id_token?: string; access_token?: string; error?: string };
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    tokenJson = await tokenRes.json();
  } catch {
    return errorRedirect(req, 'oauth_token_fetch_failed');
  }

  if (tokenJson.error || !tokenJson.id_token) {
    return errorRedirect(req, `oauth_token_error_${tokenJson.error ?? 'no_id_token'}`);
  }

  // ─── 2. Supabase-Session via signInWithIdToken ───
  // Wir bauen den SSR-Client manuell auf der Response — damit Auth-Cookies
  // direkt gesetzt werden bevor wir redirecten.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return errorRedirect(req, 'supabase_config_missing');

  const finalUrl = new URL(next, siteUrl(req));
  const res = NextResponse.redirect(finalUrl);
  clearCookies(res);

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokenJson.id_token,
  });

  if (error) {
    const errCode = encodeURIComponent(error.message ?? 'unknown');
    return errorRedirect(req, `supabase_signin_${errCode}`);
  }

  return res;
}
