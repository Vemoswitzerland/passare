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
  // Target IMMER mit ?welcome=1 anhängen, sonst feuert das Erfolgs-Banner
  // im Dashboard nicht.
  const baseTarget = sp.next || '/dashboard/broker';
  const target = baseTarget.includes('?')
    ? `${baseTarget}&welcome=1`
    : `${baseTarget}?welcome=1`;
  // Echter Stripe-Erfolg setzt ?paid=1; ohne den Param zeigen wir keine
  // «erfolgreich gezahlt»-Animation (z. B. wenn der User die Seite manuell
  // aufruft).
  const paid = sp.paid === '1';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return <WelcomeAnimation firstName={firstName} target={target} paid={paid} />;
}
