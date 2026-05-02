import Link from 'next/link';
import { ArrowRight, Check, X, Building2, Search, Briefcase } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Für Broker — passare',
  description:
    'Broker-Pakete auf passare.ch — beides in einem Abo: Mandate inserieren UND Firmen aktiv suchen. Premium-Verkäufer-Power für jedes Mandat × Käufer-Professional gratis dazu. Ab CHF 290/Monat.',
  robots: { index: false, follow: false },
};

export default function BrokerPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <ZweiWelten />
      <PaketeVergleich />
      <FAQ />
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
              Inseriere bis zu 25 Mandate gleichzeitig <strong className="text-navy">und</strong> suche
              für deine Käufer-Mandate aktiv im Marktplatz — beides in einem Broker-Abo.
              Premium-Sichtbarkeit für jedes Mandat. Käufer-Professional komplett inklusive.
              0 % Erfolgsprovision auf Deals.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center gap-4">
              <Button href="/auth/register?role=broker" size="lg">
                Als Broker registrieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="#pakete" variant="secondary" size="lg">
                Pakete ansehen
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-caption text-quiet font-mono">
              <SignalDot>Ab CHF 290 / Monat</SignalDot>
              <SignalDot>Käufer-Pro inklusive</SignalDot>
              <SignalDot>0 % Erfolgsprovision</SignalDot>
              <SignalDot>Monatlich kündbar</SignalDot>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function SignalDot({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-caption text-quiet">
      <span className="w-1 h-1 rounded-full bg-bronze" />
      {children}
    </span>
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
              Sell-Side <span className="text-bronze">×</span> Buy-Side. Gleichzeitig.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sell-Side Card */}
          <Reveal delay={0.05}>
            <div className="rounded-card border border-stone bg-cream/40 p-7 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-card bg-bronze/15 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="overline text-bronze-ink">Sell-Side</p>
                  <p className="font-serif text-head-sm text-navy">Mandate inserieren</p>
                </div>
              </div>
              <p className="text-body-sm text-muted leading-relaxed mb-5">
                Jedes deiner Mandate bekommt die volle Premium-Verkäufer-Power —
                keine Light-Variante, kein Aufpreis pro Mandat.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Hervorhebung 4× / Jahr (Pro: 12×) pro Mandat',
                  'Newsletter-Positionierung (Pro: 2× / Jahr) pro Mandat',
                  'Datenraum mit Versionierung pro Mandat',
                  'KI-Teaser-Hilfe pro Mandat',
                  'NDA-Workflow pro Mandat',
                  'Käuferprofil-Einsicht bei jeder Anfrage',
                  'Kombinierte Anfragen-Inbox über alle Mandate',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-ink">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Buy-Side Card */}
          <Reveal delay={0.1}>
            <div className="rounded-card border border-stone bg-cream/40 p-7 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-card bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-navy" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="overline text-navy">Buy-Side</p>
                  <p className="font-serif text-head-sm text-navy">Firmen aktiv suchen</p>
                </div>
              </div>
              <p className="text-body-sm text-muted leading-relaxed mb-5">
                Käufer-Professional komplett inklusive — der CHF 490/Jahr-Wert
                ist im Broker-Abo bereits drin.
              </p>
              <ul className="space-y-2.5">
                {[
                  '7-Tage-Vorzugriff auf neue Inserate',
                  'Alle Filter (EBITDA, MA-Range, Übergabezeitpunkt)',
                  'Unbegrenzte Anfragen',
                  '5 Saved Searches mit Daily-Alerts',
                  'WhatsApp-Alerts in Echtzeit',
                  'NDA-Fast-Track (verifizierter Power-User)',
                  'KMU-Multiples-Datenbank',
                  'Berater-Datenraum-Share',
                  'Featured-Käuferprofil',
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

        {/* Identität-Block */}
        <Reveal delay={0.15}>
          <div className="mt-6 rounded-card border border-stone bg-paper p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-card bg-stone flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-navy" strokeWidth={1.75} />
                </div>
                <p className="font-serif text-head-sm text-navy">Deine Broker-Identität</p>
              </div>
              <div className="flex-1 flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-muted">
                <span>· Brand-Profil mit Logo + Bio</span>
                <span>· Eigene Profil-URL <span className="font-mono text-navy">/broker/[slug]</span></span>
                <span>· Agentur-Badge auf jedem Inserat</span>
                <span>· Multi-Mandat-Dashboard</span>
              </div>
            </div>
          </div>
        </Reveal>
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
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Pakete</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">Jahres-Abo: −17 % Rabatt</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Starter oder Pro.
            </h2>
            <p className="mt-4 text-body-lg text-muted leading-relaxed">
              Beide Tiers enthalten alles aus Sell-Side und Buy-Side oben. Was die zwei
              Pakete unterscheidet, ist <strong className="text-navy">Volumen, Sichtbarkeit und Team-Skalierung</strong>.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-4xl mx-auto rounded-card border border-stone bg-paper overflow-hidden">
            {/* Header mit Preisen */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-stone">
              <div className="p-6">
                <p className="overline text-bronze-ink mb-2">Vergleich</p>
                <p className="text-caption text-muted leading-snug">
                  Was die zwei Tiers unterscheidet.
                </p>
              </div>
              <div className="p-6 text-center border-l border-stone">
                <p className="overline text-quiet mb-3">Starter</p>
                <p className="font-serif text-[1.85rem] text-navy font-light font-tabular leading-none">
                  CHF 290
                </p>
                <p className="text-caption text-quiet mt-1.5">/ Monat</p>
                <p className="text-caption text-bronze-ink mt-3 font-mono">
                  oder CHF 2&apos;900 / Jahr
                </p>
              </div>
              <div className="p-6 text-center border-l border-stone bg-bronze/5">
                <div className="inline-flex items-center px-3 py-1 rounded-pill bg-bronze text-cream text-caption font-medium tracking-wide whitespace-nowrap mb-3">
                  Empfohlen für Agenturen
                </div>
                <p className="font-serif text-[1.85rem] text-navy font-light font-tabular leading-none">
                  CHF 890
                </p>
                <p className="text-caption text-quiet mt-1.5">/ Monat</p>
                <p className="text-caption text-bronze-ink mt-3 font-mono">
                  oder CHF 8&apos;900 / Jahr
                </p>
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

            {/* In-beiden-Zeile */}
            <div className="grid grid-cols-[1.4fr_2fr] border-t border-stone bg-cream/40">
              <div className="p-4 text-body-sm text-ink font-medium">In beiden Tiers enthalten</div>
              <div className="p-4 border-l border-stone text-caption text-muted leading-relaxed">
                Premium-Verkäufer-Funktionen pro Mandat (Datenraum, KI-Teaser, NDA, Statistik, Käuferprofil-Einsicht) ·
                Käufer-Professional komplett (CHF 490/Jahr-Wert gratis) ·
                Brand-Profil + eigene Profil-URL + Agentur-Badge ·
                Multi-Mandat-Dashboard
              </div>
            </div>

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

          {/* Spielregeln-Footer */}
          <div className="mt-6 max-w-4xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-quiet">
            <span>✓ 0 % Erfolgsprovision auf Deals</span>
            <span>✓ Keine Auto-Verlängerung</span>
            <span>✓ Monatlich kündbar</span>
            <span>✓ MwSt 8.1 % wird im Checkout ausgewiesen</span>
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

/* ─────────────────────────────── FAQ ─────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: 'Wie unterscheidet sich Broker von einem normalen Verkäufer-Account?',
      a: 'Als Broker führst du mehrere Mandate parallel — ein Verkäufer-Paket erlaubt nur 1 Inserat. Plus du hast Käufer-Professional komplett gratis dabei (Wert CHF 490/Jahr), eine eigene Brand-Page mit Logo, ein Multi-Mandat-Dashboard und ein Agentur-Badge auf allen Inseraten.',
    },
    {
      q: 'Wieviele Mandate kann ich gleichzeitig führen?',
      a: 'Broker Starter erlaubt bis 5 aktive Mandate, Broker Pro bis 25. Wenn ein Mandat verkauft, pausiert oder abläuft, wird der Slot frei für ein neues.',
    },
    {
      q: 'Was bedeutet «Käufer-Professional inklusive»?',
      a: 'Das normale Käufer-Pro-Abo (CHF 49/M oder CHF 490/Jahr) ist im Broker-Abo bereits enthalten. Du kannst also für deine Käufer-Mandate aktiv im Marktplatz suchen — mit 7-Tage-Vorzugriff auf neue Inserate, allen Filtern, unbegrenzten Anfragen, WhatsApp-Alerts und NDA-Fast-Track.',
    },
    {
      q: 'Kann mein Team eigene Logins haben?',
      a: 'Ja, im Broker-Pro-Paket sind bis zu 5 zusätzliche Team-Logins enthalten. Jeder Mitarbeiter hat sein eigenes Konto mit individuellen Berechtigungen. Im Starter-Paket ist nur dein eigenes Login enthalten.',
    },
    {
      q: 'Verdient passare am Verkaufspreis mit?',
      a: 'Nein, 0 % Erfolgsprovision. Du zahlst nur das Plattform-Abo, egal ob du für CHF 100\'000 oder CHF 50 Mio vermittelst. passare verdient an der Plattform-Gebühr, nicht am Deal.',
    },
    {
      q: 'Was passiert beim Wechsel von Starter zu Pro?',
      a: 'Sofortiger Upgrade möglich — die Mandate-Slots werden direkt erweitert (5 → 25), Team-Mitglieder können angelegt werden, der monatliche Push-Boost wird aktiv. Differenz-Berechnung im Stripe-Customer-Portal.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen</p>
            <h2 className="font-serif text-display-md text-navy font-light">Kurz beantwortet.</h2>
          </div>
        </Reveal>
        <div className="max-w-3xl">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <details className="group border-b border-stone py-6 last:border-b-0">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-6">
                  <h3 className="font-serif text-head-sm text-navy font-normal">{item.q}</h3>
                  <span className="text-bronze-ink text-2xl leading-none flex-shrink-0 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-body text-muted leading-relaxed">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────── CTA ─────────────────────────────── */
function CTA() {
  return (
    <Section className="py-24 md:py-32">
      <Container>
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <p className="overline mb-6 text-bronze-ink">Bereit zu starten?</p>
            <h2 className="font-serif text-display-md text-navy font-light mb-6 leading-tight">
              Beide Welten<span className="text-bronze">.</span> Ein Login<span className="text-bronze">.</span>
            </h2>
            <p className="text-body-lg text-muted leading-relaxed mb-10 max-w-prose mx-auto">
              Registrier dich als Broker, lade dein Logo hoch, schalte dein erstes Mandat —
              und nutze die Käufer-Pro-Suche ab Tag 1.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/auth/register?role=broker" size="lg">
                Als Broker registrieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/preise" variant="secondary" size="lg">
                Alle Pakete ansehen
              </Button>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-quiet">
              Ab CHF 290 / Monat &middot; 0 % Erfolgsprovision &middot; monatlich kündbar
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
