/**
 * Zentraler Helper: hat dieser User Käufer+-Zugriff?
 *
 * Käufer+ wird gewährt wenn EINER dieser Punkte zutrifft:
 *  - subscription_tier === 'plus' (neuer Wert)
 *  - subscription_tier === 'max'  (alter Wert, Backwards-Compat für
 *    bestehende Stripe-Subscriptions vor dem Rename)
 *  - is_broker === true (Broker haben Käufer+-Funktionen inklusiv)
 */
export function isPlusKaeufer(profile: {
  subscription_tier?: string | null;
  is_broker?: boolean | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.subscription_tier === 'plus') return true;
  if (profile.subscription_tier === 'max') return true;
  if (profile.is_broker === true) return true;
  return false;
}
