import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AuthShell } from '../auth/AuthShell';
import { OnboardingWizard } from './OnboardingWizard';
import { createClient } from '@/lib/supabase/server';
import { KANTONE } from '../auth/constants';

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
    .select('full_name, sprache, rolle, onboarding_completed_at')
    .eq('id', u.user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect('/dashboard');

  // ── Last-Resort-Fallback ────────────────────────────────────────
  // Falls der User VOM Pre-Reg-Funnel kommt (Cookie noch da) ABER der
  // Auth-Callback aus irgendeinem Grund nicht gegriffen hat, fangen
  // wir das hier ab. So landet niemand mehr im 3-Step "Verkaufst du
  // oder kaufst du?"-Wizard wenn er aus dem Verkaufs-Tunnel kommt.
  const cookieStore = await cookies();
  const hasPreRegCookie = !!cookieStore.get('pre_reg_draft')?.value;
  const hasIntentCookie = cookieStore.get('passare_intent_verkaeufer')?.value === '1';
  if (hasPreRegCookie || hasIntentCookie) {
    // Profile direkt auf verkaeufer setzen + onboarding fertig markieren
    const fullName = u.user.user_metadata?.full_name ?? '';
    await supabase
      .from('profiles')
      .upsert({
        id: u.user.id,
        rolle: 'verkaeufer',
        full_name: fullName,
        sprache: u.user.user_metadata?.sprache ?? 'de',
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    redirect('/dashboard/verkaeufer/inserat/new?from=pre-reg');
  }

  // Käufer-Tunnel überspringt den 3-Step-Wizard und nutzt Konversations-Onboarding
  const intended = u.user.user_metadata?.intended_role;
  if (intended === 'kaeufer' || profile?.rolle === 'kaeufer') {
    redirect('/onboarding/kaeufer/tunnel');
  }
  if (intended === 'verkaeufer' || profile?.rolle === 'verkaeufer') {
    // Verkäufer mit metadata aber ohne Cookie → Profile-Default + direkt zum Wizard
    await supabase
      .from('profiles')
      .upsert({
        id: u.user.id,
        rolle: 'verkaeufer',
        full_name: u.user.user_metadata?.full_name ?? '',
        sprache: u.user.user_metadata?.sprache ?? 'de',
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    redirect('/dashboard/verkaeufer/inserat/new');
  }

  return (
    <AuthShell
      overline="Schritt für Schritt"
      title="Lass uns dein Konto einrichten."
      intro="Drei kurze Schritte: Rolle wählen, Basis-Profil ausfüllen, bestätigen."
    >
      <OnboardingWizard
        defaultName={profile?.full_name ?? ''}
        defaultSprache={(profile?.sprache as 'de' | 'fr' | 'it' | 'en') ?? 'de'}
        kantone={KANTONE}
      />
    </AuthShell>
  );
}
