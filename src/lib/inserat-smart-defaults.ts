// ════════════════════════════════════════════════════════════════════
// Smart-Defaults für Inserat-Felder
// ────────────────────────────────────────────────────────────────────
// Aus den bekannten Eckdaten (Branche, Kanton, Jahr, MA, Umsatz,
// EBITDA, Bewertung) generieren wir intelligente Vorschläge für
// Titel, Teaser, Beschreibung, Sales-Points, Kaufpreis und
// Übergabe-Konditionen — ohne KI, rein regelbasiert.
//
// User kann jeden Vorschlag annehmen oder editieren. Felder die
// schon explizit gesetzt sind, werden NICHT überschrieben.
// ════════════════════════════════════════════════════════════════════

import { BRANCHEN_MULTIPLES } from '@/data/branchen-multiples';

const KANTON_TO_REGION: Record<string, string> = {
  ZH: 'Region Zürich',
  BE: 'Region Bern',
  LU: 'der Zentralschweiz',
  UR: 'der Zentralschweiz',
  SZ: 'der Zentralschweiz',
  OW: 'der Zentralschweiz',
  NW: 'der Zentralschweiz',
  GL: 'der Ostschweiz',
  ZG: 'der Zentralschweiz',
  FR: 'der Westschweiz',
  SO: 'der Nordwestschweiz',
  BS: 'Region Basel',
  BL: 'Region Basel',
  SH: 'der Ostschweiz',
  AR: 'der Ostschweiz',
  AI: 'der Ostschweiz',
  SG: 'der Ostschweiz',
  GR: 'Graubünden',
  AG: 'Region Aargau',
  TG: 'der Ostschweiz',
  TI: 'dem Tessin',
  VD: 'der Westschweiz',
  VS: 'dem Wallis',
  NE: 'der Westschweiz',
  GE: 'Region Genf',
  JU: 'der Westschweiz',
};

const BRANCHE_TO_TITEL_TEMPLATES: Record<string, string[]> = {
  software_saas: [
    'Etabliertes Software-Unternehmen mit wiederkehrenden Erlösen',
    'Spezialisierte SaaS-Plattform aus {region}',
    'Profitabler Software-Anbieter mit treuer Kundenbasis',
  ],
  it_services: [
    'Etablierter IT-Dienstleister aus {region}',
    'Spezialisiertes IT-Service-Unternehmen mit langfristigen Verträgen',
    'Solider IT-Partner mit eingespielten Kundenbeziehungen',
  ],
  healthcare: [
    'Etablierte Gesundheitsdienstleistung aus {region}',
    'Spezialisierte Praxis mit treuem Patientenstamm',
    'Profitable Medtech-Firma mit Wachstumspotential',
  ],
  maschinenbau: [
    'Spezialisierter Maschinenbau-Betrieb aus {region}',
    'Eigentümergeführter Maschinenbau mit klaren Stärken',
    'Etablierte Fertigung mit langjährigem Know-how',
  ],
  bau_handwerk: [
    'Eigentümergeführter Handwerksbetrieb aus {region}',
    'Etabliertes Bauunternehmen mit stabiler Auftragslage',
    'Spezialisierter Handwerksbetrieb mit Stammkunden',
  ],
  beratung_treuhand: [
    'Spezialisierte Beratungsfirma aus {region}',
    'Etabliertes Treuhand-Unternehmen mit Top-Klienten',
    'Profitable Beratungsfirma mit wiederkehrenden Mandaten',
  ],
  industrie_chemie: [
    'Etablierter Industriebetrieb aus {region}',
    'Spezialisiertes Produktionsunternehmen mit Markennischen',
    'Solider Industriepartner mit langfristigen Lieferverträgen',
  ],
  elektrotechnik: [
    'Spezialisierter Elektrotechnik-Betrieb aus {region}',
    'Etabliertes Unternehmen mit eigenen Spezialprodukten',
  ],
  lebensmittel: [
    'Traditionsreicher Lebensmittelbetrieb aus {region}',
    'Etablierte Bäckerei/Konditorei mit Stammkunden',
    'Spezialisierter Lebensmittelhersteller mit eigenen Marken',
  ],
  telco_utilities: [
    'Etabliertes Versorgungsunternehmen aus {region}',
    'Spezialisierter Telco-Anbieter mit eigenem Netz',
  ],
  automotive: [
    'Etablierte Garage/Carrosserie aus {region}',
    'Eigentümergeführter Autobetrieb mit Stammkunden',
  ],
  handel_ecommerce: [
    'Etablierter Online-Shop mit eigenen Marken',
    'Profitabler E-Commerce-Betrieb aus {region}',
    'Spezialisierter Handel mit Wachstumspotential',
  ],
  medien_verlage: [
    'Etablierter Medienbetrieb aus {region}',
    'Spezialisierte Werbeagentur mit Top-Kunden',
  ],
  logistik_transport: [
    'Etabliertes Logistikunternehmen aus {region}',
    'Spezialisierter Transportbetrieb mit eigenem Fuhrpark',
  ],
  textil: ['Etablierter Textilbetrieb aus {region}'],
  gastro_hotel: [
    'Familiengeführtes Restaurant in {region}',
    'Etabliertes Gastro-Lokal mit Stammgästen',
    'Profitables Hotel mit treuer Klientel',
  ],
  immobilien: [
    'Etabliertes Immobilien-Unternehmen aus {region}',
    'Spezialisierte Liegenschaftsverwaltung mit Stammkunden',
  ],
  andere: [
    'Etabliertes Dienstleistungsunternehmen aus {region}',
    'Profitabler Spezialbetrieb mit Wachstumspotential',
  ],
};

export type SmartContext = {
  branche?: string | null;
  kanton?: string | null;
  gruendungsjahr?: number | null;
  mitarbeitende?: number | null;
  umsatz?: number | null;
  ebitda?: number | null;
  estimated_value_mid?: number | null;
  firma_rechtsform?: string | null;
};

/**
 * Smart-Titel: aus Branche + Region einen plausiblen Default-Titel
 */
export function suggestTitel(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const templates = BRANCHE_TO_TITEL_TEMPLATES[ctx.branche] ?? BRANCHE_TO_TITEL_TEMPLATES.andere;
  const region = ctx.kanton ? (KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}`) : 'der Schweiz';
  const tpl = templates[0]; // erster Vorschlag, deterministisch
  return tpl.replace(/\{region\}/g, region);
}

/**
 * Smart-Teaser: 1-2 Sätze, prägnant, anonymisiert
 */
export function suggestTeaser(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const branche = BRANCHEN_MULTIPLES[ctx.branche]?.label ?? 'Dienstleistung';
  const region = ctx.kanton ? KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}` : 'der Schweiz';
  const margin = ctx.umsatz && ctx.ebitda ? (ctx.ebitda / ctx.umsatz) * 100 : 0;

  const altersHinweis = ctx.gruendungsjahr
    ? `Seit ${new Date().getFullYear() - ctx.gruendungsjahr} Jahren etabliert.`
    : 'Seit vielen Jahren etabliert.';

  const margeHinweis =
    margin >= 18 ? 'Top-Margen über dem Branchenschnitt.' :
    margin >= 10 ? 'Solide Profitabilität.' :
    'Stabile Erlösbasis.';

  const maHinweis = ctx.mitarbeitende && ctx.mitarbeitende >= 10
    ? `Eingespieltes Team von ${formatMaBucket(ctx.mitarbeitende)} Mitarbeitenden.`
    : 'Schlanke Struktur, klare Übergabe.';

  return `${branche} in ${region}. ${altersHinweis} ${margeHinweis} ${maHinweis}`.trim();
}

/**
 * Smart-Beschreibung: vollständiger Text in 4 Blöcken
 */
export function suggestBeschreibung(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const branche = BRANCHEN_MULTIPLES[ctx.branche]?.label ?? 'Branche';
  const region = ctx.kanton ? KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}` : 'der Schweiz';
  const alter = ctx.gruendungsjahr ? new Date().getFullYear() - ctx.gruendungsjahr : null;
  const margin = ctx.umsatz && ctx.ebitda ? (ctx.ebitda / ctx.umsatz) * 100 : null;

  const teile: string[] = [];

  // Block 1: Was wir tun
  teile.push(
    `Etabliertes Unternehmen aus dem Bereich ${branche}, mit Sitz in ${region}.${
      alter ? ` Seit ${alter} Jahren erfolgreich am Markt.` : ''
    } Wir bedienen einen treuen Kundenstamm und haben uns über die Jahre einen klaren Namen aufgebaut.`,
  );

  // Block 2: Eckdaten (anonymisiert)
  if (ctx.mitarbeitende || ctx.umsatz || margin) {
    const eckdaten: string[] = [];
    if (ctx.mitarbeitende) eckdaten.push(`${formatMaBucket(ctx.mitarbeitende)} Mitarbeitende`);
    if (ctx.umsatz) eckdaten.push(`Jahresumsatz im Bereich ${formatChfBucket(ctx.umsatz)}`);
    if (margin) eckdaten.push(`EBITDA-Marge von rund ${margin.toFixed(0)} %`);
    if (eckdaten.length) {
      teile.push(`\n\nEckdaten: ${eckdaten.join(', ')}.`);
    }
  }

  // Block 3: USP
  if (margin && margin >= 18) {
    teile.push('\n\nDie Profitabilität liegt deutlich über dem Branchenschnitt — ein Indikator für effiziente Strukturen und klare Marktpositionierung.');
  } else if (margin && margin >= 10) {
    teile.push('\n\nSolide Profitabilität, stabile Cashflows und klare Wachstumshebel für den Käufer.');
  }

  if (alter && alter >= 20) {
    teile.push(`\n\nMit ${alter} Jahren Markt-Tradition gehören wir zu den etablierten Anbietern in unserem Segment.`);
  }

  // Block 4: Übergabe
  teile.push('\n\nDer Verkauf erfolgt aus persönlichen Gründen. Eine geordnete Übergabe und Einarbeitung ist garantiert. Wir suchen einen Käufer der unsere Werte und unsere Kundenbeziehungen langfristig pflegt.');

  return teile.join('').trim();
}

/**
 * Smart-Sales-Points: 3-5 Highlights aus den Eckdaten
 */
export function suggestSalesPoints(ctx: SmartContext): string[] {
  const points: string[] = [];
  const margin = ctx.umsatz && ctx.ebitda ? (ctx.ebitda / ctx.umsatz) * 100 : 0;
  const alter = ctx.gruendungsjahr ? new Date().getFullYear() - ctx.gruendungsjahr : 0;

  if (margin >= 18) {
    points.push(`Top-Quartil EBITDA-Marge (${margin.toFixed(0)} %) im Branchenvergleich`);
  } else if (margin >= 10) {
    points.push(`Solide Profitabilität (${margin.toFixed(0)} % EBITDA-Marge)`);
  }

  if (alter >= 30) {
    points.push(`Über ${alter} Jahre Markterfahrung — etablierte Marke`);
  } else if (alter >= 15) {
    points.push(`${alter} Jahre erfolgreich am Markt`);
  } else if (alter >= 5) {
    points.push(`${alter} Jahre stabiler Marktauftritt`);
  }

  if (ctx.mitarbeitende && ctx.mitarbeitende >= 20) {
    points.push(`Eingespieltes Team mit ${formatMaBucket(ctx.mitarbeitende)} Mitarbeitenden`);
  } else if (ctx.mitarbeitende && ctx.mitarbeitende >= 5) {
    points.push('Schlanke, effiziente Team-Struktur');
  }

  if (ctx.umsatz && ctx.umsatz >= 5_000_000) {
    points.push('Solide Umsatz-Basis im siebenstelligen Bereich');
  } else if (ctx.umsatz && ctx.umsatz >= 1_000_000) {
    points.push('Stabile, planbare Erlöse');
  }

  // Branche-spezifisch
  if (ctx.branche) {
    const brancheBonus: Record<string, string> = {
      software_saas: 'Wiederkehrende Erlöse durch Abo-Modell',
      it_services: 'Langfristige Service-Verträge mit Kunden',
      healthcare: 'Treuer Patienten-/Kundenstamm',
      maschinenbau: 'Spezialisiertes technisches Know-how',
      bau_handwerk: 'Gut gefülltes Auftragsbuch',
      beratung_treuhand: 'Wiederkehrende Mandate, hohe Kundenbindung',
      gastro_hotel: 'Etablierte Stammgäste',
      handel_ecommerce: 'Eigene Marken / wiederkehrende Käufer',
      immobilien: 'Stabile Mieteinnahmen',
    };
    if (brancheBonus[ctx.branche]) {
      points.push(brancheBonus[ctx.branche]);
    }
  }

  // Default Übergabe-Argument
  points.push('Klare Übergabe-Strategie mit Einarbeitung');

  return points.slice(0, 5);
}

/**
 * Smart-Kaufpreis: aus Smart-Bewertung den mittleren Wert
 */
export function suggestKaufpreis(ctx: SmartContext): number | null {
  if (ctx.estimated_value_mid && ctx.estimated_value_mid > 0) {
    // Auf nächste 10'000 runden
    return Math.round(ctx.estimated_value_mid / 10_000) * 10_000;
  }
  // Fallback: 5x EBITDA wenn Bewertung fehlt
  if (ctx.ebitda && ctx.ebitda > 0) {
    return Math.round((ctx.ebitda * 5) / 10_000) * 10_000;
  }
  return null;
}

/**
 * Smart-Übergabe-Defaults
 */
export function suggestUebergabeGrund(ctx: SmartContext): string {
  const alter = ctx.gruendungsjahr ? new Date().getFullYear() - ctx.gruendungsjahr : 0;
  // Annahme: lange Marktpräsenz = Pensionierung als wahrscheinlichstes Motiv
  if (alter >= 25) return 'pensionierung';
  if (alter >= 15) return 'altersnachfolge';
  return 'strategischer_exit';
}

export const DEFAULT_UEBERGABE_ZEITPUNKT = '6M';
export const DEFAULT_FINANZIERUNG = 'verhandlungsfaehig';
export const DEFAULT_IMMOBILIEN = 'auf_anfrage';

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function formatMaBucket(n: number): string {
  if (n < 10) return 'unter 10';
  if (n < 20) return '10–20';
  if (n < 50) return '20–50';
  if (n < 100) return '50–100';
  return 'über 100';
}

function formatChfBucket(n: number): string {
  if (n < 250_000) return 'unter CHF 250\'000';
  if (n < 500_000) return 'CHF 250–500\'000';
  if (n < 1_000_000) return 'CHF 500\'000–1 Mio';
  if (n < 2_000_000) return 'CHF 1–2 Mio';
  if (n < 5_000_000) return 'CHF 2–5 Mio';
  if (n < 10_000_000) return 'CHF 5–10 Mio';
  if (n < 20_000_000) return 'CHF 10–20 Mio';
  return 'über CHF 20 Mio';
}

/**
 * Wendet alle Smart-Defaults auf ein Inserat-Objekt an.
 * Felder die schon gesetzt sind, werden NICHT überschrieben.
 * Returns: Patch-Objekt mit nur den neu vorgeschlagenen Feldern.
 */
export function applySmartDefaults<T extends Record<string, any>>(
  current: T,
  ctx: SmartContext,
): Partial<T> {
  const patch: Record<string, any> = {};

  if (!current.titel) {
    const v = suggestTitel(ctx);
    if (v) patch.titel = v;
  }
  if (!current.teaser) {
    const v = suggestTeaser(ctx);
    if (v) patch.teaser = v;
  }
  if (!current.beschreibung) {
    const v = suggestBeschreibung(ctx);
    if (v) patch.beschreibung = v;
  }
  if (!current.sales_points || current.sales_points.length === 0) {
    const v = suggestSalesPoints(ctx);
    if (v.length > 0) patch.sales_points = v;
  }
  if (!current.kaufpreis_chf && !current.kaufpreis_min_chf) {
    const v = suggestKaufpreis(ctx);
    if (v) patch.kaufpreis_chf = v;
  }
  if (!current.uebergabe_grund && !current.grund) {
    patch.uebergabe_grund = suggestUebergabeGrund(ctx);
  }
  if (!current.uebergabe_zeitpunkt) {
    patch.uebergabe_zeitpunkt = DEFAULT_UEBERGABE_ZEITPUNKT;
  }
  if (!current.finanzierung) {
    patch.finanzierung = DEFAULT_FINANZIERUNG;
  }
  if (!current.immobilien) {
    patch.immobilien = DEFAULT_IMMOBILIEN;
  }

  return patch as Partial<T>;
}
