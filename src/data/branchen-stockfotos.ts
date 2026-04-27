/**
 * Stockfoto-Pool pro Branche.
 *
 * Konzept (Cyrill, 2026-04-27):
 * - Verkäufer können beim Onboarding eigenes Bild hochladen → wird als Cover genutzt.
 * - Wenn kein Bild hochgeladen: deterministisch ein Stockfoto aus dem Pool für die
 *   passende Branche wählen (anhand listing-id, damit immer dieselbe Firma dasselbe
 *   Bild bekommt → kein Flackern).
 * - Bilder werden ohnehin geblurred dargestellt → keine Anonymitätsprobleme,
 *   selbst wenn der Verkäufer ein echtes Foto seiner Firma hochlädt.
 *
 * Storage-Limit: max 10 Fotos pro Branche (Cyrill: «nicht dass wir Speicherplatz
 * übernutzen»). Die Fotos werden via Unsplash-CDN geladen — keine eigenen Assets.
 *
 * Später (DB-Migration): Tabelle `branchen_stockfotos(branche, url, sort)` mit
 * RLS-public-read. Aktuell hardgecoded für Marktplatz-Demo.
 */

const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=70&auto=format&fit=crop`;

export const STOCKFOTOS_BY_BRANCHE: Record<string, string[]> = {
  'Maschinenbau': [
    UNSPLASH('photo-1565793298595-6a879b1d9492'),
    UNSPLASH('photo-1518281420975-50db6e5d0a97'),
    UNSPLASH('photo-1504917595217-d4dc5ebe6122'),
    UNSPLASH('photo-1581094794329-c8112a89af12'),
    UNSPLASH('photo-1579751626657-72bc17010498'),
  ],
  'Lebensmittel': [
    UNSPLASH('photo-1517686469429-8bdb88b9f907'),
    UNSPLASH('photo-1568254183919-78a4f43a2877'),
    UNSPLASH('photo-1509440159596-0249088772ff'),
    UNSPLASH('photo-1555507036-ab1f4038808a'),
    UNSPLASH('photo-1486427944299-d1955d23e34d'),
  ],
  'IT & Technologie': [
    UNSPLASH('photo-1518770660439-4636190af475'),
    UNSPLASH('photo-1551434678-e076c223a692'),
    UNSPLASH('photo-1517433670267-08bbd4be890f'),
    UNSPLASH('photo-1573164713988-8665fc963095'),
    UNSPLASH('photo-1497366216548-37526070297c'),
  ],
  'Finanz / Versicherung': [
    UNSPLASH('photo-1554224155-6726b3ff858f'),
    UNSPLASH('photo-1450101499163-c8848c66ca85'),
    UNSPLASH('photo-1554224154-26032ffc0d07'),
    UNSPLASH('photo-1556761175-5973dc0f32e7'),
    UNSPLASH('photo-1444653614773-995cb1ef9efa'),
  ],
  'Handel / Industrie': [
    UNSPLASH('photo-1553413077-190dd305871c'),
    UNSPLASH('photo-1486406146926-c627a92ad1ab'),
    UNSPLASH('photo-1565008576549-57569a49371d'),
    UNSPLASH('photo-1581092160562-40aa08e78837'),
    UNSPLASH('photo-1513828583688-c52646db42da'),
  ],
  'Gastgewerbe': [
    UNSPLASH('photo-1566073771259-6a8506099945'),
    UNSPLASH('photo-1551882547-ff40c63fe5fa'),
    UNSPLASH('photo-1455587734955-081b22074882'),
    UNSPLASH('photo-1578683010236-d716f9a3f461'),
    UNSPLASH('photo-1542314831-068cd1dbfeeb'),
  ],
  'Logistik': [
    UNSPLASH('photo-1586528116311-ad8dd3c8310d'),
    UNSPLASH('photo-1601584115197-04ecc0da31d7'),
    UNSPLASH('photo-1494412574745-5b95b59f4ee4'),
    UNSPLASH('photo-1578575437130-527eed3abbec'),
    UNSPLASH('photo-1494412519320-aa613dfb7738'),
  ],
  'Kleinhandel': [
    UNSPLASH('photo-1604719312566-8912e9227c6a'),
    UNSPLASH('photo-1441986300917-64674bd600d8'),
    UNSPLASH('photo-1481437156560-3205f6a55735'),
    UNSPLASH('photo-1567401893414-76b7b1e5a7a5'),
    UNSPLASH('photo-1483985988355-763728e1935b'),
  ],
  'Gesundheit': [
    UNSPLASH('photo-1576091160399-112ba8d25d1f'),
    UNSPLASH('photo-1579684385127-1ef15d508118'),
    UNSPLASH('photo-1538108149393-fbbd81895907'),
    UNSPLASH('photo-1582719508461-905c673771fd'),
    UNSPLASH('photo-1530026405186-ed1f139313f8'),
  ],
  'Bauwesen': [
    UNSPLASH('photo-1503387762-592deb58ef4e'),
    UNSPLASH('photo-1541888946425-d81bb19240f5'),
    UNSPLASH('photo-1504307651254-35680f356dfd'),
    UNSPLASH('photo-1485628390555-1a7bd3c2f3b4'),
    UNSPLASH('photo-1504307651254-35680f356dfd'),
  ],
  'Beratung': [
    UNSPLASH('photo-1556761175-b413da4baf72'),
    UNSPLASH('photo-1497032628192-86f99bcd76bc'),
    UNSPLASH('photo-1517245386807-bb43f82c33c4'),
    UNSPLASH('photo-1543269865-cbf427effbad'),
    UNSPLASH('photo-1507679799987-c73779587ccf'),
  ],
  'Autoindustrie': [
    UNSPLASH('photo-1486006920555-c77dcf18193c'),
    UNSPLASH('photo-1487754180451-c456f719a1fc'),
    UNSPLASH('photo-1492144534655-ae79c964c9d7'),
    UNSPLASH('photo-1503376780353-7e6692767b70'),
    UNSPLASH('photo-1517524008697-84bbe3c3fd98'),
  ],
};

const FALLBACK = [
  UNSPLASH('photo-1521791136064-7986c2920216'),
  UNSPLASH('photo-1497366754035-f200968a6e72'),
  UNSPLASH('photo-1497366811353-6870744d04b2'),
];

/**
 * Wählt deterministisch ein Stockfoto für eine Branche basierend auf einem Seed
 * (üblicherweise listing-id). Gleicher Seed → gleiches Bild, kein Flackern.
 */
export function branchenStockfoto(branche: string, seed: string): string {
  const pool = STOCKFOTOS_BY_BRANCHE[branche] ?? FALLBACK;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}
