import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal } from '@/components/ui/reveal';
import { VerkaeuferPricing } from './_components/VerkaeuferPricing';
import { SiteHeader } from '../page';

export const metadata = {
  title: 'Inserat-Preise — passare',
  description:
    'Transparente Pakete für Verkäufer: Inserat Light CHF 710, Pro CHF 890, Premium CHF 1\'890 (jeweils 12 Monate). Auch als 6-Monats-Variante. Klein-Inserat-Rabatt 25 % bei Verkaufspreis unter CHF 500\'000. Pauschalpreis, 0 % Erfolgsprovision, keine Auto-Verlängerung.',
  robots: { index: false, follow: false },
};

export default function PreisePage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <VerkaeuferTable />
      <Faq />
      <KaeuferHinweis />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <Section className="pt-20 md:pt-28 pb-12">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-bronze-ink">Inserat-Preise · Für Verkäufer</p>
            <h1 className="font-serif-display text-display-lg text-navy font-light mb-8 tracking-[-0.025em]">
              Fester Preis<span className="text-bronze">.</span> Keine Überraschungen<span className="text-bronze">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed">
              Sie zahlen einmal eine Paketgebühr — Light, Pro oder Premium — und Ihr Inserat
              läuft die volle Laufzeit. Keine automatische Verlängerung. 0 % Erfolgsprovision,
              egal für welchen Preis Ihre Firma am Ende den Besitzer wechselt.
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function VerkaeuferTable() {
  return (
    <Section>
      <Container>
        <VerkaeuferPricing />
      </Container>
    </Section>
  );
}

/* ─────────────────────────── Verkäufer-FAQ ─────────────────────────── */
function Faq() {
  const items = [
    {
      q: 'Verdient passare am Verkaufspreis mit?',
      a: 'Nein, niemals. passare verdient ausschliesslich am Paketpreis. Was Sie für Ihre Firma lösen, gehört Ihnen zu 100 %.',
    },
    {
      q: 'Was passiert nach Ablauf der Laufzeit?',
      a: 'Nichts automatisch. Sie entscheiden aktiv, ob Sie verlängern. Verlängerung kostet pauschal CHF 490 für 6 weitere Monate (egal welches Paket) — oder Sie nehmen Ihr Inserat aus der Plattform.',
    },
    {
      q: 'Was ist der Klein-Inserat-Rabatt?',
      a: 'Firmen mit einem Verkaufspreis unter CHF 500\'000 erhalten 25 % Rabatt auf alle drei Pakete. Der Rabatt wird automatisch im Wizard angewendet, sobald Sie den Kaufpreis angeben. Erhöhen Sie den Preis später über die Schwelle, fragen wir das Upgrade kurz nach.',
    },
    {
      q: 'Was bringt die Hervorhebung?',
      a: 'Pro: 4× pro Jahr inklusive. Premium: 12× pro Jahr inklusive. Ihr Inserat rutscht 7 Tage auf Seite 1 des Marktplatzes und nimmt die Top-Position im Branchenfilter. Einzeln dazubuchbar für CHF 49.',
    },
    {
      q: 'Was bedeutet der Newsletter-Slot im Premium?',
      a: 'Im Premium 2× pro Jahr inklusive: Ihr Inserat wird prominent im wöchentlichen passare-Newsletter platziert, der an alle aktiven Käufer mit passendem Suchprofil geht. Einzeln dazubuchbar für CHF 86.',
    },
    {
      q: 'Sind die Preise inklusive MWST?',
      a: 'Nein, alle Preise zzgl. 8.1 % Schweizer Mehrwertsteuer.',
    },
    {
      q: 'Kann ich mein Inserat pausieren oder löschen?',
      a: 'Jederzeit, direkt aus dem Verkäufer-Dashboard. Sie können auch einzelne Interessenten ausschliessen oder priorisieren.',
    },
    {
      q: 'Brauche ich einen Anwalt oder Treuhänder?',
      a: 'Nicht zwingend. passare ist eine Self-Service-Plattform — Sie führen die Gespräche und schliessen den Deal direkt mit dem Käufer. Bei Bedarf vermitteln wir geprüfte Fachanwälte und Treuhänder zu fairen Stundensätzen.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen · Verkäufer</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Zu den Inserat-Preisen.
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

/* ─────────────────────────── Käufer-Hinweis (Cross-Link) ─────────────────────────── */
function KaeuferHinweis() {
  return (
    <Section>
      <Container>
        <Reveal>
          <div className="border border-stone bg-paper rounded-card p-8 md:p-10 max-w-content">
            <div className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center">
              <div>
                <p className="overline mb-3 text-bronze-ink">Sie sind Käufer?</p>
                <h3 className="font-serif text-head-lg text-navy font-light mb-3">
                  Diese Seite ist für Verkäufer.
                </h3>
                <p className="text-body text-muted max-w-prose leading-relaxed">
                  Käufer browsen den Marktplatz gratis. Wer alles früher sehen will und
                  unbegrenzt anfragen möchte, bucht <strong className="font-medium text-navy">Käufer+</strong> —
                  die Vorteile, der Vergleich und die Käufer-FAQ liegen auf der eigenen Seite.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Button href="/plus" size="md">
                  Käufer+ ansehen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="/" variant="ghost" size="sm">
                  Zum Marktplatz
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
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
              Erst bewerten<span className="text-bronze">.</span> Dann inserieren<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Im Inserat-Funnel führen wir Sie zuerst durch die Smart-Bewertung — Sie sehen
              die Marktwert-Range Ihrer Firma — und gehen direkt im Anschluss in das Inserat.
              In rund 10 Minuten ist Ihr Inserat live.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/verkaufen/start" variant="bronze" size="lg">
                Bewerten &amp; inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/bewerten" variant="secondary" size="lg" className="!text-cream !border-cream/30 hover:!border-cream">
                Nur bewerten
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
              <li><Link className="hover:text-navy" href="/">Firmen entdecken</Link></li>
              <li><Link className="hover:text-navy" href="/verkaufen">Firma inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/broker">Broker</Link></li>
              <li>
                <Link className="hover:text-navy inline-flex items-baseline" href="/plus">
                  Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
                </Link>
              </li>
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
