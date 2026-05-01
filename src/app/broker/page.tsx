import Link from 'next/link';
import {
  ArrowRight, Users, Briefcase, FileLock2, BarChart3,
  LayoutDashboard, Lock, ListChecks, Coins, Database, Mail,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Für Broker und M&A-Berater — passare',
  description:
    'passare baut ein dediziertes Broker-System mit eigenem Login, Multi-Mandant-Dashboard und White-Label-Datenraum. Bis dahin können Broker schon heute Verkäufer-Klienten auf passare inserieren. Pilot-Programm fürs Broker-Tool 2026.',
  robots: { index: false, follow: false },
};

export default function BrokerPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <WasGehtWasKommt />
      <BrokerToolFeatures />
      <Plaedoyer />
      <Roadmap />
      <Kontakt />
      <SiteFooter />
    </main>
  );
}

/* ─────────────────────────────────────────────── */
function Hero() {
  return (
    <Section className="pt-16 md:pt-24 pb-14 md:pb-20">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <p className="overline mb-6 text-bronze-ink">Für Broker · M&amp;A-Berater · Treuhänder</p>
            <h1 className="font-serif-display text-[clamp(2.5rem,4.5vw,4.5rem)] text-navy font-light mb-8 tracking-[-0.025em] leading-[1.05]">
              Eigenes Broker-System<span className="text-bronze">.</span>{' '}
              <span className="text-muted italic">Kommt 2026.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-6">
              passare bekommt ein dediziertes Broker-Tool mit eigenem Login,
              Multi-Mandant-Dashboard und White-Label-Datenraum. Bis dahin können
              Broker auf passare bereits <strong className="font-medium text-navy">Verkäufer-Klienten
              inserieren</strong> — die volle Käufer-Seite für Broker (Suchprofile pro Klient,
              Provisionsabrechnung, Multi-Mandant-Sicht) wird im Broker-Tool live gehen.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start mb-3">
              <Button href="mailto:broker@passare.ch?subject=Broker-Pilot%20Anfrage" size="lg">
                Auf Pilot-Liste setzen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/verkaufen/start" variant="secondary" size="lg">
                Klient inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
            <p className="text-caption text-quiet max-w-prose">
              Pilot-Teilnehmer bekommen den Broker-Login als Erste — und prägen mit, was reinkommt.
              Inserate für Verkäufer-Klienten sind heute schon möglich, pro Klient als Light/Pro/Premium-Paket.
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function WasGehtWasKommt() {
  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <p className="overline mb-5">Status</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Heute schon. <em className="italic text-muted">Und was bald kommt.</em>
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {/* Heute */}
          <Reveal>
            <div className="bg-paper p-8 md:p-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-7 h-7 text-bronze" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-pill bg-success/10 text-success">
                  verfügbar heute
                </span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-3">Verkäufer-Mandate</p>
              <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">
                Inserieren im Auftrag deiner Klienten
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-5 flex-1">
                Du legst Inserate im Namen deines Verkäufer-Klienten an, betreust den Funnel
                und gibst Käufer-Anfragen frei. Das Inserat-Paket (Light, Pro, Premium) wird
                vom Klienten gezahlt — keine Plattform-Gebühr aus deiner Kasse.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Button href="/verkaufen/start" size="md">
                  Klient inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="/preise" variant="ghost" size="md">
                  Inserat-Pakete ansehen
                </Button>
              </div>
            </div>
          </Reveal>

          {/* Kommt */}
          <Reveal delay={0.1}>
            <div className="bg-paper p-8 md:p-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-7 h-7 text-bronze" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-pill bg-bronze/10 text-bronze-ink">
                  in entwicklung
                </span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-3">Broker-System · 2026</p>
              <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">
                Eigener Login, Multi-Mandant-Dashboard, eigene Pipeline
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-5 flex-1">
                Das Broker-Tool ist nicht das Käufer-Abo — es ist ein eigenes System für M&amp;A-Profis.
                Mit eigenem Login, einer Multi-Mandant-Sicht für parallele Käufer- und Verkäufer-Mandate,
                Pipeline-Kanban pro Klient, White-Label-Datenraum und Provisionsabrechnung.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Button href="mailto:broker@passare.ch?subject=Broker-Pilot%20Anfrage" size="md">
                  Pilot anfragen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <span className="font-mono text-caption text-quiet pt-2">
                  ~ Q3 / Q4 2026
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function BrokerToolFeatures() {
  const items = [
    {
      Icon: Lock,
      title: 'Eigenes Broker-Login',
      body: 'Separate Authentifizierung mit Multi-Faktor — du loggst dich nicht über das Käufer-Abo ein, sondern über eine eigene Broker-Identität mit Kanzlei-Profil.',
    },
    {
      Icon: LayoutDashboard,
      title: 'Multi-Mandant-Dashboard',
      body: 'Eine Übersicht für alle deine Mandate gleichzeitig — Verkäufer-Klienten links, Käufer-Klienten rechts, Status, Deadlines, offene Tasks.',
    },
    {
      Icon: ListChecks,
      title: 'Pipeline-Kanban pro Klient',
      body: 'Jeder Käufer-Klient hat eine eigene Pipeline — Inserate scouten, Anfragen, Due Diligence, LOI, Closing — du bewegst Karten pro Mandat.',
    },
    {
      Icon: FileLock2,
      title: 'White-Label-Datenraum-Share',
      body: 'Datenräume an Käufer-Klienten weitergeben mit deiner Kanzlei-Marke — zeitlich begrenzt, ohne dass der Käufer ein eigenes Konto braucht.',
    },
    {
      Icon: Coins,
      title: 'Provisionsabrechnung pro Klient',
      body: 'Sauberer Mandats-Vertrag pro Klient, Stunden- und Erfolgs-Honorar im Tool dokumentiert, Rechnungs-PDF auf Knopfdruck.',
    },
    {
      Icon: Database,
      title: 'KMU-Multiples-Datenbank',
      body: 'Aktuelle Schweizer Branchen-Multiples auf Basis realer M&A-Transaktionen — direkt im Bewertungs-Workflow für deine Klienten verfügbar.',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Was im Broker-Tool kommt</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Sechs Funktionen, eigens für M&amp;A-Profis.
            </h2>
            <p className="text-body text-muted mt-4 max-w-prose leading-relaxed">
              Das Broker-Tool ist nicht das öffentliche Käufer-Abo (Käufer+) — es ist ein
              dediziertes System mit eigenem Login. Sobald die erste Pilot-Version steht,
              bekommen die Pilot-Teilnehmer als Erste Zugang.
            </p>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {items.map((it, i) => (
            <RevealItem key={i} className="bg-paper p-8 flex flex-col">
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

/* ─────────────────────────────────────────────── */
function Plaedoyer() {
  const items = [
    {
      Icon: Users,
      title: 'Plattform statt Tool-Wirrwarr',
      body: 'Statt CRM + Datenraum + Pipeline-Tool + Bewertungs-Software einzeln zu lizensieren, bekommst du im Broker-Tool alles in einer Plattform — sauber verzahnt.',
    },
    {
      Icon: BarChart3,
      title: 'Schweizer KMU-Markt im Fokus',
      body: 'passare ist bewusst auf den Schweizer KMU-Nachfolge-Markt optimiert — Zefix, kantonale Eigenheiten, Schweizer Multiples. Kein generisches M&A-Tool aus den USA.',
    },
    {
      Icon: Briefcase,
      title: '0 % Erfolgsprovision plattformseitig',
      body: 'Wir verdienen am Plattform-Abo, nicht am Deal — du behältst dein Honorar zu 100 %. Die Plattform-Kosten sind transparent, planbar und ein Bruchteil dessen, was traditionelle M&A-Plattformen verlangen.',
    },
    {
      Icon: ListChecks,
      title: 'Heute schon Verkäufer-Mandate möglich',
      body: 'Du musst nicht aufs Broker-Tool warten, um Klienten zu inserieren. Verkäufer-Mandate laufen heute über die regulären Inserat-Pakete — Pilot-Teilnehmer bekommen den Broker-Login dann zusätzlich oben drauf.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Plädoyer</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Warum sich passare als Broker lohnt.
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-2 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {items.map((it, i) => (
            <RevealItem key={i} className="bg-paper p-8 flex flex-col">
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

/* ─────────────────────────────────────────────── */
function Roadmap() {
  return (
    <Section>
      <Container>
        <Reveal>
          <div className="border border-stone bg-cream/40 rounded-card p-8 md:p-12 max-w-3xl">
            <p className="overline mb-4 text-bronze-ink">Roadmap</p>
            <h2 className="font-serif text-display-sm text-navy font-light mb-5">
              So bauen wir das Broker-System.
            </h2>
            <ol className="space-y-4 text-body-sm text-muted mb-6">
              <li className="flex gap-4">
                <span className="font-mono text-[10px] tracking-widest text-bronze flex-shrink-0 mt-1 w-12">Q2 2026</span>
                <span className="leading-relaxed">
                  <strong className="text-ink font-medium">Pilot-Programm:</strong> Wir wählen 5–10 Schweizer M&amp;A-Broker
                  aus, sammeln deren Workflows und definieren das MVP gemeinsam.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[10px] tracking-widest text-bronze flex-shrink-0 mt-1 w-12">Q3 2026</span>
                <span className="leading-relaxed">
                  <strong className="text-ink font-medium">Broker-Login + Multi-Mandant-Dashboard:</strong> Erste Closed-Beta
                  mit den Pilot-Teilnehmern. Verkäufer-Klienten + Käufer-Klienten in einer Sicht.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[10px] tracking-widest text-bronze flex-shrink-0 mt-1 w-12">Q4 2026</span>
                <span className="leading-relaxed">
                  <strong className="text-ink font-medium">Pipeline-Kanban + Datenraum-Share + Provisions-Workflow.</strong>
                  Public-Beta für alle Broker, die mitmachen wollen.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[10px] tracking-widest text-bronze flex-shrink-0 mt-1 w-12">2027</span>
                <span className="leading-relaxed">
                  <strong className="text-ink font-medium">General Availability:</strong> Broker-Tier öffentlich verfügbar,
                  inkl. KMU-Multiples-Datenbank und Bewertungs-Workflows.
                </span>
              </li>
            </ol>
            <p className="text-body-sm text-muted leading-relaxed max-w-prose">
              Ins Pilot-Programm? Schreib uns kurz auf{' '}
              <Link className="text-navy hover:text-bronze underline-offset-4 hover:underline" href="mailto:broker@passare.ch">broker@passare.ch</Link>{' '}
              — wir nehmen dich auf die Liste und du kriegst den Beta-Zugang als einer der Ersten.
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function Kontakt() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Pilot anfragen<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Wir nehmen 5–10 Schweizer M&amp;A-Broker ins Pilot-Programm auf. Pilot-Teilnehmer
              bekommen den Broker-Login als Erste, prägen das MVP mit und erhalten den
              Beta-Zugang ohne Plattform-Gebühr fürs erste Jahr.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="mailto:broker@passare.ch?subject=Broker-Pilot%20Anfrage" variant="bronze" size="lg">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
                Auf Pilot-Liste setzen
              </Button>
              <Button href="/verkaufen/start" variant="secondary" size="lg" className="!text-cream !border-cream/30 hover:!border-cream">
                Klient inserieren
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
