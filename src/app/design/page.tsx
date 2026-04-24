import Link from 'next/link';
import { ArrowRight, ShieldCheck, Compass, Newspaper, MapPin, TrendingUp, Users, Building2 } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Input, Label } from '@/components/ui/input';

export const metadata = {
  title: 'Design System — passare',
  robots: { index: false, follow: false },
};

/**
 * /design — Living Style Guide für passare.ch
 * Zeigt alle Design-Tokens, Komponenten, Patterns.
 */
export default function DesignPage() {
  return (
    <main className="min-h-screen">
      {/* Top-Bar */}
      <header className="border-b border-stone sticky top-0 bg-cream/95 backdrop-blur-sm z-10">
        <Container>
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <p className="overline text-quiet">Design · v1.0</p>
          </div>
        </Container>
      </header>

      {/* Intro */}
      <Section className="pb-16">
        <Container>
          <div className="max-w-hero animate-fade-up">
            <Badge variant="bronze" className="mb-10">Living Style Guide</Badge>
            <h1 className="font-serif-display text-display-lg text-navy font-light mb-8">
              Das Haus<span className="text-bronze">,</span> nicht nur die Fassade.
            </h1>
            <p className="text-body-lg text-muted max-w-prose leading-relaxed">
              Jedes Detail dieser Plattform folgt einer Regel. Hier sind die Regeln,
              sichtbar gemacht &mdash; die Farben, die Schrift, die Proportionen, die kleinen
              Gesten. Keine Bibliothek, kein Kit von der Stange.
            </p>
          </div>
        </Container>
      </Section>

      <Divider />
      <ColorPalette />
      <Divider />
      <TypographyScale />
      <Divider />
      <ButtonShowcase />
      <Divider />
      <CardShowcase />
      <Divider />
      <FormShowcase />
      <Divider />
      <IconShowcase />
      <Divider />
      <BadgeShowcase />
      <Divider />
      <MotionShowcase />
      <Divider />
      <SwissDetails />

      <footer className="border-t border-stone py-10">
        <Container>
          <div className="flex items-center justify-between text-caption text-quiet">
            <p>passare &mdash; «Design System v1.0»</p>
            <Link href="/" className="editorial">Zurück zur Startseite</Link>
          </div>
        </Container>
      </footer>
    </main>
  );
}

/* ────────────────────────────────────────────────
   FARBPALETTE
   ──────────────────────────────────────────────── */
function ColorPalette() {
  const groups = [
    {
      title: 'Brand',
      colors: [
        { name: 'ink', hex: '#0A0F12', note: 'Primär-Text, nicht reines Schwarz' },
        { name: 'navy', hex: '#0B1F3A', note: 'Institutional Deep-Navy, Headlines' },
        { name: 'bronze', hex: '#B8935A', note: 'Premium Warm-Akzent, Swiss-Banking' },
        { name: 'cream', hex: '#FAF8F3', note: 'Warm Off-White Background' },
        { name: 'paper', hex: '#FFFFFF', note: 'Surface / Card-Hintergrund' },
      ],
    },
    {
      title: 'Neutrals',
      colors: [
        { name: 'stone', hex: '#E8E6E0', note: 'Hairline-Border 0.5–1px' },
        { name: 'fog', hex: '#DDD9D1', note: 'Etwas dunklere Hairline' },
        { name: 'quiet', hex: '#8A9099', note: 'Tertiär-Text / Caption' },
        { name: 'muted', hex: '#5A6471', note: 'Sekundär-Text' },
      ],
    },
    {
      title: 'Status',
      colors: [
        { name: 'success', hex: '#1F7A4D', note: 'Flaschen-Grün' },
        { name: 'warn', hex: '#9A6B1E', note: 'Warm-Ocker' },
        { name: 'danger', hex: '#B8322A', note: 'Tief-Rot' },
      ],
    },
  ];

  return (
    <Section>
      <Container>
        <SectionHeader
          over="01"
          title="Farbe"
          sub="Keine Commodity-Corporate-Farbpalette. Gedeckt, warm, institutionell."
        />

        <div className="space-y-12">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="overline mb-6">{g.title}</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-stone">
                {g.colors.map((c) => (
                  <div key={c.name} className="bg-paper p-6">
                    <div
                      className="w-full h-24 rounded-soft mb-4 border border-stone"
                      style={{ background: c.hex }}
                    />
                    <p className="font-sans font-medium text-ink">{c.name}</p>
                    <p className="font-mono text-caption text-muted mt-1">{c.hex}</p>
                    <p className="text-caption text-quiet mt-2 leading-snug">{c.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   TYPOGRAFIE
   ──────────────────────────────────────────────── */
function TypographyScale() {
  return (
    <Section>
      <Container>
        <SectionHeader
          over="02"
          title="Typografie"
          sub="Fraunces (Variable, Editorial-Serif) + Geist Sans (Swiss-Grotesk-Erbe)."
        />

        <div className="space-y-12">
          <Row label="Display XL — Hero">
            <p className="font-serif-display text-display-xl text-navy font-light">
              Der Übergang<span className="text-bronze">.</span>
            </p>
          </Row>
          <Row label="Display LG — Section">
            <p className="font-serif text-display-lg text-navy font-light">
              Kuratierte Nachfolge
            </p>
          </Row>
          <Row label="Display MD — Block">
            <p className="font-serif text-display-md text-navy font-light">
              Drei Prinzipien, die alles bestimmen.
            </p>
          </Row>
          <Row label="Headline LG">
            <p className="font-serif text-head-lg text-navy">Diskretion als Grundhaltung</p>
          </Row>
          <Row label="Body Large (Lead)">
            <p className="text-body-lg text-muted max-w-prose">
              Jedes Mandat wird geprüft, strukturiert, erzählt. Wir liefern den Kontext,
              der einen Käufer von einem Interessenten unterscheidet.
            </p>
          </Row>
          <Row label="Body">
            <p className="text-body text-ink max-w-prose">
              passare kuratiert den Übergang von Schweizer KMU. Für Unternehmerinnen und
              Unternehmer, die ihr Lebenswerk in die richtigen Hände übergeben wollen.
            </p>
          </Row>
          <Row label="Caption">
            <p className="text-caption text-quiet">Quelle: IFJ Nachfolgestudie 2024</p>
          </Row>
          <Row label="Overline">
            <p className="overline">Vertraulich · Kuratiert · Transparent</p>
          </Row>
          <Row label="Mono — Deal-Zahlen (tabular-nums)">
            <p className="font-mono text-body-lg text-navy font-tabular">
              CHF 1'250'000 &nbsp; · &nbsp; EBITDA 18.4% &nbsp; · &nbsp; 24 MA
            </p>
          </Row>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   BUTTONS
   ──────────────────────────────────────────────── */
function ButtonShowcase() {
  return (
    <Section>
      <Container>
        <SectionHeader over="03" title="Buttons" sub="Rounded-6px, nicht Pill. Hover: subtile Translation + Shadow." />

        <div className="space-y-8">
          <ShowRow label="Primary (Navy)">
            <Button>Inserat einstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></Button>
            <Button size="lg">Beta-Zugang anfragen</Button>
            <Button size="sm">Details</Button>
            <Button disabled>Gesperrt</Button>
          </ShowRow>

          <ShowRow label="Secondary (Outlined)">
            <Button variant="secondary">Mehr erfahren</Button>
            <Button variant="secondary" size="lg">Designsprache</Button>
          </ShowRow>

          <ShowRow label="Bronze (Premium-Akzent)">
            <Button variant="bronze">Upgrade auf Pro</Button>
          </ShowRow>

          <ShowRow label="Ghost">
            <Button variant="ghost">Abbrechen</Button>
          </ShowRow>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   CARDS — inkl. Mock Deal-Card
   ──────────────────────────────────────────────── */
function CardShowcase() {
  return (
    <Section>
      <Container>
        <SectionHeader
          over="04"
          title="Karten"
          sub="Statt Cards mit harten Rändern: Editorial-Blöcke mit dezenter Depth."
        />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Deal-Card im Editorial-Stil */}
          <Card interactive>
            <CardBody>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge variant="navy">Maschinenbau</Badge>
                </div>
                <p className="overline text-quiet">ZH · 1987</p>
              </div>
              <h3 className="font-serif text-head-lg text-navy mb-4 leading-tight">
                Spezialmaschinen für die Präzisionsindustrie
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-8">
                Zweite Generation, 34 Mitarbeitende, exportiert in 14 Länder. Nachfolge
                aus persönlichen Gründen, Übergabe geordnet.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone">
                <KeyValue label="Umsatz" value="CHF 8.4M" />
                <KeyValue label="EBITDA" value="18.2%" />
                <KeyValue label="Richtpreis" value="VHB" />
              </div>
            </CardBody>
          </Card>

          {/* Quiet-Card */}
          <Card variant="quiet">
            <CardBody>
              <Newspaper className="w-6 h-6 text-bronze mb-6" strokeWidth={1.5} />
              <p className="overline mb-4">Aus der Redaktion</p>
              <h3 className="font-serif text-head-lg text-navy mb-4 leading-tight">
                Die sieben Fehler bei der Firmenübergabe
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-6">
                Lesezeit 8 Min &mdash; Eine Checkliste aus der Praxis unserer Redaktion.
              </p>
              <a href="#" className="editorial text-navy text-body-sm inline-flex items-center gap-2">
                Weiterlesen <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            </CardBody>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="overline mb-1">{label}</p>
      <p className="font-mono text-body text-navy font-tabular">{value}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────
   FORMS
   ──────────────────────────────────────────────── */
function FormShowcase() {
  return (
    <Section>
      <Container>
        <SectionHeader over="05" title="Formulare" sub="Klare Hierarchie, Bronze-Focus-Ring, kein Material-Floating-Label." />

        <div className="grid md:grid-cols-2 gap-10 max-w-3xl">
          <div>
            <Label htmlFor="f1">Firmenname (Zefix)</Label>
            <Input id="f1" placeholder="z.B. Mustermann AG" />
          </div>
          <div>
            <Label htmlFor="f2">Kanton</Label>
            <Input id="f2" placeholder="ZH" />
          </div>
          <div>
            <Label htmlFor="f3">Branche</Label>
            <Input id="f3" placeholder="Dienstleistung / IT / Produktion…" />
          </div>
          <div>
            <Label htmlFor="f4">Umsatz-Range</Label>
            <Input id="f4" placeholder="CHF 1M – 5M" />
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   ICONS — Lucide 1.5px
   ──────────────────────────────────────────────── */
function IconShowcase() {
  const icons = [
    { Ic: ShieldCheck, name: 'ShieldCheck' },
    { Ic: Compass, name: 'Compass' },
    { Ic: Newspaper, name: 'Newspaper' },
    { Ic: MapPin, name: 'MapPin' },
    { Ic: TrendingUp, name: 'TrendingUp' },
    { Ic: Users, name: 'Users' },
    { Ic: Building2, name: 'Building2' },
    { Ic: ArrowRight, name: 'ArrowRight' },
  ];

  return (
    <Section>
      <Container>
        <SectionHeader over="06" title="Icons" sub="Lucide-Set, 1.5px Stroke, currentColor." />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-stone">
          {icons.map(({ Ic, name }) => (
            <div key={name} className="bg-paper p-8 flex flex-col items-center">
              <Ic className="w-6 h-6 text-navy mb-4" strokeWidth={1.5} />
              <p className="font-mono text-caption text-quiet">{name}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   BADGES
   ──────────────────────────────────────────────── */
function BadgeShowcase() {
  return (
    <Section>
      <Container>
        <SectionHeader over="07" title="Badges" sub="Pill-Form, subtile Hintergrund-Farben." />

        <div className="flex flex-wrap gap-3">
          <Badge variant="neutral">Maschinenbau</Badge>
          <Badge variant="navy">Dienstleistung</Badge>
          <Badge variant="bronze">Premium-Mandat</Badge>
          <Badge variant="success">Verkauft</Badge>
          <Badge variant="live" dot>Beta · Live</Badge>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   MOTION
   ──────────────────────────────────────────────── */
function MotionShowcase() {
  return (
    <Section>
      <Container>
        <SectionHeader over="08" title="Bewegung" sub="Dezent. Nie Auto-Scrolling, nie Parallax, nie Karussells." />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-paper border border-stone rounded-card p-8 hover:-translate-y-1 hover:shadow-lift transition-all duration-300 ease-out-expo">
            <p className="overline mb-3">200ms</p>
            <p className="font-serif text-head-md text-navy mb-2">Card-Hover-Lift</p>
            <p className="text-body-sm text-muted">translateY(-1px) + Shadow</p>
          </div>
          <div className="bg-paper border border-stone rounded-card p-8 animate-fade-up">
            <p className="overline mb-3">700ms</p>
            <p className="font-serif text-head-md text-navy mb-2">Fade-Up on Scroll</p>
            <p className="text-body-sm text-muted">cubic-bezier(0.16, 1, 0.3, 1)</p>
          </div>
          <div className="bg-paper border border-stone rounded-card p-8 animate-fade-up-slow">
            <p className="overline mb-3">1000ms</p>
            <p className="font-serif text-head-md text-navy mb-2">Fade-Up slow</p>
            <p className="text-body-sm text-muted">Für Hero-Elemente</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   SWISS DETAILS
   ──────────────────────────────────────────────── */
function SwissDetails() {
  return (
    <Section>
      <Container>
        <SectionHeader over="09" title="Swiss Details" sub="Die stille Schweizer Selbstverständlichkeit." />

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl">
          <DetailItem
            title="Anführungszeichen"
            description={`Immer Guillemets — «so», nicht „so“ oder 'so'.`}
            example={<p className="font-serif text-head-md text-navy">«Ein Unternehmen übergibt man nicht an Zahlen.»</p>}
          />
          <DetailItem
            title="Währungsformat"
            description="CHF mit Apostroph als Tausender — CHF 1'250'000, nicht 1,250,000 oder 1.250.000."
            example={<p className="font-mono text-head-md text-navy font-tabular">CHF 1'250'000</p>}
          />
          <DetailItem
            title="Kanton-Kürzel"
            description="Firmen-Standorte mit Kantons-Kürzel: «Zürich ZH», «Lausanne VD»."
            example={<p className="font-sans text-head-md text-navy">Zürich <span className="text-quiet">ZH</span> · Lausanne <span className="text-quiet">VD</span></p>}
          />
          <DetailItem
            title="Datumsformat"
            description="Schweizer Format mit Punkten, Tag vor Monat: 24.04.2026."
            example={<p className="font-mono text-head-md text-navy font-tabular">24.04.2026</p>}
          />
          <DetailItem
            title="Sprachen statt Flaggen"
            description="DE · FR · IT · EN als Typo-Liste. Flaggen sind politisch und unpräzise."
            example={<p className="overline">DE · FR · IT · EN</p>}
          />
          <DetailItem
            title="Hairlines statt Shadows"
            description="0.5px Trennlinien statt Box-Shadows — typografische Hierarchie statt Materialimitation."
            example={<div><div className="h-px bg-stone w-full my-2" /><p className="text-caption text-quiet">0.5px — stone</p></div>}
          />
        </div>
      </Container>
    </Section>
  );
}

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */
function SectionHeader({ over, title, sub }: { over: string; title: string; sub: string }) {
  return (
    <div className="mb-16 max-w-prose">
      <p className="overline mb-5">{over}</p>
      <h2 className="font-serif text-display-md text-navy font-light mb-6">{title}</h2>
      <p className="text-body-lg text-muted leading-relaxed">{sub}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-10 items-baseline border-t border-stone pt-6">
      <p className="overline text-quiet">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function ShowRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6 items-center border-t border-stone pt-6">
      <p className="overline">{label}</p>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}

function DetailItem({
  title,
  description,
  example,
}: {
  title: string;
  description: string;
  example: React.ReactNode;
}) {
  return (
    <div className="border-t border-stone pt-6">
      <p className="font-serif text-head-sm text-navy mb-2">{title}</p>
      <p className="text-body-sm text-muted mb-5 leading-relaxed">{description}</p>
      <div className="bg-paper border border-stone rounded-soft px-5 py-4">{example}</div>
    </div>
  );
}
