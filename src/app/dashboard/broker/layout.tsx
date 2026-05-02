import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { BrokerShell } from './components/Shell';

export const metadata = {
  title: 'Broker-Dashboard — passare',
  robots: { index: false, follow: false },
};

// Layout zeigt tier + counts — die ändern sich häufig (Paket-Wechsel, neue
// Anfrage, neues Mandat). Dynamisch rendern, sonst sieht der User Stale-Daten.
export const dynamic = 'force-dynamic';

export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login?next=/dashboard/broker');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, rolle, onboarding_completed_at')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed_at) {
    redirect('/onboarding');
  }
  if (profile.rolle !== 'broker' && profile.rolle !== 'admin') {
    if (profile.rolle === 'verkaeufer') redirect('/dashboard/verkaeufer');
    if (profile.rolle === 'kaeufer') redirect('/dashboard/kaeufer');
    redirect('/onboarding');
  }

  let tier: string | null = null;
  let counts = { mandateActive: 0, anfragenNeu: 0, suchprofile: 0, teamMembers: 0 };

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('tier, subscription_status')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (bp) {
      tier = bp.tier;
    }

    if (await hasTable('inserate')) {
      const { count: mandateCount } = await supabase
        .from('inserate')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', userData.user.id)
        .not('status', 'in', '("verkauft","abgelaufen")');
      counts.mandateActive = mandateCount ?? 0;
    }

    if (await hasTable('anfragen') && await hasTable('inserate')) {
      const { data: brokerInserate } = await supabase
        .from('inserate')
        .select('id')
        .eq('broker_id', userData.user.id);

      if (brokerInserate && brokerInserate.length > 0) {
        const inseratIds = brokerInserate.map((i: { id: string }) => i.id);
        const { count: anfragenCount } = await supabase
          .from('anfragen')
          .select('id', { count: 'exact', head: true })
          .in('inserat_id', inseratIds)
          .eq('status', 'neu');
        counts.anfragenNeu = anfragenCount ?? 0;
      }
    }

    if (await hasTable('suchprofile')) {
      const { count: suchCount } = await supabase
        .from('suchprofile')
        .select('id', { count: 'exact', head: true })
        .eq('kaeufer_id', userData.user.id);
      counts.suchprofile = suchCount ?? 0;
    }

    if (await hasTable('broker_team_members')) {
      const { count: teamCount } = await supabase
        .from('broker_team_members')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', userData.user.id);
      counts.teamMembers = teamCount ?? 0;
    }
  }

  return (
    <BrokerShell
      email={userData.user.email ?? ''}
      fullName={profile.full_name}
      tier={tier}
      counts={counts}
    >
      {children}
    </BrokerShell>
  );
}
