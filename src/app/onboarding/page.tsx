// ════════════════════════════════════════════════════════════════════
// /onboarding — Rollen-Routing nach erstem Login
// ────────────────────────────────────────────────────────────────────
//  - intended_role bekannt ODER Pre-Reg-Cookie aktiv → direkt ins Ziel
//  - SONST: Rollenwahl-Page anzeigen (KEIN Default mehr — sonst werden
//    OAuth-User die nur einmal "Mit Google anmelden" geklickt haben
//    automatisch als Verkäufer markiert)
// ════════════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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

  // ── Eindeutige Käufer-Indikatoren ────────────────────────────────
  if (intended === 'kaeufer' || profile?.rolle === 'kaeufer') {
    if (!profile) {
      await supabase.from('profiles').upsert({
        id: u.user.id, rolle: 'kaeufer', full_name: fullName, sprache,
      }, { onConflict: 'id' });
    }
    redirect('/onboarding/kaeufer/tunnel');
  }

  // ── Eindeutige Verkäufer-Indikatoren ─────────────────────────────
  if (intended === 'verkaeufer' || hasFreshPreReg) {
    await supabase.from('profiles').upsert({
      id: u.user.id,
      rolle: 'verkaeufer',
      full_name: fullName,
      sprache,
      onboarding_completed_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (hasFreshPreReg) {
      redirect('/dashboard/verkaeufer/inserat/new?from=pre-reg');
    }
    redirect('/dashboard/verkaeufer');
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
