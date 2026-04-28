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

  if (u.user && intendedRole === 'verkaeufer' && preRegRaw) {
    let preReg: any = null;
    try { preReg = JSON.parse(preRegRaw); } catch { /* invalid */ }

    if (preReg && typeof preReg === 'object') {
      const fullName = u.user.user_metadata?.full_name ?? '';
      const sprache = u.user.user_metadata?.sprache ?? 'de';
      const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
      const ua = req.headers.get('user-agent') ?? null;

      // 1. Profile fertigstellen (rolle=verkaeufer, AGB akzeptiert)
      const { error: completeErr } = await supabase.rpc('complete_onboarding', {
        p_rolle: 'verkaeufer',
        p_full_name: fullName,
        p_kanton: (preReg.kanton ?? '').toUpperCase().slice(0, 2),
        p_sprache: sprache,
        p_agb_version: '2026-04',
        p_datenschutz_version: '2026-04',
        p_ip: ip,
        p_user_agent: ua,
      });

      if (!completeErr) {
        // 2. Inserat aus Pre-Reg-Daten anlegen
        const inseratPayload = {
          zefix_uid: preReg.zefix_uid ?? null,
          firma_name: preReg.firma_name ?? null,
          firma_rechtsform: preReg.firma_rechtsform ?? null,
          firma_sitz_gemeinde: preReg.firma_sitz_gemeinde ?? null,
          branche_id: preReg.branche_id ?? null,
          kanton: (preReg.kanton ?? '').toUpperCase().slice(0, 2),
          jahr: preReg.jahr ?? null,
          mitarbeitende: preReg.mitarbeitende ?? null,
          umsatz: preReg.umsatz ?? null,
          ebitda: preReg.ebitda ?? null,
          valuation: preReg.valuation ?? null,
        };
        const { data: inseratId } = await supabase.rpc(
          'create_inserat_from_pre_reg',
          { p: inseratPayload },
        );

        // 3. Cookie clearen + Redirect zu Inserat-Edit
        const targetUrl = inseratId
          ? `${origin}/dashboard/verkaeufer/inserat/${inseratId}/edit?from=pre-reg`
          : `${origin}/dashboard/verkaeufer/inserat/new?from=pre-reg`;
        const res = NextResponse.redirect(targetUrl);
        res.cookies.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
        return res;
      }
    }
  }

  // Standard-Flow: zu /dashboard, dort routet das Smart-Routing
  return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
}
