// ════════════════════════════════════════════════════════════════════
// Demo-Checkout-Seite (DEMO MODE)
// ────────────────────────────────────────────────────────────────────
// Vereinfacht: kein Form, kein doppelter Header. User sieht
// klar was er kauft, klickt einmal Bezahlen, fertig.
// ════════════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/components/ui/container';
import { CheckoutForm } from './CheckoutForm';
import { PAKETE, POWERUPS } from '@/data/pakete';

export const metadata = {
  title: 'Bezahlung — passare',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    inserat?: string;
    paket?: string;
    powerups?: string;
    laufzeit?: string;
    klein?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/dashboard/verkaeufer/checkout');

  const inseratId = sp.inserat;
  const paketId = (sp.paket ?? 'pro') as keyof typeof PAKETE;
  const powerupIds = (sp.powerups ?? '').split(',').filter(Boolean);
  const laufzeit = (sp.laufzeit === '6' ? 6 : 12) as 6 | 12;
  const isKlein = sp.klein === '1';

  if (!inseratId) {
    redirect('/dashboard/verkaeufer/inserat');
  }

  const paket = PAKETE[paketId] ?? PAKETE.pro;
  const selectedPowerups = POWERUPS.filter((p) => powerupIds.includes(p.id));

  const paketPreis = isKlein ? paket.preisKlein[laufzeit] : paket.preis[laufzeit];
  const subtotal = paketPreis + selectedPowerups.reduce((s, p) => s + p.preis, 0);
  const mwst = Math.round(subtotal * 0.081 * 100) / 100;
  const total = Math.round((subtotal + mwst) * 100) / 100;

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-12 md:py-20">
        <p className="overline text-bronze-ink mb-3 text-center">Bezahlung</p>
        <h1 className="font-serif text-display-md text-navy font-light text-center tracking-tight mb-2">
          CHF {total.toFixed(2).replace(/\.00$/, '').replace(/,/g, "'")}
        </h1>
        <p className="text-body text-muted text-center mb-12">
          Einmalig · {paket.label}-Paket {selectedPowerups.length > 0 && `+ ${selectedPowerups.length} Powerup${selectedPowerups.length === 1 ? '' : 's'}`}
        </p>

        {/* ── Bestellübersicht (sauber, nicht gequetscht) ── */}
        <div className="bg-paper border border-stone rounded-card p-6 md:p-8 mb-8">
          <div className="flex items-start justify-between pb-5 border-b border-stone">
            <div>
              <p className="text-body text-navy font-medium">Inserat {paket.label}</p>
              <p className="text-caption text-quiet mt-1">
                {laufzeit} Monate {isKlein && '· Klein-Inserat-Rabatt 25 %'}
              </p>
            </div>
            <p className="text-body font-mono text-ink">
              CHF {paketPreis.toLocaleString('de-CH')}
            </p>
          </div>

          {selectedPowerups.length > 0 && (
            <div className="py-5 border-b border-stone space-y-3">
              {selectedPowerups.map((pu) => (
                <div key={pu.id} className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-ink">{pu.label}</p>
                    <p className="text-caption text-quiet">{pu.einheit}</p>
                  </div>
                  <p className="text-body-sm font-mono text-ink ml-4">
                    CHF {pu.preis}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-5 space-y-2">
            <div className="flex justify-between text-body-sm text-muted">
              <span>Zwischensumme</span>
              <span className="font-mono">CHF {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body-sm text-muted">
              <span>MwSt 8.1 %</span>
              <span className="font-mono">CHF {mwst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body-lg text-navy font-medium pt-3 border-t border-stone mt-3">
              <span>Gesamt</span>
              <span className="font-mono">CHF {total.toFixed(2).replace(/,/g, "'")}</span>
            </div>
          </div>
        </div>

        <CheckoutForm
          inseratId={inseratId}
          paketId={paket.id}
          powerupIds={powerupIds}
          total={total}
        />

        <p className="text-caption text-quiet text-center mt-6 leading-relaxed">
          Inserat bleibt aktiv bis zum Verkauf · 0 % Erfolgsprovision · Schweizer Datenschutz
        </p>
      </div>
    </Container>
  );
}
