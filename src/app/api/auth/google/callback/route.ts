import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isSafeNextPath, safeNextPath } from '@/lib/auth/safe-redirect';
import { routeAfterAuth } from '@/lib/auth/routing';
import { AGB_VERSION, DATENSCHUTZ_VERSION } from '@/app/auth/constants';

// SECURITY: Wie im /auth/callback — pre_reg_draft strikt validieren bevor
// wir den Inhalt an den DB-RPC weiterreichen.
const PreRegDraftSchema = z.object({
  firma_name: z.string().trim().max(200).optional().nullable(),
  zefix_uid: z.string().trim().max(50).optional().nullable(),
  firma_rechtsform: z.string().trim().max(50).optional().nullable(),
  firma_sitz_gemeinde: z.string().trim().max(120).optional().nullable(),
  branche_id: z.string().trim().max(50).optional().nullable(),
  kanton: z.string().trim().max(2).optional().nullable(),
  jahr: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  mitarbeitende: z.coerce.number().min(0).max(100_000).optional().nullable(),
  umsatz: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
  ebitda: z.coerce.number().min(-1_000_000_000).max(1_000_000_000).optional().nullable(),
  valuation: z.union([
    z.object({
      min: z.number().min(0).max(10_000_000_000).optional().nullable(),
      mid: z.number().min(0).max(10_000_000_000).optional().nullable(),
      max: z.number().min(0).max(10_000_000_000).optional().nullable(),
    }).passthrough(),
    z.null(),
  ]).optional(),
}).passthrough();
type PreRegDraft = z.infer<typeof PreRegDraftSchema>;
function parsePreRegDraft(raw: unknown): PreRegDraft | null {
  const result = PreRegDraftSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[google-callback] pre_reg_draft schema invalid — verwerfen');
    return null;
  }
  return result.data;
}

// Selber HMAC-Salt wie in middleware.ts und /api/beta — wir vergleichen
// das Cookie gegen `betaCookieValue(BETA_ACCESS_CODE)`.
function betaCookieValue(code: string): string {
  return createHmac('sha256', code).update('passare_beta_v1').digest('hex');
}

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

  // SECURITY: Beta-Gate auch im Google-Callback gegenchecken — sonst
  // kann ein Angreifer den Beta-Schutz via direkten OAuth-Link umgehen.
  if (process.env.BETA_GATE_ENABLED === 'true') {
    const beta = req.cookies.get('passare_beta')?.value;
    const expected = process.env.BETA_ACCESS_CODE
      ? betaCookieValue(process.env.BETA_ACCESS_CODE)
      : null;
    if (!beta || !expected || beta !== expected) {
      return errorRedirect(req, 'beta_required');
    }
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('passare_oauth_state')?.value;
  const verifier = cookieStore.get('passare_oauth_pkce')?.value;
  // SECURITY: `next` kommt aus `/api/auth/google/start` (Cookie) — der
  // wiederum kommt aus dem Query der Start-Route. Wir whitelisten daher
  // nochmal. Sonst Open-Redirect via `//evil.com`.
  const rawNext = cookieStore.get('passare_oauth_next')?.value ?? '/dashboard';
  const next = isSafeNextPath(rawNext) ? rawNext : '/dashboard';

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

  // Wiederkehrer-Erkennung: per geteiltem Helper berechnen.
  const routing = await routeAfterAuth(supabase, u.user, next);
  const isWiederkehrer = routing.isWiederkehrer;
  const hasInserat = routing.hasInserat;

  // Pre-Reg-Daten prüfen (nur ECHTE Funnel-Daten zählen).
  // SECURITY: Cookie wird strikt validiert via Zod-Schema.
  const preRegRaw = req.cookies.get('pre_reg_draft')?.value;
  let preReg: PreRegDraft | null = null;
  if (preRegRaw) {
    try {
      const parsed = JSON.parse(preRegRaw);
      preReg = parsePreRegDraft(parsed);
    } catch {
      preReg = null;
    }
  }
  const hasFreshPreReg: boolean = preReg !== null &&
    Boolean(preReg.firma_name || preReg.zefix_uid || preReg.branche_id);

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
  // Logik liegt im geteilten Helper `routeAfterAuth` (gleiches Verhalten wie
  // /auth/callback). Admins landen über die Rollen-Auswertung im Helper auf
  // /admin — der vorherige Bug (alle Wiederkehrer hart auf /dashboard/verkaeufer)
  // ist damit behoben.
  if (isWiederkehrer || hasInserat) {
    return buildFinalRedirect(`${siteUrl(req)}${routing.targetPath}`, true);
  }

  // Kein Pre-Reg-Flow → einfacher Redirect zur next-URL.
  // `next` ist oben bereits whitelist-validiert.
  if (!hasFreshPreReg || preReg === null) {
    return buildFinalRedirect(`${siteUrl(req)}${safeNextPath(next, '/dashboard')}`, true);
  }

  // ── NEUER User mit Pre-Reg-Daten — Auto-Onboarding via RPC ─────
  // preReg ist hier garantiert nicht null (durch Guard oben).
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
    p_agb_version: AGB_VERSION,
    p_datenschutz_version: DATENSCHUTZ_VERSION,
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
