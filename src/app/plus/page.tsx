import Link from 'next/link';
import {
  ArrowRight, Eye, BellRing, MessageCircle,
  Filter, Bookmark, Sparkles, ShieldCheck, Plus,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../page';

export const metadata = {
  title: 'Käufer+ — alle Inserate, Echtzeit-Alerts, 7 Tage Frühzugang — passare',
  description:
    'Mit Käufer+ siehst du auch geschlossene Inserate, hast 7 Tage Frühzugang auf neue Inserate, bekommst Echtzeit-Alerts und kannst dein Käuferprofil mit eigenem Logo aufwerten. CHF 199 / Monat oder CHF 1\'990 / Jahr.',
  robots: { index: false, follow: false },
};

export default function PlusPage() {
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
/** «Käufer+» als Marken-Wortbild im Serif-Stil des passare-Logos.
 *  «+» ist ein Fraunces-Glyph in Bronze — kein gold-Kreis, gleiche
 *  Logik wie der Bronze-Punkt am «passare.»-Logo. */
function KaeuferPlus({
  variant = 'inherit',
}: {
  variant?: 'inherit' | 'cream' | 'navy';
}) {
  const baseColor =
    variant === 'cream' ? 'text-cream' :
    variant === 'navy'  ? 'text-navy'  : '';
  return (
    <span className={`inline-flex items-baseline ${baseColor}`}>
      Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
    </span>
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
              <p className="overline mb-6 text-bronze-ink inline-flex items-center gap-2">
                Für Käufer · das Upgrade
              </p>
              <h1 className="font-serif-display text-[clamp(2.5rem,4.5vw,4.5rem)] text-navy font-light mb-8 tracking-[-0.025em] leading-[1.05]">
                Sieh es zuerst<span className="text-bronze">.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg md:text-xl text-muted max-w-prose leading-relaxed mb-10">
                Die besten Schweizer KMU-Inserate werden in den ersten Tagen nach
                Veröffentlichung weggeschnappt. Mit <strong className="font-medium text-navy">Käufer+</strong> siehst du auch
                geschlossene Inserate, hast 7 Tage Frühzugang auf Neue und bekommst
                Echtzeit-Alerts statt Wochen-Digest.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-10">
                <Button href="/auth/register?role=kaeufer&plan=max" size="lg">
                  Käufer+ buchen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
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
                    <p className="font-mono text-[9px] uppercase tracking-widest text-bronze-ink mb-1 inline-flex items-center gap-1">
                      Sichtbar Käufer+
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
                    E-Mail innerhalb von 30 Sekunden
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
      title: 'Geschlossene Inserate sehen',
      body: 'Inserate, die nicht öffentlich sichtbar sind, werden für Käufer+ freigeschaltet — komplett zugänglich.',
    },
    {
      Icon: Plus,
      title: '7 Tage Frühzugang',
      body: 'Du siehst neue Inserate sieben Tage bevor sie für Basic-Käufer freigeschaltet werden. Die meisten Top-Deals werden in dieser Phase weggeschnappt.',
    },
    {
      Icon: BellRing,
      title: 'Echtzeit-Alerts',
      body: 'E-Mail-Alerts innerhalb von Sekunden, sobald ein Inserat zu deinem Suchprofil passt. Basic bekommt einen wöchentlichen Digest.',
    },
    {
      Icon: Bookmark,
      title: 'Eigenes Logo im Käuferprofil',
      body: 'Lade dein Logo hoch — dein Käuferprofil wirkt sofort professioneller. Verkäufer erkennen seriöse Käufer schneller und schalten ihre Inserate bevorzugt frei.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-14 max-w-prose">
            <p className="overline mb-5">Warum Käufer+</p>
            <h2 className="font-serif text-display-md text-navy font-light">
              Vier Gründe, einen Schritt voraus zu sein.
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

/* ─────────────────────────────────────────────── */
function Vergleich() {
  const rows = [
    { feature: 'Öffentliche Inserate sehen',                 basic: '✓',           plus: '✓' },
    { feature: 'Geschlossene Inserate sehen',                basic: '—',           plus: '✓' },
    { feature: 'Frühzugang neue Inserate',                   basic: '—',           plus: '7 Tage vor allen' },
    { feature: 'Alle 18 Filter',                             basic: '✓',           plus: '✓' },
    { feature: 'Gespeicherte Suchen',                        basic: '✓',           plus: '✓' },
    { feature: 'E-Mail-Alerts',                              basic: 'Wöchentlich', plus: 'Echtzeit' },
    { feature: 'Eigenes Logo im Käuferprofil (Trust-Boost)', basic: '—',           plus: '✓' },
  ];

  return (
    <Section>
      <Container>
        <Reveal>
          <div className="mb-10 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Vergleich</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">Basic gratis · Käufer+-Abo</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Basic oder <KaeuferPlus />.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border border-stone rounded-card overflow-hidden bg-paper max-w-4xl">
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-stone">
              <div className="p-6"></div>
              <PlanHeader name="Basic" price="CHF 0" note="Unbefristet" />
              <PlanHeader name="Käufer+" price="CHF 199" note="/ Monat · CHF 1'990 / Jahr" highlight />
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
                <Cell highlight>{r.plus}</Cell>
              </div>
            ))}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-stone bg-cream/50">
              <div className="p-4"></div>
              <div className="p-4 border-l border-stone">
                <Button href="/auth/register?role=kaeufer&plan=basic" variant="secondary" size="sm" className="w-full justify-center">Gratis starten</Button>
              </div>
              <div className="p-4 border-l border-stone">
                <Button href="/auth/register?role=kaeufer&plan=max" size="sm" className="w-full justify-center">Käufer+ buchen</Button>
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
      title: 'Du hast ein klares Mandat und willst auch geschlossene Inserate sehen.',
      body: 'Käufer+ schaltet die Inserate frei, die nicht öffentlich sind — und mit deinem Logo im Käuferprofil erkennen Verkäufer dich sofort als ernsthaften Mandatsträger.',
    },
    {
      tag: 'Family Office · Holding',
      title: 'Du investierst privat oder fürs Family Office.',
      body: 'Frühzugang und Echtzeit-Alerts sorgen dafür, dass dir keine passende Übernahme-Gelegenheit durchrutscht. Wer als M&A-Broker mit eigener Marke und mehreren externen Klienten arbeitet, sollte sich die /broker-Seite ansehen — dafür gibt es das Broker-Abo.',
    },
  ];

  return (
    <Section className="bg-paper border-y border-stone">
      <Container>
        <Reveal>
          <div className="mb-12 max-w-prose">
            <p className="overline mb-5">Wann sich Käufer+ lohnt</p>
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
      a: 'Sobald ein Verkäufer ein Inserat veröffentlicht, ist es für Käufer+-Mitglieder sofort sichtbar. Basic-Käufer sehen das Inserat erst 7 Tage später. Diese Phase entscheidet bei beliebten Inseraten oft über die Anfrage-Reihenfolge.',
    },
    {
      q: 'Wo bekomme ich die Echtzeit-Alerts?',
      a: 'In jedem Käufer+-Abo enthalten: E-Mail-Benachrichtigungen innerhalb von Sekunden, sobald ein neues Inserat einem deiner Suchprofile entspricht. Basic-Käufer bekommen einen wöchentlichen Digest.',
    },
    {
      q: 'Kann ich Käufer+ jederzeit kündigen?',
      a: 'Ja. Im Monats-Abo (CHF 199 / Monat) jederzeit aufs nächste Monatsende. Beim Jahres-Abo (CHF 1\'990 / Jahr) endet der Vertrag automatisch nach 12 Monaten — keine stille Verlängerung.',
    },
    {
      q: 'Was kostet Käufer+ im Jahres-Abo gegenüber monatlich?',
      a: 'Monatlich: CHF 199 × 12 = CHF 2\'388. Jahres-Abo: CHF 1\'990. Du sparst zwei Monatsgebühren.',
    },
    {
      q: 'Bekomme ich nach Anfrage die Firmen-Details?',
      a: 'Sobald du eine Anfrage stellst und der Verkäufer dich freigibt, siehst du Firmenname, Detail-Dossier und ggf. den Datenraum mit weiteren Unterlagen. Mit Käufer+ wird deine Anfrage prioritär verarbeitet.',
    },
    {
      q: 'Was bringt das eigene Logo im Käuferprofil?',
      a: 'Mit Käufer+ kannst du dein Logo hochladen — dein Käuferprofil wird damit sofort professioneller wahrgenommen. Verkäufer erkennen seriöse Käufer schneller und schalten ihre Inserate bevorzugt frei.',
    },
    {
      q: 'Kann ich Basic erst testen und später upgraden?',
      a: 'Ja. Basic ist gratis und unbefristet. Du kannst jederzeit auf Käufer+ upgraden — ohne neue Registrierung, der Wechsel passiert direkt im Konto.',
    },
    {
      q: 'Ich bin Broker — soll ich Käufer+ buchen?',
      a: 'Käufer+ ist für persönliche Käufer (Family Offices, Investoren mit eigenem Mandat). Für M&A-Broker, die im Auftrag mehrerer externer Klienten arbeiten, bauen wir ein eigenes Broker-System mit separatem Login, Multi-Mandant-Dashboard und Provisionsabrechnung. Mehr dazu — und das Pilot-Programm — auf der /broker-Seite.',
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
              Zu Käufer+.
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
              Geschlossene Inserate, 7 Tage Frühzugang, Echtzeit-Alerts und Logo im Käuferprofil.
              Beim Jahres-Abo zwei Monate gratis.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/auth/register?role=kaeufer&plan=max" variant="bronze" size="lg">
                Käufer+ buchen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
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
