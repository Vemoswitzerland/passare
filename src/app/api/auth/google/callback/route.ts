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

  // Wir sammeln die Auth-Cookies (mit Options!) in einem Array, damit
  // wir sie später auf den finalen Redirect mit korrektem httpOnly/secure
  // /sameSite kopieren können. NextResponse.cookies.getAll() liefert
  // keine Options zurück — daher das Buffer-Pattern.
  type AuthCookieToSet = { name: string; value: string; options?: CookieOptions };
  const authCookies: AuthCookieToSet[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet: AuthCookieToSet[]) {
        authCookies.push(...cookiesToSet);
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

  // ════════════════════════════════════════════════════════════════
  //  Auth-Cookies + Pre-Reg-Auto-Onboarding (analog /auth/callback)
  // ────────────────────────────────────────────────────────────────
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return errorRedirect(req, 'session_failed');
  }

  // Wiederkehrer-Erkennung: Account älter als 5 Min ODER hat schon Inserate
  const accountAgeMs = Date.now() - new Date(u.user.created_at).getTime();
  const isWiederkehrer = accountAgeMs > 5 * 60 * 1000;

  const { data: existingInserate } = await supabase
    .from('inserate')
    .select('id')
    .eq('verkaeufer_id', u.user.id)
    .limit(1);
  const hasInserat = (existingInserate?.length ?? 0) > 0;

  // Pre-Reg-Daten prüfen (nur ECHTE Funnel-Daten zählen)
  const preRegRaw = req.cookies.get('pre_reg_draft')?.value;
  let preReg: any = null;
  if (preRegRaw) {
    try { preReg = JSON.parse(preRegRaw); } catch { /* invalid */ }
  }
  const hasFreshPreReg = preReg && typeof preReg === 'object' &&
    (preReg.firma_name || preReg.zefix_uid || preReg.branche_id);

  // Helper: finalen Redirect mit Auth-Cookies (mit Options!) bauen
  function buildFinalRedirect(targetUrl: string, clearPreReg: boolean): NextResponse {
    const r = NextResponse.redirect(targetUrl);
    // Auth-Cookies mit korrekten Options (httpOnly, secure, sameSite) übertragen
    authCookies.forEach(({ name, value, options }) => {
      r.cookies.set(name, value, options);
    });
    // OAuth-Helper-Cookies löschen
    r.cookies.delete('passare_oauth_pkce');
    r.cookies.delete('passare_oauth_state');
    r.cookies.delete('passare_oauth_next');
    if (clearPreReg) {
      r.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
      r.cookies.set('passare_intent_verkaeufer', '', { maxAge: 0, path: '/' });
    }
    return r;
  }

  // Wiederkehrer ODER hat schon Inserate → rolle-basiert ins richtige Dashboard.
  //
  // VORHER (Bug): hart auf /dashboard/verkaeufer für ALLE Wiederkehrer —
  // Admins (info@vemo.ch) landeten dadurch nach jedem Google-Login fälschlich
  // im Verkäufer-Bereich. Jetzt prüfen wir die Profil-Rolle direkt:
  //   admin       → /admin
  //   kaeufer     → /dashboard/kaeufer
  //   verkaeufer  → /dashboard/verkaeufer
  //   null + hasInserat → /dashboard/verkaeufer (Verkäufer-Default)
  //   sonst       → /dashboard (Fallback-Router)
  if (isWiederkehrer || hasInserat) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle')
      .eq('id', u.user.id)
      .maybeSingle();

    // Sales-CTAs (z.B. "Käufer+ buchen") setzen einen spezifischen `next`.
    // Wenn der zum Bereich des Wiederkehrers passt → Vorrang, sonst
    // routen wir defensiv ins zugehörige Dashboard.
    const nextMatchesRole =
      next && next !== '/dashboard' && (
        (profile?.rolle === 'admin' && next.startsWith('/admin')) ||
        (profile?.rolle === 'broker' && next.startsWith('/dashboard/broker')) ||
        (profile?.rolle === 'kaeufer' && (next.startsWith('/dashboard/kaeufer') || next.startsWith('/onboarding/kaeufer'))) ||
        (profile?.rolle === 'verkaeufer' && (next.startsWith('/dashboard/verkaeufer') || next.startsWith('/verkaufen')))
      );

    const targetPath = nextMatchesRole
      ? next
      : profile?.rolle === 'admin' ? '/admin'
      : profile?.rolle === 'broker' ? '/dashboard/broker'
      : profile?.rolle === 'kaeufer' ? '/dashboard/kaeufer'
      : profile?.rolle === 'verkaeufer' ? '/dashboard/verkaeufer'
      : hasInserat ? '/dashboard/verkaeufer'
      : '/dashboard';

    return buildFinalRedirect(`${siteUrl(req)}${targetPath}`, true);
  }

  // Kein Pre-Reg-Flow → einfacher Redirect zur next-URL
  if (!hasFreshPreReg) {
    return buildFinalRedirect(new URL(next, siteUrl(req)).toString(), true);
  }

  // ── NEUER User mit Pre-Reg-Daten — Auto-Onboarding via RPC ─────
  const fullName = u.user.user_metadata?.full_name ?? u.user.email?.split('@')[0] ?? 'User';
  const sprache = u.user.user_metadata?.sprache ?? 'de';
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = req.headers.get('user-agent') ?? null;
  const kanton = (preReg?.kanton ?? '').toUpperCase().slice(0, 2) || 'ZH';

  // 1. Profile fertigstellen via RPC (security definer — darf rolle + onboarding_completed_at setzen)
  const { error: completeErr } = await supabase.rpc('complete_onboarding', {
    p_rolle: 'verkaeufer',
    p_full_name: fullName,
    p_kanton: kanton,
    p_sprache: sprache,
    p_agb_version: '2026-04',
    p_datenschutz_version: '2026-04',
    p_ip: ip,
    p_user_agent: ua,
  });
  if (completeErr) {
    console.warn('[google-callback] complete_onboarding fehlgeschlagen:', completeErr.message);
  }

  // 2. Inserat aus Pre-Reg-Daten anlegen
  let inseratId: string | null = null;
  const { data: createdId, error: insErr } = await supabase.rpc('create_inserat_from_pre_reg', {
    p: {
      zefix_uid: preReg.zefix_uid ?? null,
      firma_name: preReg.firma_name ?? null,
      firma_rechtsform: preReg.firma_rechtsform ?? null,
      firma_sitz_gemeinde: preReg.firma_sitz_gemeinde ?? null,
      branche_id: preReg.branche_id ?? null,
      kanton,
      jahr: preReg.jahr ?? null,
      mitarbeitende: preReg.mitarbeitende ?? null,
      umsatz: preReg.umsatz ?? null,
      ebitda: preReg.ebitda ?? null,
      valuation: preReg.valuation ?? null,
    },
  });
  if (insErr) {
    console.warn('[google-callback] create_inserat_from_pre_reg fehlgeschlagen:', insErr.message);
  } else {
    inseratId = createdId as string;
  }

  // 3. Final-Redirect mit Cookie-Cleanup
  const targetUrl = inseratId
    ? `${siteUrl(req)}/dashboard/verkaeufer/inserat/${inseratId}/edit?from=pre-reg`
    : `${siteUrl(req)}/dashboard/verkaeufer/inserat/new?from=pre-reg`;
  return buildFinalRedirect(targetUrl, true);
}
