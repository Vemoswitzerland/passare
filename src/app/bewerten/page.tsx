import Link from 'next/link';
import { ArrowRight, Calculator, ShieldCheck, Lock, Clock } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { Divider } from '@/components/ui/divider';
import { SiteHeader } from '../page';
import { createClient } from '@/lib/supabase/server';
import { KANTON_CODES } from '@/lib/listings-mock';
import BewertungsWizard from './BewertungsWizard';

export const metadata = {
  title: 'Was ist meine Firma wert? Gratis bewerten — passare',
  description:
    'Kostenloses Bewertungstool für Schweizer KMU. Sechs Fragen, Marktwert in 60 Sekunden. Basierend auf aktuellen Branchen-Multiples (M&A 2025).',
  robots: { index: false, follow: false },
};

export const revalidate = 600;

type Branche = {
  branche: string;
  ebitda_multiple_min: number;
  ebitda_multiple_max: number;
  quelle: string | null;
};

async function loadBranchen(): Promise<Branche[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('kmu_multiples')
      .select('branche, ebitda_multiple_min, ebitda_multiple_max, quelle')
      .order('ebitda_multiple_max', { ascending: false });

    if (error || !data) return [];
    return data.map((b) => ({
      branche: b.branche,
      ebitda_multiple_min: Number(b.ebitda_multiple_min),
      ebitda_multiple_max: Number(b.ebitda_multiple_max),
      quelle: b.quelle,
    }));
  } catch {
    return [];
  }
}

export default async function BewertenPage() {
  const branchen = await loadBranchen();
  const kantone = [...KANTON_CODES];

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <WizardSection branchen={branchen} kantone={kantone} />
      <Methode />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-10 md:pb-14">
      <Container size="wide">
        <Reveal>
          <p className="overline mb-5 text-bronze-ink">Gratis Firmenbewertung</p>
          <h1 className="font-serif text-[clamp(2.25rem,4.5vw,4rem)] text-navy font-light tracking-[-0.025em] leading-[1.05] max-w-hero mb-6">
            Was ist meine Firma <span className="text-muted italic">wirklich wert<span className="not-italic text-bronze">?</span></span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-body-lg text-muted max-w-prose leading-relaxed mb-8">
            Sechs Fragen, eine Indikation. Basierend auf den aktuellen Branchen-Multiples
            aus Schweizer M&amp;A-Reports 2025 — transparent, nachvollziehbar, kostenlos.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
            <SignalDot>60 Sekunden</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>Keine Registrierung</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>9 Branchen</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>Quellen offen</SignalDot>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function WizardSection({ branchen, kantone }: { branchen: Branche[]; kantone: string[] }) {
  if (branchen.length === 0) {
    return (
      <Section>
        <Container size="wide">
          <div className="bg-paper border border-stone rounded-card p-12 text-center">
            <p className="font-serif text-head-lg text-navy mb-3">Tool wird vorbereitet</p>
            <p className="text-body text-muted">Die Multiples-Datenbank wird gerade aufgebaut. Bitte später nochmal vorbeischauen.</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <section className="pb-16 md:pb-24">
      <Container size="wide">
        <BewertungsWizard branchen={branchen} kantone={kantone} />
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

function Methode() {
  const items = [
    { Icon: Calculator, title: 'EBITDA-Multiple', body: 'Standard-Methode für KMU. Branchen-Multiple × bereinigtes EBITDA = Marktwert-Indikation.' },
    { Icon: ShieldCheck, title: 'Cross-Check Umsatz', body: 'Bei untypischer Marge (z.B. SaaS) wird parallel das Umsatz-Multiple gerechnet — Range bleibt realistisch.' },
    { Icon: Clock, title: 'Wachstums-Faktor', body: 'Drei Wachstums-Bänder. ±15 % Adjustment auf die Range — wer wächst, wird höher bewertet.' },
    { Icon: Lock, title: 'Diskret', body: 'Keine Zwangs-Registrierung, keine Telefon-Akquise. Nur wenn Sie wollen, schicken wir den Detail-Report per Email.' },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Methode</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Transparenz statt Black-Box.
            </h2>
            <p className="text-body-lg text-muted mt-6 leading-relaxed">
              Sie sehen genau, mit welchem Multiple gerechnet wird, woher es stammt und wie das Wachstum die Range verschiebt.
            </p>
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

function FAQ() {
  const items = [
    { q: 'Wie genau ist diese Bewertung?', a: 'Es ist eine Indikation — keine professionelle Bewertung. Persönliche Faktoren (Inhaber-Abhängigkeit, Klumpenrisiken, Substanz-Wert, Eigentümerstruktur) sind nicht berücksichtigt. Erwarten Sie eine Range von ±20 %.' },
    { q: 'Wo kommen die Multiples her?', a: 'Aus aktuellen Schweizer M&A-Reports 2025: KPMG, Deloitte, BDO, PwC, GastroSuisse, KMU-Studie HSG. Wir aktualisieren quartalsweise. Quelle wird zu jeder Branche angezeigt.' },
    { q: 'Werden meine Daten gespeichert?', a: 'Ja — wir speichern Branche, Eckdaten und das Ergebnis anonym (kein Firmenname, keine Email — ausser Sie geben sie für den Detail-Report). Wir nutzen das, um die Multiples-DB zu verbessern.' },
    { q: 'Was, wenn meine Branche nicht in der Liste ist?', a: 'Wählen Sie die nächstliegende. Für eine spezifische Bewertung (Tech-Startups, Spezialfertigung, Dienstleistungen mit Recurring Revenue) wenden Sie sich an unser Treuhand-Netzwerk.' },
    { q: 'Brauche ich einen Account?', a: 'Nein. Das Tool ist komplett ohne Registrierung nutzbar. Wenn Sie den Detail-Report wollen, hinterlassen Sie eine Email — sonst nichts.' },
    { q: 'Was ist der nächste Schritt nach der Bewertung?', a: 'Wenn die Range stimmt, ist ein Inserat auf passare die schnellste Markttest-Variante. Sie sehen, wie Käufer reagieren — anonym und unverbindlich.' },
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

function CTA() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Bewerten ist erst der Anfang<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Wenn die Range stimmt: Markttest mit anonymem Inserat. Sie sehen, wer ernsthaft interessiert ist —
              ohne Verträge, ohne Provisionen.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/verkaufen" variant="bronze" size="lg">
                Inserat erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/atlas" size="lg" className="bg-transparent border border-cream/25 text-cream hover:bg-cream/10">
                Zum Firmen-Atlas
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
            <p className="overline mb-4">Tools</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/atlas">Firmen-Atlas</Link></li>
              <li><Link className="hover:text-navy" href="/ratgeber">Ratgeber</Link></li>
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
