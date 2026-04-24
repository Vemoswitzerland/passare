import Link from 'next/link';
import { ArrowRight, ShieldCheck, Users, Scale, Upload, FileLock2, MessageCircle, Handshake, Check } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { LiveTicker } from '@/components/sections/live-ticker';
import { DashboardMockup } from '@/components/sections/dashboard-mockup';

/**
 * passare.ch — Self-Service-Plattform für KMU-Nachfolge
 *
 * Geschäftsmodell:
 * - Verkäufer: 3 Inseratspakete (Light/Pro/Premium, einmalig)
 * - Käufer: Basic (gratis) + MAX (CHF 199/Monat)
 * - Kein Broker-Angebot in V1
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopBar />
      <Hero />
      <Principles />
      <HowItWorks />
      <Pricing />
      <LiveSignal />
      <KPIs />
      <Promise />
      <Footer />
    </main>
  );
}

/* ═══════════════════════════════════════════════ */
function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-cream/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/" className="group flex items-center gap-3">
            <span className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </span>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest text-quiet border border-stone rounded-full px-2 py-0.5">
              beta
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-9">
            {['Inserieren', 'Entdecken', 'Preise', 'Ratgeber'].map((n) => (
              <a
                key={n}
                href="/"
                className="text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors duration-300"
              >
                {n}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-quiet">
              <span className="text-navy">DE</span>
              <span className="text-stone">·</span>
              <span className="hover:text-navy cursor-pointer">FR</span>
              <span className="text-stone">·</span>
              <span className="hover:text-navy cursor-pointer">IT</span>
              <span className="text-stone">·</span>
              <span className="hover:text-navy cursor-pointer">EN</span>
            </div>
            <Button href="/beta" size="sm" variant="secondary" className="hidden md:inline-flex">
              Einloggen
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}

/* ═══════════════════════════════════════════════
   HERO — Text links, Dashboard-Mockup rechts
   ═══════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-20 md:pb-28">
      <Container size="wide">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="relative">
            <Reveal>
              <h1 className="font-serif-display text-[clamp(2.75rem,5.5vw,5.75rem)] text-navy font-light mb-6 tracking-[-0.025em] leading-[1.02]">
                Der Firmen-Marktplatz
                <br />
                <span className="text-muted italic">der Schweiz<span className="not-italic text-bronze">.</span></span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg text-muted max-w-md leading-relaxed mb-8">
                Die Schweizer Plattform für KMU-Nachfolge &mdash;
                selbst inserieren, direkt verhandeln. Ohne Provision.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-3 items-start mb-10">
                <Button href="/verkaufen" size="lg">
                  Firma inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="/kaufen" variant="secondary" size="lg">
                  Firmen entdecken
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
                <SignalDot>Ab CHF 290</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>0% Provision</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>NDA-Gate</SignalDot>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.35} className="relative">
            <DashboardMockup />
          </Reveal>
        </div>
      </Container>
    </section>
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

/* ═══════════════════════════════════════════════
   PRINZIPIEN — Plattform-Modell
   ═══════════════════════════════════════════════ */
function Principles() {
  const principles = [
    {
      Icon: Users,
      no: '01',
      over: 'Direkt',
      title: 'Sie verhandeln selbst',
      body: 'Anfragen kommen direkt in Ihr Dashboard. Sie entscheiden, mit wem Sie ins Gespräch gehen — ohne Zwischenhändler, ohne Telefon-Ping-Pong, ohne Commission-Tracker.',
    },
    {
      Icon: ShieldCheck,
      no: '02',
      over: 'Diskret',
      title: 'Anonym, bis Sie es anders wollen',
      body: 'Ihr Inserat ist öffentlich sichtbar — Firmenname und Details bleiben verdeckt. Erst nach unterzeichnetem NDA und Ihrer Freigabe erhält ein Interessent das volle Dossier.',
    },
    {
      Icon: Scale,
      no: '03',
      over: 'Transparent',
      title: 'Fester Paketpreis, fertig',
      body: 'Ab CHF 290 für 3 Monate Laufzeit. Keine Provision auf Ihren Verkaufspreis. Was Sie zahlen, wissen Sie vorab — unabhängig davon, was Ihr Unternehmen später bringt.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-16 max-w-prose">
            <p className="overline mb-5">Das Modell</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Plattform statt Makler.
            </h2>
            <p className="text-body-lg text-muted leading-relaxed mt-6 max-w-prose">
              Wir verbinden Verkäufer und Käufer &mdash; den Rest machen Sie selbst.
              Schneller, günstiger, und ohne Interessenkonflikt eines Vermittlers.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-3 gap-px bg-stone">
          {principles.map((p, i) => (
            <RevealItem key={i} className="bg-paper p-10 md:p-12 flex flex-col group">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-[11px] tracking-widest uppercase text-quiet">
                  {p.no} · {p.over}
                </span>
                <p.Icon className="w-5 h-5 text-bronze group-hover:rotate-12 transition-transform duration-500 ease-out-expo" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-head-lg text-navy mb-4 font-normal leading-snug">
                {p.title}
              </h3>
              <p className="text-body text-muted leading-relaxed">{p.body}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   HOW-IT-WORKS
   ═══════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      Icon: Upload,
      step: 'I',
      over: 'Inserat',
      title: 'Paket wählen & inserieren',
      body: 'Zefix-Import, KI-Assistent für Teaser, Foto-Upload. In 10–15 Minuten ist Ihr anonymes Inserat live.',
      tech: 'CHF 290 – 1\'890',
    },
    {
      Icon: FileLock2,
      step: 'II',
      over: 'Schutz',
      title: 'NDA-Gate aktivieren',
      body: 'Interessenten signieren digital eine Geheimhaltung, bevor sie Firmenname oder echte Zahlen sehen.',
      tech: 'eSign · QES',
    },
    {
      Icon: MessageCircle,
      step: 'III',
      over: 'Kontakt',
      title: 'Anfragen direkt beantworten',
      body: 'Alle Anfragen laufen in Ihrem Dashboard zusammen. Sie wählen, mit wem Sie den Dialog suchen.',
      tech: 'Inbox · Datenraum',
    },
    {
      Icon: Handshake,
      step: 'IV',
      over: 'Abschluss',
      title: 'Selbst verhandeln & abschliessen',
      body: 'Sie führen die Gespräche, Sie setzen den Preis. Bei Bedarf vermitteln wir Experten aus unserem Netzwerk.',
      tech: '0% Provision',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-20 max-w-prose">
            <p className="overline mb-5">So funktioniert&apos;s</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              In vier Schritten zum eigenen Verkauf.
            </h2>
            <p className="text-body-lg text-muted leading-relaxed mt-6 max-w-prose">
              Kein langes Onboarding, keine Beraterverträge. Sie bleiben Eigentümer
              des Prozesses &mdash; von der ersten Zeile bis zum Handschlag.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {steps.map((s, i) => (
            <RevealItem key={i} className="bg-paper relative p-8 md:p-10 flex flex-col group hover:bg-cream/40 transition-colors duration-300">
              <span
                aria-hidden
                className="absolute top-6 right-6 font-serif text-6xl text-bronze/10 font-light select-none"
              >
                {s.step}
              </span>
              <div className="relative">
                <s.Icon className="w-6 h-6 text-bronze mb-8" strokeWidth={1.5} />
                <p className="font-mono text-[11px] tracking-widest uppercase text-quiet mb-3">
                  Schritt {s.step} &middot; {s.over}
                </p>
                <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">
                  {s.title}
                </h3>
                <p className="text-body-sm text-muted leading-relaxed mb-8">{s.body}</p>
                <div className="mt-auto pt-4 border-t border-stone">
                  <span className="font-mono text-[11px] text-bronze-ink font-medium">
                    ◦ {s.tech}
                  </span>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   PRICING — Nur Verkäufer-Pakete (Käufer → /preise)
   ═══════════════════════════════════════════════ */
function Pricing() {
  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Preise für Verkäufer</p>
            <h2 className="font-serif text-display-md text-navy font-light mb-6">
              Fester Preis. Keine Provision.
            </h2>
            <p className="text-body-lg text-muted leading-relaxed max-w-prose">
              Sie zahlen einmal für Ihr Inserat. Was Ihre Firma später bringt, bleibt bei Ihnen.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          <SellerPlan
            tag="Einstieg" name="Inserat Light" price="CHF 290" note="einmalig · 3 Monate"
            features={['Anonymes Inserat', '5 Bilder · 2 PDFs', 'NDA-Gate mit eSign', 'KI-Teaser']}
            cta="Light wählen" delay={0}
          />
          <SellerPlan
            tag="Empfohlen" highlight name="Inserat Pro" price="CHF 890" note="einmalig · 6 Monate"
            features={['Alles aus Light', '20 Bilder + Videos', 'Unbegrenzter Datenraum', 'Käuferprofil-Matching', 'Newsletter-Feature']}
            cta="Pro wählen" delay={0.08}
          />
          <SellerPlan
            tag="Maximum" name="Inserat Premium" price="CHF 1'890" note="einmalig · 12 Monate"
            features={['Alles aus Pro', 'Homepage-Feature', 'FR/IT/EN-Version', '2h Beratung inklusive', 'Priorisierter Support']}
            cta="Premium wählen" delay={0.16}
          />
        </div>

        <Reveal delay={0.25}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
              <SignalDot>Zzgl. 8.1% MWST</SignalDot>
              <span className="w-px h-3 bg-stone" />
              <SignalDot>Keine Auto-Verlängerung</SignalDot>
              <span className="w-px h-3 bg-stone" />
              <SignalDot>0% Erfolgsprovision</SignalDot>
            </div>
            <Link
              href="/preise"
              className="font-mono text-[11px] uppercase tracking-widest text-navy hover:text-bronze inline-flex items-center gap-1.5"
            >
              Preise im Detail &amp; Käufer-Abos <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function SellerPlan({
  tag, name, price, note, features, cta, highlight, delay = 0,
}: {
  tag: string; name: string; price: string; note: string;
  features: string[]; cta: string; highlight?: boolean; delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className={`h-full p-8 md:p-10 flex flex-col ${highlight ? 'bg-cream/60' : 'bg-paper'}`}>
        <div className="flex items-start justify-between mb-6">
          <p className={`font-mono text-[11px] uppercase tracking-widest ${highlight ? 'text-bronze-ink' : 'text-quiet'}`}>
            {tag}
          </p>
          {highlight && (
            <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-bronze/15 text-bronze-ink">
              empfohlen
            </span>
          )}
        </div>
        <h3 className="font-serif text-head-lg text-navy font-normal mb-6">{name}</h3>
        <div className="mb-6 pb-6 border-b border-stone">
          <p className="font-serif text-[clamp(2rem,4vw,3rem)] text-navy font-light font-tabular leading-none">
            {price}
          </p>
          <p className="font-mono text-[11px] mt-3 uppercase tracking-widest text-quiet">{note}</p>
        </div>
        <ul className="space-y-2.5 mb-10 flex-1">
          {features.map((f, j) => (
            <li key={j} className="flex items-start gap-3 text-body-sm">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-bronze" strokeWidth={1.75} />
              <span className="text-muted">{f}</span>
            </li>
          ))}
        </ul>
        <Button href="/verkaufen" variant={highlight ? 'primary' : 'secondary'} size="lg" className="w-full justify-center">
          {cta} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════ */
function LiveSignal() {
  return (
    <Section>
      <Container>
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-center">
          <Reveal>
            <p className="overline mb-5">Aktivität</p>
            <h2 className="font-serif text-display-sm text-navy font-light leading-tight mb-6">
              Der Marktplatz lebt &mdash; anonymisiert, aber spürbar.
            </h2>
            <p className="text-body text-muted leading-relaxed mb-8 max-w-md">
              Verifizierte Käufer, eingehende Anfragen, signierte NDAs &mdash;
              ein Live-Bild dessen, was auf der Plattform gerade passiert.
            </p>
            <div className="flex items-baseline gap-8">
              <div>
                <p className="font-mono text-display-sm text-navy font-tabular font-light">47</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mt-1">Aktive Inserate</p>
              </div>
              <div>
                <p className="font-mono text-display-sm text-navy font-tabular font-light">312</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mt-1">Verifizierte Käufer</p>
              </div>
              <div>
                <p className="font-mono text-display-sm text-bronze font-tabular font-light">99.98%</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mt-1">Verfügbarkeit</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <LiveTicker />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════ */
function KPIs() {
  const stats = [
    { value: '72.3%', label: 'der Schweizer KMU suchen in den nächsten 10 Jahren eine Nachfolge', source: 'IFJ 2024', bar: 72.3 },
    { value: 'CHF 2.1 Mrd', label: 'geschätztes jährliches Übergabe-Volumen im KMU-Segment', source: 'Bisnode', bar: 84 },
    { value: '26', label: 'Kantone – eine Plattform. Drei Landessprachen plus Englisch.', source: null, bar: 100 },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-16 max-w-prose">
            <p className="overline mb-5">Kontext</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Der Markt, den passare adressiert.
            </h2>
          </div>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-3 gap-10 md:gap-16">
          {stats.map((s, i) => (
            <RevealItem key={i}>
              <div className="border-t border-stone pt-8">
                <p className="font-serif text-display-sm text-navy mb-4 font-light font-tabular">
                  {s.value}
                </p>
                <p className="text-body-sm text-muted leading-relaxed mb-5">{s.label}</p>
                <div className="h-0.5 w-full bg-stone rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-bronze transition-all duration-1000 ease-out-expo" style={{ width: `${s.bar}%` }} />
                </div>
                {s.source && (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-quiet">Quelle: {s.source}</p>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════ */
function Promise() {
  return (
    <Section className="relative bg-navy text-cream overflow-hidden">
      <Container>
        <div className="relative max-w-hero">
          <Reveal>
            <p className="overline mb-8" style={{ color: '#B8935A' }}>Unser Versprechen</p>
            <blockquote className="font-serif text-display-md md:text-display-lg font-light leading-[1.08] text-cream">
              «Wir verdienen an der Plattform &mdash;
              <br />
              nicht an <em className="text-bronze not-italic">Ihrem Deal</em>.»
            </blockquote>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-16 pt-8 border-t border-cream/15 max-w-prose">
              <p className="text-body-lg text-cream/80 leading-relaxed mb-6">
                Klassische Makler leben von Erfolgsprovision &mdash; und haben damit ein
                Interesse an schnellen Abschlüssen. Wir leben von festen Paketen und
                Käufer-Abos: Sie zahlen einmal, Sie behalten jeden Franken vom Verkaufspreis.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Button href="/beta" variant="bronze" size="md">
                  Jetzt inserieren
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <span className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
                  Ab CHF 290 &middot; keine Provision
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-stone pt-16 pb-10 bg-cream">
      <Container>
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <p className="font-serif text-3xl text-navy mb-4">
              passare<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted max-w-xs leading-relaxed">
              Die Schweizer Self-Service-Plattform für die Nachfolge von KMU.
              Inserieren, verbinden, verhandeln &mdash; ohne Vermittler.
            </p>
            <div className="mt-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-quiet">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                System operational
              </span>
              <span className="text-stone">·</span>
              <span>v1.0.0-beta</span>
            </div>
          </div>
          <div>
            <p className="overline mb-4">Plattform</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy transition-colors" href="/">Inserieren</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Entdecken</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Preise</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Käufer MAX</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Haus</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy transition-colors" href="/">Über passare</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Ratgeber</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Kontakt</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/design">Design System</Link></li>
            </ul>
          </div>
        </div>

        <Divider className="mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
          <div className="flex gap-6">
            <Link className="hover:text-navy transition-colors" href="/">Impressum</Link>
            <Link className="hover:text-navy transition-colors" href="/">Datenschutz</Link>
            <Link className="hover:text-navy transition-colors" href="/">AGB</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
