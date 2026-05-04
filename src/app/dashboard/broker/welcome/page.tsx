// ════════════════════════════════════════════════════════════════════
// /dashboard/broker/welcome — Premium-Übergang zum Broker-Dashboard
// ────────────────────────────────────────────────────────────────────
// Gleiche Animation wie beim Verkäufer — zentrales Logo, Bronze-Glow,
// Auto-Redirect nach 2.6s.
// Wird getriggert nach:
//   • Mockup-Checkout (Paket gewählt)
//   • Erstem Login nach Tunnel-Abschluss
// ════════════════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WelcomeAnimation } from './WelcomeAnimation';

export const metadata = {
  title: 'Willkommen — passare Broker',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string; paid?: string }> };

export default async function BrokerWelcomePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login');

  const sp = await searchParams;
  const target = sp.next || '/dashboard/broker';
  const paid = sp.paid === '1' || true; // bei Broker kommt man IMMER nach Bezahlung

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return <WelcomeAnimation firstName={firstName} target={target} paid={paid} />;
}
