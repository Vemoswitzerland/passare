import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSafeNextPath, safeNextPath } from '@/lib/auth/safe-redirect';
import { routeAfterAuth } from '@/lib/auth/routing';
import { AGB_VERSION, DATENSCHUTZ_VERSION } from '@/app/auth/constants';

// SECURITY: pre_reg_draft kommt vom Browser-Cookie und wird an einen
// security-definer-RPC weitergereicht — daher MÜSSEN wir vor der
// Übergabe schema-validieren und Bounds checken.
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
    console.warn('[auth-callback] pre_reg_draft schema invalid — verwerfen');
    return null;
  }
  return result.data;
}

/**
 * Supabase-Redirect-Ziel für Bestätigungs- und Recovery-E-Mails.
 *
 * Akzeptiert sowohl `?code=…` (PKCE-Flow) als auch `?token_hash=…&type=…`
 * (klassischer OTP-Flow), tauscht in eine Session und leitet weiter.
 *
 * SPECIAL: Pre-Reg-Verkäufer (mit `pre_reg_draft`-Cookie) bekommen beim
 * ALLERERSTEN Login Profile + Inserat automatisch angelegt — sie über-
 * springen den generischen 3-Step-Onboarding-Wizard und landen direkt
 * im Verkäufer-Bereich auf der Inserat-Edit-Seite.
 *
 * KEY: "Wiederkehrer-Erkennung" via Account-Alter (>5 Min) — verhindert
 * den klassischen Bug, dass beim 2. Login mit altem Intent-Cookie
 * nochmal ein neues Inserat angelegt wird und der User in den Tunnel
 * geworfen wird.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // signup | recovery | invite | magiclink | email_change
  // SECURITY: `next` MUSS validiert werden — sonst Open-Redirect via `//evil.com`.
  const rawNext = searchParams.get('next') ?? '';
  const next = isSafeNextPath(rawNext) ? rawNext : '';

  const supabase = await createClient();

  // PKCE-Flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }
  // OTP/Token-Hash-Flow
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    });
    if (error) return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_callback`);
  }

  // Recovery → direkter Redirect zur Confirm-Seite.
  // SECURITY: Recovery-Session ist sofort eingeloggt — würde der User
  // einfach navigieren, käme er aufs Dashboard ohne neues Passwort.
  // Wir setzen ein kurzlebiges Cookie das die Middleware bei jedem Request
  // gegenchecken kann; bis das Passwort neu gesetzt ist (updatePasswordAction
  // räumt das Cookie weg) sind alle Routes ausser /auth/reset/confirm gesperrt.
  if (type === 'recovery') {
    const res = NextResponse.redirect(`${origin}/auth/reset/confirm`);
    res.cookies.set('passare_recovery_only', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 30, // 30 Minuten
    });
    return res;
  }

  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
  }

  // ════════════════════════════════════════════════════════════════
  //  WIEDERKEHRER-ERKENNUNG via geteiltem Helper.
  //  Wenn das Auth-Account schon älter als 5 Min ist ODER der User
  //  schon ein Inserat hat → kein neues Inserat aus Pre-Reg-Daten,
  //  immer rolle-basiert ins Dashboard, Cookies clearen.
  // ════════════════════════════════════════════════════════════════
  const routing = await routeAfterAuth(supabase, u.user, next);
  if (routing.isWiederkehrer || routing.hasInserat) {
    const targetUrl = `${origin}${routing.targetPath}`;
    const res = NextResponse.redirect(targetUrl);
    res.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
    res.cookies.set('passare_intent_verkaeufer', '', { maxAge: 0, path: '/' });
    return res;
  }

  // ════════════════════════════════════════════════════════════════
  //  NEUER USER — Pre-Reg-Auto-Onboarding (1× pro Lifecycle)
  // ────────────────────────────────────────────────────────────────
  //  KEY: Nur ECHTE Pre-Reg-Daten triggern den Auto-Flow. Das langlebige
  //  `passare_intent_verkaeufer` Cookie alleine reicht NICHT — es kann
  //  vom letzten Funnel-Versuch übrig sein (7 Tage TTL). Ohne
  //  `pre_reg_draft` (mit echten Firma-/Bewertungs-Daten) ist es stale
  //  und wird ignoriert.
  // ════════════════════════════════════════════════════════════════
  const preRegRaw = req.cookies.get('pre_reg_draft')?.value;
  let preReg: PreRegDraft | null = null;
  if (preRegRaw) {
    try {
      const parsed = JSON.parse(preRegRaw);
      // SECURITY: Cookie kommt vom Browser — vor Weitergabe an die DB-RPC
      // strikt validieren. Sonst kann ein Angreifer mit forge'd Cookie
      // beliebige Werte (auch Numbers ausserhalb von Bounds) durchreichen.
      preReg = parsePreRegDraft(parsed);
    } catch {
      preReg = null;
    }
  }

  const hasFreshPreReg = preReg !== null &&
    (preReg.firma_name || preReg.zefix_uid || preReg.branche_id);

  if (!hasFreshPreReg) {
    // Kein echter Pre-Reg-Flow → Cookies clearen + Dashboard.
    // `next` ist oben bereits whitelist-validiert.
    const targetUrl = `${origin}${safeNextPath(next, '/dashboard')}`;
    const res = NextResponse.redirect(targetUrl);
    res.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
    res.cookies.set('passare_intent_verkaeufer', '', { maxAge: 0, path: '/' });
    return res;
  }

  const fullName = u.user.user_metadata?.full_name ?? '';
  const sprache = u.user.user_metadata?.sprache ?? 'de';
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = req.headers.get('user-agent') ?? null;
  const kanton = (preReg?.kanton ?? '').toUpperCase().slice(0, 2);

  // 1. Profile fertigstellen — wichtig: verhindert Onboarding-Loop
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
    console.warn('[auth-callback] complete_onboarding fehlgeschlagen:', completeErr.message);
    // Fallback: direktes Update auf profiles um Onboarding-Loop zu vermeiden
    await supabase
      .from('profiles')
      .upsert({
        id: u.user.id,
        rolle: 'verkaeufer',
        full_name: fullName,
        kanton: kanton || null,
        sprache,
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: 'id' });
  }

  // 2. Inserat aus Pre-Reg-Daten anlegen (nur wenn Cookie da war)
  let inseratId: string | null = null;
  if (preReg && typeof preReg === 'object') {
    const { data, error: insErr } = await supabase.rpc('create_inserat_from_pre_reg', {
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
      console.warn('[auth-callback] create_inserat_from_pre_reg fehlgeschlagen:', insErr.message);
    } else {
      inseratId = data as string;
    }
  }

  // 3. Cookies clearen + Redirect zu Inserat-Edit (oder zu /new falls Inserat-Anlage fehlschlug)
  const targetUrl = inseratId
    ? `${origin}/dashboard/verkaeufer/inserat/${inseratId}/edit?from=pre-reg`
    : `${origin}/dashboard/verkaeufer/inserat/new?from=pre-reg`;
  const res = NextResponse.redirect(targetUrl);
  res.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
  res.cookies.set('passare_intent_verkaeufer', '', { maxAge: 0, path: '/' });
  return res;
}
