import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BrokerTunnelForm } from './BrokerTunnelForm';

export const metadata = {
  title: 'Broker-Onboarding — passare',
  robots: { index: false, follow: false },
};

export default async function BrokerTunnelPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  const [{ data: profile }, { data: brokerProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('rolle, onboarding_completed_at, full_name')
      .eq('id', u.user.id)
      .maybeSingle(),
    supabase
      .from('broker_profiles')
      .select('id')
      .eq('id', u.user.id)
      .maybeSingle(),
  ]);

  // Recovery-Pfad: Wenn rolle=broker, onboarding fertig und Broker-Profil existiert
  // → ab ins Dashboard. Falls Broker-Profil FEHLT (halbfertiges Onboarding),
  // erlauben wir Re-Entry zum Tunnel statt User stranden zu lassen.
  if (profile?.rolle === 'broker' && profile.onboarding_completed_at && brokerProfile) {
    redirect('/dashboard/broker');
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-stone bg-paper">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <div className="flex items-center h-16">
            <span className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </span>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <p className="overline text-bronze mb-3 text-center">Broker-Onboarding</p>
          <h1 className="font-serif text-display-sm text-navy font-light text-center mb-2">
            Deine Agentur einrichten
          </h1>
          <p className="text-body text-muted text-center mb-10">
            In 3 Schritten zur fertigen Broker-Präsenz auf passare.
          </p>

          <BrokerTunnelForm
            userName={profile?.full_name ?? u.user.user_metadata?.full_name ?? ''}
            userEmail={u.user.email ?? ''}
          />
        </div>
      </section>
    </main>
  );
}
