import Link from 'next/link';
import {
  ArrowRight, Search, TrendingUp,
  Filter, Eye, LayoutDashboard, ChevronDown,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Reveal } from '@/components/ui/reveal';
import { CardActions } from '@/components/marketplace/CardActions';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import { renderKeyFacts } from '@/lib/key-facts';
import {
  countListings,
  formatEbitda,
  formatKaufpreis,
  formatUmsatz,
  getListings,
  type InseratPublic,
} from '@/lib/listings';
import { getBranchen, type Branche } from '@/lib/branchen';
import {
  EBITDA_BUCKETS,
  KANTON_CODES,
  MA_BUCKETS,
  PREIS_BUCKETS,
  UEBERGABE_GRUENDE,
  UMSATZ_BUCKETS,
  uebergabeGrundLabel,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

/**
 * passare.ch — Homepage = Plattform / Marktplatz
 *
 * Konzept (siehe Memory `project_passare_value_first_signup`):
 * Wer "firma kaufen" googelt, landet hier und sieht SOFORT die Inserate.
 * Filter, Anwählen, Anfragen — alles ohne Konto. Registrieren erst beim
 * tatsächlich-anfragen.
 *
 * Stand 2026-04-29: Inserate kommen aus der echten DB (`inserate_public` VIEW).
 * Bei leerer DB rendert `<MarketplaceEmpty />` mit Onboarding-CTAs.
 */

export const metadata = {
  title: 'passare — Schweizer Marktplatz für KMU-Nachfolge',
  description:
    'Aktuelle Schweizer KMU-Inserate. Filtern nach Branche, Kanton, Umsatz und EBITDA. Anonymer Teaser gratis sichtbar, Detail-Dossier nach Anfrage und Freigabe durch den Verkäufer.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = {
  branche?: string;
  kanton?: string;
  preis?: string;
  umsatz?: string;
  ebitda?: string;
  ma?: string;
  gruende?: string;
  suche?: string;
  sort?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFiltersFromSearchParams(sp);

  const [listings, totalCount, branchen] = await Promise.all([
    getListings(filters),
    countListings(),
    getBranchen(),
  ]);

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero totalCount={totalCount} filteredCount={listings.length} />
      <Marketplace
        listings={listings}
        totalCount={totalCount}
        branchen={branchen}
        searchParams={sp}
      />
      <SiteFooter />
    </main>
  );
}

/* ════════════════════════ Filter-Mapping ════════════════════════ */
function parseFiltersFromSearchParams(sp: SearchParams) {
  const preisBucket = PREIS_BUCKETS.find((b) => b.id === sp.preis);
  const umsatzBucket = UMSATZ_BUCKETS.find((b) => b.id === sp.umsatz);
  const maBucket = MA_BUCKETS.find((b) => b.id === sp.ma);
  const ebitdaBucket = EBITDA_BUCKETS.find((b) => b.id === sp.ebitda);
  const gruende = sp.gruende?.split(',').filter(Boolean);

  return {
    branche: sp.branche && sp.branche !== 'all' ? sp.branche : undefined,
    kanton: sp.kanton && sp.kanton !== 'all' ? sp.kanton : undefined,
    preis_min: preisBucket && 'min' in preisBucket ? preisBucket.min : undefined,
    preis_max: preisBucket && 'max' in preisBucket ? preisBucket.max : undefined,
    umsatz_min: umsatzBucket && 'min' in umsatzBucket ? umsatzBucket.min : undefined,
    umsatz_max: umsatzBucket && 'max' in umsatzBucket ? umsatzBucket.max : undefined,
    ebitda_min: ebitdaBucket && 'min' in ebitdaBucket ? ebitdaBucket.min : undefined,
    ma_min: maBucket && 'min' in maBucket ? maBucket.min : undefined,
    ma_max: maBucket && 'max' in maBucket ? maBucket.max : undefined,
    gruende: gruende && gruende.length > 0 ? gruende : undefined,
    suche: sp.suche?.trim() || undefined,
    sort: (sp.sort as 'neu' | 'preis_asc' | 'preis_desc' | 'umsatz_desc' | 'ebitda_desc' | undefined) ?? 'neu',
  } as const;
}

/* ════════════════════════ Header & Footer ════════════════════════ */
export async function SiteHeader({ activeSell = false }: { activeSell?: boolean } = {}) {
  // Konsistente Hauptnav über alle Seiten: «Firma inserieren», «Broker»,
  // «Käufer+». Auf /verkaufen + /preise wird «Firma inserieren» nur als
  // aktiv hervorgehoben (activeSell=true), die Menüpunkte selber bleiben gleich.
  // «Inserat-Preise» ist nicht im Hauptmenü — über die Pakete-Sektion auf
  // /verkaufen erreichbar (Detailvergleich → /preise).
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  let dashboardHref: string | null = null;
  if (u.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle')
      .eq('id', u.user.id)
      .maybeSingle();
    dashboardHref =
      profile?.rolle === 'verkaeufer' ? '/dashboard/verkaeufer'
      : profile?.rolle === 'admin' ? '/admin'
      : '/dashboard/kaeufer';
  }

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
              Firma inserieren
            </Link>
            <Link href="/broker" className="text-[0.8125rem] font-medium text-muted hover:text-ink">
              Broker
            </Link>
            <Link
              href="/plus"
              className="text-[0.8125rem] font-medium text-muted hover:text-ink inline-flex items-baseline"
            >
              Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {dashboardHref ? (
              <Button href={dashboardHref} size="sm" className="hidden md:inline-flex">
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.5} />
                Mein Bereich
              </Button>
            ) : (
              <>
                <Button href="/auth/login" size="sm" variant="ghost" className="hidden md:inline-flex">
                  Anmelden
                </Button>
                <Button
                  href={activeSell ? '/verkaufen/start' : '/auth/register'}
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  {activeSell ? 'Bewerten & inserieren' : 'Registrieren'}
                </Button>
              </>
            )}
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
function Hero({ totalCount, filteredCount }: { totalCount: number; filteredCount: number }) {
  const sub =
    totalCount === 0
      ? 'noch keine öffentlichen Inserate. Sei der/die Erste auf der Plattform.'
      : 'anonymer Teaser gratis sichtbar. Anfrage und Datenraum-Zugang gehen erst nach kostenloser Anmeldung und Freigabe durch den Verkäufer.';

  return (
    <Section className="pt-12 md:pt-16 pb-10 md:pb-14">
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
                {totalCount === 0
                  ? 'Marktplatz im Aufbau'
                  : `${filteredCount} ${filteredCount === 1 ? 'Inserat' : 'Inserate'}${
                      filteredCount !== totalCount ? ` von ${totalCount}` : ''
                    }`}
              </span> &middot;{' '}
              {sub}
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ Marketplace ════════════════════════ */
function Marketplace({
  listings,
  totalCount,
  branchen,
  searchParams,
}: {
  listings: InseratPublic[];
  totalCount: number;
  branchen: Branche[];
  searchParams: SearchParams;
}) {
  const isFiltered = Object.values(searchParams).some((v) => v && v !== 'all');
  const hasAdvancedFilter =
    (!!searchParams.umsatz && searchParams.umsatz !== 'all') ||
    (!!searchParams.ebitda && searchParams.ebitda !== 'all') ||
    (!!searchParams.ma && searchParams.ma !== 'all') ||
    !!searchParams.gruende;

  return (
    <Section className="pt-0 md:pt-0 pb-24 md:pb-24">
      <Container>
        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar — als <form method="GET"> damit Filter über URL-Params gehen */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <form method="GET" action="/" className="bg-paper border border-stone rounded-card p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-bronze" strokeWidth={1.5} />
                  <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">Filter</h2>
                </div>

                <div>
                  <label htmlFor="suche" className="overline block mb-2">Stichwort</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
                    <input
                      id="suche"
                      name="suche"
                      type="text"
                      defaultValue={searchParams.suche ?? ''}
                      placeholder="z.B. Bäckerei"
                      className="w-full bg-cream border border-stone rounded-soft pl-9 pr-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="branche" className="overline block mb-2">Branche</label>
                  <select
                    id="branche"
                    name="branche"
                    defaultValue={searchParams.branche ?? 'all'}
                    className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                  >
                    <option value="all">Alle Branchen</option>
                    {branchen.map((b) => (
                      <option key={b.id} value={b.id}>{b.label_de}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Kanton</label>
                  <select
                    name="kanton"
                    defaultValue={searchParams.kanton ?? 'all'}
                    className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                  >
                    <option value="all">Alle Kantone</option>
                    {KANTON_CODES.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="overline block mb-2">Kaufpreis</label>
                  <select
                    name="preis"
                    defaultValue={searchParams.preis ?? 'all'}
                    className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                  >
                    {PREIS_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>

                <details open={hasAdvancedFilter} className="group border-t border-stone -mx-5 px-5 pt-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none select-none text-quiet hover:text-navy transition-colors [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-[11px] uppercase tracking-widest">Mehr Filter</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" strokeWidth={1.5} />
                  </summary>
                  <div className="space-y-5 mt-5">
                    <div>
                      <label className="overline block mb-2">Jahresumsatz</label>
                      <select
                        name="umsatz"
                        defaultValue={searchParams.umsatz ?? 'all'}
                        className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                      >
                        {UMSATZ_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="overline block mb-2">EBITDA-Marge</label>
                      <select
                        name="ebitda"
                        defaultValue={searchParams.ebitda ?? 'all'}
                        className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                      >
                        {EBITDA_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="overline block mb-2">Mitarbeitende</label>
                      <select
                        name="ma"
                        defaultValue={searchParams.ma ?? 'all'}
                        className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze"
                      >
                        {MA_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="overline block mb-2">Übergabegrund</label>
                      <div className="space-y-2">
                        {UEBERGABE_GRUENDE.map((g) => {
                          const checked = searchParams.gruende?.split(',').includes(g.id) ?? false;
                          return (
                            <label key={g.id} className="flex items-center gap-2 cursor-pointer text-body-sm text-muted hover:text-ink">
                              <input type="checkbox" name="gruende" value={g.id} defaultChecked={checked} className="accent-bronze" />
                              {g.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>

                <input type="hidden" name="sort" value={searchParams.sort ?? 'neu'} />

                <div className="pt-4 border-t border-stone flex flex-col gap-2">
                  <Button size="sm" className="w-full justify-center">Filter anwenden</Button>
                  <Link
                    href="/"
                    className="font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy text-center"
                  >
                    zurücksetzen
                  </Link>
                </div>

                {/* Plus-Upsell — eigene Käufer-Vorteile-Seite */}
                <div className="bg-navy text-cream rounded-soft p-4 -mx-2 mt-6">
                  <p className="overline text-bronze mb-2 inline-flex items-baseline">
                    Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
                  </p>
                  <p className="font-serif text-body text-cream mb-3 leading-snug">
                    7 Tage Frühzugang &amp; Echtzeit-Alerts
                  </p>
                  <Link href="/plus" className="font-mono text-[11px] uppercase tracking-widest text-bronze inline-flex items-center gap-1 hover:gap-2 transition-all">
                    Käufer+ ansehen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </Link>
                </div>
              </form>
            </Reveal>
          </aside>

          {/* Grid */}
          <div>
            <Reveal>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone flex-wrap gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-quiet">
                  {totalCount === 0 ? (
                    <span className="text-navy font-medium">Marktplatz im Aufbau</span>
                  ) : (
                    <>
                      <span className="text-navy font-medium">
                        {listings.length} {listings.length === 1 ? 'Inserat' : 'Inserate'}
                      </span>
                      {' '}&middot; aktualisiert {new Date().toLocaleDateString('de-CH')}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-4">
                  <label className="overline text-quiet">Sortieren</label>
                  <SortSelect defaultValue={searchParams.sort ?? 'neu'} />
                </div>
              </div>
            </Reveal>

            {totalCount === 0 ? (
              <MarketplaceEmpty variant="marktplatz" />
            ) : listings.length === 0 ? (
              <MarketplaceEmpty
                variant="marktplatz"
                headline="Keine Inserate für diese Filter-Kombination"
                beschreibung="Probiere andere Filter aus oder lege ein Suchprofil an — wir benachrichtigen dich, sobald ein passendes Inserat reinkommt."
              />
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-5">
                  {listings.map((l, i) => (
                    <Reveal key={l.id} delay={i * 0.03}>
                      <ListingCard listing={l} branchen={branchen} />
                    </Reveal>
                  ))}
                </div>
              </>
            )}

            {totalCount > 0 && !isFiltered && (
              <Reveal delay={0.4}>
                <div className="mt-16 text-center p-10 border border-dashed border-stone rounded-card">
                  <p className="overline mb-3 text-bronze-ink">Weitere Inserate</p>
                  <h3 className="font-serif text-head-lg text-navy mb-3 font-normal">
                    Mit Käufer+ sehen Sie alles zuerst.
                  </h3>
                  <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
                    Neue Inserate sind 7 Tage lang nur für Käufer+-Mitglieder sichtbar,
                    bevor sie öffentlich werden. Plus alle Filter, unbegrenzte Anfragen,
                    Echtzeit-Alerts.
                  </p>
                  <Button href="/plus" variant="secondary" size="md">
                    Käufer+ ab CHF 199/Monat <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ ListingCard ════════════════════════ */
function ListingCard({ listing, branchen }: { listing: InseratPublic; branchen: Branche[] }) {
  // Status-Ableitung
  const now = Date.now();
  const isFeatured = listing.featured_until && new Date(listing.featured_until).getTime() > now;
  const ageDays = (now - new Date(listing.published_at).getTime()) / (24 * 60 * 60 * 1000);
  const status: 'featured' | 'neu' | 'live' = isFeatured ? 'featured' : ageDays < 14 ? 'neu' : 'live';

  const statusColor =
    status === 'featured' ? 'bg-bronze/90 text-cream'
    : status === 'neu' ? 'bg-success/90 text-cream'
    : 'bg-paper/90 text-navy';

  const statusLabel =
    status === 'featured' ? 'Featured'
    : status === 'neu' ? 'Neu'
    : 'Live';

  const brancheObj = branchen.find((b) => b.id === listing.branche_id);
  const brancheLabel = brancheObj?.label_de ?? listing.branche_id ?? '—';

  const cover = branchenStockfoto(listing.branche_id ?? brancheLabel, listing.id);

  // EBITDA-Marge ableiten falls null aber chf-Werte vorhanden
  let margePct = listing.ebitda_marge_pct;
  if (margePct == null && listing.ebitda_chf && listing.umsatz_chf && listing.umsatz_chf > 0) {
    margePct = (Number(listing.ebitda_chf) / Number(listing.umsatz_chf)) * 100;
  }

  // KeyFacts arbeiten mit Display-Strings — echte Werte bevorzugen
  const umsatzStr = formatUmsatz({
    umsatz_chf: listing.umsatz_chf,
    umsatz_bucket: listing.umsatz_bucket,
  });
  const ebitdaStr = formatEbitda(margePct);
  const kaufpreisStr = formatKaufpreis({
    kaufpreis_chf: listing.kaufpreis_chf,
    kaufpreis_min_chf: listing.kaufpreis_min_chf,
    kaufpreis_max_chf: listing.kaufpreis_max_chf,
    kaufpreis_bucket: listing.kaufpreis_bucket,
    kaufpreis_vhb: listing.kaufpreis_vhb,
  });
  const facts = renderKeyFacts({
    jahr: listing.jahr ?? new Date().getFullYear(),
    mitarbeitende: listing.mitarbeitende ?? 0,
    umsatz: umsatzStr,
    ebitda: ebitdaStr,
  });

  // Public-ID für Anzeige (z.B. "DOS-001234"). Wenn slug existiert: nutzen, sonst kurz-id
  const displayId = listing.slug ?? listing.id.slice(0, 8);
  const detailHref = `/inserat/${listing.slug ?? listing.id}`;

  return (
    <article className="group relative bg-paper border border-stone rounded-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lift hover:border-bronze/40 transition-all duration-300 flex flex-col cursor-pointer">
      <Link
        href={detailHref}
        className="absolute inset-0 z-[1]"
        aria-label={`Inserat ${listing.titel} ansehen`}
      />

      {/* ─── Cover ─── */}
      <div className="relative h-44 md:h-48 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-110"
          style={{
            backgroundImage: `url(${listing.cover_url ?? cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.55) saturate(1.1)',
            transform: 'scale(1.15)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

        <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest text-cream/85 backdrop-blur-sm bg-navy/40 px-2 py-1 rounded-full">
          {displayId}
        </span>
        <span className={`absolute top-3 right-3 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${statusColor}`}>
          {statusLabel}
        </span>

        <div className="absolute bottom-4 left-5 right-5 z-[1]">
          <p className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.16em] text-bronze font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {brancheLabel} · Kanton {listing.kanton ?? '—'}
          </p>
          <p className="font-mono text-[13px] md:text-[14px] tracking-wider text-cream mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {facts}
          </p>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="p-6 flex flex-col flex-1">
        <h3
          lang="de"
          className="font-serif text-head-md text-navy leading-tight font-normal mb-5 h-[3.9rem] hyphens-auto break-words line-clamp-2 group-hover:text-bronze-ink transition-colors"
        >
          {listing.titel}<span className="text-bronze">.</span>
        </h3>

        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-stone mb-5">
          <div className="min-w-0">
            <p className="overline mb-1">Umsatz</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{umsatzStr}</p>
          </div>
          <div className="min-w-0">
            <p className="overline mb-1">EBITDA</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{ebitdaStr}</p>
          </div>
          <div className="min-w-0">
            <p className="overline mb-1">Preis</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{kaufpreisStr}</p>
          </div>
        </div>

        {listing.uebergabe_grund && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mb-5">
            <TrendingUp className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
            {uebergabeGrundLabel(listing.uebergabe_grund)}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 relative z-10">
          <Button
            href={detailHref}
            size="sm"
            className="flex-1 justify-center"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            Details
          </Button>
          <CardActions
            listingId={listing.id}
            titel={listing.titel}
            branche={brancheLabel}
            kanton={listing.kanton ?? '—'}
            umsatz={umsatzStr}
          />
        </div>
      </div>
    </article>
  );
}
