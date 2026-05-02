import Link from 'next/link';
import { Check, ArrowRight, Crown, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { BERATER_TIERS } from '@/data/pakete';

export const metadata = { title: 'Paket — passare Broker' };

type Props = { searchParams: Promise<{ error?: string; canceled?: string; tier?: string; interval?: string }> };

export default async function BrokerPaketPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const sp = await searchParams;

  let brokerProfile: any = null;

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();
    brokerProfile = bp;
  }

  const currentTier = brokerProfile?.tier ?? 'starter';
  const isActive = brokerProfile?.subscription_status === 'active';

  const errorMessages: Record<string, string> = {
    stripe_not_configured: 'Die Bezahlung ist gerade noch nicht konfiguriert. Bitte versuche es später nochmal — wir richten das im Hintergrund ein.',
    stripe_price_missing: `Für dieses Paket fehlt eine Preis-Konfiguration (${sp.tier ?? '?'} / ${sp.interval ?? '?'}). Bitte wähle ein anderes Paket oder kontaktiere uns.`,
    invalid_tier: 'Ungültige Paket-Auswahl.',
    no_customer: 'Es ist noch keine Stripe-Kundenverknüpfung vorhanden. Wähle bitte erst ein Paket.',
  };
  const errorMessage = sp.error ? errorMessages[sp.error] : null;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Paket</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Dein Broker-Abo
          </h1>
        </div>

        {errorMessage && (
          <div className="rounded-card bg-warn/10 border border-warn/30 p-5 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-body-sm text-navy">{errorMessage}</p>
          </div>
        )}

        {sp.canceled === '1' && !errorMessage && (
          <div className="rounded-card bg-stone/30 border border-stone p-5 mb-6">
            <p className="text-body-sm text-muted">Bezahlung abgebrochen — kein Problem, du kannst jederzeit fortfahren.</p>
          </div>
        )}

        {isActive && (
          <div className="rounded-card bg-success/5 border border-success/30 p-5 mb-8 flex items-center gap-3">
            <Check className="w-5 h-5 text-success flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-body text-navy font-medium">
                Broker {currentTier === 'pro' ? 'Pro' : 'Starter'} — aktiv
              </p>
              {brokerProfile?.subscription_interval && (
                <p className="text-caption text-muted mt-0.5">
                  {brokerProfile.subscription_interval === 'yearly' ? 'Jahresabo' : 'Monatsabo'}
                  {brokerProfile.subscription_cancel_at && ` · Kündigung zum ${new Date(brokerProfile.subscription_cancel_at).toLocaleDateString('de-CH')}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tier-Vergleich */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {BERATER_TIERS.map((tier) => {
            const isCurrent = currentTier === tier.id && isActive;
            return (
              <div
                key={tier.id}
                className={`rounded-card border p-6 md:p-8 ${
                  isCurrent ? 'border-bronze bg-bronze/5' : 'border-stone bg-paper'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="overline text-quiet mb-1">{tier.label}</p>
                    <p className="font-serif text-head-lg text-navy font-light font-tabular">
                      CHF {tier.preisMonat.toLocaleString('de-CH')}
                    </p>
                    <p className="text-caption text-muted mt-1">
                      / Monat · oder CHF {tier.preisJahr.toLocaleString('de-CH')} / Jahr
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-bronze/15 text-bronze-ink text-[10px] font-medium uppercase">
                      <Crown className="w-3 h-3" strokeWidth={2} />
                      Aktuell
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-body-sm text-ink">
                      <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <Link
                    href={`/api/stripe/broker-checkout?tier=${tier.id}&interval=monthly`}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
                  >
                    {isActive && tier.id === 'pro' ? 'Auf Pro upgraden' : `${tier.label} wählen`}
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Portal */}
        {isActive && (
          <div className="rounded-card bg-paper border border-stone p-6">
            <h3 className="font-serif text-head-sm text-navy mb-2">Abo verwalten</h3>
            <p className="text-body-sm text-muted mb-4">
              Zahlungsmethode ändern, Rechnungen einsehen oder Abo kündigen.
            </p>
            <Link
              href="/api/stripe/customer-portal?ctx=broker"
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone rounded-soft text-body-sm text-navy font-medium hover:bg-stone/30 transition-colors"
            >
              Stripe Kundenportal öffnen
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
