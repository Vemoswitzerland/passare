import Link from 'next/link';
import { ArrowRight, ShieldCheck, Compass, Newspaper, Terminal, Layers, FileLock2, Sparkles } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { DotPattern, GridLines } from '@/components/ui/dot-pattern';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { LiveTicker } from '@/components/sections/live-ticker';

/**
 * passare.ch — Editorial × Tech Homepage
 * Partners-Group-Gravitas + Linear/Stripe-Precision
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopBar />
      <Hero />
      <Principles />
      <HowItWorks />
      <LiveSignal />
      <KPIs />
      <Promise />
      <Footer />
    </main>
  );
}

/* ═══════════════════════════════════════════════
   TOP-BAR
   ═══════════════════════════════════════════════ */
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
            {['Verkaufen', 'Entdecken', 'Bewertung', 'Redaktion'].map((n) => (
              <a
                key={n}
                href="/"
                className="relative text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors duration-300"
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
   HERO
   ═══════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 md:pt-36 pb-24 md:pb-40">
      {/* Dezentes Dot-Grid im Hintergrund */}
      <DotPattern spacing={28} size={1} color="rgba(11,31,58,0.10)" />
      <GridLines />

      <Container>
        <div className="relative max-w-hero">
          <Reveal>
            <Badge variant="live" dot className="mb-10 font-mono text-[11px] tracking-widest uppercase">
              <span>Beta</span>
              <span className="text-stone">·</span>
              <span>Launch Herbst 2026</span>
              <span className="text-stone">·</span>
              <span className="text-bronze-ink">Invite only</span>
            </Badge>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-serif-display text-display-xl text-navy font-light mb-8 tracking-[-0.025em]">
              Der vertrauensvolle Übergang<span className="text-bronze">.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
              <span className="font-serif italic text-navy">passare</span> kuratiert den Übergang
              von Schweizer KMU. Für Unternehmerinnen und Unternehmer, die ihr Lebenswerk nicht
              an den nächsten Höchstbietenden geben wollen &mdash; sondern an die richtigen Hände.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 items-start mb-16">
              <Button href="/beta" size="lg">
                Beta-Zugang anfragen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/design" variant="secondary" size="lg">
                Designsprache ansehen
              </Button>
            </div>
          </Reveal>

          {/* Mini-Signals-Zeile (tech-style, mono) */}
          <Reveal delay={0.4}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-widest text-quiet">
              <SignalDot>Made in Zürich</SignalDot>
              <span className="w-px h-3 bg-stone" />
              <SignalDot>4 Sprachen</SignalDot>
              <span className="w-px h-3 bg-stone" />
              <SignalDot>Keine Provision</SignalDot>
              <span className="w-px h-3 bg-stone" />
              <SignalDot>NDA-First</SignalDot>
            </div>
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
   PRINZIPIEN
   ═══════════════════════════════════════════════ */
function Principles() {
  const principles = [
    {
      Icon: ShieldCheck,
      no: '01',
      over: 'Vertraulich',
      title: 'Diskretion als Grundhaltung',
      body: 'Anonymisierte Profile. NDA vor jeder Detail-Einsicht. Datenraum mit Wasserzeichen. Wer verkauft, bestimmt, wer schaut.',
    },
    {
      Icon: Compass,
      no: '02',
      over: 'Kuratiert',
      title: 'Kein Marktplatz – eine Redaktion',
      body: 'Jedes Mandat wird geprüft, strukturiert, erzählt. Wir liefern den Kontext, der einen Käufer von einem Interessenten unterscheidet.',
    },
    {
      Icon: Newspaper,
      no: '03',
      over: 'Transparent',
      title: 'Klares Pricing, keine Provision',
      body: 'Feste Pakete statt Erfolgsbeteiligung. Was Sie zahlen, wissen Sie vorab – unabhängig davon, was Ihr Unternehmen später wert ist.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-16 max-w-prose">
            <p className="overline mb-5">Haltung</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Drei Prinzipien, die alles bestimmen.
            </h2>
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
   HOW-IT-WORKS (Tech-affin, Nummerierte Steps)
   ═══════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      Icon: Terminal,
      step: 'I',
      over: 'Einreichen',
      title: 'Mandat anlegen',
      body: 'Zefix-Import, KI-Assistent für Beschreibung, Bildupload. Wir validieren — Sie entscheiden.',
      tech: 'Ø 8 Min',
    },
    {
      Icon: Layers,
      step: 'II',
      over: 'Kuratieren',
      title: 'Redaktionelle Prüfung',
      body: 'Unsere Redaktion strukturiert, prüft, platziert. Anonymisiert, präzise, verkaufsstark.',
      tech: '48 Std SLA',
    },
    {
      Icon: FileLock2,
      step: 'III',
      over: 'NDA',
      title: 'Sichere Datenräume',
      body: 'Qualifizierte Käufer signieren digital. Wasserzeichen, Audit-Trail, Einzel-Freischaltung.',
      tech: 'eSign · QES',
    },
    {
      Icon: Sparkles,
      step: 'IV',
      over: 'Übergabe',
      title: 'Persönliche Begleitung',
      body: 'Vom Erstgespräch bis zum Closing. Mit Steuer-Experten, Anwälten, Treuhändern aus unserem Netzwerk.',
      tech: '6–18 Monate',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-20 max-w-prose">
            <p className="overline mb-5">Prozess</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Vom Entschluss bis zum Closing.
            </h2>
            <p className="text-body-lg text-muted leading-relaxed mt-6 max-w-prose">
              Vier Etappen, klar strukturiert. Ohne Zwischenhändler, ohne versteckte Kosten,
              ohne Zeitdruck.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {steps.map((s, i) => (
            <RevealItem key={i} className="bg-paper relative p-8 md:p-10 flex flex-col group hover:bg-cream/40 transition-colors duration-300">
              {/* Step-Nummer gross im Hintergrund */}
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

                {/* Tech-Badge */}
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
   LIVE-SIGNAL — Ticker-Sektion
   ═══════════════════════════════════════════════ */
function LiveSignal() {
  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-center">
          <Reveal>
            <p className="overline mb-5">Signal</p>
            <h2 className="font-serif text-display-sm text-navy font-light leading-tight mb-6">
              Die Plattform bewegt sich &mdash; leise, aber spürbar.
            </h2>
            <p className="text-body text-muted leading-relaxed mb-8 max-w-md">
              Jeden Tag neue Mandate, Anfragen, NDAs, Abschlüsse. Ein anonymisiertes
              Live-Bild unserer kuratierten Deal-Redaktion.
            </p>
            <div className="flex items-baseline gap-8">
              <div>
                <p className="font-mono text-display-sm text-navy font-tabular font-light">47</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mt-1">Aktive Mandate</p>
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

/* ═══════════════════════════════════════════════
   KPIs
   ═══════════════════════════════════════════════ */
function KPIs() {
  const stats = [
    {
      value: '72.3%',
      label: 'der Schweizer KMU suchen in den nächsten 10 Jahren eine Nachfolge',
      source: 'IFJ 2024',
      bar: 72.3,
    },
    {
      value: 'CHF 2.1 Mrd',
      label: 'geschätztes jährliches Übergabe-Volumen im KMU-Segment',
      source: 'Bisnode',
      bar: 84,
    },
    {
      value: '26',
      label: 'Kantone – eine Plattform. Drei Landessprachen plus Englisch.',
      source: null,
      bar: 100,
    },
  ];

  return (
    <Section>
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
                {/* Tech-Bar */}
                <div className="h-0.5 w-full bg-stone rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-bronze transition-all duration-1000 ease-out-expo"
                    style={{ width: `${s.bar}%` }}
                  />
                </div>
                {s.source && (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-quiet">
                    Quelle: {s.source}
                  </p>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   VERSPRECHEN — Editorial Quote
   ═══════════════════════════════════════════════ */
function Promise() {
  return (
    <Section className="relative bg-navy text-cream overflow-hidden">
      {/* Subtile Pattern im Dunkeln */}
      <DotPattern spacing={32} size={1} color="rgba(250,248,243,0.05)" fade={false} />

      <Container>
        <div className="relative max-w-hero">
          <Reveal>
            <p className="overline mb-8" style={{ color: '#B8935A' }}>Unser Versprechen</p>
            <blockquote className="font-serif text-display-md md:text-display-lg font-light leading-[1.08] text-cream">
              «Ein Unternehmen übergibt man nicht an Zahlen.
              <br />
              Man übergibt es an <em className="text-bronze not-italic">Menschen</em>.»
            </blockquote>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-16 pt-8 border-t border-cream/15 max-w-prose">
              <p className="text-body-lg text-cream/80 leading-relaxed mb-6">
                Darum dauern unsere Prozesse länger, sind unsere Gespräche persönlicher,
                und unsere Plattform bewusst kleiner als die der Mitbewerber.
                <span className="font-serif italic"> passare</span> ist für die Minderheit der Verkäufer,
                die den Unterschied spürt.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Button href="/beta" variant="bronze" size="md">
                  Beta-Zugang anfragen
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <span className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
                  Invite only &middot; Q4 2026
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════ */
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
              Die Schweizer Nachfolge-Plattform. Kuratiert. Diskret. Vierprachig.
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
              <li><Link className="hover:text-navy transition-colors" href="/">Verkaufen</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Entdecken</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Bewertung</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Broker</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Haus</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy transition-colors" href="/">Über passare</Link></li>
              <li><Link className="hover:text-navy transition-colors" href="/">Redaktion</Link></li>
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
