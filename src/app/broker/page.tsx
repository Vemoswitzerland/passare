import Link from 'next/link';
import {
  ArrowRight, Users, Briefcase, FileLock2, BarChart3,
  Sparkles, ShieldCheck, MessageCircle,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Für Broker und M&A-Berater — passare',
  description:
    'passare ist die Self-Service-Plattform für Schweizer KMU-Nachfolge — Broker und M&A-Berater nutzen sie heute schon, um mehrere Mandate effizient abzuwickeln. Aktuell mit Käufer+, später mit dediziertem Broker-Tier.',
  robots: { index: false, follow: false },
};

export default function BrokerPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <Plaedoyer />
      <SoNutzenSie />
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
              Mehrere Mandate<span className="text-bronze">.</span>{' '}
              <span className="text-muted italic">Eine Plattform.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
              passare ist die Self-Service-Plattform für die Schweizer KMU-Nachfolge.
              Broker und M&amp;A-Berater nutzen sie heute schon — sie inserieren für
              ihre Verkäufer-Klienten und stellen mit <strong className="font-medium text-navy">Käufer+</strong>{' '}
              parallele Suchprofile für Käufer-Klienten.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/plus" size="lg">
                Käufer+ ansehen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/verkaufen/start" variant="secondary" size="lg">
                Klient inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function Plaedoyer() {
  const items = [
    {
      Icon: Users,
      title: 'Mehrere Klienten parallel betreuen',
      body: 'Verkäufer-Mandate nutzen das Inserat-Paket des jeweiligen Klienten. Käufer-Mandate laufen über Käufer+ mit unbegrenzten Suchprofilen — du kannst pro Klient ein eigenes Suchraster anlegen.',
    },
    {
      Icon: BarChart3,
      title: 'Daten-getriebene Bewertungen',
      body: 'Du hast Zugriff auf die KMU-Multiples-Datenbank (Käufer+ exklusiv) — aktuelle Schweizer Branchen-Multiples auf Basis realer M&A-Transaktionen. Damit untermauerst du Bewertungen für deine Klienten in Sekunden.',
    },
    {
      Icon: MessageCircle,
      title: 'Direkter Kontakt zu Verkäufern',
      body: 'Mit Käufer+ siehst du neue Inserate 7 Tage vor allen anderen, kannst unbegrenzt Anfragen senden und bekommst Echtzeit-Alerts auf WhatsApp, sobald ein Inserat zu einem deiner Suchprofile passt.',
    },
    {
      Icon: FileLock2,
      title: 'Datenraum-Share für deine Käufer',
      body: 'Wenn du als Verkäufer-Berater inserierst und ein Käufer mit Käufer+ den Datenraum freischalten lässt, kannst du Berater zeitlich begrenzt mit ins Datenraum holen — sauber dokumentiert, ohne Mail-Anhang-Chaos.',
    },
    {
      Icon: ShieldCheck,
      title: 'Featured-Profil mit Käufer+-Badge',
      body: 'Verkäufer sehen dein Käuferprofil im Anfragen-Backlog mit Käufer+-Badge. Wer ernsthaft sucht, wird bevorzugt freigeschaltet — du bist dadurch in der Verhandlung früher am Tisch.',
    },
    {
      Icon: Briefcase,
      title: '0 % Erfolgsprovision plattformseitig',
      body: 'Wir verdienen am Plattform-Abo, nicht am Deal — du behältst dein Honorar zu 100 %. Die Plattform-Kosten sind transparent, planbar und ein Bruchteil dessen, was traditionelle M&A-Plattformen für CRM-, Datenraum- und Pipeline-Tools verlangen.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Plädoyer</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Sechs Gründe, passare als Broker zu nutzen.
            </h2>
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
function SoNutzenSie() {
  const flows = [
    {
      tag: 'Verkäufer-Mandat',
      title: 'Du hast einen Klienten, der seine Firma verkaufen möchte.',
      steps: [
        'Du legst das Inserat im Namen des Klienten an — Bewertung läuft über den Wizard, Klient signiert die AGB digital.',
        'Mehrere Mitarbeiter aus deiner Kanzlei können auf das Inserat zugreifen (Premium-Paket: bis 3 Mitarbeiter).',
        'Anfragen kommen in deinem Dashboard rein, du filterst seriös vs. neugierig und schaltest Detail-Dossier + Datenraum frei.',
      ],
      Icon: Briefcase,
    },
    {
      tag: 'Käufer-Mandat',
      title: 'Du hast einen Klienten, der eine Firma übernehmen möchte.',
      steps: [
        'Du buchst Käufer+ und legst pro Klient ein eigenes Suchprofil an (unbegrenzt viele).',
        'Echtzeit-Alerts auf WhatsApp und 7 Tage Frühzugang sorgen dafür, dass du bei Top-Inseraten an erster Stelle anfragst.',
        'Mit dem Berater-Datenraum-Share kannst du den Datenraum 14 Tage lang an deinen Klienten weiterreichen — ohne dass er sich registrieren muss.',
      ],
      Icon: Sparkles,
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">So nutzen Broker passare</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Zwei klassische Mandate.
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {flows.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-paper p-8 md:p-10 h-full flex flex-col">
                <f.Icon className="w-6 h-6 text-bronze mb-6" strokeWidth={1.5} />
                <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-3">{f.tag}</p>
                <h3 className="font-serif text-head-md text-navy mb-5 font-normal leading-snug">{f.title}</h3>
                <ol className="space-y-3 text-body-sm text-muted">
                  {f.steps.map((s, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="font-mono text-[10px] tracking-widest text-bronze flex-shrink-0 mt-1">0{j + 1}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function Roadmap() {
  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="border border-stone bg-cream/40 rounded-card p-8 md:p-12 max-w-3xl">
            <p className="overline mb-4 text-bronze-ink">Auf der Roadmap</p>
            <h2 className="font-serif text-display-sm text-navy font-light mb-5">
              Dediziertes Broker-Tier — kommt 2026.
            </h2>
            <p className="text-body text-muted leading-relaxed mb-6 max-w-prose">
              Wir bauen ein dediziertes Broker-Tier mit Multi-Mandant-Dashboard,
              White-Label-Datenraum, eigener Provisionsabrechnung pro Klient und einer
              Pipeline-Kanban-Sicht für mehrere parallele Deals. Bis dahin ist
              <strong className="font-medium text-navy"> Käufer+</strong> der schnellste Weg, passare
              für deine Mandate produktiv zu nutzen.
            </p>
            <p className="text-body-sm text-muted leading-relaxed max-w-prose">
              Du willst ins Pilotprogramm? Schreib uns kurz auf{' '}
              <Link className="text-navy hover:text-bronze underline-offset-4 hover:underline" href="mailto:broker@passare.ch">broker@passare.ch</Link> —
              wir nehmen dich auf die Liste und du kriegst die Beta-Zugänge zuerst.
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
              Bereit, deine Klienten<br />
              schneller zu bedienen<span className="text-bronze">?</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Käufer+ ist heute der direkte Weg auf alle Inserate, parallele Suchprofile,
              Echtzeit-Alerts und die KMU-Multiples-Datenbank — alles, was du für
              gleichzeitige Käufer-Mandate brauchst.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/plus" variant="bronze" size="lg">
                Käufer+ ansehen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="mailto:broker@passare.ch" variant="secondary" size="lg" className="!text-cream !border-cream/30 hover:!border-cream">
                Pilotprogramm anfragen
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
