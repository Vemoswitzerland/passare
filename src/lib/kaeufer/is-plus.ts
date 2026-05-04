/**
 * Zentraler Helper: hat dieser User Käufer+-Zugriff?
 *
 * Käufer+ wird gewährt wenn EINER dieser Punkte zutrifft:
 *  - subscription_tier === 'plus' (neuer Wert)
 *  - subscription_tier === 'max'  (alter Wert, Backwards-Compat für
 *    bestehende Stripe-Subscriptions vor dem Rename)
 *  - is_broker === true UND Broker-Abo aktiv UND nicht gesperrt
 *
 * Broker-Coupling gefixt 2026-05-04: Bisher hat `is_broker === true` allein
 * gereicht — auch wenn das Abo `inactive` oder das Profil `suspended_at !=
 * null` war. Das hat Käufer+-Features für gesperrte/abgemeldete Broker
 * weiter freigeschaltet. Jetzt: Broker bekommt Käufer+ NUR wenn das Abo
 * aktiv läuft und das Profil nicht gesperrt ist.
 */
export function isPlusKaeufer(profile: {
  subscription_tier?: string | null;
  is_broker?: boolean | null;
  /** Broker-spezifisch — kommt aus broker_profiles, nicht aus profiles. */
  broker_subscription_status?: string | null;
  broker_suspended_at?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.subscription_tier === 'plus') return true;
  if (profile.subscription_tier === 'max') return true;
  if (
    profile.is_broker === true &&
    profile.broker_subscription_status === 'active' &&
    !profile.broker_suspended_at
  ) {
    return true;
  }
  return false;
}
