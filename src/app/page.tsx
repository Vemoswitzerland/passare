import { ArrowRight, ShieldCheck, Compass, Newspaper } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';

/**
 * passare.ch — Editorial Homepage
 *
 * Ton: Partners-Group-Institutional × Editorial-Real-Estate
 * Nicht: Marktplatz-Cards, nicht Corporate-Fintech-Blau
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <TopBar />
      <Hero />
      <Principles />
      <KPIs />
      <Promise />
      <Footer />
    </main>
  );
}

/* ────────────────────────────────────────────────
   TOP-BAR (minimal, Swiss-Style)
   ──────────────────────────────────────────────── */
function TopBar() {
  return (
    <header className="border-b border-stone">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/" className="font-serif text-2xl text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </a>
          <nav className="hidden md:flex items-center gap-10 overline">
            <a href="/" className="text-muted hover:text-ink transition-colors">Verkaufen</a>
            <a href="/" className="text-muted hover:text-ink transition-colors">Entdecken</a>
            <a href="/" className="text-muted hover:text-ink transition-colors">Bewertung</a>
            <a href="/" className="text-muted hover:text-ink transition-colors">Redaktion</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex gap-1.5 overline text-quiet">
              DE <span className="text-stone">·</span> FR <span className="text-stone">·</span> IT <span className="text-stone">·</span> EN
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}

/* ────────────────────────────────────────────────
   HERO — Editorial Opening
   ──────────────────────────────────────────────── */
function Hero() {
  return (
    <Section className="pt-20 md:pt-32 pb-24 md:pb-40">
      <Container>
        <div className="max-w-hero animate-fade-up">
          <Badge variant="live" dot className="mb-10">
            <span>Beta</span>
            <span className="text-stone">·</span>
            <span>Launch Herbst 2026</span>
          </Badge>

          <h1 className="font-serif-display text-display-xl text-navy font-light mb-8">
            Der vertrauensvolle Übergang<span className="text-bronze">.</span>
          </h1>

          <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
            <span className="font-serif italic text-navy">passare</span> kuratiert den Übergang
            von Schweizer KMU. Für Unternehmerinnen und Unternehmer, die ihr Lebenswerk nicht
            an den nächsten Höchstbietenden geben wollen &mdash; sondern an die richtigen Hände.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button href="/beta" size="lg">
              Beta-Zugang anfragen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button href="/design" variant="secondary" size="lg">
              Designsprache ansehen
            </Button>
          </div>

          <div className="mt-16 flex items-center gap-6 overline text-quiet">
            <span>Made in Zürich</span>
            <span className="w-px h-3 bg-stone" />
            <span>Vierprachig</span>
            <span className="w-px h-3 bg-stone" />
            <span>Keine Erfolgsprovision</span>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   DREI-PRINZIPIEN-SEKTION
   ──────────────────────────────────────────────── */
function Principles() {
  const principles = [
    {
      Icon: ShieldCheck,
      overline: '01 &mdash; Vertraulich',
      title: 'Diskretion als Grundhaltung',
      body:
        'Anonymisierte Profile. NDA vor jeder Detail-Einsicht. Datenraum mit Wasserzeichen. Wer verkauft, bestimmt, wer schaut.',
    },
    {
      Icon: Compass,
      overline: '02 &mdash; Kuratiert',
      title: 'Kein Marktplatz &mdash; eine Redaktion',
      body:
        'Jedes Mandat wird geprüft, strukturiert, erzählt. Wir liefern den Kontext, der einen Käufer von einem Interessenten unterscheidet.',
    },
    {
      Icon: Newspaper,
      overline: '03 &mdash; Transparent',
      title: 'Klares Pricing, keine Provision',
      body:
        'Feste Pakete statt Erfolgsbeteiligung. Was Sie zahlen, wissen Sie vorab &mdash; unabhängig davon, was Ihr Unternehmen später wert ist.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <div className="mb-16 max-w-prose">
          <p className="overline mb-5">Haltung</p>
          <h2 className="font-serif text-display-md text-navy font-light">
            Drei Prinzipien, die alles bestimmen.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-stone">
          {principles.map((p, i) => (
            <div key={i} className="bg-paper p-10 md:p-12 flex flex-col">
              <p className="overline mb-6" dangerouslySetInnerHTML={{ __html: p.overline }} />
              <p.Icon className="w-6 h-6 text-bronze mb-8" strokeWidth={1.5} />
              <h3 className="font-serif text-head-lg text-navy mb-4 font-normal">
                {p.title}
              </h3>
              <p className="text-body text-muted leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   KPIs mit editorialen Zahlen
   ──────────────────────────────────────────────── */
function KPIs() {
  const stats = [
    { value: '72.3%', label: 'der Schweizer KMU suchen in den nächsten 10 Jahren eine Nachfolge', source: 'IFJ 2024' },
    { value: 'CHF 2.1 Mrd', label: 'geschätztes jährliches Übergabe-Volumen im KMU-Segment', source: 'Bisnode' },
    { value: '26', label: 'Kantone &mdash; eine Plattform. Drei Landessprachen plus Englisch.', source: null },
  ];

  return (
    <Section>
      <Container>
        <div className="grid md:grid-cols-3 gap-10 md:gap-16">
          {stats.map((s, i) => (
            <div key={i} className="border-t border-stone pt-8">
              <p className="font-serif text-display-sm text-navy mb-4 font-light font-tabular">
                {s.value}
              </p>
              <p className="text-body-sm text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: s.label }} />
              {s.source && (
                <p className="overline text-quiet mt-3">Quelle: {s.source}</p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   VERSPRECHEN — grosses Editorial-Zitat
   ──────────────────────────────────────────────── */
function Promise() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <p className="overline text-bronze mb-8">Unser Versprechen</p>
          <blockquote className="font-serif text-display-md md:text-display-lg font-light leading-[1.08] text-cream">
            «Ein Unternehmen übergibt man nicht an Zahlen.
            <br />
            Man übergibt es an <em className="text-bronze not-italic">Menschen</em>.»
          </blockquote>
          <div className="mt-16 pt-8 border-t border-cream/15 max-w-prose">
            <p className="text-body-lg text-cream/80 leading-relaxed">
              Darum dauern unsere Prozesse länger, sind unsere Gespräche persönlicher,
              und unsere Plattform bewusst kleiner als die der Mitbewerber. <span className="font-serif italic">passare</span>
              {' '}ist für die Minderheit der Verkäufer, die den Unterschied spürt.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   FOOTER
   ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-stone pt-16 pb-10">
      <Container>
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <p className="font-serif text-3xl text-navy mb-4">
              passare<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted max-w-xs leading-relaxed">
              Die Schweizer Nachfolge-Plattform. Kuratiert. Diskret. Vierprachig.
            </p>
          </div>
          <div>
            <p className="overline mb-4">Plattform</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><a className="hover:text-navy transition-colors" href="/">Verkaufen</a></li>
              <li><a className="hover:text-navy transition-colors" href="/">Entdecken</a></li>
              <li><a className="hover:text-navy transition-colors" href="/">Bewertung</a></li>
              <li><a className="hover:text-navy transition-colors" href="/">Broker</a></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Haus</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><a className="hover:text-navy transition-colors" href="/">Über passare</a></li>
              <li><a className="hover:text-navy transition-colors" href="/">Redaktion</a></li>
              <li><a className="hover:text-navy transition-colors" href="/">Kontakt</a></li>
              <li><a className="hover:text-navy transition-colors" href="mailto:beta@passare.ch">Beta-Zugang</a></li>
            </ul>
          </div>
        </div>

        <Divider className="mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p>&copy; {new Date().getFullYear()} passare &mdash; «Made in Switzerland»</p>
          <div className="flex gap-6">
            <a className="hover:text-navy transition-colors" href="/">Impressum</a>
            <a className="hover:text-navy transition-colors" href="/">Datenschutz</a>
            <a className="hover:text-navy transition-colors" href="/">AGB</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
