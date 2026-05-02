import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../AuthShell';
import { RegisterForm } from '../RegisterForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Konto erstellen — passare',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ role?: string; plan?: string; paket?: string; next?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Schon eingeloggt: smart-routen je nach Intent (statt /dashboard-Loop).
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle, onboarding_completed_at, subscription_tier, is_broker')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = sp.role;

    // Käufer-Intent
    if (role === 'kaeufer') {
      if (profile?.rolle === 'kaeufer' && profile.onboarding_completed_at) {
        // Schon Käufer: zum Plan-Endpoint oder direkt ins Dashboard
        if (sp.plan === 'plus' && profile.subscription_tier !== 'plus' && !profile.is_broker) {
          redirect('/dashboard/kaeufer/abo');
        }
        redirect('/dashboard/kaeufer');
      }
      redirect('/onboarding/kaeufer/tunnel');
    }

    // Broker-Intent
    if (role === 'broker') {
      if (profile?.rolle === 'broker' && profile.onboarding_completed_at) {
        redirect('/dashboard/broker');
      }
      redirect('/onboarding/broker/tunnel');
    }

    // Verkäufer-Intent
    if (role === 'verkaeufer') {
      if (profile?.rolle === 'verkaeufer' && profile.onboarding_completed_at) {
        redirect('/dashboard/verkaeufer');
      }
      redirect('/verkaufen/start');
    }

    // Sonst: aufs zugehörige Dashboard je nach existierender Rolle
    if (profile?.rolle === 'admin') redirect('/admin');
    if (profile?.rolle === 'broker') redirect('/dashboard/broker');
    if (profile?.rolle === 'kaeufer') redirect('/dashboard/kaeufer');
    if (profile?.rolle === 'verkaeufer') redirect('/dashboard/verkaeufer');
    redirect('/onboarding');
  }

  // Dynamisch je nach intended_role
  const role = sp.role;
  const overline =
    role === 'broker' ? 'Als Agentur registrieren' :
    role === 'kaeufer' ? 'Als Käufer registrieren' :
    role === 'verkaeufer' ? 'Inserat starten' :
    'Kostenlos registrieren';
  const title =
    role === 'broker' ? 'Agentur-Konto erstellen.' :
    role === 'kaeufer' ? (sp.plan === 'plus' ? 'Käufer+ buchen.' : 'Käufer-Konto erstellen.') :
    role === 'verkaeufer' ? 'Verkäufer-Konto erstellen.' :
    'Konto erstellen.';
  const intro =
    role === 'broker' ? <>Mandate verwalten und im Marktplatz suchen — beides in einem Konto. Nach der Registrierung führen wir dich direkt zum Agentur-Onboarding.</> :
    role === 'kaeufer' ? <>Schweizer KMU finden, Anfragen stellen und Inserate speichern. Nach der Registrierung richten wir in 2 Schritten dein Käuferprofil ein.</> :
    role === 'verkaeufer' ? <>Inserat anonym aufschalten, Anfragen empfangen, im Datenraum verhandeln. Nach der Registrierung legst du dein Inserat an.</> :
    <>Lege dein passare-Konto an. In einem nächsten Schritt wählst du, ob du <em>verkaufen</em> oder <em>kaufen</em> möchtest.</>;

  return (
    <AuthShell
      overline={overline}
      title={title}
      intro={intro}
      footer={
        <>
          Bereits registriert?&nbsp;
          <Link href="/auth/login" className="editorial text-navy">
            Hier anmelden
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
