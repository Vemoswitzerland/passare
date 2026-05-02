import { ArrowRight, Check, X, Building2, Search } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Für Broker — passare',
  description:
    'Broker auf passare: Mandate inserieren mit Premium-Sichtbarkeit + aktiv für Käufer-Mandate suchen mit Käufer+ inklusive. Beides in einem Abo.',
  robots: { index: false, follow: false },
};

export default function BrokerPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <ZweiWelten />
      <PaketeVergleich />
      <CTA />
      <SiteFooter />
    </main>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */
function Hero() {
  return (
    <Section className="pt-20 md:pt-28 pb-16">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-bronze-ink">Für Broker &amp; M&amp;A-Berater</p>
            <h1 className="font-serif-display text-display-lg text-navy font-light mb-8 tracking-[-0.025em]">
              Beide Seiten<span className="text-bronze">.</span>{' '}
              Ein Abo<span className="text-bronze">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
              Inseriere mehrere Mandate gleichzeitig <strong className="text-navy">und</strong> suche
              für deine Käufer-Mandate aktiv im Marktplatz — beides in einem Broker-Abo.
              Käufer+ ist komplett inklusive.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center gap-4">
              <Button href="/auth/register?role=broker" size="lg">
                Als Broker registrieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="#pakete" variant="secondary" size="lg">
                Pakete vergleichen
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────── ZWEI WELTEN ────────────────────────── */
function ZweiWelten() {
  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Was du als Broker bekommst</span>
              <span className="h-px flex-1 bg-stone" />
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Verkaufen <span className="text-bronze">×</span> Kaufen.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Verkaufen-Card (= Verkäufer-Premium pro Mandat) */}
          <Reveal delay={0.05}>
            <div className="rounded-card border border-stone bg-cream/40 p-7 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-card bg-bronze/15 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="overline text-bronze-ink">Verkaufen</p>
                  <p className="font-serif text-head-sm text-navy">Für jedes Mandat</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  '1 Inserat live pro Mandat',
                  'Anfragen empfangen',
                  'In-App-Chat mit Käufern',
                  'Vollständige Statistik (Charts, Conversion)',
                  'Datenraum',
                  'Hervorhebung pro Mandat',
                  'Positionierung im Newsletter pro Mandat',
                  'Käuferprofil-Einsicht bei Anfragen',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-ink">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Kaufen-Card (= Käufer+ inklusive) */}
          <Reveal delay={0.1}>
            <div className="rounded-card border border-stone bg-cream/40 p-7 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-card bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-navy" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="overline text-navy">Kaufen</p>
                  <p className="font-serif text-head-sm text-navy">Käufer+ komplett inklusive</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Alle Inserate inkl. Premium sichtbar',
                  '7 Tage Frühzugang auf neue Inserate',
                  'Alle 18 Filter + Custom',
                  'Unbegrenzte gespeicherte Suchen',
                  'E-Mail-Alerts in Echtzeit',
                  'WhatsApp-Alerts',
                  'Unbegrenzte Anfragen',
                  'Direkt-Anfrage-Track',
                  'Featured-Käuferprofil',
                  'KMU-Multiples-Datenbank',
                  'Persönlicher Ansprechpartner',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-ink">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ──────────────────────── PAKETE-VERGLEICH ──────────────────────── */
function PaketeVergleich() {
  const rows: Array<{
    label: string;
    starter: string | boolean;
    pro: string | boolean;
  }> = [
    { label: 'Aktive Mandate gleichzeitig', starter: 'bis 5', pro: 'bis 25' },
    { label: 'Hervorhebung pro Mandat', starter: '4× / Jahr', pro: '12× / Jahr' },
    { label: 'Positionierung im Newsletter pro Mandat', starter: false, pro: '2× / Jahr' },
    { label: 'Mehrere Mitarbeiter onboarden', starter: false, pro: 'bis 5' },
  ];

  return (
    <Section id="pakete">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Pakete</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Starter oder Pro.
            </h2>
            <p className="mt-4 text-body-lg text-muted leading-relaxed">
              Beide Tiers enthalten alle Funktionen aus Verkaufen und Kaufen oben.
              Was die zwei Pakete unterscheidet:
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-4xl mx-auto rounded-card border border-stone bg-paper overflow-hidden">
            {/* Header — nur Tier-Namen, ohne Preise */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-stone">
              <div className="p-6">
                <p className="overline text-bronze-ink">Vergleich</p>
              </div>
              <div className="p-6 text-center border-l border-stone">
                <p className="font-serif text-head-md text-navy font-normal">Starter</p>
              </div>
              <div className="p-6 text-center border-l border-stone bg-bronze/5">
                <p className="font-serif text-head-md text-navy font-normal">Pro</p>
              </div>
            </div>

            {/* Differenzierer-Zeilen */}
            {rows.map((r, i) => (
              <div
                key={r.label}
                className={`grid grid-cols-[1.4fr_1fr_1fr] ${
                  i !== rows.length - 1 ? 'border-b border-stone/60' : ''
                } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
              >
                <div className="p-4 text-body-sm text-ink font-medium">{r.label}</div>
                <DifferenzZelle value={r.starter} />
                <DifferenzZelle value={r.pro} highlight />
              </div>
            ))}

            {/* CTA-Footer */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-t border-stone bg-cream/50">
              <div className="p-4" />
              <div className="p-4 border-l border-stone">
                <Button
                  href="/auth/register?role=broker&paket=starter"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Starter wählen
                </Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button
                  href="/auth/register?role=broker&paket=pro"
                  size="sm"
                  className="w-full justify-center"
                >
                  Pro wählen
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function DifferenzZelle({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  let content: React.ReactNode;
  if (value === true) {
    content = (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success">
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </span>
    );
  } else if (value === false) {
    content = (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger/10 text-danger">
        <X className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  } else {
    content = (
      <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-success/10 text-success text-caption font-mono font-medium">
        ✓ {value}
      </span>
    );
  }
  return (
    <div className={`p-4 border-l border-stone flex items-center justify-center ${highlight ? 'bg-bronze/5' : ''}`}>
      {content}
    </div>
  );
}

/* ─────────────────────────────── CTA ─────────────────────────────── */
function CTA() {
  return (
    <Section className="py-20 md:py-28 bg-paper border-t border-stone">
      <Container>
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-display-md text-navy font-light mb-6 leading-tight">
              Jetzt loslegen.
            </h2>
            <Button href="/auth/register?role=broker" size="lg">
              Als Broker registrieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
