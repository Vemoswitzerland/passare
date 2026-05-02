import { createClient } from '@/lib/supabase/server';

type UserState = {
  isLoggedIn: boolean;
  rolle: 'admin' | 'broker' | 'kaeufer' | 'verkaeufer' | null;
  onboarded: boolean;
  isPlus: boolean;
  isBroker: boolean;
};

export async function getUserState(): Promise<UserState> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return { isLoggedIn: false, rolle: null, onboarded: false, isPlus: false, isBroker: false };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, onboarding_completed_at, subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();

  return {
    isLoggedIn: true,
    rolle: (profile?.rolle ?? null) as UserState['rolle'],
    onboarded: !!profile?.onboarding_completed_at,
    isPlus:
      profile?.subscription_tier === 'plus' ||
      profile?.subscription_tier === 'max' ||
      profile?.is_broker === true,
    isBroker: !!profile?.is_broker,
  };
}

/**
 * "Käufer+ buchen"-CTA — führt IMMER in den Käufer-Funnel.
 *
 * Cyrill 02.05.: «Bei Käufer+ kaufen klicke, bin verdammten Käuferfunnel.
 * Egal ob Google, LinkedIn oder normalerweise.»
 */
export function ctaKaeuferPlus(state: UserState): string {
  if (!state.isLoggedIn) return '/auth/register?role=kaeufer&plan=plus';
  // Schon Plus oder Broker (mit Käufer+-Inklusiv) → ins Dashboard
  if (state.isPlus) return '/dashboard/kaeufer?welcome=plus';
  // Schon Käufer aber Basic → direkt zur Abo-Seite (Stripe-Mock kauft Plus)
  if (state.rolle === 'kaeufer' && state.onboarded) return '/dashboard/kaeufer/abo';
  // Eingeloggt mit fremder Rolle (Verkäufer/Admin) → Reg neu mit role-Hint
  if (state.rolle && state.rolle !== 'kaeufer') return '/auth/register?role=kaeufer&plan=plus';
  // Eingeloggt, aber rolle=null oder nicht onboarded → Käufer-Tunnel
  return '/onboarding/kaeufer/tunnel?plan=plus';
}

/** "Käufer Basic"-CTA — gratis Variante, gleiche Funnel-Logik aber ohne plan=plus. */
export function ctaKaeuferBasic(state: UserState): string {
  if (!state.isLoggedIn) return '/auth/register?role=kaeufer&plan=basic';
  if (state.rolle === 'kaeufer' && state.onboarded) return '/dashboard/kaeufer';
  if (state.rolle && state.rolle !== 'kaeufer') return '/auth/register?role=kaeufer&plan=basic';
  return '/onboarding/kaeufer/tunnel';
}

/** Broker-Onboarding-CTA. */
export function ctaBroker(state: UserState, paket?: 'starter' | 'pro'): string {
  const paketSuffix = paket ? `&paket=${paket}` : '';
  if (!state.isLoggedIn) return `/auth/register?role=broker${paketSuffix}`;
  if (state.rolle === 'broker' && state.onboarded) return '/dashboard/broker';
  if (state.rolle && state.rolle !== 'broker') return `/auth/register?role=broker${paketSuffix}`;
  return '/onboarding/broker/tunnel';
}

/** Verkäufer-Inserat-CTA — geht IMMER zum Pre-Reg-Funnel (Firma → Bewertung → Account). */
export function ctaVerkaeufer(state: UserState): string {
  // Verkäufer mit eigener Inserat-History sollen direkt ins Dashboard.
  // Für alle anderen: Pre-Reg-Funnel.
  if (state.rolle === 'verkaeufer' && state.onboarded) return '/dashboard/verkaeufer';
  return '/verkaufen/start';
}
