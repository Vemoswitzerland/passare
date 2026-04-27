import Link from 'next/link';
import {
  ArrowRight, Search, TrendingUp,
  FileLock2, Filter, Heart,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal } from '@/components/ui/reveal';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import { renderKeyFacts } from '@/lib/key-facts';

/**
 * passare.ch — Homepage = Plattform / Marktplatz
 *
 * Konzept (siehe Memory `project_passare_value_first_signup`):
 * Wer "firma kaufen" googelt, landet hier und sieht SOFORT die Inserate.
 * Filter, Anwählen, Anfragen — alles ohne Konto. Registrieren erst beim
 * tatsächlich-anfragen.
 */

export const metadata = {
  title: 'passare — Schweizer Marktplatz für KMU-Nachfolge',
  description:
    'Aktuelle Schweizer KMU-Inserate. Filtern nach Branche, Kanton, Umsatz und EBITDA. Anonymer Teaser gratis sichtbar, Detail-Dossier nach Anfrage und NDA.',
  robots: { index: false, follow: false },
};

const LISTINGS = [
  { id: 'dossier-247', titel: 'Spezialmaschinen für die Präzisionsindustrie', branche: 'Maschinenbau', kanton: 'ZH', jahr: 1987, mitarbeitende: 34, umsatz: 'CHF 8.4M', ebitda: '18.2%', kaufpreis: 'CHF 6–8M', grund: 'Altersnachfolge', status: 'featured' },
  { id: 'dossier-248', titel: 'Regionale Bäckerei mit Filialen', branche: 'Lebensmittel', kanton: 'BE', jahr: 1962, mitarbeitende: 18, umsatz: 'CHF 3.1M', ebitda: '12.5%', kaufpreis: 'VHB', grund: 'Altersnachfolge', status: 'neu' },
  { id: 'dossier-249', titel: 'IT-Dienstleister Cloud & Security', branche: 'IT & Technologie', kanton: 'ZG', jahr: 2009, mitarbeitende: 42, umsatz: 'CHF 12.1M', ebitda: '22.0%', kaufpreis: 'CHF 14–18M', grund: 'Strategischer Exit', status: 'live' },
  { id: 'dossier-250', titel: 'Treuhandkanzlei mit Immobilien-Spezialisierung', branche: 'Finanz / Versicherung', kanton: 'VD', jahr: 1998, mitarbeitende: 11, umsatz: 'CHF 2.4M', ebitda: '35.0%', kaufpreis: 'CHF 3–4M', grund: 'Pensionierung', status: 'nda' },
  { id: 'dossier-251', titel: 'Elektrotechnik & Automation Industrie', branche: 'Handel / Industrie', kanton: 'SG', jahr: 1975, mitarbeitende: 58, umsatz: 'CHF 16.8M', ebitda: '14.1%', kaufpreis: 'CHF 18–22M', grund: 'Nachfolge unklar', status: 'live' },
  { id: 'dossier-252', titel: 'Boutique-Hotel mit 30 Zimmern', branche: 'Gastgewerbe', kanton: 'GR', jahr: 1923, mitarbeitende: 22, umsatz: 'CHF 4.2M', ebitda: '16.5%', kaufpreis: 'CHF 8–10M', grund: 'Generationenwechsel', status: 'live' },
  { id: 'dossier-253', titel: 'Logistik-Unternehmen mit eigener Flotte', branche: 'Logistik', kanton: 'AG', jahr: 2001, mitarbeitende: 67, umsatz: 'CHF 22.5M', ebitda: '9.8%', kaufpreis: 'CHF 11–14M', grund: 'Strategisch', status: 'featured' },
  { id: 'dossier-254', titel: 'Online-Shop für Premium-Haushaltswaren', branche: 'Kleinhandel', kanton: 'LU', jahr: 2015, mitarbeitende: 8, umsatz: 'CHF 1.8M', ebitda: '24.0%', kaufpreis: 'CHF 2–3M', grund: 'Gründer-Exit', status: 'neu' },
  { id: 'dossier-255', titel: 'Medizintechnik mit eigener Entwicklung', branche: 'Gesundheit', kanton: 'BS', jahr: 1989, mitarbeitende: 29, umsatz: 'CHF 9.7M', ebitda: '19.8%', kaufpreis: 'VHB', grund: 'Private-Equity-Exit', status: 'live' },
];

const BRANCHEN = [
  'Alle Branchen', 'Autoindustrie', 'Ausbildung', 'Bauwesen', 'Beratung', 'Energie / Umwelt',
  'Finanz / Versicherung', 'Gastgewerbe', 'Gesundheit', 'Grafik / Design', 'Grosshandel',
  'Handel / Industrie', 'IT & Technologie', 'Immobilien', 'Kleinhandel', 'Landwirtschaft',
  'Lebensmittel', 'Logistik', 'Maschinenbau', 'Andere Dienstleistungen',
];

const KANTONE = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'];

const PREIS_BUCKETS = [
  'Alle', 'Bis CHF 250\'000', 'CHF 250\'000 – 500\'000', 'CHF 500\'000 – 1 Mio',
  'CHF 1 – 5 Mio', 'CHF 5 – 10 Mio', 'CHF 10 – 20 Mio', 'Über CHF 20 Mio',
];

const UMSATZ_BUCKETS = [
  'Alle', 'Bis CHF 1 Mio', 'CHF 1 – 5 Mio', 'CHF 5 – 15 Mio',
  'CHF 15 – 50 Mio', 'Über CHF 50 Mio',
];

const MA_BUCKETS = ['Alle', '0 – 10 MA', '10 – 20 MA', '20 – 50 MA', '50 – 100 MA', 'Über 100 MA'];

const GRUND = ['Altersnachfolge', 'Pensionierung', 'Strategisch', 'Private Equity', 'Andere'];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero />
      <Marketplace />
      <SiteFooter />
    </main>
  );
}

/* ════════════════════════ Header & Footer ════════════════════════ */
export function SiteHeader({ activeSell = false }: { activeSell?: boolean } = {}) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-cream/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="group flex items-center gap-3">
            <span className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </span>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest text-quiet border border-stone rounded-full px-2 py-0.5">
              beta
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-9">
            <Link
              href="/verkaufen"
              className={`text-[0.8125rem] font-medium transition-colors ${
                activeSell ? 'text-navy' : 'text-muted hover:text-ink'
              }`}
            >
              Firma verkaufen
            </Link>
            <Link href="/preise" className="text-[0.8125rem] font-medium text-muted hover:text-ink">
              Preise
            </Link>
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

export function SiteFooter() {
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
              <li><Link className="hover:text-navy" href="/verkaufen">Firma verkaufen</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Preise &amp; Käufer MAX</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Konto</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/auth/login">Anmelden</Link></li>
              <li><Link className="hover:text-navy" href="/auth/register">Registrieren</Link></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
          <div className="flex gap-6">
            <a href="mailto:info@passare.ch" className="hover:text-navy">info@passare.ch</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ════════════════════════ Hero ════════════════════════ */
function Hero() {
  return (
    <Section className="pt-8 md:pt-10 pb-4 md:pb-4">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-content">
          <div>
            <Reveal>
              <p className="overline mb-3 text-bronze-ink">Schweizer KMU-Marktplatz</p>
              <h1 className="font-serif-display text-[clamp(2rem,4vw,3.5rem)] text-navy font-light tracking-[-0.02em] leading-[1.08]">
                Firmen entdecken<span className="text-bronze">.</span>
              </h1>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="text-body-sm text-muted max-w-md leading-relaxed">
              <span className="font-mono text-[11px] uppercase tracking-widest text-navy">
                {LISTINGS.length} aktive Inserate
              </span> &middot;
              anonymer Teaser gratis sichtbar. Anfrage, NDA und Datenraum
              gehen erst nach kostenloser Anmeldung.
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Marketplace ════════════════════════ */
function Marketplace() {
  return (
    <Section className="pt-0 md:pt-0 pb-24 md:pb-24">
      <Container>
        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div className="bg-paper border border-stone rounded-card p-6 space-y-7">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-bronze" strokeWidth={1.5} />
                  <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">Filter</h2>
                </div>

                <div>
                  <label className="overline block mb-2">Stichwort</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
                    <input type="text" placeholder="z.B. Bäckerei" className="w-full bg-cream border border-stone rounded-soft pl-9 pr-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze" />
                  </div>
                </div>

                <div>
                  <label className="overline block mb-2">Branche</label>
                  <select className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze">
                    {BRANCHEN.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Kanton</label>
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {KANTONE.map((k) => (
                      <button key={k} type="button" className="font-mono text-[11px] py-1.5 rounded-soft text-muted hover:bg-navy hover:text-cream transition-colors">
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="overline block mb-2">Kaufpreis</label>
                  <select className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze">
                    {PREIS_BUCKETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Jahresumsatz</label>
                  <select className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze">
                    {UMSATZ_BUCKETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">EBITDA-Marge</label>
                  <select className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze">
                    <option>Alle</option>
                    <option>&gt; 5%</option>
                    <option>&gt; 10%</option>
                    <option>&gt; 15%</option>
                    <option>&gt; 20%</option>
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Mitarbeitende</label>
                  <select className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze">
                    {MA_BUCKETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Übergabegrund</label>
                  <div className="space-y-2">
                    {GRUND.map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-body-sm text-muted hover:text-ink">
                        <input type="checkbox" className="accent-bronze" />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone flex flex-col gap-2">
                  <Button size="sm" className="w-full justify-center">Filter anwenden</Button>
                  <button type="button" className="font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy">
                    zurücksetzen
                  </button>
                </div>

                {/* MAX-Upsell */}
                <div className="bg-navy text-cream rounded-soft p-4 -mx-2 mt-6">
                  <p className="overline text-bronze mb-2">Käufer MAX</p>
                  <p className="font-serif text-body text-cream mb-3 leading-snug">
                    7 Tage Frühzugang &amp; Echtzeit-Alerts
                  </p>
                  <Link href="/preise" className="font-mono text-[11px] uppercase tracking-widest text-bronze inline-flex items-center gap-1 hover:gap-2 transition-all">
                    MAX ansehen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </aside>

          {/* Grid */}
          <div>
            <Reveal>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone flex-wrap gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-quiet">
                  <span className="text-navy font-medium">{LISTINGS.length} Inserate</span> &middot; aktualisiert 27.04.2026
                </p>
                <div className="flex items-center gap-4">
                  <label className="overline text-quiet">Sortieren</label>
                  <select className="bg-transparent border border-stone rounded-soft px-3 py-1.5 text-body-sm focus:outline-none focus:border-bronze">
                    <option>Neueste zuerst</option>
                    <option>Preis aufsteigend</option>
                    <option>Preis absteigend</option>
                    <option>Umsatz absteigend</option>
                    <option>EBITDA absteigend</option>
                  </select>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="bg-bronze/5 border border-bronze/20 rounded-card px-5 py-4 mb-6 flex items-center gap-4 flex-wrap">
                <FileLock2 className="w-5 h-5 text-bronze flex-shrink-0" strokeWidth={1.5} />
                <p className="text-body-sm text-muted flex-1 min-w-[240px]">
                  <span className="text-navy font-medium">Teaser sind öffentlich.</span> Für Dossier-Anfrage, NDA-Signatur und Datenraum-Zugriff ist eine kostenlose Registrierung nötig.
                </p>
                <Link
                  href="/auth/register"
                  className="font-mono text-[11px] uppercase tracking-widest text-navy hover:text-bronze inline-flex items-center gap-1"
                >
                  Registrieren <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </Link>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {LISTINGS.map((l, i) => (
                <Reveal key={l.id} delay={i * 0.03}>
                  <ListingCard listing={l} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.4}>
              <div className="mt-16 text-center p-10 border border-dashed border-stone rounded-card">
                <p className="overline mb-3 text-bronze-ink">Weitere Inserate</p>
                <h3 className="font-serif text-head-lg text-navy mb-3 font-normal">
                  Mit Käufer MAX sehen Sie alles zuerst.
                </h3>
                <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
                  Neue Inserate sind 7 Tage lang nur für MAX-Mitglieder sichtbar,
                  bevor sie öffentlich werden. Plus: alle Filter, unbegrenzte Anfragen,
                  Echtzeit-Alerts.
                </p>
                <Button href="/preise" variant="secondary" size="md">
                  MAX ab CHF 199/Monat <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ ListingCard ════════════════════════ */
function ListingCard({ listing }: { listing: typeof LISTINGS[number] }) {
  const statusColor =
    listing.status === 'featured' ? 'bg-bronze/90 text-cream'
    : listing.status === 'neu' ? 'bg-success/90 text-cream'
    : listing.status === 'nda' ? 'bg-navy/90 text-cream'
    : 'bg-paper/90 text-navy';

  const statusLabel =
    listing.status === 'featured' ? 'Featured'
    : listing.status === 'neu' ? 'Neu'
    : listing.status === 'nda' ? 'NDA-Prozess'
    : 'Live';

  const cover = branchenStockfoto(listing.branche, listing.id);
  const facts = renderKeyFacts(listing);

  return (
    <article className="group bg-paper border border-stone rounded-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all duration-300 flex flex-col">
      {/* ─── Cover ─── */}
      <div className="relative h-44 md:h-48 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-110"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.55) saturate(1.1)',
            transform: 'scale(1.15)',
          }}
        />
        {/* Verlauf für bessere Lesbarkeit unten */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

        <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest text-cream/85 backdrop-blur-sm bg-navy/40 px-2 py-1 rounded-full">
          {listing.id}
        </span>
        <span className={`absolute top-3 right-3 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${statusColor}`}>
          {statusLabel}
        </span>

        <div className="absolute bottom-4 left-5 right-5 z-[1]">
          <p className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.16em] text-bronze font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {listing.branche} · Kanton {listing.kanton}
          </p>
          <p className="font-mono text-[13px] md:text-[14px] tracking-wider text-cream mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {facts}
          </p>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-serif text-head-md text-navy leading-tight font-normal mb-5 min-h-[3.9rem]">
          {listing.titel}<span className="text-bronze">.</span>
        </h3>

        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-stone mb-5">
          <div>
            <p className="overline mb-1">Umsatz</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium">{listing.umsatz}</p>
          </div>
          <div>
            <p className="overline mb-1">EBITDA</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium">{listing.ebitda}</p>
          </div>
          <div>
            <p className="overline mb-1">Preis</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium">{listing.kaufpreis}</p>
          </div>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mb-5">
          <TrendingUp className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
          {listing.grund}
        </p>

        <div className="mt-auto flex items-center gap-3">
          <Button href="/auth/register" size="sm" className="flex-1 justify-center">
            <FileLock2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Dossier anfragen
          </Button>
          <button
            type="button"
            className="px-3 py-2 border border-stone rounded-soft text-muted hover:border-bronze hover:text-bronze transition-colors"
            aria-label="Favorit"
          >
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
