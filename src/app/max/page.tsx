import Link from 'next/link';
import {
  ArrowRight, Check, Eye, Zap, BellRing, MessageCircle,
  Filter, Bookmark, Sparkles, ShieldCheck,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Käufer MAX — alle Inserate, Echtzeit-Alerts, 7 Tage Frühzugang — passare',
  description:
    'Mit MAX siehst du als Käufer 7 Tage früher neue KMU-Inserate, bekommst Echtzeit-Alerts per WhatsApp und nutzt unbegrenzte Anfragen, alle 18 Filter und ein Featured-Käuferprofil. CHF 199 / Monat oder CHF 1\'990 / Jahr.',
  robots: { index: false, follow: false },
};

export default function MaxPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <Vorteile />
      <Vergleich />
      <UseCases />
      <Faq />
      <CTA />
      <SiteFooter />
    </main>
  );
}

/* ─────────────────────────────────────────────── */
function Hero() {
  return (
    <Section className="pt-16 md:pt-24 pb-14 md:pb-20">
      <Container>
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
          <div>
            <Reveal>
              <p className="overline mb-6 text-bronze-ink">Für Käufer</p>
              <h1 className="font-serif-display text-[clamp(2.5rem,4.5vw,4.5rem)] text-navy font-light mb-8 tracking-[-0.025em] leading-[1.05]">
                Sieh es zuerst<span className="text-bronze">.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
                Die besten Schweizer KMU-Inserate werden in den ersten Tagen nach
                Veröffentlichung weggeschnappt. Mit MAX siehst du sie 7 Tage
                früher als alle anderen, bekommst Echtzeit-Alerts und kannst
                unbegrenzt Anfragen senden.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-10">
                <Button href="/auth/register?role=kaeufer&plan=max" size="lg">
                  MAX buchen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button href="/" variant="secondary" size="lg">
                  Erst Marktplatz anschauen
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
                <SignalDot>CHF 199 / Monat</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>Monatlich kündbar</SignalDot>
                <span className="w-px h-3 bg-stone" />
                <SignalDot>Jahres-Abo: 2 Monate gratis</SignalDot>
              </div>
            </Reveal>
          </div>

          {/* Visueller Anker rechts: Frühzugang-Beispiel */}
          <Reveal delay={0.35}>
            <div className="relative">
              <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-bronze/8 blur-3xl pointer-events-none" />
              <div className="relative border border-stone bg-paper rounded-card p-8 md:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bronze bg-bronze/10 border border-bronze/30 rounded-full px-2.5 py-1">
                    <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                    Frühzugang aktiv
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
                    7 Tage vor allen
                  </span>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-2">
                  Beispiel-Inserat
                </p>
                <p className="font-serif text-head-md text-navy mb-1 leading-snug">
                  Schweizer Spezialhandel · Zentralschweiz
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-bronze-ink mb-5">
                  Umsatz 4.2M · 12 MA · EBITDA 14 %
                </p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="border border-stone rounded-soft bg-cream/40 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-quiet mb-1">
                      Sichtbar Basic
                    </p>
                    <p className="font-mono text-[12px] text-navy font-tabular">
                      ab Tag 8
                    </p>
                  </div>
                  <div className="border border-bronze/40 rounded-soft bg-bronze/10 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-bronze-ink mb-1">
                      Sichtbar MAX
                    </p>
                    <p className="font-mono text-[12px] text-navy font-tabular font-medium">
                      ab Tag 1
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-1">
                    Echtzeit-Alert
                  </p>
                  <p className="text-body-sm text-ink">
                    Push + WhatsApp innerhalb von 30 Sekunden
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
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

/* ─────────────────────────────────────────────── */
function Vorteile() {
  const items = [
    {
      Icon: Eye,
      title: '7 Tage Frühzugang',
      body: 'Du siehst neue Inserate bevor die Basic-Käufer sie überhaupt finden. Die meisten Top-Deals werden in dieser Phase weggeschnappt.',
    },
    {
      Icon: BellRing,
      title: 'Echtzeit-Alerts',
      body: 'E-Mail + WhatsApp innerhalb von Sekunden, sobald ein Inserat zu deinem Suchprofil passt. Keine Wartezeit auf den wöchentlichen Digest.',
    },
    {
      Icon: Filter,
      title: 'Alle 18 Filter + Custom',
      body: 'Über die 5 Basic-Filter hinaus: EBITDA-Marge, Mitarbeiter-Bucket, Übergabegrund, Branchen-Sub-Kategorien, Kanton-Kombinationen.',
    },
    {
      Icon: MessageCircle,
      title: 'Unbegrenzte Anfragen',
      body: 'Statt 5 pro Monat: so viele Anfragen wie du willst. Bei seriösem Mandat ein klarer Vorteil.',
    },
    {
      Icon: Bookmark,
      title: 'Unbegrenzte Suchprofile',
      body: 'Mehrere parallele Suchen mit unterschiedlichen Filtern, gespeichert mit individuellem Alert-Rhythmus. Basic erlaubt 3.',
    },
    {
      Icon: ShieldCheck,
      title: 'Featured-Käuferprofil',
      body: 'Verkäufer sehen dein Profil im Anfragen-Backlog mit MAX-Badge. Ernsthafte Käufer werden bevorzugt freigeschaltet.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Warum MAX</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Sechs Gründe, einen Schritt voraus zu sein.
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
function Vergleich() {
  const rows = [
    { feature: 'Inserate durchsuchen',          basic: 'Öffentliche',     max: 'Alle inkl. Premium' },
    { feature: 'Frühzugang neue Inserate',      basic: '—',               max: '7 Tage vor allen' },
    { feature: 'Basis-Filter (5)',              basic: '✓',               max: '✓' },
    { feature: 'Alle Filter (18) + Custom',     basic: '—',               max: '✓' },
    { feature: 'Gespeicherte Suchen',           basic: '3',               max: 'Unbegrenzt' },
    { feature: 'E-Mail-Alerts',                 basic: 'Wöchentlich',     max: 'Echtzeit' },
    { feature: 'WhatsApp-Alerts',               basic: '—',               max: '✓' },
    { feature: 'Anfragen pro Monat',            basic: '5',               max: 'Unbegrenzt' },
    { feature: 'Direkt-Anfrage-Track',          basic: '—',               max: '✓' },
    { feature: 'Öffentliches Käuferprofil',     basic: '—',               max: 'Featured' },
    { feature: 'KMU-Multiples-Datenbank',       basic: '—',               max: '✓' },
    { feature: 'Persönlicher Ansprechpartner',  basic: '—',               max: '✓' },
    { feature: 'Kündigungsfrist',               basic: '—',               max: 'Monatlich' },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Vergleich</span>
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
                <Button href="/auth/register?role=kaeufer&plan=basic" variant="secondary" size="sm" className="w-full justify-center">Gratis starten</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/auth/register?role=kaeufer&plan=max" size="sm" className="w-full justify-center">MAX buchen</Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-quiet">
            ◦ Jahres-Abo: 2 Monate gratis &middot; Monatlich kündbar &middot; Preise zzgl. 8.1 % MWST
          </p>
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
        Tier
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

/* ─────────────────────────────────────────────── */
function UseCases() {
  const cases = [
    {
      tag: 'Aktiver Suchender',
      title: 'Du suchst seit Monaten und willst nichts mehr verpassen.',
      body: 'Echtzeit-Alerts und 7 Tage Frühzugang sind hier matchentscheidend — die guten Inserate sind oft in 14 Tagen vergeben.',
    },
    {
      tag: 'Investor mit Mandat',
      title: 'Du hast ein klares Mandat und willst alle passenden Inserate sehen.',
      body: 'Alle 18 Filter, unbegrenzte Suchprofile und das Featured-Profil sorgen dafür, dass Verkäufer dich kennen, bevor andere reagieren.',
    },
    {
      tag: 'Berater oder Treuhänder',
      title: 'Du suchst im Auftrag mehrerer Klienten parallel.',
      body: 'Unbegrenzte Anfragen + parallele Suchprofile mit individuellen Alerts decken mehrere Mandate gleichzeitig ab.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Wann sich MAX lohnt</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Drei typische Käufer-Profile.
            </h2>
          </div>
        </Reveal>
        <RevealStagger className="grid md:grid-cols-3 gap-px bg-stone border border-stone rounded-card overflow-hidden">
          {cases.map((c, i) => (
            <RevealItem key={i} className="bg-paper p-8 md:p-10 flex flex-col">
              <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-4">{c.tag}</p>
              <h3 className="font-serif text-head-md text-navy mb-4 font-normal leading-snug">{c.title}</h3>
              <p className="text-body-sm text-muted leading-relaxed">{c.body}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/* ─────────────────────────────────────────────── */
function Faq() {
  const items = [
    {
      q: 'Wie funktioniert der 7-Tage-Frühzugang?',
      a: 'Sobald ein Verkäufer ein Inserat veröffentlicht, ist es für MAX-Käufer sofort sichtbar. Basic-Käufer sehen das Inserat erst 7 Tage später. Diese Phase entscheidet bei beliebten Inseraten oft über die Anfrage-Reihenfolge.',
    },
    {
      q: 'Wo bekomme ich die Echtzeit-Alerts?',
      a: 'In jedem MAX-Abo enthalten: Push- und E-Mail-Benachrichtigungen sofort, sobald ein neues Inserat einem deiner Suchprofile entspricht. WhatsApp-Alerts kannst du zusätzlich aktivieren — innert 30 Sekunden im Chat.',
    },
    {
      q: 'Kann ich MAX jederzeit kündigen?',
      a: 'Ja. Im Monats-Abo (CHF 199 / Monat) jederzeit aufs nächste Monatsende. Beim Jahres-Abo (CHF 1\'990 / Jahr) endet der Vertrag automatisch nach 12 Monaten — keine stille Verlängerung.',
    },
    {
      q: 'Was kostet MAX im Jahres-Abo gegenüber monatlich?',
      a: 'Monatlich: CHF 199 × 12 = CHF 2\'388. Jahres-Abo: CHF 1\'990. Du sparst zwei Monatsgebühren.',
    },
    {
      q: 'Bekomme ich nach Anfrage die Firmen-Details?',
      a: 'Sobald du eine Anfrage stellst und der Verkäufer dich freigibt, siehst du Firmenname, Detail-Dossier und ggf. den Datenraum mit weiteren Unterlagen. Mit MAX wird deine Anfrage prioritär verarbeitet.',
    },
    {
      q: 'Was ist die KMU-Multiples-Datenbank?',
      a: 'Aktuelle Schweizer Branchen-Multiples (EBITDA, Umsatz) für deine Bewertungen — basierend auf realen M&A-Transaktionen. Nur für MAX-Käufer einsehbar.',
    },
    {
      q: 'Kann ich Basic erst testen und später upgraden?',
      a: 'Ja. Basic ist gratis und unbefristet. Du kannst jederzeit auf MAX upgraden — ohne neue Registrierung, der Wechsel passiert direkt im Konto.',
    },
    {
      q: 'Sind die Preise inklusive MWST?',
      a: 'Nein, alle Preise zzgl. 8.1 % Schweizer Mehrwertsteuer.',
    },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Häufige Fragen</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Zu MAX.
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

/* ─────────────────────────────────────────────── */
function CTA() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Sieh es zuerst<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Frühzugang, Echtzeit-Alerts und unbegrenzte Anfragen. Monatlich kündbar.
              Beim Jahres-Abo zwei Monate gratis.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/auth/register?role=kaeufer&plan=max" variant="bronze" size="lg">
                MAX buchen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/" variant="secondary" size="lg" className="!text-cream !border-cream/30 hover:!border-cream">
                Erst Marktplatz anschauen
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
