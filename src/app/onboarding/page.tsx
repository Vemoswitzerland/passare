// ════════════════════════════════════════════════════════════════════
// /onboarding — Rollen-Routing nach erstem Login
// ────────────────────────────────────────────────────────────────────
//  - intended_role bekannt ODER Pre-Reg-Cookie aktiv → direkt ins Ziel
//  - SONST: Rollenwahl-Page anzeigen (KEIN Default mehr — sonst werden
//    OAuth-User die nur einmal "Mit Google anmelden" geklickt haben
//    automatisch als Verkäufer markiert)
// ════════════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { RolleWaehlen } from './RolleWaehlen';
import { logoutAction } from '@/app/auth/actions';

export const metadata = {
  title: 'Konto einrichten — passare',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, onboarding_completed_at')
    .eq('id', u.user.id)
    .maybeSingle();

  // Schon onboarded → smart-redirect je nach Rolle
  if (profile?.onboarding_completed_at) {
    if (profile.rolle === 'admin') redirect('/admin');
    if (profile.rolle === 'kaeufer') redirect('/dashboard/kaeufer');
    if (profile.rolle === 'verkaeufer') redirect('/dashboard/verkaeufer');
  }

  const cookieStore = await cookies();
  const preRegRaw = cookieStore.get('pre_reg_draft')?.value;
  let preReg: any = null;
  if (preRegRaw) {
    try { preReg = JSON.parse(preRegRaw); } catch { /* invalid */ }
  }
  // Echter Pre-Reg-Flow nur wenn wir tatsächliche Funnel-Daten haben.
  const hasFreshPreReg = preReg && typeof preReg === 'object' &&
    (preReg.firma_name || preReg.zefix_uid || preReg.branche_id);

  const intended = u.user.user_metadata?.intended_role;
  const fullName = u.user.user_metadata?.full_name ?? '';
  const sprache = u.user.user_metadata?.sprache ?? 'de';

  // ── Broker-Indikator ──────────────────────────────────────────────
  if (intended === 'broker' || profile?.rolle === 'broker') {
    redirect('/onboarding/broker/tunnel');
  }

  // ── Eindeutige Käufer-Indikatoren ────────────────────────────────
  // Kaeufer wird in /onboarding/kaeufer/tunnel komplett geführt — wir
  // setzen hier nur die rolle, onboarding_completed_at folgt am Ende
  // des Tunnels via complete_onboarding-RPC.
  if (intended === 'kaeufer' || profile?.rolle === 'kaeufer') {
    redirect('/onboarding/kaeufer/tunnel');
  }

  // ── Eindeutige Verkäufer-Indikatoren ─────────────────────────────
  // KEIN direkter UPSERT auf profiles — RLS lässt rolle und
  // onboarding_completed_at nicht zu (nur der security-definer-RPC darf
  // das). Sonst entsteht ein Loop: upsert silent fail → onboarding bleibt
  // null → /dashboard redirected wieder zu /onboarding.
  if (intended === 'verkaeufer' || hasFreshPreReg) {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
    const ua = h.get('user-agent') ?? null;
    const kanton = (preReg?.kanton ?? '').toUpperCase().slice(0, 2) || 'ZH';

    const { error: completeErr } = await supabase.rpc('complete_onboarding', {
      p_rolle: 'verkaeufer',
      p_full_name: fullName || u.user.email?.split('@')[0] || 'User',
      p_kanton: kanton,
      p_sprache: sprache,
      p_agb_version: '2026-04',
      p_datenschutz_version: '2026-04',
      p_ip: ip,
      p_user_agent: ua,
    });

    if (completeErr) {
      console.warn('[onboarding] complete_onboarding fehlgeschlagen:', completeErr.message);
      // Fallback: Rollenwahl-Page anzeigen statt Loop riskieren
      // (User landet hier wenn z.B. Pre-Reg-Daten unvollständig)
    } else {
      if (hasFreshPreReg) {
        redirect('/dashboard/verkaeufer/inserat/new?from=pre-reg');
      }
      redirect('/dashboard/verkaeufer');
    }
  }

  // ── KEINE Indikatoren — User muss selbst wählen ──────────────────
  // (Klassischer OAuth-Login, ohne dass User vorher etwas geklickt hat.
  //  Wir markieren NICHT automatisch als Verkäufer.)
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <header className="border-b border-stone bg-paper">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <div className="flex items-center justify-between h-16">
            <span className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="text-caption text-quiet hover:text-navy transition-colors">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <p className="overline text-bronze mb-3 text-center">Konto eingerichtet</p>
          <h1 className="font-serif text-display-sm text-navy font-light text-center mb-4">
            Was möchtest du tun{fullName ? `, ${fullName.split(' ')[0]}` : ''}?
          </h1>
          <p className="text-body text-muted text-center mb-12">
            Wähle aus, ob du dein Unternehmen verkaufen oder ein Unternehmen kaufen möchtest.
          </p>

          <RolleWaehlen />
        </div>
      </section>

      <footer className="border-t border-stone py-6">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <p className="text-center text-caption text-quiet">
            passare — «Made in Switzerland»
          </p>
        </div>
      </footer>
    </main>
  );
}
