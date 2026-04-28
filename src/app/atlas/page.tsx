import Link from 'next/link';
import { ArrowRight, MapPin, Filter as FilterIcon, Lock } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { Divider } from '@/components/ui/divider';
import { SiteHeader } from '../page';
import { loadAtlasMarkers } from './atlas-data';
import { KANTON_CODES } from '@/lib/constants';
import { getBranchen } from '@/lib/branchen';
import AtlasMap from './AtlasMapWrapper';

export const metadata = {
  title: 'Firmen-Atlas Schweiz — passare',
  description:
    'Interaktive Karte aller aktiven KMU-Inserate auf passare. Filter nach Branche und Kanton, Eckdaten direkt im Popup, anonymes Dossier auf Anfrage.',
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function AtlasPage() {
  const [markers, branchenRaw] = await Promise.all([
    loadAtlasMarkers(),
    getBranchen(),
  ]);
  const branchen = branchenRaw
    .map((b) => b.label_de)
    .sort((a, b) => a.localeCompare(b, 'de'));
  const kantone = [...KANTON_CODES];

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero count={markers.length} />
      <MapSection markers={markers} branchen={branchen} kantone={kantone} />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero({ count }: { count: number }) {
  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-10 md:pb-14">
      <Container size="wide">
        <Reveal>
          <p className="overline mb-5 text-bronze-ink">Firmen-Atlas</p>
          <h1 className="font-serif text-[clamp(2.25rem,4.5vw,4rem)] text-navy font-light tracking-[-0.025em] leading-[1.05] max-w-hero mb-6">
            Alle aktiven KMU-Inserate <span className="text-muted italic">auf einer Karte<span className="not-italic text-bronze">.</span></span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-body-lg text-muted max-w-prose leading-relaxed mb-6">
            Filtern Sie nach Branche und Kanton. Klicken Sie auf einen Punkt, um die Eckdaten zu sehen.
            Detaillierte Dossiers gibt es nach Registrierung und unterzeichnetem NDA.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
            <SignalDot>{count} aktive Inserate</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>26 Kantone</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>Anonyme Teaser</SignalDot>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function MapSection({
  markers,
  branchen,
  kantone,
}: {
  markers: Awaited<ReturnType<typeof loadAtlasMarkers>>;
  branchen: string[];
  kantone: string[];
}) {
  return (
    <section className="pb-16 md:pb-24">
      <Container size="wide">
        <AtlasMap markers={markers} branchen={branchen} kantone={kantone} />
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

function HowItWorks() {
  const items = [
    { Icon: MapPin, title: 'Marker entdecken', body: 'Jeder Punkt ist ein anonymisiertes Inserat. Cluster fassen mehrere Mandate in einer Region zusammen — Klick zoomt rein.' },
    { Icon: FilterIcon, title: 'Filter setzen', body: 'Branche und Kanton oben filtern die Karte live. So sehen Sie sofort, was im interessierenden Markt verfügbar ist.' },
    { Icon: Lock, title: 'NDA-geschützt', body: 'Firmenname und Detail-Zahlen erscheinen erst nach Registrierung und unterzeichnetem NDA. Sie entscheiden, was öffentlich ist.' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">So funktioniert es</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Drei Klicks bis zum Mandat.
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {items.map((it, i) => (
            <RevealItem key={i} className="bg-paper p-8 md:p-10 flex flex-col">
              <it.Icon className="w-6 h-6 text-bronze mb-6" strokeWidth={1.5} />
              <h3 className="font-serif text-head-md text-navy mb-3 font-normal leading-snug">{it.title}</h3>
              <p className="text-body-sm text-muted leading-relaxed">{it.body}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

function CTA() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Sie verkaufen — Ihr Punkt fehlt auf der Karte<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              In zehn Minuten ist Ihr Inserat live, anonymisiert und NDA-geschützt. Sie entscheiden,
              wer welche Information sieht und wann.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/verkaufen" variant="bronze" size="lg">
                Inserat erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/kaufen" size="lg" className="bg-transparent border border-cream/25 text-cream hover:bg-cream/10">
                Marktplatz öffnen
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone pt-16 pb-10 bg-cream mt-auto">
      <Container>
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <p className="font-serif text-3xl text-navy mb-4">
              passare<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted max-w-xs leading-relaxed">
              Die Schweizer Self-Service-Plattform für die Nachfolge von KMU.
            </p>
          </div>
          <div>
            <p className="overline mb-4">Plattform</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/verkaufen">Inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/kaufen">Firmen entdecken</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Preise</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Haus</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/">Über passare</Link></li>
              <li><Link className="hover:text-navy" href="/design">Design System</Link></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
        </div>
      </Container>
    </footer>
  );
}
