import { createClient } from '@/lib/supabase/server';

/**
 * Defensiv-Check ob eine Tabelle im public-Schema existiert.
 * Nötig weil Chat 2 (Verkäufer-Bereich) die Tabellen `inserate`, `anfragen`,
 * `nda_signaturen` parallel baut — der Käufer-Bereich muss aber funktionieren
 * auch wenn die Tabellen noch nicht da sind.
 *
 * Cached pro Server-Render (1× pro Request).
 */
const cache = new Map<string, boolean>();

export async function hasTable(name: string): Promise<boolean> {
  if (cache.has(name)) return cache.get(name)!;

  try {
    const supabase = await createClient();
    // Versucht 0-Row-Query — wenn Tabelle fehlt, error.code='42P01'
    const { error } = await supabase.from(name).select('*', { count: 'exact', head: true }).limit(0);
    const exists = !error || error.code !== '42P01';
    cache.set(name, exists);
    return exists;
  } catch {
    cache.set(name, false);
    return false;
  }
}
