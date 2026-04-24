import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal } from '@/components/ui/reveal';

export const metadata = {
  title: 'Preise — passare',
  description:
    'Transparente Pakete für Verkäufer (Light CHF 290, Pro CHF 890, Premium CHF 1\'890) und Käufer (Basic gratis oder MAX CHF 199/Monat). 0% Erfolgsprovision.',
  robots: { index: false, follow: false },
};

export default function PreisePage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopBar />
      <Hero />
      <VerkaeuferTable />
      <KaeuferTable />
      <Faq />
      <CTA />
      <Footer />
    </main>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-cream/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-9">
            <Link href="/verkaufen" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Inserieren</Link>
            <Link href="/entdecken" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Entdecken</Link>
            <Link href="/preise" className="text-[0.8125rem] font-medium text-navy">Preise</Link>
            <Link href="/" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Ratgeber</Link>
          </nav>
          <Button href="/beta" size="sm" variant="secondary" className="hidden md:inline-flex">
            Einloggen
          </Button>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <Section className="pt-20 md:pt-28 pb-12">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-bronze-ink">Preise</p>
            <h1 className="font-serif-display text-display-lg text-navy font-light mb-8 tracking-[-0.025em]">
              Transparent<span className="text-bronze">.</span> Fair<span className="text-bronze">.</span> Ohne Provision<span className="text-bronze">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed">
              Verkäufer zahlen eine einmalige Paketgebühr. Käufer starten gratis
              oder buchen MAX für Frühzugang. Kein Prozent an Ihrem Deal.
              Kein Kleingedrucktes.
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────── */
function VerkaeuferTable() {
  const rows = [
    { feature: 'Laufzeit', light: '3 Monate', pro: '6 Monate', premium: '12 Monate' },
    { feature: 'Bilder', light: '5', pro: '20 + Videos', premium: 'Unbegrenzt' },
    { feature: 'PDFs im Datenraum', light: '2', pro: 'Unbegrenzt', premium: 'Unbegrenzt' },
    { feature: 'Wasserzeichen PDF-Downloads', light: '—', pro: '✓', premium: '✓' },
    { feature: 'NDA-Gate mit eSign', light: '✓', pro: '✓', premium: '✓' },
    { feature: 'KI-Teaser-Generator', light: '✓', pro: '✓', premium: '✓' },
    { feature: 'Käuferprofil-Matching', light: '—', pro: '✓', premium: '✓' },
    { feature: 'Newsletter-Feature', light: '—', pro: '1× einmalig', premium: 'Monatlich' },
    { feature: 'Homepage-Feature', light: '—', pro: '—', premium: '1 Woche / Monat' },
    { feature: 'Mehrsprachige Inseratversion', light: '—', pro: '—', premium: 'FR / IT / EN' },
    { feature: 'Statistiken & Conversion', light: 'Basis', pro: 'Detail', premium: 'Detail + Export' },
    { feature: 'Persönliche Beratung', light: '—', pro: '—', premium: '2h inklusive' },
    { feature: 'Support', light: 'E-Mail', pro: 'E-Mail', premium: 'Priorisiert' },
    { feature: 'Verlängerung', light: '+CHF 190/3M', pro: '+CHF 490/6M', premium: '+CHF 990/12M' },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Für Verkäufer</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">einmalige Paketgebühr</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Inserat Light · Pro · Premium.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border border-stone rounded-card overflow-hidden bg-paper">
            {/* Header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-stone">
              <div className="p-6"></div>
              <PlanHeader name="Light" price="CHF 290" note="3 Monate" />
              <PlanHeader name="Pro" price="CHF 890" note="6 Monate" highlight />
              <PlanHeader name="Premium" price="CHF 1'890" note="12 Monate" />
            </div>
            {/* Rows */}
            {rows.map((r, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] ${
                  i !== rows.length - 1 ? 'border-b border-stone' : ''
                } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
              >
                <div className="p-4 text-body-sm text-ink">{r.feature}</div>
                <Cell>{r.light}</Cell>
                <Cell highlight>{r.pro}</Cell>
                <Cell>{r.premium}</Cell>
              </div>
            ))}
            {/* CTA */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-stone bg-cream/50">
              <div className="p-4"></div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" variant="secondary" size="sm" className="w-full justify-center">Light wählen</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" size="sm" className="w-full justify-center">Pro wählen</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" variant="secondary" size="sm" className="w-full justify-center">Premium wählen</Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function PlanHeader({ name, price, note, highlight }: { name: string; price: string; note: string; highlight?: boolean }) {
  return (
    <div className={`p-6 border-l border-stone ${highlight ? 'bg-navy text-cream' : ''}`}>
      {highlight && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-bronze mb-1">Empfohlen</p>
      )}
      <p className={`font-mono text-[11px] uppercase tracking-widest ${highlight ? 'text-cream/60' : 'text-quiet'} mb-1.5`}>
        Paket
      </p>
      <p className={`font-serif text-head-md ${highlight ? 'text-cream' : 'text-navy'} font-normal`}>{name}</p>
      <p className={`font-serif text-display-sm ${highlight ? 'text-cream' : 'text-navy'} font-light font-tabular mt-3`}>
        {price}
      </p>
      <p className={`font-mono text-[11px] uppercase tracking-widest ${highlight ? 'text-cream/60' : 'text-quiet'} mt-1`}>
        {note}
      </p>
    </div>
  );
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`p-4 border-l border-stone text-center font-mono text-[13px] ${
        highlight ? 'text-navy font-medium bg-cream/40' : 'text-muted'
      }`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────── */
function KaeuferTable() {
  const rows = [
    { feature: 'Inserate durchsuchen',        basic: 'Öffentliche',     pro: 'Alle inkl. Premium', max: 'Alle inkl. Premium' },
    { feature: 'Frühzugang neue Inserate',    basic: '—',               pro: '48 Stunden',         max: '7 Tage vor allen' },
    { feature: 'Basis-Filter (5)',            basic: '✓',               pro: '✓',                   max: '✓' },
    { feature: 'Alle Filter (18)',            basic: '—',               pro: '✓',                   max: '✓ + Custom' },
    { feature: 'Gespeicherte Suchen',         basic: '3',               pro: '20',                  max: 'Unbegrenzt' },
    { feature: 'E-Mail-Alerts',               basic: 'Wöchentlich',     pro: 'Täglich',             max: 'Echtzeit' },
    { feature: 'WhatsApp-Alerts',             basic: '—',               pro: '—',                    max: '✓' },
    { feature: 'Anfragen pro Monat',          basic: '5',               pro: '25',                  max: 'Unbegrenzt' },
    { feature: 'NDA signieren',               basic: '✓',               pro: '✓',                   max: '✓' },
    { feature: 'NDA-Fast-Track',              basic: '—',               pro: '✓',                   max: '✓ priorisiert' },
    { feature: 'Öffentliches Käuferprofil',   basic: '—',               pro: 'Standard',            max: 'Featured' },
    { feature: 'KMU-Multiples-Datenbank',     basic: '—',               pro: '—',                    max: '✓' },
    { feature: 'Persönlicher Ansprechpartner', basic: '—',              pro: '—',                    max: '✓' },
    { feature: 'Kündigungsfrist',             basic: '—',               pro: 'Monatlich',           max: 'Monatlich' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Für Käufer</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">Basic · Pro · MAX</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Drei Stufen. Ihrer Aktivität angepasst.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border border-stone rounded-card overflow-hidden bg-paper">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-stone">
              <div className="p-6"></div>
              <PlanHeader name="Basic" price="CHF 0" note="Unbefristet" />
              <PlanHeader name="Pro" price="CHF 49" note="/ Monat · CHF 490 / Jahr" highlight />
              <PlanHeader name="MAX" price="CHF 199" note="/ Monat · CHF 1'990 / Jahr" />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] ${
                  i !== rows.length - 1 ? 'border-b border-stone' : ''
                } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
              >
                <div className="p-4 text-body-sm text-ink">{r.feature}</div>
                <Cell>{r.basic}</Cell>
                <Cell highlight>{r.pro}</Cell>
                <Cell>{r.max}</Cell>
              </div>
            ))}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-stone bg-cream/50">
              <div className="p-4"></div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" variant="secondary" size="sm" className="w-full justify-center">Gratis starten</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" size="sm" className="w-full justify-center">Pro buchen</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/beta" variant="secondary" size="sm" className="w-full justify-center">MAX buchen</Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-quiet">
            ◦ Jahres-Abo: 2 Monate gratis &middot; Monatlich kündbar &middot; Preise zzgl. 8.1% MWST
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────── */
function Faq() {
  const items = [
    {
      q: 'Gibt es eine Erfolgsprovision auf den Verkaufspreis?',
      a: 'Nein, niemals. passare verdient ausschliesslich am Paketpreis bzw. MAX-Abo. Was Sie für Ihre Firma lösen, gehört Ihnen zu 100%.',
    },
    {
      q: 'Kann ich mein Verkäufer-Paket jederzeit kündigen?',
      a: 'Verkäufer-Pakete sind einmalige Laufzeit-Käufe. Sie zahlen einmal (z.B. CHF 890 für 6 Monate Pro) und das Inserat läuft die volle Zeit. Keine automatische Verlängerung — Sie entscheiden am Ende der Laufzeit, ob Sie verlängern (+CHF 490 für weitere 6 Monate).',
    },
    {
      q: 'Kann ich MAX jederzeit kündigen?',
      a: 'Ja. MAX ist monatlich kündbar. Bei Jahres-Abo läuft die Zahlung einmalig, der Vertrag endet automatisch nach 12 Monaten — keine stille Verlängerung.',
    },
    {
      q: 'Was kostet Verlängerung nach der Laufzeit?',
      a: 'Light: +CHF 190 pro weitere 3 Monate. Pro: +CHF 490 pro weitere 6 Monate. Premium: +CHF 990 pro weitere 12 Monate. Sie entscheiden aktiv — nichts wird automatisch abgebucht.',
    },
    {
      q: 'Sind die Preise inklusive MWST?',
      a: 'Nein, alle Preise zzgl. 8.1% Schweizer Mehrwertsteuer.',
    },
    {
      q: 'Gibt es Rabatte für mehrere Inserate oder Jahres-Abos?',
      a: 'Käufer MAX im Jahres-Abo: 2 Monate gratis (CHF 1\'990 statt CHF 2\'388). Für Verkäufer mit mehreren Inseraten kontaktieren Sie uns: info@passare.ch.',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Zu den Preisen.
            </h2>
          </div>
        </Reveal>
        <div className="max-w-3xl">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="border-t border-stone py-8">
                <h3 className="font-serif text-head-md text-navy font-normal mb-3">{item.q}</h3>
                <p className="text-body text-muted leading-relaxed max-w-prose">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────── */
function CTA() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Kein Kleingedrucktes<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Sie zahlen einmal für Ihr Inserat, oder monatlich für MAX.
              Der Rest bleibt Ihre Sache.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/verkaufen" variant="bronze" size="lg">
                Ich will inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/kaufen" variant="secondary" size="lg" className="!text-cream !border-cream/30 hover:!border-cream">
                Ich will kaufen
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
    <footer className="border-t border-stone pt-16 pb-10 bg-cream">
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
              <li><Link className="hover:text-navy" href="/kaufen">Käufer MAX</Link></li>
              <li><Link className="hover:text-navy" href="/entdecken">Entdecken</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Preise</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Haus</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/">Über passare</Link></li>
              <li><Link className="hover:text-navy" href="/">Kontakt</Link></li>
              <li><Link className="hover:text-navy" href="/design">Design System</Link></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
          <div className="flex gap-6">
            <Link className="hover:text-navy" href="/">Impressum</Link>
            <Link className="hover:text-navy" href="/">Datenschutz</Link>
            <Link className="hover:text-navy" href="/">AGB</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
