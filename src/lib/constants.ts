/**
 * passare.ch — Statische Konstanten (CH-spezifisch, ändern sich selten)
 *
 * Branchen werden NICHT hier definiert — sie kommen aus der `branchen`-Tabelle
 * via `src/lib/branchen.ts` (Admin-pflegbar, mit i18n-Labels und Multiples).
 */

/** Alle 26 Schweizer Kantone (alphabetisch sortiert) */
export const KANTON_CODES = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const;

export type KantonCode = (typeof KANTON_CODES)[number];

/**
 * Übergabe-Gründe — gespiegelt zum Postgres-Enum `public.uebergabe_grund`.
 * Reihenfolge entspricht UI-Empfehlung (häufigste zuerst).
 */
export const UEBERGABE_GRUENDE = [
  { id: 'altersnachfolge',     label: 'Altersnachfolge' },
  { id: 'pensionierung',       label: 'Pensionierung' },
  { id: 'strategischer_exit',  label: 'Strategischer Exit' },
  { id: 'familienwechsel',     label: 'Generationenwechsel / Familie' },
  { id: 'gesundheit',          label: 'Gesundheit' },
  { id: 'andere',              label: 'Andere' },
] as const;

export type UebergabeGrund = (typeof UEBERGABE_GRUENDE)[number]['id'];

/** Display-Label für einen Übergabe-Grund (DB-Enum → UI-Text) */
export function uebergabeGrundLabel(grund: string | null | undefined): string {
  if (!grund) return '—';
  const found = UEBERGABE_GRUENDE.find((g) => g.id === grund);
  return found?.label ?? grund;
}

/** Preis-Buckets für Marktplatz-Filter (Käufer-Sicht) */
export const PREIS_BUCKETS = [
  { id: 'all',     label: 'Alle Preise' },
  { id: '<250k',   label: 'Bis CHF 250\'000',          min: 0,         max: 250_000 },
  { id: '250-500', label: 'CHF 250\'000 – 500\'000',   min: 250_000,   max: 500_000 },
  { id: '500-1m',  label: 'CHF 500\'000 – 1 Mio',      min: 500_000,   max: 1_000_000 },
  { id: '1-5m',    label: 'CHF 1 – 5 Mio',             min: 1_000_000, max: 5_000_000 },
  { id: '5-10m',   label: 'CHF 5 – 10 Mio',            min: 5_000_000, max: 10_000_000 },
  { id: '10-20m',  label: 'CHF 10 – 20 Mio',           min: 10_000_000,max: 20_000_000 },
  { id: '>20m',    label: 'Über CHF 20 Mio',           min: 20_000_000 },
] as const;

/** Umsatz-Buckets für Marktplatz-Filter */
export const UMSATZ_BUCKETS = [
  { id: 'all',     label: 'Alle Umsätze' },
  { id: '<1m',     label: 'Bis CHF 1 Mio',     min: 0,           max: 1_000_000 },
  { id: '1-5m',    label: 'CHF 1 – 5 Mio',     min: 1_000_000,   max: 5_000_000 },
  { id: '5-15m',   label: 'CHF 5 – 15 Mio',    min: 5_000_000,   max: 15_000_000 },
  { id: '15-50m',  label: 'CHF 15 – 50 Mio',   min: 15_000_000,  max: 50_000_000 },
  { id: '>50m',    label: 'Über CHF 50 Mio',   min: 50_000_000 },
] as const;

/** Mitarbeitenden-Buckets */
export const MA_BUCKETS = [
  { id: 'all',    label: 'Alle Grössen' },
  { id: '0-10',   label: '0 – 10 MA',     min: 0,    max: 10 },
  { id: '10-20',  label: '10 – 20 MA',    min: 10,   max: 20 },
  { id: '20-50',  label: '20 – 50 MA',    min: 20,   max: 50 },
  { id: '50-100', label: '50 – 100 MA',   min: 50,   max: 100 },
  { id: '>100',   label: 'Über 100 MA',   min: 100 },
] as const;

/** EBITDA-Marge-Buckets */
export const EBITDA_BUCKETS = [
  { id: 'all',  label: 'Alle Margen' },
  { id: '5',    label: '> 5 %',  min: 5 },
  { id: '10',   label: '> 10 %', min: 10 },
  { id: '15',   label: '> 15 %', min: 15 },
  { id: '20',   label: '> 20 %', min: 20 },
] as const;

/** Sortier-Optionen für Marktplatz */
export const SORT_OPTIONS = [
  { id: 'neu',         label: 'Neueste zuerst' },
  { id: 'preis_asc',   label: 'Preis aufsteigend' },
  { id: 'preis_desc',  label: 'Preis absteigend' },
  { id: 'umsatz_desc', label: 'Umsatz absteigend' },
  { id: 'ebitda_desc', label: 'EBITDA absteigend' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['id'];
