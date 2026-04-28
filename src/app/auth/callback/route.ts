import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase-Redirect-Ziel für Bestätigungs- und Recovery-E-Mails.
 *
 * Akzeptiert sowohl `?code=…` (PKCE-Flow) als auch `?token_hash=…&type=…`
 * (klassischer OTP-Flow), tauscht in eine Session und leitet weiter.
 *
 * SPECIAL: Pre-Reg-Verkäufer (mit `pre_reg_draft`-Cookie) bekommen
 * Profile + Inserat automatisch angelegt — sie überspringen den
 * generischen 3-Step-Onboarding-Wizard ("Verkaufst du? Kaufst du?")
 * und landen direkt im Verkäufer-Bereich auf der Inserat-Edit-Seite.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // signup | recovery | invite | magiclink | email_change
  const next = searchParams.get('next') ?? '';

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

  // Recovery → direkter Redirect zur Confirm-Seite
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset/confirm`);
  }

  // ─── Pre-Reg-Verkäufer-Auto-Onboarding ──────────────────────────
  // Wenn der User aus dem /verkaufen/start-Funnel kommt, hat er:
  //  - intended_role=verkaeufer im user_metadata
  //  - einen pre_reg_draft Cookie mit Firma/Branche/Finanzen/Bewertung
  // Dann erledigen wir hier Onboarding + Inserat automatisch und
  // leiten direkt zu /dashboard/verkaeufer/inserat/[id]/edit.
  const { data: u } = await supabase.auth.getUser();
  const intendedRole = u.user?.user_metadata?.intended_role;
  const preRegRaw = req.cookies.get('pre_reg_draft')?.value;
  // Drittes Sicherheitsnetz: das langlebige Intent-Cookie. Wird beim
  // ersten Pre-Reg-Step gesetzt mit 7-Tagen-TTL, ohne httpOnly,
  // sameSite=lax — überlebt Google-OAuth-Redirects und Cookie-
  // Prevention-Settings zuverlässiger als der httpOnly draft-Cookie.
  const intentCookie = req.cookies.get('passare_intent_verkaeufer')?.value;

  // Pre-Reg-Verkäufer-Erkennung — DREIFACH-Schutz:
  //  1. user_metadata.intended_role (klassischer /auth/register Form)
  //  2. pre_reg_draft Cookie (httpOnly, mit Funnel-Daten)
  //  3. passare_intent_verkaeufer Cookie (non-httpOnly, langlebig,
  //     überlebt OAuth-Redirects + Browser-Privacy-Settings)
  const isPreRegVerkaeufer = u.user && (
    intendedRole === 'verkaeufer' ||
    !!preRegRaw ||
    intentCookie === '1'
  );
  if (isPreRegVerkaeufer) {
    let preReg: any = null;
    if (preRegRaw) {
      try { preReg = JSON.parse(preRegRaw); } catch { /* invalid */ }
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
      p_agb_version: '2026-04',
      p_datenschutz_version: '2026-04',
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

    // 3. Cookie clearen + Redirect zu Inserat-Edit (oder zu /new falls Inserat-Anlage fehlschlug)
    const targetUrl = inseratId
      ? `${origin}/dashboard/verkaeufer/inserat/${inseratId}/edit?from=pre-reg`
      : `${origin}/dashboard/verkaeufer/inserat/new?from=pre-reg`;
    const res = NextResponse.redirect(targetUrl);
    res.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
    res.cookies.set('passare_intent_verkaeufer', '', { maxAge: 0, path: '/' });
    return res;
  }

  // Standard-Flow: zu /dashboard, dort routet das Smart-Routing
  return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
}
