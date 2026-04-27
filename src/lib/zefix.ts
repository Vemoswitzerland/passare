/**
 * Schweizer Handelsregister-Client.
 *
 * Datenquellen:
 *  1. LINDAS Linked Data SPARQL (Default, KEIN Auth nötig)
 *     Endpoint:  https://lindas.admin.ch/query
 *     Dataset:   https://register.ld.admin.ch/.well-known/dataset/foj-zefix
 *     Offizielles Bundesangebot, frei zugänglich, Live-Daten.
 *
 *  2. Zefix Public REST API (Fallback, falls ZEFIX_USER + ZEFIX_PASS gesetzt)
 *     Endpoint:  https://www.zefix.admin.ch/ZefixPublicREST/api/v1
 *     Auth:      HTTP Basic (Account via zefix@bj.admin.ch beantragen)
 *
 * Cache: zefix_cache Tabelle (24h TTL) mit stale-while-revalidate.
 */
import { createAdminClient } from '@/lib/supabase/server';

const REST_BASE_URL = process.env.ZEFIX_BASE_URL ?? 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';
const SPARQL_ENDPOINT = process.env.LINDAS_ENDPOINT ?? 'https://lindas.admin.ch/query';
const CACHE_TTL_HOURS = 24;

export type ZefixCompany = {
  uid: string | null;
  name: string | null;
  rechtsform: string | null;
  status: string | null;
  statusActive: boolean;
  kanton: string | null;
  gemeinde: string | null;
  adresse: {
    strasse: string | null;
    hausnummer: string | null;
    plz: string | null;
    ort: string | null;
    land: string | null;
  };
  branche: string | null;
  zweck: string | null;
  gruendungsjahr: number | null;
  source: 'lindas' | 'rest' | 'cache';
};

export type ZefixSearchHit = {
  uid: string | null;
  name: string | null;
  ort: string | null;
  kanton: string | null;
  source: 'lindas' | 'rest';
};

// ─────────────────────────────────────────────────────────────────
// UID-Helpers
// ─────────────────────────────────────────────────────────────────
function normaliseUid(uid: string): { formatted: string; compact: string } {
  const compact = uid.trim().toUpperCase().replace(/[\s\-.]/g, '');
  // CHE + 9 digits
  const formatted = `CHE-${compact.slice(3, 6)}.${compact.slice(6, 9)}.${compact.slice(9, 12)}`;
  return { formatted, compact };
}

export function isValidUid(uid: string): boolean {
  const compact = uid.trim().toUpperCase().replace(/[\s\-.]/g, '');
  return /^CHE\d{9}$/.test(compact);
}

// ─────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────
async function readCache(uid: string): Promise<{ payload: any; fresh: boolean } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('zefix_cache')
    .select('payload, fetched_at')
    .eq('uid', uid)
    .maybeSingle();

  if (!data) return null;
  const fetched = new Date(data.fetched_at).getTime();
  const age = Date.now() - fetched;
  return { payload: data.payload, fresh: age < CACHE_TTL_HOURS * 3600 * 1000 };
}

async function writeCache(uid: string, payload: any, endpoint = 'lookup', query?: string) {
  const supabase = createAdminClient();
  await supabase
    .from('zefix_cache')
    .upsert(
      {
        uid,
        payload,
        endpoint,
        query: query ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'uid' },
    );
}

// ─────────────────────────────────────────────────────────────────
// LINDAS SPARQL (Default, kein Auth)
// ─────────────────────────────────────────────────────────────────
type SparqlBinding = Record<string, { type: string; value: string; 'xml:lang'?: string }>;
type SparqlResponse = {
  head: { vars: string[] };
  results: { bindings: SparqlBinding[] };
};

async function sparqlQuery(query: string, timeoutMs = 7000): Promise<SparqlResponse> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'passare.ch/1.0',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`LINDAS HTTP ${res.status}`);
  return res.json() as Promise<SparqlResponse>;
}

function pickByLang(rows: SparqlBinding[], key: string, preferLang = 'de'): string | null {
  const matches = rows.filter((r) => r[key]);
  if (!matches.length) return null;
  const preferred = matches.find((r) => r[key]['xml:lang'] === preferLang);
  if (preferred) return preferred[key].value;
  const noLang = matches.find((r) => !r[key]['xml:lang']);
  if (noLang) return noLang[key].value;
  return matches[0][key].value;
}

async function lookupViaLindas(uidCompact: string): Promise<ZefixCompany | null> {
  // 1. Company-URI über UID-Identifier finden (STRENDS ist deutlich schneller als CONTAINS)
  const findCompanyQuery = `
    PREFIX schema: <http://schema.org/>
    SELECT DISTINCT ?company WHERE {
      ?company a <https://schema.ld.admin.ch/ZefixOrganisation> ;
               schema:identifier ?id .
      FILTER(STRENDS(STR(?id), "/${uidCompact}"))
    } LIMIT 1
  `;
  const findRes = await sparqlQuery(findCompanyQuery);
  const companyUri = findRes.results.bindings[0]?.company?.value;
  if (!companyUri) return null;

  // 2. Alle Properties des Unternehmens und der Adresse holen
  const detailQuery = `
    PREFIX schema: <http://schema.org/>
    PREFIX locn: <http://www.w3.org/ns/locn#>
    SELECT ?name ?nameLang ?description ?strasse ?hausnummer ?plz ?ort ?kanton ?gruendung ?status ?legalFormName ?legalFormLang
    WHERE {
      <${companyUri}> schema:name ?name .
      BIND(LANG(?name) AS ?nameLang)
      OPTIONAL { <${companyUri}> schema:description ?description }
      OPTIONAL {
        <${companyUri}> schema:address ?addr .
        OPTIONAL { ?addr locn:thoroughfare ?strasse }
        OPTIONAL { ?addr locn:locatorDesignator ?hausnummer }
        OPTIONAL { ?addr schema:postalCode ?plz }
        OPTIONAL { ?addr schema:addressLocality ?ort }
        OPTIONAL { ?addr schema:addressRegion ?kanton }
      }
      OPTIONAL { <${companyUri}> schema:foundingDate ?gruendung }
      OPTIONAL { <${companyUri}> schema:status ?status }
      OPTIONAL {
        <${companyUri}> <https://schema.ld.admin.ch/legalForm> ?lf .
        ?lf schema:name ?legalFormName .
        BIND(LANG(?legalFormName) AS ?legalFormLang)
      }
    } LIMIT 50
  `;

  const detail = await sparqlQuery(detailQuery);
  const rows = detail.results.bindings;
  if (!rows.length) return null;

  const nameDe = pickByLang(rows, 'name', 'de');
  const beschreibung = rows.find((r) => r.description)?.description.value ?? null;
  const strasse = rows.find((r) => r.strasse)?.strasse.value ?? null;
  const hausnummer = rows.find((r) => r.hausnummer)?.hausnummer.value ?? null;
  const plz = rows.find((r) => r.plz)?.plz.value ?? null;
  const ort = rows.find((r) => r.ort)?.ort.value ?? null;
  const kanton = rows.find((r) => r.kanton)?.kanton.value ?? null;
  const gruendung = rows.find((r) => r.gruendung)?.gruendung.value ?? null;
  const status = rows.find((r) => r.status)?.status.value ?? null;
  const legalFormName = pickByLang(rows, 'legalFormName', 'de');

  const year = (() => {
    if (!gruendung) return null;
    const m = gruendung.match(/^(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  })();

  return {
    uid: `CHE-${uidCompact.slice(3, 6)}.${uidCompact.slice(6, 9)}.${uidCompact.slice(9, 12)}`,
    name: nameDe,
    rechtsform: legalFormName,
    status,
    statusActive: status !== 'CANCELLED' && status !== 'DELETED',
    kanton,
    gemeinde: ort,
    adresse: {
      strasse,
      hausnummer,
      plz,
      ort,
      land: 'CH',
    },
    branche: null, // LINDAS hat keinen NOGA-Code direkt
    zweck: beschreibung,
    gruendungsjahr: year,
    source: 'lindas',
  };
}

async function searchViaLindas(name: string, maxResults: number): Promise<ZefixSearchHit[]> {
  const escaped = name.replace(/"/g, '\\"');
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX locn: <http://www.w3.org/ns/locn#>
    SELECT DISTINCT ?company ?name ?ort ?kanton WHERE {
      ?company a <https://schema.ld.admin.ch/ZefixOrganisation> ;
               schema:name ?name .
      FILTER(CONTAINS(LCASE(?name), LCASE("${escaped}")))
      OPTIONAL {
        ?company schema:address ?addr .
        OPTIONAL { ?addr schema:addressLocality ?ort }
        OPTIONAL { ?addr schema:addressRegion ?kanton }
      }
    } LIMIT ${maxResults}
  `;
  const res = await sparqlQuery(query);

  // UID aus identifier-URI extrahieren — pro Company nochmals query, gebatcht via VALUES
  const companies = res.results.bindings;
  if (!companies.length) return [];

  const uris = companies.map((b) => b.company.value);
  const uidQuery = `
    PREFIX schema: <http://schema.org/>
    SELECT ?company ?id WHERE {
      VALUES ?company { ${uris.map((u) => `<${u}>`).join(' ')} }
      ?company schema:identifier ?id .
      FILTER(CONTAINS(STR(?id), "/UID/"))
    }
  `;
  const uidRes = await sparqlQuery(uidQuery);
  const uidMap = new Map<string, string>();
  for (const b of uidRes.results.bindings) {
    const m = b.id.value.match(/UID\/(CHE\d{9})/);
    if (m) {
      const c = m[1];
      uidMap.set(b.company.value, `CHE-${c.slice(3, 6)}.${c.slice(6, 9)}.${c.slice(9, 12)}`);
    }
  }

  return companies.map((b) => ({
    uid: uidMap.get(b.company.value) ?? null,
    name: b.name.value,
    ort: b.ort?.value ?? null,
    kanton: b.kanton?.value ?? null,
    source: 'lindas' as const,
  }));
}

// ─────────────────────────────────────────────────────────────────
// REST-API (optional, mit Basic-Auth)
// ─────────────────────────────────────────────────────────────────
function getRestAuthHeader(): string | null {
  const user = process.env.ZEFIX_USER;
  const pass = process.env.ZEFIX_PASS;
  if (!user || !pass) return null;
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

function mapRestCompany(raw: any, uidFormatted: string): ZefixCompany {
  const addr = raw?.address ?? {};
  const status = raw?.status ?? raw?.companyStatus ?? null;
  const year = (() => {
    const candidates = [raw?.shabDate, raw?.swissTradeRegisterDate, raw?.firstShabDate];
    for (const c of candidates) {
      if (typeof c === 'string' && c.length >= 4) {
        const y = parseInt(c.slice(0, 4), 10);
        if (!isNaN(y)) return y;
      }
    }
    return null;
  })();

  return {
    uid: raw?.uid ?? uidFormatted,
    name: raw?.name ?? null,
    rechtsform: raw?.legalForm?.name?.de ?? raw?.legalForm?.shortName?.de ?? null,
    status,
    statusActive: status === 'EXISTING' || status === 'ACTIVE' || raw?.deletionDate == null,
    kanton: raw?.canton ?? raw?.legalSeat?.cantonalExcerptWeb ?? null,
    gemeinde: raw?.legalSeat?.name ?? raw?.municipality ?? null,
    adresse: {
      strasse: addr?.street ?? null,
      hausnummer: addr?.houseNumber ?? null,
      plz: addr?.swissZipCode?.toString() ?? addr?.zipCode ?? null,
      ort: addr?.town ?? addr?.city ?? null,
      land: addr?.country ?? 'CH',
    },
    branche: raw?.purpose ?? null,
    zweck: raw?.purpose ?? null,
    gruendungsjahr: year,
    source: 'rest',
  };
}

async function lookupViaRest(uidFormatted: string): Promise<ZefixCompany | null> {
  const auth = getRestAuthHeader();
  if (!auth) return null;
  const res = await fetch(`${REST_BASE_URL}/company/uid/${uidFormatted}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': auth,
      'User-Agent': 'passare.ch/1.0',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Zefix REST HTTP ${res.status}`);
  const data = await res.json();
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return null;
  return mapRestCompany(raw, uidFormatted);
}

async function searchViaRest(query: string, maxResults: number): Promise<ZefixSearchHit[]> {
  const auth = getRestAuthHeader();
  if (!auth) return [];
  const res = await fetch(`${REST_BASE_URL}/company/search`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': auth,
      'User-Agent': 'passare.ch/1.0',
    },
    body: JSON.stringify({ name: query, maxEntries: maxResults }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Zefix-Search HTTP ${res.status}`);
  const data = await res.json();
  const hits = Array.isArray(data) ? data : (data?.list ?? []);
  return hits.slice(0, maxResults).map((raw: any) => ({
    uid: raw?.uid ?? null,
    name: raw?.name ?? null,
    ort: raw?.address?.town ?? null,
    kanton: raw?.canton ?? null,
    source: 'rest' as const,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Public Interface (mit Cache + Failover)
// ─────────────────────────────────────────────────────────────────
export async function lookupByUid(uid: string): Promise<ZefixCompany | null> {
  const { formatted, compact } = normaliseUid(uid);

  // Cache prüfen
  const cached = await readCache(formatted);
  if (cached?.fresh) {
    return { ...(cached.payload as ZefixCompany), source: 'cache' };
  }

  // Versuche REST → fallback LINDAS
  let company: ZefixCompany | null = null;
  try {
    company = await lookupViaRest(formatted);
  } catch {
    // ignore — fallback to LINDAS
  }

  if (!company) {
    try {
      company = await lookupViaLindas(compact);
    } catch (err) {
      // Stale Cache als letztes Fallback
      if (cached) return { ...(cached.payload as ZefixCompany), source: 'cache' };
      throw err;
    }
  }

  if (!company) {
    if (cached) return { ...(cached.payload as ZefixCompany), source: 'cache' };
    return null;
  }

  await writeCache(formatted, company, 'lookup');
  return company;
}

/**
 * Generiert smartere Such-Varianten falls die Volltext-Suche
 * keine Treffer liefert. Beispiel "Vemo Group GmbH":
 *   1. "Vemo Group GmbH"   → exact substring
 *   2. "Vemo Group"         → ohne Rechtsform
 *   3. "Vemo"               → Hauptwort allein
 */
function buildSearchVariants(q: string): string[] {
  const trimmed = q.trim();
  const variants: string[] = [trimmed];

  // Rechtsform-Suffixe entfernen
  const stripRechtsform = trimmed
    .replace(/\b(GmbH|AG|SA|S\.A\.|Sàrl|Sarl|S\.à r\.l\.|Genossenschaft|Verein|Stiftung|in Liquidation|i\.\s*L\.|& Co\.?|& Cie\.?)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (stripRechtsform.length >= 3 && stripRechtsform.toLowerCase() !== trimmed.toLowerCase()) {
    variants.push(stripRechtsform);
  }

  // Erstes signifikantes Wort
  const firstWord = stripRechtsform.split(/\s+/).find((w) => w.length >= 3);
  if (firstWord && !variants.some((v) => v.toLowerCase() === firstWord.toLowerCase())) {
    variants.push(firstWord);
  }

  return variants;
}

export async function searchByName(query: string, maxResults = 20): Promise<ZefixSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // REST zuerst (falls Auth gesetzt), dann LINDAS — jeweils mit Such-Varianten
  const variants = buildSearchVariants(q);
  for (const variant of variants) {
    try {
      const restHits = await searchViaRest(variant, maxResults);
      if (restHits.length > 0) return restHits;
    } catch {
      // ignore — fallback auf LINDAS
    }
    try {
      const lindasHits = await searchViaLindas(variant, maxResults);
      if (lindasHits.length > 0) return lindasHits;
    } catch {
      // ignore — nächste Variante
    }
  }
  return [];
}
