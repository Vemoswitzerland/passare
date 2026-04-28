/**
 * passare.ch — Branchen aus der `branchen`-Tabelle laden
 *
 * 18 KMU-Branchen mit i18n-Labels und Multiples (Q1/2026).
 * Admin-pflegbar — daher NIE hardcoded im Frontend.
 *
 * Verwendung:
 *   const branchen = await getBranchen();   // Server Component
 *   <ProfilForm branchen={branchen} />      // an Client Component reichen
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type Branche = {
  id: string;            // 'software_saas'
  label_de: string;      // 'Software & SaaS'
  label_fr: string | null;
  label_it: string | null;
  label_en: string | null;
  ebitda_multiple_median: number;
  umsatz_multiple_median: number;
  sort_order: number;
};

/**
 * Lädt alle Branchen aus der DB, sortiert nach `sort_order`.
 * Per-Request gecacht via React `cache()` — mehrere Calls in einem Render
 * lösen nur eine DB-Query aus.
 */
export const getBranchen = cache(async (): Promise<Branche[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('branchen')
    .select('id, label_de, label_fr, label_it, label_en, ebitda_multiple_median, umsatz_multiple_median, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[branchen] getBranchen failed:', error.message);
    return [];
  }
  return (data ?? []) as Branche[];
});

/**
 * Lookup einer Branche per ID. Nutzt den per-Request-Cache von `getBranchen()`.
 * Liefert null wenn Branche nicht in DB existiert.
 */
export const getBrancheById = cache(async (id: string | null | undefined): Promise<Branche | null> => {
  if (!id) return null;
  const all = await getBranchen();
  return all.find((b) => b.id === id) ?? null;
});

/**
 * Display-Label für eine Branche.
 * Fallback: gibt die ID zurück wenn nicht in DB gefunden (degradet sauber).
 */
export async function brancheLabel(id: string | null | undefined, lang: 'de' | 'fr' | 'it' | 'en' = 'de'): Promise<string> {
  if (!id) return '—';
  const b = await getBrancheById(id);
  if (!b) return id;
  if (lang === 'fr' && b.label_fr) return b.label_fr;
  if (lang === 'it' && b.label_it) return b.label_it;
  if (lang === 'en' && b.label_en) return b.label_en;
  return b.label_de;
}

/**
 * Synchroner Lookup wenn die Liste schon geladen ist (Performance-Optimierung
 * für Schleifen mit vielen Inseraten).
 */
export function brancheLabelFromList(
  branchen: Branche[],
  id: string | null | undefined,
  lang: 'de' | 'fr' | 'it' | 'en' = 'de',
): string {
  if (!id) return '—';
  const b = branchen.find((x) => x.id === id);
  if (!b) return id;
  if (lang === 'fr' && b.label_fr) return b.label_fr;
  if (lang === 'it' && b.label_it) return b.label_it;
  if (lang === 'en' && b.label_en) return b.label_en;
  return b.label_de;
}
