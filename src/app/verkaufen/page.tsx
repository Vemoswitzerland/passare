import Link from 'next/link';
import { ArrowRight, ShieldCheck, Upload, FileLock2, MessageCircle, Handshake, Check, Clock, TrendingUp, Users, Calculator, Sparkles } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { DashboardMockup } from '@/components/sections/dashboard-mockup';

export const metadata = {
  title: 'Firma inserieren — passare',
  description:
    'Inserieren Sie Ihr KMU auf der Schweizer Plattform passare. Fester Paketpreis ab CHF 425, anonymes Profil, Freigabe durch Sie als Verkäufer. Sie behalten die Kontrolle.',
  robots: { index: false, follow: false },
};

export default function VerkaufenPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopBar />
      <Hero />
      <Benefits />
      <Packages />
      <Process />
      <BewertungsKarte />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

import { SiteHeader } from '../page';

/* ───────────────────────────────── */
function TopBar() {
  return <SiteHeader activeSell />;
}

/* Hero — 2-col: Text links, Dashboard-Mockup rechts */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-20 md:pb-28">
      <Container size="wide">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="relative">
            <Reveal>
              <p className="overline mb-6 text-bronze-ink">Für Verkäufer</p>
              <h1 className="font-serif-display text-[clamp(2.5rem,4.5vw,4.5rem)] text-navy font-light mb-8 tracking-[-0.025em] leading-[1.05]">
                Firmenmarktplatz <span className="text-muted italic">der Schweiz<span className="not-italic text-bronze">.</span></span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
                Ihr Inserat ist öffentlich &mdash; Firmenname, echte Zahlen und Dossier
                bleiben verdeckt. Erst wenn Sie einen Interessenten freischalten,
                sieht er die Details. Sie bleiben Herr des Prozesses.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-3">
                <Button href="/verkaufen/start" size="lg">
                  Bewerten &amp; inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="#pakete" variant="secondary" size="lg">
                  Pakete ansehen
                </Button>
              </div>
              <p className="text-caption text-quiet mb-12 max-w-prose">
                Der Inserat-Funnel beginnt mit der Smart-Bewertung &mdash; Sie sehen die Marktwert-Range Ihrer Firma, bevor Sie das Inserat fertig stellen.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
                <SignalDot>Ab CHF 425</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>Pauschalpreis</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>Anonym</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>0&nbsp;% Provision</SignalDot>
              </div>
            </Reveal>
          </div>

          {/* Dashboard-Mockup */}
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

/* ───────────────────────────────── */
function Benefits() {
  const items = [
    { Icon: ShieldCheck, title: 'Anonym inserieren', body: 'Teaser öffentlich, Details erst nach Ihrer Freigabe. Ihre Mitarbeitenden, Lieferanten und Kunden erfahren nichts vom Verkauf.' },
    { Icon: Clock, title: '10–15 Min. live', body: 'Zefix-Import, KI-Assistent, Foto-Upload. Ihr Inserat läuft noch heute.' },
    { Icon: TrendingUp, title: 'Pauschal-Preis', body: 'Sie zahlen einmalig für Ihr Inserat — egal ob Ihre Firma am Ende für CHF 500\'000 oder CHF 25 Mio den Besitzer wechselt.' },
    { Icon: Users, title: 'Verifizierte Käufer', body: 'Über 300 registrierte Käufer mit KYC und ernstem Interesse. Keine Schaulustigen.' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Warum passare</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Vier Gründe, es selbst zu machen.
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone border border-stone rounded-card overflow-hidden">
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

/* ───────────────────────────────── */
function Packages() {
  const plans = [
    {
      tag: 'Einstieg',
      name: 'Inserat Light',
      price: 'CHF 710',
      note: 'einmalig · 12 Monate Laufzeit',
      features: [
        '1 Inserat live im Marktplatz',
        'Anfragen empfangen',
        'In-App-Chat mit Käufern',
        'Vollständige Statistik (Charts, Conversion)',
      ],
      verlaengerung: 'Auch als 6-Monats-Paket: CHF 425',
    },
    {
      tag: 'Empfohlen',
      highlight: true,
      name: 'Inserat Pro',
      price: 'CHF 890',
      note: 'einmalig · 12 Monate Laufzeit',
      features: [
        'Alles aus Light, plus:',
        'Datenraum mit Versionierung',
        'Hervorhebung 4× pro Jahr',
        '(Seite 1 + Top-Position im Branchenfilter)',
      ],
      verlaengerung: 'Auch als 6-Monats-Paket: CHF 535',
    },
    {
      tag: 'Maximum Reichweite',
      name: 'Inserat Premium',
      price: 'CHF 1\'890',
      note: 'einmalig · 12 Monate Laufzeit',
      features: [
        'Alles aus Pro, plus:',
        'Hervorhebung 12× pro Jahr',
        'Newsletter-Slot 2× pro Jahr',
        'Bis 3 Mitarbeiter onboarden',
        'Käuferprofil-Einsicht bei Anfragen',
      ],
      verlaengerung: 'Auch als 6-Monats-Paket: CHF 1\'140',
    },
  ];

  return (
    <Section id="pakete">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Pakete</p>
            <h2 className="font-serif text-display-md text-navy font-light mb-6">
              Fester Preis. Keine Überraschungen.
            </h2>
            <p className="text-body-lg text-muted leading-relaxed max-w-prose">
              Sie wählen ein Paket &mdash; Ihr Inserat läuft die ganze Laufzeit.
              Keine automatische Verlängerung. Sie zahlen einmal für die Plattform.
            </p>
            <p className="mt-4 text-body-sm text-bronze-ink leading-relaxed max-w-prose">
              <strong className="font-medium">Klein-Inserat-Rabatt 25 %</strong> für Firmen mit Verkaufspreis unter CHF 500&apos;000 &mdash; wird automatisch im Wizard angewendet.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {plans.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className={`h-full p-8 md:p-10 flex flex-col ${
                  p.highlight ? 'bg-cream/60' : 'bg-paper'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <p className={`font-mono text-[11px] uppercase tracking-widest ${p.highlight ? 'text-bronze-ink' : 'text-quiet'}`}>
                    {p.tag}
                  </p>
                  {p.highlight && (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-bronze/15 text-bronze-ink">
                      empfohlen
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-head-lg text-navy font-normal mb-6">{p.name}</h3>
                <div className="mb-6 pb-6 border-b border-stone">
                  <p className="font-serif text-[clamp(2rem,4vw,3rem)] text-navy font-light font-tabular leading-none">
                    {p.price}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mt-3">
                    {p.note}
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-body-sm">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-bronze" strokeWidth={1.75} />
                      <span className="text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[11px] text-quiet mb-6">
                  {p.verlaengerung}
                </p>
                <Button
                  href="/verkaufen/start"
                  variant={p.highlight ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full justify-center"
                >
                  {p.name} wählen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ───────────────────────────────── */
function Process() {
  const steps = [
    { Icon: Upload, step: 'I', title: 'Firma importieren', body: 'Zefix-Autocomplete holt Grunddaten. KI-Assistent schreibt den Teaser anonymisiert.' },
    { Icon: FileLock2, step: 'II', title: 'Anfrage-Schutz aktivieren', body: 'Sie entscheiden, wer Detail-Dossier und Datenraum sieht. Jede Anfrage landet zuerst in Ihrem Dashboard zur Freigabe.' },
    { Icon: MessageCircle, step: 'III', title: 'Interessenten filtern', body: 'Anfragen kommen in Ihr Dashboard. Sie entscheiden, wen Sie freischalten.' },
    { Icon: Handshake, step: 'IV', title: 'Deal abschliessen', body: 'Direktverhandlung. Bei Bedarf vermitteln wir Fachanwälte und Treuhänder.' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-16 max-w-prose">
            <p className="overline mb-5">Ihr Weg</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Vier Schritte. Keine Überraschungen.
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {steps.map((s, i) => (
            <RevealItem key={i} className="bg-paper relative p-8 md:p-10 flex flex-col">
              <span aria-hidden className="absolute top-6 right-6 font-serif text-6xl text-bronze/10 font-light select-none">
                {s.step}
              </span>
              <div className="relative">
                <s.Icon className="w-6 h-6 text-bronze mb-8" strokeWidth={1.5} />
                <p className="font-mono text-[11px] tracking-widest uppercase text-quiet mb-3">Schritt {s.step}</p>
                <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">{s.title}</h3>
                <p className="text-body-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ───────────────────────────────── */
function BewertungsKarte() {
  return (
    <Section>
      <Container>
        <Reveal>
          <article className="relative overflow-hidden border border-stone bg-paper rounded-card p-8 md:p-12">
            {/* dezenter Hintergrund-Akzent */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-bronze/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-navy/5 blur-3xl pointer-events-none" />

            <div className="relative grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-end">
              <div className="max-w-prose">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bronze bg-bronze/10 border border-bronze/30 rounded-full px-2.5 py-1">
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                    Alternativ-Weg
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
                    2 Min &middot; gratis &middot; ohne Konto
                  </span>
                </div>

                <h2 className="font-serif text-display-sm md:text-display-md text-navy font-light mb-4 tracking-[-0.02em] leading-[1.1]">
                  Erst bewerten<span className="text-bronze">.</span>{' '}
                  <span className="text-muted italic">Dann inserieren.</span>
                </h2>

                <p className="text-body-lg text-muted leading-relaxed mb-6">
                  Du weisst noch nicht, was deine Firma wert ist? Mit der
                  Smart-Bewertung erhältst du eine indikative Marktwert-Range
                  basierend auf Schweizer KMU-Multiples deiner Branche &mdash;
                  und gehst direkt im Anschluss in den Inserat-Wizard.
                </p>

                <ul className="grid sm:grid-cols-3 gap-3 mb-8">
                  <li className="flex items-start gap-2 text-body-sm">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-ink">Marktwert-Range in 2 Min</span>
                  </li>
                  <li className="flex items-start gap-2 text-body-sm">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-ink">EBITDA &amp; Umsatz-Multiples</span>
                  </li>
                  <li className="flex items-start gap-2 text-body-sm">
                    <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-ink">Direkt-Übergabe ans Inserat</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <Button href="/verkaufen/start" size="lg">
                    <Calculator className="w-4 h-4" strokeWidth={1.5} />
                    Bewerten &amp; inserieren
                  </Button>
                  <Button href="/bewerten" variant="ghost" size="lg">
                    Nur bewerten (ohne Inserat) <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>

              {/* Visueller Anker rechts: indikative Range-Pillen */}
              <div className="hidden md:block">
                <div className="border border-stone rounded-soft bg-cream/60 p-5 w-[260px]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-3">
                    Beispiel-Bewertung
                  </p>
                  <p className="font-serif text-head-md text-navy mb-1">
                    CHF 2.4 – 3.2M
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-bronze-ink mb-4">
                    Bäckerei BE &middot; 18 MA &middot; 12.5%
                  </p>

                  {/* Range-Bar */}
                  <div className="h-2 rounded-full bg-stone overflow-hidden mb-2 relative">
                    <div className="absolute inset-y-0 left-[18%] right-[22%] bg-bronze rounded-full" />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-quiet">
                    <span>1.0M</span>
                    <span>5.0M</span>
                  </div>

                  <div className="border-t border-stone mt-4 pt-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-quiet mb-1">
                      EBITDA-Multiple
                    </p>
                    <p className="font-mono text-[11px] text-navy font-tabular font-medium">
                      4.2 – 5.6 ×
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ───────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: 'Muss ich meinen Firmennamen öffentlich angeben?',
      a: 'Nein. Im öffentlichen Teaser ist Ihre Firma anonymisiert. Firmenname, Standort und Detailzahlen sieht ein Interessent erst, wenn Sie ihn aktiv im Dashboard freischalten.',
    },
    {
      q: 'Wie läuft eine Anfrage ab?',
      a: 'Ein Interessent stellt über das Inserat eine Anfrage mit kurzer Vorstellung. Sie sehen die Anfrage im Dashboard, prüfen Käuferprofil und Hintergrund, und entscheiden ob Sie freischalten oder ablehnen. Erst nach Ihrer Freigabe erhält der Interessent Detail-Dossier und ggf. den Datenraum.',
    },
    {
      q: 'Beginnt der Inserat-Funnel mit der Bewertung?',
      a: 'Ja. Im Inserat-Wizard fragen wir zuerst Branche, Kanton, Mitarbeitende, Umsatz und EBITDA-Marge ab und zeigen Ihnen sofort eine indikative Marktwert-Range basierend auf aktuellen Schweizer KMU-Multiples. Das Inserat selbst wird im gleichen Flow erstellt — kein separater Schritt.',
    },
    {
      q: 'Verdient passare am Verkaufspreis mit?',
      a: 'Nein. passare ist eine Self-Service-Plattform. Sie zahlen einmal das Paket — ob Sie für CHF 500\'000 oder CHF 25 Mio verkaufen, am Plattform-Preis ändert sich nichts. 0 % Erfolgsprovision.',
    },
    {
      q: 'Was passiert, wenn mein Inserat nach der Laufzeit nicht verkauft ist?',
      a: 'Sie verlängern manuell oder nehmen das Inserat von der Plattform — beides aus dem Dashboard. Verlängerung kostet CHF 490 für 6 weitere Monate (egal welches Paket). Es gibt keine automatische Verlängerung.',
    },
    {
      q: 'Was ist der Klein-Inserat-Rabatt?',
      a: 'Firmen mit einem Verkaufspreis unter CHF 500\'000 erhalten 25 % Rabatt auf alle drei Pakete. Der Rabatt wird automatisch im Wizard angewendet, sobald Sie den Kaufpreis angeben.',
    },
    {
      q: 'Kann ich mein Inserat pausieren oder löschen?',
      a: 'Jederzeit, aus dem Dashboard. Sie können auch einzelne Interessenten ausschliessen oder priorisieren.',
    },
    {
      q: 'Was bringt die Hervorhebung im Pro- und Premium-Paket?',
      a: 'Pro: 4× pro Jahr inklusive. Premium: 12× pro Jahr inklusive. Ihr Inserat rutscht 7 Tage auf Seite 1 des Marktplatzes und nimmt die Top-Position im Branchenfilter. Einzeln dazubuchbar für CHF 49.',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen</p>
            <h2 className="font-serif text-display-md text-navy font-light">Kurz beantwortet.</h2>
          </div>
        </Reveal>
        <div className="max-w-3xl">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="border-t border-stone py-8 group">
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

/* ───────────────────────────────── */
function CTA() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Ihr Inserat kann heute live gehen<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Keine Verträge, keine Vertreterbesuche, keine unterschriftspflichtigen Mandate.
              Wählen Sie ein Paket, füllen Sie 10 Minuten aus, und der Marktplatz öffnet sich.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/verkaufen/start" variant="bronze" size="lg">
                Bewerten &amp; inserieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <span className="font-mono text-[11px] uppercase tracking-widest text-cream/50 mt-3">
                Ab CHF 425 &middot; Pauschalpreis &middot; 0 % Provision
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ───────────────────────────────── */
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
              <li><Link className="hover:text-navy" href="/verkaufen">Firma inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Inserat-Preise</Link></li>
              <li><Link className="hover:text-navy" href="/">Firmen entdecken</Link></li>
              <li><Link className="hover:text-navy" href="/broker">Broker</Link></li>
              <li><Link className="hover:text-navy" href="/plus">Käufer+</Link></li>
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
