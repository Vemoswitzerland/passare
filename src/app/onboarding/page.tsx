import { redirect } from 'next/navigation';
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
