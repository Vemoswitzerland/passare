/**
 * passare.ch — Zentrale DB-Helper für Inserate (Marktplatz, Detail, Käufer-Sicht)
 *
 * Ersetzt das gelöschte Mock-File. Alle Stellen die früher aus einem
 * statischen Demo-Pool lasen, rufen jetzt diese Funktionen auf.
 *
 * Quellen:
 *   - `inserate_public` VIEW (anon-readable, status='live') → für Marktplatz-Cards
 *   - `inserate` Tabelle direkt (mit RLS-Policy `ins_public_read_live`) → für Detail
 *   - `favoriten`, `suchprofile` → für Käufer-Dashboard
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  formatEbitda,
  formatKaufpreis,
  formatMitarbeitende,
  formatUmsatz,
} from '@/lib/format-listing';
import type { SortOption } from '@/lib/constants';

// Re-export für Backward-Compatibility — bestehende Imports funktionieren weiter,
// aber Client-Components sollten direkt aus `@/lib/format-listing` importieren.
export { formatEbitda, formatKaufpreis, formatMitarbeitende, formatUmsatz };

/* ──────────────────────────────────────────────────────────────────────
 * TYPES — was die UI sieht (gemappt aus DB-Rows)
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Marktplatz-Card-Shape: kommt aus `inserate_public` VIEW.
 * Enthält bewusst KEINE numerischen Sensitiv-Daten — nur die Bucket-Strings,
 * damit die anon-View nicht versehentlich umsatz_chf etc. preisgibt.
 */
export type InseratPublic = {
  id: string;
  slug: string | null;
  titel: string;
  teaser: string | null;
  branche_id: string | null;
  kanton: string | null;
  region: string | null;
  jahr: number | null;
  mitarbeitende_bucket: string | null;
  umsatz_bucket: string | null;
  ebitda_marge_pct: number | null;
  kaufpreis_bucket: string | null;
  kaufpreis_vhb: boolean;
  uebergabe_grund: string | null;
  cover_url: string | null;
  sales_points: string[];
  paket: string | null;
  featured_until: string | null;
  published_at: string;
  views: number;
};

/**
 * Detail-Shape: zusätzliche Felder für die Inserat-Detail-Seite.
 * Liest direkt aus `inserate` Tabelle (Public-Read-Policy auf status='live').
 */
export type InseratDetail = InseratPublic & {
  beschreibung: string | null;
  mitarbeitende: number | null;
  umsatz_chf: number | null;
  ebitda_chf: number | null;
  kaufpreis_chf: number | null;
  kaufpreis_min_chf: number | null;
  kaufpreis_max_chf: number | null;
  eigenkapital_chf: number | null;
  uebergabe_zeitpunkt: string | null;
  art: string;
  kategorie: string;
  immobilien: string | null;
  finanzierung: string | null;
  wir_anteil_moeglich: boolean;
  rechtsform_typ: string | null;
  firma_name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  /** Verkäufer-ID (für Anfrage-Routing). NICHT öffentlich anzeigen. */
  owner_id: string;
};

/* ──────────────────────────────────────────────────────────────────────
 * QUERIES
 * ────────────────────────────────────────────────────────────────────── */

export type ListingFilters = {
  branche?: string;
  kanton?: string;
  /** kaufpreis_chf untere Grenze (in CHF) */
  preis_min?: number;
  preis_max?: number;
  umsatz_min?: number;
  umsatz_max?: number;
  ebitda_min?: number;     // EBITDA-Marge in %
  ma_min?: number;
  ma_max?: number;
  /** uebergabe_grund Liste — Inserat matcht wenn einer drin ist */
  gruende?: string[];
  /** Volltext-Suche in titel + teaser */
  suche?: string;
  sort?: SortOption;
  /** Frühzugang-Filter: Wenn true, nur Inserate die seit > 7 Tagen live sind. */
  fruehzugang_gesperrt?: boolean;
  limit?: number;
};

/**
 * Lädt alle live-Inserate aus `inserate_public` mit optionalen Filtern.
 * Liefert leeres Array bei leerer DB oder Fehler — niemals throw.
 */
export async function getListings(filters: ListingFilters = {}): Promise<InseratPublic[]> {
  const supabase = await createClient();
  let q = supabase.from('inserate_public').select('*');

  if (filters.branche && filters.branche !== 'all') {
    q = q.eq('branche_id', filters.branche);
  }
  if (filters.kanton && filters.kanton !== 'all') {
    q = q.eq('kanton', filters.kanton.toUpperCase());
  }
  if (filters.gruende && filters.gruende.length > 0) {
    q = q.in('uebergabe_grund', filters.gruende);
  }
  if (filters.ebitda_min != null) {
    q = q.gte('ebitda_marge_pct', filters.ebitda_min);
  }
  if (filters.fruehzugang_gesperrt) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    q = q.lt('published_at', cutoff);
  }
  if (filters.suche && filters.suche.trim().length > 0) {
    const term = filters.suche.trim();
    q = q.or(`titel.ilike.%${term}%,teaser.ilike.%${term}%`);
  }

  // Sortierung: Featured zuerst, dann nach gewählter Sortierung
  switch (filters.sort) {
    case 'preis_asc':
      // kaufpreis_bucket ist String — sortiere alphabetisch (besser als nichts)
      q = q.order('kaufpreis_bucket', { ascending: true, nullsFirst: false });
      break;
    case 'preis_desc':
      q = q.order('kaufpreis_bucket', { ascending: false, nullsFirst: false });
      break;
    case 'umsatz_desc':
      q = q.order('umsatz_bucket', { ascending: false, nullsFirst: false });
      break;
    case 'ebitda_desc':
      q = q.order('ebitda_marge_pct', { ascending: false, nullsFirst: false });
      break;
    case 'neu':
    default:
      q = q.order('published_at', { ascending: false });
      break;
  }

  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) {
    console.error('[listings] getListings failed:', error.message);
    return [];
  }

  // Featured-First: Inserate mit aktivem featured_until vorne
  const now = Date.now();
  const rows = (data ?? []) as InseratPublic[];
  return rows.sort((a, b) => {
    const aF = a.featured_until ? new Date(a.featured_until).getTime() > now : false;
    const bF = b.featured_until ? new Date(b.featured_until).getTime() > now : false;
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return 0;
  });
}

/**
 * Zählt live-Inserate mit Filtern (für Hero-Counter).
 */
export async function countListings(filters: ListingFilters = {}): Promise<number> {
  const supabase = await createClient();
  let q = supabase.from('inserate_public').select('id', { count: 'exact', head: true });

  if (filters.branche && filters.branche !== 'all') q = q.eq('branche_id', filters.branche);
  if (filters.kanton && filters.kanton !== 'all') q = q.eq('kanton', filters.kanton.toUpperCase());
  if (filters.gruende?.length) q = q.in('uebergabe_grund', filters.gruende);
  if (filters.ebitda_min != null) q = q.gte('ebitda_marge_pct', filters.ebitda_min);
  if (filters.fruehzugang_gesperrt) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    q = q.lt('published_at', cutoff);
  }

  const { count, error } = await q;
  if (error) {
    console.error('[listings] countListings failed:', error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Lädt ein einzelnes Inserat per ID oder slug.
 * Liefert null wenn nicht gefunden ODER nicht live (RLS verbirgt entwurf etc.).
 */
export const getListingById = cache(async (idOrSlug: string): Promise<InseratDetail | null> => {
  const supabase = await createClient();

  // UUID-Format? → per id, sonst per slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const filter = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

  const { data, error } = await supabase
    .from('inserate')
    .select(
      `id, slug, titel, teaser, beschreibung, branche_id, kanton, region, jahr,
       mitarbeitende, mitarbeitende_bucket, umsatz_chf, umsatz_bucket,
       ebitda_chf, ebitda_marge_pct, kaufpreis_chf, kaufpreis_bucket, kaufpreis_vhb,
       kaufpreis_min_chf, kaufpreis_max_chf, eigenkapital_chf,
       uebergabe_grund, uebergabe_zeitpunkt, cover_url, sales_points, paket,
       featured_until, published_at, views, art, kategorie, immobilien, finanzierung,
       wir_anteil_moeglich, rechtsform_typ, firma_name,
       website_url, linkedin_url, twitter_url, facebook_url, owner_id, status`,
    )
    .match(filter)
    .eq('status', 'live')
    .maybeSingle();

  if (error) {
    console.error('[listings] getListingById failed:', error.message);
    return null;
  }
  if (!data) return null;
  // Strip status für UI-Type
  const { status: _status, ...rest } = data as InseratDetail & { status: string };
  return rest as InseratDetail;
});

/**
 * Lädt mehrere Inserate per ID (für Favoriten-Liste).
 * Returns Map<id, InseratPublic> für O(1)-Lookup.
 */
export async function getListingsByIds(ids: string[]): Promise<Map<string, InseratPublic>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inserate_public')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('[listings] getListingsByIds failed:', error.message);
    return new Map();
  }
  return new Map((data ?? []).map((row) => [row.id, row as InseratPublic]));
}

/**
 * Daily-Digest für einen Käufer: top-3 Inserate, neuester first.
 * Wenn der Käufer aktive Suchprofile hat, werden die Branche/Kanton-Vorlieben
 * berücksichtigt. Sonst: einfach die 3 neuesten.
 */
export async function getDailyDigest(kaeuferId: string, limit = 3): Promise<InseratPublic[]> {
  const supabase = await createClient();

  // Aktives Suchprofil holen (max 1, das erste nicht-pausierte)
  const { data: profile } = await supabase
    .from('suchprofile')
    .select('branche, kantone')
    .eq('kaeufer_id', kaeuferId)
    .eq('ist_pausiert', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const filters: ListingFilters = {
    sort: 'neu',
    limit,
  };

  // Wenn Suchprofil existiert: erste Branche / ersten Kanton als Filter (best-effort)
  if (profile && Array.isArray(profile.branche) && profile.branche.length > 0) {
    filters.branche = profile.branche[0];
  }
  if (profile && Array.isArray(profile.kantone) && profile.kantone.length > 0 && profile.kantone[0] !== 'CH') {
    filters.kanton = profile.kantone[0];
  }

  const matches = await getListings(filters);
  if (matches.length >= limit) return matches;

  // Auffüllen mit den neuesten Listings ohne Filter
  if (matches.length === 0) return getListings({ sort: 'neu', limit });
  const fillCount = limit - matches.length;
  const fillers = await getListings({ sort: 'neu', limit: limit + fillCount });
  const seenIds = new Set(matches.map((m) => m.id));
  const additional = fillers.filter((f) => !seenIds.has(f.id)).slice(0, fillCount);
  return [...matches, ...additional];
}

/**
 * Favoriten eines Käufers — joined mit den Inserat-Daten.
 * Returnt Map<inserat_id, listing> für die UI um pro Favorit das Listing zu ziehen.
 */
export async function getFavoritenListings(kaeuferId: string): Promise<{
  favoriten: Array<{ inserat_id: string; stage: string; note: string | null; tags: string[]; created_at: string }>;
  listings: Map<string, InseratPublic>;
}> {
  const supabase = await createClient();
  const { data: favs, error } = await supabase
    .from('favoriten')
    .select('inserat_id, stage, note, tags, created_at')
    .eq('kaeufer_id', kaeuferId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listings] getFavoritenListings failed:', error.message);
    return { favoriten: [], listings: new Map() };
  }

  const favoriten = (favs ?? []) as Array<{
    inserat_id: string;
    stage: string;
    note: string | null;
    tags: string[];
    created_at: string;
  }>;
  const ids = favoriten.map((f) => f.inserat_id);
  const listings = await getListingsByIds(ids);
  return { favoriten, listings };
}

/* ──────────────────────────────────────────────────────────────────────
 * BACK-COMPAT-Helper — temporäre Adapter für alten String-Code
 * Geben dem `match-score.ts` und `key-facts.ts` weiterhin Strings.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Map InseratPublic → Display-Listing-Shape (mit String-Werten).
 * Wird benötigt während `match-score.ts` und `key-facts.ts` noch String-basiert
 * sind (kommt in Block 4 vollständig auf numerische DB-Werte).
 */
export function toDisplayListing(l: InseratPublic | InseratDetail) {
  const detail = l as Partial<InseratDetail>;
  return {
    id: l.id,
    titel: l.titel,
    branche: l.branche_id ?? '—',
    kanton: l.kanton ?? '—',
    jahr: l.jahr ?? new Date().getFullYear(),
    mitarbeitende:
      typeof detail.mitarbeitende === 'number' ? detail.mitarbeitende : 0,
    umsatz: formatUmsatz({ umsatz_chf: detail.umsatz_chf, umsatz_bucket: l.umsatz_bucket }),
    ebitda: formatEbitda(l.ebitda_marge_pct),
    kaufpreis: formatKaufpreis({
      kaufpreis_chf: detail.kaufpreis_chf,
      kaufpreis_min_chf: detail.kaufpreis_min_chf,
      kaufpreis_max_chf: detail.kaufpreis_max_chf,
      kaufpreis_bucket: l.kaufpreis_bucket,
      kaufpreis_vhb: l.kaufpreis_vhb,
    }),
    grund: l.uebergabe_grund ?? '—',
    status: deriveStatus(l),
  } as const;
}

/** Leitet UI-Status ab: featured > nda > neu > live */
function deriveStatus(l: InseratPublic): 'featured' | 'neu' | 'nda' | 'live' {
  const now = Date.now();
  if (l.featured_until && new Date(l.featured_until).getTime() > now) return 'featured';
  // Neu wenn weniger als 14 Tage online
  const ageDays = (now - new Date(l.published_at).getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays < 14) return 'neu';
  return 'live';
}
