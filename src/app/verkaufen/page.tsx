import Link from 'next/link';
import { ArrowRight, ShieldCheck, Upload, FileLock2, MessageCircle, Handshake, Check, Clock, TrendingUp, Users } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { DashboardMockup } from '@/components/sections/dashboard-mockup';

export const metadata = {
  title: 'Firma inserieren — passare',
  description:
    'Inserieren Sie Ihr KMU auf der Schweizer Plattform passare. Fester Paketpreis ab CHF 290, keine Erfolgsprovision, anonymes Profil, NDA-Gate. Sie behalten die Kontrolle.',
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
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

/* ───────────────────────────────── */
function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-cream/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-9">
            <Link href="/verkaufen" className="text-[0.8125rem] font-medium text-navy">Inserieren</Link>
            <Link href="/kaufen" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Entdecken</Link>
            <Link href="/preise" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Preise</Link>
            <Link href="/" className="text-[0.8125rem] font-medium text-muted hover:text-ink">Ratgeber</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button href="/auth/login" size="sm" variant="ghost" className="hidden md:inline-flex">
              Anmelden
            </Button>
            <Button href="/auth/register" size="sm" className="hidden md:inline-flex">
              Registrieren
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
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
                Inserieren Sie Ihre Firma<span className="text-bronze">.</span>{' '}
                <span className="text-muted">Nicht Ihren Namen.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
                Ihr Inserat ist öffentlich &mdash; Firmenname, echte Zahlen und Dossier
                bleiben verdeckt. Erst nach unterzeichnetem NDA und Ihrer Freigabe
                erhält ein Interessent Einblick. Sie bleiben Herr des Prozesses.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-12">
                <Button href="/auth/register" size="lg">
                  Inserat erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="#pakete" variant="secondary" size="lg">
                  Pakete ansehen
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
                <SignalDot>Ab CHF 290</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>0% Provision</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>Anonym</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>NDA-Gate</SignalDot>
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
    { Icon: ShieldCheck, title: 'Anonym inserieren', body: 'Teaser öffentlich, Details nach NDA. Ihre Mitarbeitenden, Lieferanten und Kunden erfahren es nicht.' },
    { Icon: Clock, title: '10–15 Min. live', body: 'Zefix-Import, KI-Assistent, Foto-Upload. Ihr Inserat läuft noch heute.' },
    { Icon: TrendingUp, title: 'Keine Provision', body: 'Ob Sie für CHF 500\'000 oder CHF 25 Mio verkaufen — wir verdienen keinen Rappen am Deal.' },
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
      price: 'CHF 290',
      note: 'einmalig · 3 Monate Laufzeit',
      features: [
        'Anonymes Inserat im Marktplatz',
        '5 Bilder · 2 PDFs im Datenraum',
        'NDA-Gate mit eSign',
        'Anfragen-Dashboard',
        'KI-Teaser-Generator',
      ],
      verlaengerung: 'Verlängerung: +CHF 190 pro 3 Monate',
    },
    {
      tag: 'Empfohlen',
      highlight: true,
      name: 'Inserat Pro',
      price: 'CHF 890',
      note: 'einmalig · 6 Monate Laufzeit',
      features: [
        'Alles aus Light, plus:',
        '20 Bilder + Videos · unbegrenzter Datenraum',
        'Wasserzeichen auf PDF-Downloads',
        'Matching mit Käuferprofilen',
        'Newsletter-Feature (einmalig)',
        'Detailstatistiken & Conversion',
      ],
      verlaengerung: 'Verlängerung: +CHF 490 pro 6 Monate',
    },
    {
      tag: 'Maximum Reichweite',
      name: 'Inserat Premium',
      price: 'CHF 1\'890',
      note: 'einmalig · 12 Monate Laufzeit',
      features: [
        'Alles aus Pro, plus:',
        'Homepage-Feature (1 Woche/Monat)',
        'Newsletter-Feature (monatlich)',
        'Mehrsprachige Version (FR/IT/EN)',
        '2h persönliche Beratung',
        'Priorisierter Support',
      ],
      verlaengerung: 'Verlängerung: +CHF 990 pro 12 Monate',
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
              Keine automatische Verlängerung. Keine Provision auf Ihren Verkaufspreis.
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
                  href="/auth/register"
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
    { Icon: FileLock2, step: 'II', title: 'NDA-Gate einrichten', body: 'Template anpassen, Käufer signieren digital (eSign QES-konform).' },
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
function FAQ() {
  const items = [
    { q: 'Muss ich meinen Firmennamen öffentlich angeben?', a: 'Nein. Im öffentlichen Teaser ist die Firma anonymisiert. Erst nach unterzeichnetem NDA und Ihrer expliziten Freigabe sieht ein Interessent den Firmennamen und Detailzahlen.' },
    { q: 'Wie funktioniert das NDA-Gate?', a: 'Interessenten signieren mit einem Klick eine vordefinierte Geheimhaltungserklärung (eSign, QES-konform). Die signierte PDF wird archiviert, Sie werden benachrichtigt und können den Zugriff auf das Dossier und den Datenraum individuell freigeben.' },
    { q: 'Verdient passare an meinem Verkaufspreis?', a: 'Nein. Wir haben keine Erfolgsprovision. Sie zahlen einmal das Paket — ob Sie dann für CHF 500\'000 oder CHF 25 Mio verkaufen, wir verdienen keinen zusätzlichen Rappen.' },
    { q: 'Was passiert, wenn mein Inserat nach der Laufzeit nicht verkauft ist?', a: 'Sie können das Inserat manuell verlängern (Light +CHF 190 / Pro +CHF 490 / Premium +CHF 990). Es gibt keine automatische Verlängerung — Sie entscheiden.' },
    { q: 'Kann ich mein Inserat pausieren oder löschen?', a: 'Jederzeit, aus dem Dashboard. Sie können auch einzelne Interessenten sperren oder freischalten.' },
    { q: 'Bietet passare auch persönliche Beratung?', a: 'Im Premium-Paket sind 2 Stunden Beratung mit unserem Netzwerk (Treuhänder, Fachanwalt) inklusive. Darüber hinaus vermitteln wir Experten zu marktüblichen Stundensätzen.' },
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
              <Button href="/auth/register" variant="bronze" size="lg">
                Inserat erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <span className="font-mono text-[11px] uppercase tracking-widest text-cream/50 mt-3">
                Ab CHF 290 &middot; keine Provision &middot; anonym
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
              <li><Link className="hover:text-navy" href="/verkaufen">Inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/kaufen">Firmen entdecken</Link></li>
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
