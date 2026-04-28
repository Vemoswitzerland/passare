// ════════════════════════════════════════════════════════════════════
// /onboarding — KEIN WIZARD mehr.
// ────────────────────────────────────────────────────────────────────
// Der 3-Step "Verkaufst-du-oder-kaufst-du?"-Wizard ist abgeschafft.
// Diese Page tut jetzt nur noch eines: Profile-Defaults setzen und
// User zum richtigen Bereich weiterleiten.
//
// Logik:
//   - Käufer-Indikatoren (intended_role=kaeufer ODER schon rolle=kaeufer)
//     → Käufer-Tunnel /onboarding/kaeufer/tunnel
//   - Verkäufer-Indikatoren (intended_role=verkaeufer ODER pre-reg-Cookies
//     ODER schon rolle=verkaeufer ODER GAR NICHTS — Default)
//     → Profile auf verkaeufer setzen + redirect zu /dashboard/verkaeufer/inserat/new
// ════════════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

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
    redirect('/dashboard/verkaeufer');
  }

  const cookieStore = await cookies();
  const hasPreRegCookie = !!cookieStore.get('pre_reg_draft')?.value;
  const hasIntentCookie = cookieStore.get('passare_intent_verkaeufer')?.value === '1';
  const intended = u.user.user_metadata?.intended_role;
  const fullName = u.user.user_metadata?.full_name ?? '';
  const sprache = u.user.user_metadata?.sprache ?? 'de';

  // Käufer-Erkennung
  const isKaeufer = intended === 'kaeufer' || profile?.rolle === 'kaeufer';

  if (isKaeufer) {
    // Profile als kaeufer markieren falls noch nicht — onboarding bleibt offen,
    // weil der Käufer-Tunnel das setzt.
    if (!profile) {
      await supabase.from('profiles').upsert({
        id: u.user.id, rolle: 'kaeufer', full_name: fullName, sprache,
      }, { onConflict: 'id' });
    }
    redirect('/onboarding/kaeufer/tunnel');
  }

  // Default = Verkäufer (alle anderen Fälle: explicit verkaeufer ODER
  // Pre-Reg-Cookies ODER nichts gesetzt)
  await supabase.from('profiles').upsert({
    id: u.user.id,
    rolle: 'verkaeufer',
    full_name: fullName,
    sprache,
    onboarding_completed_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Wenn Pre-Reg-Cookies da → mit ?from=pre-reg (nutzt Cookie-Daten),
  // sonst leeres Inserat
  redirect(hasPreRegCookie || hasIntentCookie
    ? '/dashboard/verkaeufer/inserat/new?from=pre-reg'
    : '/dashboard/verkaeufer/inserat/new');
}
