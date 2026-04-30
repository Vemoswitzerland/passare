import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal } from '@/components/ui/reveal';
import { VerkaeuferPricing } from './_components/VerkaeuferPricing';

export const metadata = {
  title: 'Preise — passare',
  description:
    'Transparente Pakete für Verkäufer (Light CHF 710, Pro CHF 890, Premium CHF 1\'890 — alle 12 Monate). Klein-Inserat-Rabatt 25 % bei Verkaufspreis < CHF 500\'000. Käufer Basic gratis oder Professional CHF 49/Monat. Keine Auto-Verlängerung.',
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

import { SiteHeader } from '../page';

function TopBar() {
  return <SiteHeader />;
}

function Hero() {
  return (
    <Section className="pt-20 md:pt-28 pb-12">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-bronze-ink">Preise</p>
            <h1 className="font-serif-display text-display-lg text-navy font-light mb-8 tracking-[-0.025em]">
              Transparent<span className="text-bronze">.</span> Fair<span className="text-bronze">.</span> Pauschal<span className="text-bronze">.</span>
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
  return (
    <Section>
      <Container>
        <VerkaeuferPricing />
      </Container>
    </Section>
  );
}

// ── Helper für Käufer-Tabelle (Verkäufer-Tabelle hat eigene in VerkaeuferPricing) ──
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
    { feature: 'Inserate durchsuchen',          basic: 'Öffentliche',     max: 'Alle inkl. Premium' },
    { feature: 'Frühzugang neue Inserate',      basic: '—',               max: '7 Tage vor allen' },
    { feature: 'Basis-Filter (5)',              basic: '✓',               max: '✓' },
    { feature: 'Alle Filter (18) + Custom',     basic: '—',               max: '✓' },
    { feature: 'Gespeicherte Suchen',           basic: '3',               max: 'Unbegrenzt' },
    { feature: 'E-Mail-Alerts',                 basic: 'Wöchentlich',     max: 'Echtzeit' },
    { feature: 'WhatsApp-Alerts',               basic: '—',               max: '✓' },
    { feature: 'Anfragen pro Monat',            basic: '5',               max: 'Unbegrenzt' },
    { feature: 'NDA signieren',                 basic: '✓',               max: '✓' },
    { feature: 'NDA-Fast-Track',                basic: '—',               max: '✓' },
    { feature: 'Öffentliches Käuferprofil',     basic: '—',               max: 'Featured' },
    { feature: 'KMU-Multiples-Datenbank',       basic: '—',               max: '✓' },
    { feature: 'Persönlicher Ansprechpartner',  basic: '—',               max: '✓' },
    { feature: 'Kündigungsfrist',               basic: '—',               max: 'Monatlich' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Für Käufer</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">Basic gratis · MAX-Abo</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Basic oder MAX.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border border-stone rounded-card overflow-hidden bg-paper max-w-4xl">
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-stone">
              <div className="p-6"></div>
              <PlanHeader name="Basic" price="CHF 0" note="Unbefristet" />
              <PlanHeader name="MAX" price="CHF 199" note="/ Monat · CHF 1'990 / Jahr" highlight />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.5fr_1fr_1fr] ${
                  i !== rows.length - 1 ? 'border-b border-stone' : ''
                } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
              >
                <div className="p-4 text-body-sm text-ink">{r.feature}</div>
                <Cell>{r.basic}</Cell>
                <Cell highlight>{r.max}</Cell>
              </div>
            ))}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-stone bg-cream/50">
              <div className="p-4"></div>
              <div className="p-4 border-l border-stone">
                <Button href="/auth/register" variant="secondary" size="sm" className="w-full justify-center">Gratis starten</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/auth/register" size="sm" className="w-full justify-center">MAX buchen</Button>
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
      q: 'Verdient passare am Verkaufspreis mit?',
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
