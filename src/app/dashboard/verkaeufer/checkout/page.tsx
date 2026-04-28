// ════════════════════════════════════════════════════════════════════
// Fake-Stripe-Checkout-Seite (DEMO MODE)
// ────────────────────────────────────────────────────────────────────
// Zeigt eine UI die wie Stripe Checkout aussieht, ist aber explizit
// als DEMO markiert. Nach Klick "Bezahlen" wird das gewählte Paket +
// Powerups als bezahlt markiert und der User landet auf dem
// Inserat-Confirmation-Screen.
//
// Wenn STRIPE_SECRET_KEY in ENV gesetzt ist, würden wir hier eine
// echte Checkout-Session erstellen. V1 = Mock.
// ════════════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
    powerups?: string; // CSV von powerup_ids
  }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/dashboard/verkaeufer/checkout');

  const inseratId = sp.inserat;
  const paketId = (sp.paket ?? 'standard') as keyof typeof PAKETE;
  const powerupIds = (sp.powerups ?? '').split(',').filter(Boolean);

  if (!inseratId) {
    redirect('/dashboard/verkaeufer/inserat');
  }

  const paket = PAKETE[paketId] ?? PAKETE.standard;
  const selectedPowerups = POWERUPS.filter((p) => powerupIds.includes(p.id));

  const subtotal = paket.preis + selectedPowerups.reduce((s, p) => s + p.preis, 0);
  const mwst = Math.round(subtotal * 0.081 * 100) / 100;
  const total = Math.round((subtotal + mwst) * 100) / 100;

  return (
    <main className="min-h-screen bg-cream">
      {/* DEMO-Banner */}
      <div className="bg-warn/10 border-b border-warn/30">
        <Container>
          <p className="text-center text-caption text-warn py-2 font-mono uppercase tracking-widest">
            ⚠ Demo-Modus · keine echte Zahlung · alles wird sofort als bezahlt markiert
          </p>
        </Container>
      </div>

      <header className="border-b border-stone bg-paper">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <span className="font-mono text-caption text-quiet uppercase tracking-widest">
              Sichere Zahlung
            </span>
          </div>
        </Container>
      </header>

      <Container>
        <div className="grid md:grid-cols-[1fr_400px] gap-8 lg:gap-12 py-10 md:py-14">
          {/* ── Linke Spalte: Stripe-Style-Formular ── */}
          <div>
            <p className="overline text-bronze-ink mb-3">Inserat-Paket</p>
            <h1 className="font-serif text-display-sm text-navy font-light mb-2">
              CHF {total.toFixed(2).replace(/,/g, "'")}
            </h1>
            <p className="text-body text-muted mb-8">
              Einmalige Zahlung · {paket.label}-Paket
            </p>

            <CheckoutForm
              inseratId={inseratId}
              paketId={paket.id}
              powerupIds={powerupIds}
              total={total}
            />
          </div>

          {/* ── Rechte Spalte: Order-Summary ── */}
          <aside className="bg-paper border border-stone rounded-card p-6 h-fit md:sticky md:top-8">
            <p className="overline text-bronze-ink mb-4">Bestellübersicht</p>

            <div className="flex items-start justify-between mb-4 pb-4 border-b border-stone">
              <div>
                <p className="text-body-sm text-navy font-medium">Inserat {paket.label}</p>
                <p className="text-caption text-quiet mt-0.5">
                  {paket.laufzeitMonate ? `${paket.laufzeitMonate} Monate` : 'Bis zum Verkauf'}
                </p>
              </div>
              <p className="text-body-sm font-mono text-ink">
                CHF {paket.preis}
              </p>
            </div>

            {selectedPowerups.length > 0 && (
              <>
                <p className="text-caption text-quiet mb-3 mt-4">Powerups</p>
                {selectedPowerups.map((pu) => (
                  <div key={pu.id} className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">{pu.label}</p>
                      <p className="text-caption text-quiet">{pu.einheit}</p>
                    </div>
                    <p className="text-body-sm font-mono text-ink ml-4">
                      CHF {pu.preis}
                    </p>
                  </div>
                ))}
                <div className="border-t border-stone mt-4 pt-3" />
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-body-sm text-muted">
                <span>Zwischensumme</span>
                <span className="font-mono">CHF {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-muted">
                <span>MwSt 8.1 %</span>
                <span className="font-mono">CHF {mwst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body text-navy font-medium pt-2 border-t border-stone mt-2">
                <span>Gesamt</span>
                <span className="font-mono">CHF {total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-caption text-quiet mt-6 leading-relaxed">
              Wir halten dein Inserat aktiv bis zum Verkauf. Keine automatische
              Verlängerung — du entscheidest selbst.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
