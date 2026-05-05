import Link from 'next/link';
import {
  ArrowRight, Search, Filter, ChevronDown,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { SiteHeader, SiteFooter } from '@/components/site/SiteShell';
import {
  countListings,
  getListings,
  type InseratPublic,
} from '@/lib/listings';
import { getBranchen, type Branche } from '@/lib/branchen';
import {
  EBITDA_BUCKETS,
  KANTON_CODES,
  KANTON_NAMES,
  MA_BUCKETS,
  PREIS_BUCKETS,
  UEBERGABE_GRUENDE,
  UMSATZ_BUCKETS,
} from '@/lib/constants';

/**
 * passare.ch — /boerse
 *
 * Die «Börse» ist die perfektionierte Marktplatz-Seite — eine eigene Route
 * für die offentlichen Inserate, mit klarer Identität (Hero «Börse.»),
 * Quick-Stats über dem Grid und einer Sticky-Reset-Bar wenn Filter aktiv.
 *
 * Inhalt 1:1 wie auf `/`, aber:
 * - eigener Hero (statt «Firmen entdecken»)
 * - Quick-Stats (Inserate · Branchen · Kantone) abgeleitet aus den Listings
 * - aktive-Filter-Bar mit «Alle zurücksetzen»
 * - Filter-Form `action="/boerse"` (statt `/`)
 *
 * ListingCard kommt aus `@/components/marketplace/ListingCard`. Nicht mehr
 * lokal duplizieren — sonst läuft die Karte aus dem Ruder.
 */

export const metadata = {
  title: 'Börse — passare.ch',
  description:
    'Aktuelle Schweizer KMU-Inserate. Filtern nach Branche, Kanton, Umsatz und EBITDA. Anonymer Teaser gratis sichtbar — Anfrage und Detail nach Freigabe durch den Verkäufer.',
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

export default async function BoersePage({
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

/* ════════════════════════ Hero ════════════════════════ */
function Hero({ totalCount, filteredCount }: { totalCount: number; filteredCount: number }) {
  return (
    <Section className="pt-12 md:pt-16 pb-10 md:pb-14">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-content">
          <div>
            <Reveal>
              <p className="overline mb-3 text-bronze-ink">Schweizer KMU-Marktplatz</p>
              <h1 className="font-serif-display text-[clamp(2rem,4vw,3.5rem)] text-navy font-light tracking-[-0.02em] leading-[1.08]">
                Börse<span className="text-bronze">.</span>
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
              </span>{' '}&middot;{' '}
              Der Schweizer Marktplatz für KMU-Nachfolge — direkt zwischen Käufer und Verkäufer.
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
  // Aktive-Filter-Anzahl (Stichwort-Filter zählt mit, leerer suche-String aber nicht)
  const activeFilters = countActiveFilters(searchParams);
  const isFiltered = activeFilters > 0;
  const hasAdvancedFilter =
    (!!searchParams.umsatz && searchParams.umsatz !== 'all') ||
    (!!searchParams.ebitda && searchParams.ebitda !== 'all') ||
    (!!searchParams.ma && searchParams.ma !== 'all') ||
    !!searchParams.gruende;

  // Quick-Stats — aus den (gefilterten) Listings ableiten
  const stats = computeStats(listings);

  return (
    <Section className="pt-0 md:pt-0 pb-24 md:pb-24">
      <Container>
        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar — als <form method="GET"> damit Filter über URL-Params gehen */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <form method="GET" action="/boerse" className="bg-paper border border-stone rounded-card p-5 space-y-5">
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
                      <option key={k} value={k}>{KANTON_NAMES[k]}</option>
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
                    href="/boerse"
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
            {/* Quick-Stats — nur anzeigen wenn überhaupt Inserate da sind */}
            {totalCount > 0 && listings.length > 0 && (
              <Reveal>
                <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6">
                  <QuickStat label="Inserate" value={listings.length} />
                  <QuickStat label="Branchen" value={stats.branchen} />
                  <QuickStat label="Kantone" value={stats.kantone} />
                </div>
              </Reveal>
            )}

            {/* Sticky Filter-Reset-Bar — nur wenn Filter aktiv */}
            {isFiltered && (
              <Reveal>
                <div className="sticky top-16 md:top-20 z-20 -mx-2 md:mx-0 mb-5 bg-cream/90 backdrop-blur-sm border border-stone rounded-soft px-4 py-2.5 flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-navy">
                    <span className="font-medium">{activeFilters}</span> {activeFilters === 1 ? 'Filter aktiv' : 'Filter aktiv'}
                  </p>
                  <Link
                    href="/boerse"
                    className="font-mono text-[11px] uppercase tracking-widest text-bronze hover:text-navy transition-colors"
                  >
                    Alle zurücksetzen
                  </Link>
                </div>
              </Reveal>
            )}

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
              <div className="grid md:grid-cols-2 gap-5 items-stretch">
                {listings.map((l, i) => (
                  <Reveal key={l.id} delay={i * 0.03} className="h-full">
                    <ListingCard listing={l} branchen={branchen} />
                  </Reveal>
                ))}
              </div>
            )}

            {totalCount > 0 && !isFiltered && (
              <Reveal delay={0.4}>
                <div className="mt-16 text-center p-10 border border-dashed border-stone rounded-card">
                  <p className="overline mb-3 text-bronze-ink">Weitere Inserate</p>
                  <h3 className="font-serif text-head-lg text-navy mb-3 font-normal">
                    Mit Käufer+ sehen Sie alles zuerst.
                  </h3>
                  <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
                    Neue Inserate sind 7 Tage lang nur für Käufer+ Mitglieder sichtbar,
                    bevor sie öffentlich werden. Plus geschlossene Inserate, Echtzeit-Alerts
                    und ein eigenes Logo im Käuferprofil.
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

/* ════════════════════════ QuickStat ════════════════════════ */
function QuickStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper border border-stone rounded-card px-4 py-3 md:px-5 md:py-4">
      <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-widest text-quiet mb-1">{label}</p>
      <p className="font-mono text-xl md:text-2xl text-navy tabular-nums">{value}</p>
    </div>
  );
}

/* ════════════════════════ Helpers ════════════════════════ */
function countActiveFilters(sp: SearchParams): number {
  let n = 0;
  if (sp.suche && sp.suche.trim() !== '') n++;
  if (sp.branche && sp.branche !== 'all') n++;
  if (sp.kanton && sp.kanton !== 'all') n++;
  if (sp.preis && sp.preis !== 'all') n++;
  if (sp.umsatz && sp.umsatz !== 'all') n++;
  if (sp.ebitda && sp.ebitda !== 'all') n++;
  if (sp.ma && sp.ma !== 'all') n++;
  if (sp.gruende && sp.gruende.split(',').filter(Boolean).length > 0) n++;
  return n;
}

function computeStats(listings: InseratPublic[]): { branchen: number; kantone: number } {
  const branchenSet = new Set<string>();
  const kantoneSet = new Set<string>();
  for (const l of listings) {
    if (l.branche_id) branchenSet.add(l.branche_id);
    if (l.kanton) kantoneSet.add(l.kanton);
  }
  return { branchen: branchenSet.size, kantone: kantoneSet.size };
}
