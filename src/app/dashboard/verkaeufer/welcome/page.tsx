// ════════════════════════════════════════════════════════════════════
// /dashboard/verkaeufer/welcome — Premium-Übergang zum Dashboard
// ────────────────────────────────────────────────────────────────────
// Sexy Loading-Animation mit zentralem Logo, weichem Bronze-Glow und
// Auto-Redirect nach 2.6s zum Verkäufer-Dashboard.
//
// Wird getriggert nach:
//   • Erfolgreicher Zahlung (CheckoutForm)
//   • Pre-Reg-Auto-Onboarding (Google-Callback)
//   • First-Login nach Onboarding-Wizard
// ════════════════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WelcomeAnimation } from './WelcomeAnimation';

export const metadata = {
  title: 'Willkommen — passare',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; paid?: string }> };

export default async function WelcomePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login');

  const sp = await searchParams;
  const target = sp.next || '/dashboard/verkaeufer';
  const paid = sp.paid === '1';

  // Prüfe ob die Welcome-Animation schon einmal gezeigt wurde.
  // Bei welcome_seen_at = null → Animation zeigen + setzen.
  // Sonst direkt aufs Dashboard.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, welcome_seen_at')
    .eq('id', userData.user.id)
    .maybeSingle();

  const alreadySeen = Boolean(profile?.welcome_seen_at);
  if (alreadySeen && !paid) {
    redirect(target);
  }

  // Welcome_seen_at setzen (best effort — wenn Spalte fehlt, ignorieren)
  if (!alreadySeen) {
    try {
      await supabase
        .from('profiles')
        .update({ welcome_seen_at: new Date().toISOString() })
        .eq('id', userData.user.id);
    } catch {
      /* Spalte ggf. noch nicht in DB-Schema */
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return <WelcomeAnimation firstName={firstName} target={target} paid={paid} />;
}
