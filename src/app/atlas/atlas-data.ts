/**
 * passare.ch — Atlas-Datenlader
 *
 * Server-Side: holt aktive Inserate aus DB (defensiv via hasTable),
 * fällt zurück auf MOCK_LISTINGS wenn `inserate` noch nicht existiert
 * (parallele Agents bauen die Tabelle).
 *
 * Reichert jeden Listing mit lat/lng aus Kanton-Centroid + deterministischem
 * Offset (Hash der id) an — so streuen Marker visuell über den Kanton.
 */

import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { MOCK_LISTINGS, type MockListing } from '@/lib/listings-mock';

export type AtlasMarker = {
  id: string;
  titel: string;
  branche: string;
  kanton: string;
  jahr?: number;
  mitarbeitende?: number;
  umsatz?: string;
  ebitda?: string;
  kaufpreis?: string;
  grund?: string;
  lat: number;
  lng: number;
};

/** Kanton-Code → [lng, lat]-Centroid (WGS84). Quelle: BFS-Geodaten. */
export const KANTON_CENTROIDS: Record<string, [number, number]> = {
  AG: [8.184, 47.388],
  AI: [9.408, 47.317],
  AR: [9.417, 47.367],
  BE: [7.633, 46.823],
  BL: [7.730, 47.450],
  BS: [7.585, 47.560],
  FR: [7.106, 46.806],
  GE: [6.146, 46.210],
  GL: [9.067, 47.034],
  GR: [9.560, 46.660],
  JU: [7.155, 47.348],
  LU: [8.222, 47.072],
  NE: [6.792, 46.992],
  NW: [8.385, 46.927],
  OW: [8.250, 46.877],
  SG: [9.376, 47.236],
  SH: [8.633, 47.700],
  SO: [7.640, 47.370],
  SZ: [8.755, 47.020],
  TG: [9.067, 47.567],
  TI: [8.800, 46.330],
  UR: [8.635, 46.770],
  VD: [6.633, 46.617],
  VS: [7.640, 46.220],
  ZG: [8.515, 47.166],
  ZH: [8.651, 47.418],
};

/** Deterministischer Hash → Float in [-0.5, 0.5] (für lat/lng-Offset). */
function seedOffset(seed: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  // h ist -2^31..2^31, normalisieren auf [-0.5, 0.5]
  return (h / 2147483647) * 0.5;
}

function listingToMarker(l: MockListing): AtlasMarker {
  const centroid = KANTON_CENTROIDS[l.kanton] ?? [8.227, 46.818];
  // ±0.12° lng, ±0.06° lat (etwa ±9km × ±7km — innerhalb der meisten Kantone)
  const lng = centroid[0] + seedOffset(l.id, 7) * 0.24;
  const lat = centroid[1] + seedOffset(l.id, 13) * 0.12;
  return {
    id: l.id,
    titel: l.titel,
    branche: l.branche,
    kanton: l.kanton,
    jahr: l.jahr,
    mitarbeitende: l.mitarbeitende,
    umsatz: l.umsatz,
    ebitda: l.ebitda,
    kaufpreis: l.kaufpreis,
    grund: l.grund,
    lat,
    lng,
  };
}

/**
 * Lädt aktive Inserate. Defensiv: wenn `inserate`-Tabelle nicht existiert
 * (parallele Etappe baut sie), Fallback auf MOCK_LISTINGS.
 */
export async function loadAtlasMarkers(): Promise<AtlasMarker[]> {
  const tableExists = await hasTable('inserate');

  if (tableExists) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('inserate')
        .select('id, slug, titel, branche_id, kanton, jahr, mitarbeitende_bucket, umsatz_bucket, kaufpreis_bucket, kaufpreis_vhb, uebergabe_grund, status')
        .eq('status', 'live')
        .limit(500);

      if (!error && data && data.length > 0) {
        return data.map((row): AtlasMarker => {
          const id = String(row.slug ?? row.id);
          const kanton = String(row.kanton ?? 'ZH');
          const centroid = KANTON_CENTROIDS[kanton] ?? [8.227, 46.818];
          return {
            id,
            titel: String(row.titel ?? 'Inserat'),
            branche: String(row.branche_id ?? 'Andere'),
            kanton,
            jahr: row.jahr ?? undefined,
            mitarbeitende: undefined,
            umsatz: row.umsatz_bucket ?? undefined,
            ebitda: undefined,
            kaufpreis: row.kaufpreis_vhb ? 'VHB' : (row.kaufpreis_bucket ?? undefined),
            grund: row.uebergabe_grund ?? undefined,
            lng: centroid[0] + seedOffset(id, 7) * 0.24,
            lat: centroid[1] + seedOffset(id, 13) * 0.12,
          };
        });
      }
    } catch {
      // Ignore — fallback unten
    }
  }

  return MOCK_LISTINGS.map(listingToMarker);
}
