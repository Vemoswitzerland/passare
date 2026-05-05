import Link from 'next/link';
import {
  ArrowRight, Search, ShieldCheck, Handshake, Eye, FileLock2,
  TrendingUp, Users, Calculator, Sparkles, Check,
  MessageCircle, Clock, MapPin, Building2,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '@/components/site/SiteShell';
import { ListingCard } from '@/components/marketplace/ListingCard';
import {
  KANTON_CODES, KANTON_NAMES, PREIS_BUCKETS,
} from '@/lib/constants';
import { getListings, countListings } from '@/lib/listings';
import { getBranchen } from '@/lib/branchen';

/**
 * passare.ch — Homepage / Landingpage
 *
 * Die zentrale Eingangsseite. Erklärt was passare ist und schickt mit dem
 * prominenten Hero-Filter zur Marktplatz `/marktplatz`. Marktplatz-Logik selber liegt
 * jetzt unter `/marktplatz` — diese Seite ist eine reine Landing.
 *
 * Stand 2026-05-05: Marktplatz-Trennung — Landing & Marktplatz leben separat.
 */

export const metadata = {
  title: 'passare — Schweizer Plattform für KMU-Nachfolge',
  description:
    'Direkt. Diskret. Schweizerisch. Verkäufer und Käufer finden auf passare ohne Mittelsmann zueinander.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Back-Compat: andere Pages importieren {SiteHeader, SiteFooter} aus '../page'
export { SiteHeader, SiteFooter } from '@/components/site/SiteShell';

export default async function HomePage() {
  const [listings, totalCount, branchen] = await Promise.all([
    getListings({ sort: 'neu', limit: 6 }),
    countListings(),
    getBranchen(),
  ]);

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero totalCount={totalCount} branchenCount={branchen.length} branchen={branchen} />
      <ThreePillars />
      <LiveListings listings={listings} branchen={branchen} totalCount={totalCount} />
      <SellerPackages />
      <BuyerPackages />
      <ProcessSteps />
      <TrustBlock />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

/* ════════════════════════ Hero mit Filter-Bar ════════════════════════ */
function Hero({
  totalCount,
  branchenCount,
  branchen,
}: {
  totalCount: number;
  branchenCount: number;
  branchen: { id: string; label_de: string }[];
}) {
  return (
    <Section className="pt-12 md:pt-20 pb-16 md:pb-24">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <Reveal>
            <p className="overline mb-4 text-bronze-ink">Schweizer KMU-Nachfolge</p>
            <h1 className="font-serif-display text-[clamp(2.5rem,5vw,4.5rem)] text-navy font-light tracking-[-0.02em] leading-[1.05] mb-6">
              Direkt<span className="text-bronze">.</span>{' '}
              Diskret<span className="text-bronze">.</span>{' '}
              Schweizerisch<span className="text-bronze">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Verkäufer und Käufer finden auf passare ohne Mittelsmann zueinander.
              Vollständig in der Schweiz gehostet.
            </p>
          </Reveal>
        </div>

        {/* Filter-Bar — geht via GET zum Marktplatz */}
        <Reveal delay={0.2}>
          <form
            method="GET"
            action="/marktplatz"
            className="bg-paper border border-stone rounded-card p-6 md:p-8 max-w-4xl mx-auto shadow-subtle"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div>
                <label htmlFor="hero-suche" className="overline block mb-2">Stichwort</label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-quiet"
                    strokeWidth={1.5}
                  />
                  <input
                    id="hero-suche"
                    name="suche"
                    type="text"
                    placeholder="z.B. Bäckerei"
                    className="w-full bg-cream border border-stone rounded-soft pl-9 pr-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hero-branche" className="overline block mb-2">Branche</label>
                <select
                  id="hero-branche"
                  name="branche"
                  defaultValue="all"
                  className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                >
                  <option value="all">Alle Branchen</option>
                  {branchen.map((b) => (
                    <option key={b.id} value={b.id}>{b.label_de}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hero-kanton" className="overline block mb-2">Kanton</label>
                <select
                  id="hero-kanton"
                  name="kanton"
                  defaultValue="all"
                  className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                >
                  <option value="all">Alle Kantone</option>
                  {KANTON_CODES.map((k) => (
                    <option key={k} value={k}>{KANTON_NAMES[k]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hero-preis" className="overline block mb-2">Kaufpreis</label>
                <select
                  id="hero-preis"
                  name="preis"
                  defaultValue="all"
                  className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                >
                  {PREIS_BUCKETS.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-5 border-t border-stone">
              <Button size="lg" className="sm:flex-1 sm:max-w-xs justify-center">
                <Search className="w-4 h-4" strokeWidth={1.5} />
                Auf dem Marktplatz suchen
              </Button>
              <Link
                href="/marktplatz"
                className="font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy text-center sm:text-right inline-flex items-center justify-center gap-2 transition-colors"
              >
                Alle Inserate ansehen <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          </form>
        </Reveal>

        {/* Vertrauens-Zeile */}
        <Reveal delay={0.3}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
            <SignalDot>
              {totalCount === 0
                ? 'Marktplatz im Aufbau'
                : `${totalCount} ${totalCount === 1 ? 'Inserat' : 'Inserate'} live`}
            </SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>{branchenCount} Branchen</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>26 Kantone</SignalDot>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function SignalDot({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-bronze" />
      {children}
    </span>
  );
}

/* ════════════════════════ Was ist passare — 3 Säulen ════════════════════════ */
function ThreePillars() {
  const pillars = [
    {
      Icon: Search,
      tag: 'Marktplatz',
      title: 'Direkter Marktplatz',
      body: 'Verkäufer inserieren anonym, Käufer finden ohne Mittelsmann. Jede Anfrage geht direkt an den Inhaber — keine Broker dazwischen.',
      href: '/marktplatz',
      cta: 'Zum Marktplatz',
    },
    {
      Icon: Calculator,
      tag: 'Bewertung',
      title: 'Smart-Bewertung gratis',
      body: 'In sechs Fragen erhältst du eine realistische Marktwert-Range, basierend auf Schweizer KMU-Multiples deiner Branche.',
      href: '/bewerten',
      cta: 'Firma bewerten',
    },
    {
      Icon: MapPin,
      tag: 'Atlas',
      title: 'CH-Firmen-Atlas',
      body: 'Über 150’000 Schweizer KMU auf der Karte — Branche, Kanton, Grösse. Recherchiere visuell, ohne Konto.',
      href: '/atlas',
      cta: 'Atlas öffnen',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Was ist passare</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Drei Wege zur Nachfolge<span className="text-bronze">.</span>
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {pillars.map((p, i) => (
            <RevealItem key={i} className="bg-paper p-8 md:p-10 flex flex-col">
              <p.Icon className="w-7 h-7 text-bronze mb-6" strokeWidth={1.5} />
              <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mb-3">{p.tag}</p>
              <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">
                {p.title}
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-6 flex-1">{p.body}</p>
              <Link
                href={p.href}
                className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink hover:text-bronze inline-flex items-center gap-2 transition-colors group/link"
              >
                {p.cta}
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform"
                  strokeWidth={1.5}
                />
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Live-Inserate-Vorschau ════════════════════════ */
function LiveListings({
  listings,
  branchen,
  totalCount,
}: {
  listings: Awaited<ReturnType<typeof getListings>>;
  branchen: Awaited<ReturnType<typeof getBranchen>>;
  totalCount: number;
}) {
  return (
    <Section>
      <Container>
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="max-w-prose">
              <p className="overline mb-5">Aktuell auf dem Marktplatz</p>
              <h2 className="font-serif text-display-md text-navy font-light mb-4">
                Die neusten Inserate<span className="text-bronze">.</span>
              </h2>
              <p className="text-body-lg text-muted leading-relaxed">
                Alle anonym, alle aus der Schweiz. Detail-Dossier sieht ein
                Interessent erst, wenn der Verkäufer ihn freischaltet.
              </p>
            </div>
            <div className="hidden md:block">
              <Button href="/marktplatz" variant="secondary" size="md">
                Alle Inserate
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </Reveal>

        {listings.length === 0 ? (
          <Reveal>
            <div className="border border-dashed border-stone rounded-card p-12 text-center max-w-2xl mx-auto bg-paper">
              <Building2 className="w-8 h-8 text-bronze/60 mx-auto mb-5" strokeWidth={1.25} />
              <h3 className="font-serif text-head-md text-navy font-normal mb-3">
                Marktplatz im Aufbau
              </h3>
              <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
                Bald siehst du hier die ersten Schweizer KMU-Inserate.
                Wenn du verkaufen möchtest, bist du in 10 Minuten live.
              </p>
              <Button href="/verkaufen" size="md">
                Firma inserieren
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {listings.map((l, i) => (
                <Reveal key={l.id} delay={i * 0.05} className="h-full">
                  <ListingCard listing={l} branchen={branchen} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.3}>
              <div className="mt-10 text-center">
                <Button href="/marktplatz" size="lg">
                  Alle Inserate auf dem Marktplatz
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                {totalCount > listings.length && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mt-4">
                    {totalCount - listings.length} weitere Inserate auf dem Marktplatz
                  </p>
                )}
              </div>
            </Reveal>
          </>
        )}
      </Container>
    </Section>
  );
}

/* ════════════════════════ Verkäufer-Pakete ════════════════════════ */
function SellerPackages() {
  const plans = [
    {
      tag: 'Einstieg',
      name: 'Inserat Light',
      price: 'CHF 290',
      note: '3 Monate Laufzeit',
      features: [
        '1 anonymes Inserat im Marktplatz',
        'Anfragen-Inbox mit Freigabe-Workflow',
        'Standard-Cover aus Branchen-Bibliothek',
        'In-App-Chat mit Käufern',
      ],
    },
    {
      tag: 'Empfohlen',
      highlight: true,
      name: 'Inserat Pro',
      price: 'CHF 890',
      note: '6 Monate Laufzeit',
      features: [
        'Alles aus Light, plus:',
        'Featured-Position 7 Tage',
        'Bis 8 Bilder + KI-Teaser',
        'Vollständige Statistik',
      ],
    },
    {
      tag: 'Maximum',
      name: 'Inserat Premium',
      price: 'CHF 1\'890',
      note: '12 Monate Laufzeit',
      features: [
        'Alles aus Pro, plus:',
        'Featured-Position 30 Tage',
        'Eigenes Branding & Logo',
        'Prioritäts-Support',
      ],
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Für Verkäufer</p>
            <h2 className="font-serif text-display-md text-navy font-light mb-4">
              Inserate für Verkäufer<span className="text-bronze">.</span>
            </h2>
            <p className="text-body-lg text-muted leading-relaxed">
              Einmalige Paketgebühr. Alle Preise zzgl.&nbsp;8.1%&nbsp;MwSt.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {plans.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className={`h-full p-8 md:p-10 flex flex-col ${
                  p.highlight ? 'bg-cream/60' : 'bg-paper'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <p
                    className={`font-mono text-[11px] uppercase tracking-widest ${
                      p.highlight ? 'text-bronze-ink' : 'text-quiet'
                    }`}
                  >
                    {p.tag}
                  </p>
                  {p.highlight && (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-bronze/15 text-bronze-ink">
                      empfohlen
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-head-lg text-navy font-normal mb-6">{p.name}</h3>
                <div className="mb-6 pb-6 border-b border-stone">
                  <p className="font-serif text-[clamp(2rem,4vw,3rem)] text-navy font-light font-tabular leading-none">
                    {p.price}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mt-3">
                    {p.note}
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-body-sm">
                      <Check
                        className="w-4 h-4 flex-shrink-0 mt-0.5 text-bronze"
                        strokeWidth={1.75}
                      />
                      <span className="text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button href="/verkaufen" size="lg">
              Firma inserieren
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Link
              href="/preise"
              className="font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy inline-flex items-center gap-2 transition-colors"
            >
              Detail-Vergleich aller Pakete
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Käufer-Tiers ════════════════════════ */
function BuyerPackages() {
  const tiers = [
    {
      tag: 'Standard',
      name: 'Käufer Basic',
      price: 'CHF 0',
      note: 'unbefristet',
      features: [
        'Marktplatz vollständig browsen',
        '5 Basis-Filter',
        '5 Anfragen pro Monat',
        'Suchprofil mit täglichem Alert',
      ],
      cta: 'Kostenlos registrieren',
      href: '/onboarding/kaeufer/tunnel',
      variant: 'secondary' as const,
    },
    {
      tag: 'Plus',
      highlight: true,
      name: 'Käufer+ MAX',
      price: 'CHF 199',
      note: 'pro Monat (oder CHF 1’990 / Jahr)',
      features: [
        '7 Tage Frühzugang zu neuen Inseraten',
        'Alle 17 Filter inklusive',
        'Unbegrenzte Anfragen',
        'WhatsApp-Echtzeit-Alerts',
        'NDA-Fast-Track + Käuferprofil-Boost',
      ],
      cta: 'Käufer+ ansehen',
      href: '/plus',
      variant: 'primary' as const,
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Für Käufer</p>
            <h2 className="font-serif text-display-md text-navy font-light mb-4">
              Käufer-Pakete<span className="text-bronze">.</span>
            </h2>
            <p className="text-body-lg text-muted leading-relaxed">
              Einsteigen mit Basic. Wenn du ernst suchst — Käufer+ MAX gibt dir
              den 7-Tage-Vorsprung und alle Filter.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {tiers.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className={`h-full p-8 md:p-10 flex flex-col ${
                  t.highlight ? 'bg-navy text-cream' : 'bg-paper'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <p
                    className={`font-mono text-[11px] uppercase tracking-widest ${
                      t.highlight ? 'text-bronze' : 'text-quiet'
                    }`}
                  >
                    {t.tag}
                  </p>
                  {t.highlight && (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-bronze text-cream">
                      empfohlen
                    </span>
                  )}
                </div>
                <h3
                  className={`font-serif text-head-lg font-normal mb-6 ${
                    t.highlight ? 'text-cream' : 'text-navy'
                  }`}
                >
                  {t.name}
                </h3>
                <div className={`mb-6 pb-6 border-b ${t.highlight ? 'border-cream/15' : 'border-stone'}`}>
                  <p
                    className={`font-serif text-[clamp(2rem,4vw,3rem)] font-light font-tabular leading-none ${
                      t.highlight ? 'text-cream' : 'text-navy'
                    }`}
                  >
                    {t.price}
                  </p>
                  <p
                    className={`font-mono text-[11px] uppercase tracking-widest mt-3 ${
                      t.highlight ? 'text-cream/60' : 'text-quiet'
                    }`}
                  >
                    {t.note}
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-body-sm">
                      <Check
                        className="w-4 h-4 flex-shrink-0 mt-0.5 text-bronze"
                        strokeWidth={1.75}
                      />
                      <span className={t.highlight ? 'text-cream/85' : 'text-muted'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  href={t.href}
                  variant={t.highlight ? 'bronze' : 'secondary'}
                  size="lg"
                  className="w-full justify-center"
                >
                  {t.cta}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ So funktioniert's ════════════════════════ */
function ProcessSteps() {
  const steps = [
    {
      Icon: FileLock2,
      step: 'I',
      title: 'Inserieren oder Suchen',
      body: 'Verkäufer erstellen ein anonymes Inserat in 10 Minuten. Käufer browsen den Marktplatz — ohne Konto.',
    },
    {
      Icon: MessageCircle,
      step: 'II',
      title: 'Anonym Anfragen',
      body: 'Käufer stellen über das Inserat eine Anfrage mit kurzer Vorstellung. Der Verkäufer entscheidet.',
    },
    {
      Icon: ShieldCheck,
      step: 'III',
      title: 'NDA & Datenraum',
      body: 'Bei Freigabe unterzeichnet der Käufer das NDA und erhält Zugang zum Detail-Dossier mit Versionierung.',
    },
    {
      Icon: Handshake,
      step: 'IV',
      title: 'Direkt verhandeln',
      body: 'Verkäufer und Käufer verhandeln direkt. Bei Bedarf vermitteln wir Anwälte und Treuhänder.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">So funktioniert’s</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Vier Schritte zur Nachfolge<span className="text-bronze">.</span>
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {steps.map((s, i) => (
            <RevealItem key={i} className="bg-paper relative p-8 md:p-10 flex flex-col">
              <span
                aria-hidden
                className="absolute top-6 right-6 font-serif text-6xl text-bronze/10 font-light select-none"
              >
                {s.step}
              </span>
              <div className="relative">
                <s.Icon className="w-6 h-6 text-bronze mb-8" strokeWidth={1.5} />
                <p className="font-mono text-[11px] tracking-widest uppercase text-quiet mb-3">
                  Schritt {s.step}
                </p>
                <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">
                  {s.title}
                </h3>
                <p className="text-body-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Trust-Block ════════════════════════ */
function TrustBlock() {
  const points = [
    {
      Icon: Sparkles,
      title: 'Made in Switzerland',
      body: 'Server in der Schweiz, Schweizer Datenschutz, Schweizer Recht.',
    },
    {
      Icon: ShieldCheck,
      title: 'Anonyme Inserate',
      body: 'Der Verkäufer entscheidet, was öffentlich ist und wer Detail-Daten sieht.',
    },
    {
      Icon: TrendingUp,
      title: 'In 10 Minuten online',
      body: 'Pre-Reg mit Live-Handelsregister-Suche und Smart-Bewertung — dein Inserat ist schnell live.',
    },
  ];

  return (
    <Section>
      <Container>
        <RevealStagger className="grid md:grid-cols-3 gap-8 md:gap-12">
          {points.map((p, i) => (
            <RevealItem key={i} className="flex flex-col">
              <p.Icon className="w-6 h-6 text-bronze mb-5" strokeWidth={1.5} />
              <h3 className="font-serif text-head-sm text-navy font-normal mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="text-body-sm text-muted leading-relaxed max-w-xs">{p.body}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ════════════════════════ FAQ ════════════════════════ */
function FAQ() {
  const items = [
    {
      q: 'Was kostet passare?',
      a: 'Verkäufer zahlen eine einmalige Paketgebühr ab CHF 290 (Light, 3 Monate Laufzeit). Käufer können kostenlos browsen und mit dem Basic-Tier 5 Anfragen pro Monat stellen. Käufer+ MAX kostet CHF 199 pro Monat oder CHF 1’990 pro Jahr und gibt 7 Tage Frühzugang sowie alle Filter.',
    },
    {
      q: 'Wer sieht meine Daten als Verkäufer?',
      a: 'Im öffentlichen Teaser sind Firmenname, Standort und Detailzahlen anonymisiert. Erst wenn du eine Anfrage im Dashboard freischaltest, erhält der Käufer das Detail-Dossier und ggf. den Datenraum. Du entscheidest pro Anfrage, ob du freigibst oder ablehnst.',
    },
    {
      q: 'Wie funktioniert die Anfrage als Käufer?',
      a: 'Du wählst ein Inserat und stellst über das Anfrage-Formular eine kurze Vorstellung mit Hintergrund, Kapital-Setup und Zeitschiene. Die Anfrage geht direkt an den Verkäufer. Bei Freigabe öffnet sich das Detail-Dossier — keine Wartezeit über einen Broker.',
    },
    {
      q: 'Was ist der Unterschied zu einem Broker?',
      a: 'Ein Broker arbeitet auf Mandat und übernimmt das Mandat ganzheitlich. passare ist eine Self-Service-Plattform: Du inserierst selbst, du verhandelst selbst, du entscheidest selbst, wer dein Detail-Dossier sieht. Falls du einen Broker brauchst, kannst du jederzeit einen über unser Verzeichnis finden.',
    },
    {
      q: 'Brauche ich einen Anwalt für die Übergabe?',
      a: 'Für den Kaufvertrag und die Übergabestrukturierung ja — passare ersetzt keinen Fachanwalt oder Treuhänder. Bei Bedarf vermitteln wir auf Wunsch Schweizer M&A-Anwälte und Treuhänder. Die eigentliche Plattform-Arbeit (Anonymes Listing, Anfragen, Datenraum) machst du auf passare; den Vertragsteil mit dem Profi.',
    },
    {
      q: 'Wie lange dauert eine Nachfolge typischerweise?',
      a: 'Eine vollständige Nachfolge dauert in der Schweiz typischerweise 6 – 18 Monate von Inserat bis Closing — Due Diligence, Verhandlung und steuerliche Strukturierung sind die längsten Etappen. Auf passare läuft dein Inserat während dieser ganzen Zeit, du kannst es jederzeit pausieren oder verlängern.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Kurz beantwortet<span className="text-bronze">.</span>
            </h2>
          </div>
        </Reveal>
        <div className="max-w-3xl">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <details className="group border-t border-stone py-6 last:border-b">
                <summary className="flex items-start justify-between gap-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <h3 className="font-serif text-head-md text-navy font-normal leading-snug group-hover:text-bronze-ink transition-colors">
                    {item.q}
                  </h3>
                  <span
                    aria-hidden
                    className="flex-shrink-0 mt-1 w-6 h-6 rounded-full border border-stone flex items-center justify-center text-quiet group-hover:border-bronze group-hover:text-bronze transition-colors"
                  >
                    <span className="block w-2.5 h-px bg-current" />
                    <span className="block w-px h-2.5 -ml-[1px] bg-current group-open:hidden" />
                  </span>
                </summary>
                <p className="mt-4 text-body text-muted leading-relaxed max-w-prose">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Final CTA ════════════════════════ */
function FinalCTA() {
  return (
    <Section className="bg-bronze text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-cream/70">Bereit?</p>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Direkter Marktplatz<span className="text-navy">.</span>{' '}
              Heute live<span className="text-navy">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/85 max-w-prose leading-relaxed mb-10">
              Du verkaufst eine Firma? Inserat ist in 10 Minuten live.
              Du suchst eine? Browsen ist kostenlos.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                href="/verkaufen"
                className="bg-navy text-cream hover:bg-ink"
                size="lg"
              >
                Firma inserieren
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                href="/onboarding/kaeufer/tunnel"
                variant="secondary"
                size="lg"
                className="border-cream/30 text-cream hover:border-cream"
              >
                Kostenlos als Käufer registrieren
              </Button>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-cream/60 mt-6">
              «Made in Switzerland» &middot; Anonym &middot; Self-Service
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
