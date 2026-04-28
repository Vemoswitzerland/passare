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
    'Skalierbares Software-Geschäft mit Abo-Modell',
    'Schweizer Software-Pionier mit klarer Marktnische',
    'Etablierte B2B-Plattform mit hoher Kundenbindung',
    'Profitable Tech-Firma mit klaren Wachstumshebeln',
  ],
  it_services: [
    'Etablierter IT-Dienstleister aus {region}',
    'Spezialisiertes IT-Service-Unternehmen mit langfristigen Verträgen',
    'Solider IT-Partner mit eingespielten Kundenbeziehungen',
    'Schweizer IT-Spezialist mit treuem Mittelstands-Klientel',
    'Profitabler Managed-Service-Anbieter mit wiederkehrenden Erlösen',
    'Etablierte IT-Beratung mit Top-Referenzen',
  ],
  healthcare: [
    'Etablierte Gesundheitsdienstleistung aus {region}',
    'Spezialisierte Praxis mit treuem Patientenstamm',
    'Profitable Medtech-Firma mit Wachstumspotential',
    'Etablierter Gesundheits-Anbieter mit eingespieltem Team',
    'Schweizer Gesundheits-Spezialist mit klarem Profil',
    'Solide Praxisgemeinschaft mit langjähriger Tradition',
  ],
  maschinenbau: [
    'Spezialisierter Maschinenbau-Betrieb aus {region}',
    'Eigentümergeführter Maschinenbau mit klaren Stärken',
    'Etablierte Fertigung mit langjährigem Know-how',
    'Profitabler Schweizer Maschinenbauer mit eigenen Lösungen',
    'Spezialisiertes Engineering-Unternehmen aus {region}',
    'Inhabergeführter Maschinenbau mit Top-Kundenbeziehungen',
    'Etablierter Anlagenbauer mit weltweiten Referenzen',
  ],
  bau_handwerk: [
    'Eigentümergeführter Handwerksbetrieb aus {region}',
    'Etabliertes Bauunternehmen mit stabiler Auftragslage',
    'Spezialisierter Handwerksbetrieb mit Stammkunden',
    'Schweizer Handwerksunternehmen mit eingespieltem Team',
    'Profitabler Bau-Spezialist mit gefülltem Auftragsbuch',
    'Inhabergeführtes Bau-Unternehmen mit Top-Reputation',
  ],
  beratung_treuhand: [
    'Spezialisierte Beratungsfirma aus {region}',
    'Etabliertes Treuhand-Unternehmen mit Top-Klienten',
    'Profitable Beratungsfirma mit wiederkehrenden Mandaten',
    'Schweizer Treuhand-Spezialist mit treuer Mandantschaft',
    'Inhabergeführte Beratung mit hoher Kundenbindung',
    'Etabliertes Treuhand-Büro in {region} mit klaren Stärken',
  ],
  industrie_chemie: [
    'Etablierter Industriebetrieb aus {region}',
    'Spezialisiertes Produktionsunternehmen mit Markennischen',
    'Solider Industriepartner mit langfristigen Lieferverträgen',
    'Schweizer Hersteller mit eigenen Spezialprodukten',
    'Profitabler Chemie-Spezialist mit B2B-Fokus',
    'Etablierter Produzent mit eigener Marke',
  ],
  elektrotechnik: [
    'Spezialisierter Elektrotechnik-Betrieb aus {region}',
    'Etabliertes Unternehmen mit eigenen Spezialprodukten',
    'Schweizer Elektrotechnik-Spezialist mit Top-Referenzen',
    'Inhabergeführtes Sensorik-/Messtechnik-Unternehmen',
    'Profitabler Automation-Anbieter mit eigenem Engineering',
  ],
  lebensmittel: [
    'Traditionsreicher Lebensmittelbetrieb aus {region}',
    'Etablierte Bäckerei/Konditorei mit Stammkunden',
    'Spezialisierter Lebensmittelhersteller mit eigenen Marken',
    'Profitabler Schweizer Lebensmittelproduzent',
    'Familienbetrieb mit eigenen Spezialitäten in {region}',
    'Etablierter Hersteller mit Top-Distributionspartnern',
  ],
  telco_utilities: [
    'Etabliertes Versorgungsunternehmen aus {region}',
    'Spezialisierter Telco-Anbieter mit eigenem Netz',
    'Solider Energie-Anbieter mit treuer Kundenbasis',
    'Schweizer Versorger mit klarer Marktposition',
  ],
  automotive: [
    'Etablierte Garage/Carrosserie aus {region}',
    'Eigentümergeführter Autobetrieb mit Stammkunden',
    'Spezialisierter Fahrzeug-Service mit Top-Reputation',
    'Inhabergeführte Werkstatt mit eingespieltem Team',
    'Profitabler Autohändler mit Marken-Vertretung',
  ],
  handel_ecommerce: [
    'Etablierter Online-Shop mit eigenen Marken',
    'Profitabler E-Commerce-Betrieb aus {region}',
    'Spezialisierter Handel mit Wachstumspotential',
    'Schweizer Detailhändler mit treuer Stammkundschaft',
    'Profitable Nische im E-Commerce mit eigener Marke',
    'Etablierter Grosshändler mit Top-B2B-Beziehungen',
  ],
  medien_verlage: [
    'Etablierter Medienbetrieb aus {region}',
    'Spezialisierte Werbeagentur mit Top-Kunden',
    'Profitabler Verlag mit treuer Leserbasis',
    'Schweizer Kommunikationsagentur mit Premium-Klientel',
    'Etabliertes Designstudio mit eingespieltem Team',
  ],
  logistik_transport: [
    'Etabliertes Logistikunternehmen aus {region}',
    'Spezialisierter Transportbetrieb mit eigenem Fuhrpark',
    'Schweizer Spedition mit Top-B2B-Verträgen',
    'Profitabler Logistik-Anbieter mit Lager-Infrastruktur',
    'Inhabergeführter Transport-Spezialist mit Stammkundschaft',
  ],
  textil: [
    'Etablierter Textilbetrieb aus {region}',
    'Schweizer Textilhersteller mit eigener Marke',
    'Profitable Mode-Manufaktur mit treuer Kundschaft',
  ],
  gastro_hotel: [
    'Familiengeführtes Restaurant in {region}',
    'Etabliertes Gastro-Lokal mit Stammgästen',
    'Profitables Hotel mit treuer Klientel',
    'Schweizer Gastronomie-Klassiker mit Tradition',
    'Inhabergeführte Hospitality-Adresse in {region}',
    'Etabliertes Hotel-Restaurant mit Top-Reputation',
  ],
  immobilien: [
    'Etabliertes Immobilien-Unternehmen aus {region}',
    'Spezialisierte Liegenschaftsverwaltung mit Stammkunden',
    'Schweizer Immobilien-Spezialist mit langjähriger Erfahrung',
    'Profitable Hausverwaltung mit treuer Eigentümerschaft',
    'Inhabergeführter Makler mit Top-Reputation in {region}',
    'Etabliertes Real-Estate-Unternehmen mit eigenem Portfolio',
    'Spezialisierte Immobilien-Beratung mit Premium-Klientel',
  ],
  andere: [
    'Etabliertes Dienstleistungsunternehmen aus {region}',
    'Profitabler Spezialbetrieb mit Wachstumspotential',
    'Schweizer Familienunternehmen mit klaren Stärken',
    'Inhabergeführter Spezialist mit Top-Reputation',
  ],
};

/**
 * Eröffnungs-Sätze für Beschreibung — Variationen statt Copy-Paste
 */
const BESCHREIBUNG_EROEFFNUNGEN: string[] = [
  'Etabliertes Unternehmen aus dem Bereich {branche}, mit Sitz in {region}.',
  'Solides {branche}-Unternehmen mit klarer Marktposition in {region}.',
  'Inhabergeführter Betrieb im Segment {branche}, beheimatet in {region}.',
  'Profitable {branche}-Firma mit klarem Profil und Sitz in {region}.',
  'Spezialisiertes {branche}-Unternehmen mit langjähriger Markterfahrung in {region}.',
];

const BESCHREIBUNG_USP_HOCH: string[] = [
  'Die Profitabilität liegt deutlich über dem Branchenschnitt — ein Indikator für effiziente Strukturen und klare Marktpositionierung.',
  'Top-Margen sind das Ergebnis konsequenter Effizienz und einer eingespielten Operations-Pipeline.',
  'Überdurchschnittliche Rentabilität dank schlanker Strukturen und treuer Kundenbasis.',
  'Die Firma erwirtschaftet Premium-Margen — Beleg für eine starke Marktposition und disziplinierte Führung.',
];

const BESCHREIBUNG_USP_MITTEL: string[] = [
  'Solide Profitabilität, stabile Cashflows und klare Wachstumshebel für den Käufer.',
  'Stabile Cashflows und planbare Erlöse — eine solide Basis für den nächsten Wachstumsschritt.',
  'Verlässliche Profitabilität mit klaren Optionen auf Margen-Steigerung durch den Käufer.',
];

const BESCHREIBUNG_UEBERGABE: string[] = [
  'Der Verkauf erfolgt aus persönlichen Gründen. Eine geordnete Übergabe und Einarbeitung ist garantiert. Wir suchen einen Käufer der unsere Werte und unsere Kundenbeziehungen langfristig pflegt.',
  'Aus persönlichen Gründen suchen wir eine Nachfolge. Sorgfältige Einarbeitung und ein nahtloser Übergang sind selbstverständlich.',
  'Aufgrund einer Lebensphase-Veränderung übergeben wir das Unternehmen in vertrauensvolle Hände. Eine ausführliche Übergabe-Periode ist möglich.',
  'Wir suchen den passenden Nachfolger der unsere Mannschaft, unsere Kunden und unsere Marke fortführt. Übergabe-Begleitung garantiert.',
];

/** Einfacher deterministischer Hash auf einen String, gibt 0..n−1 zurück */
function pickIndex(seed: string | undefined | null, n: number): number {
  if (!seed || n <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % n;
}

export type SmartContext = {
  branche?: string | null;
  kanton?: string | null;
  gruendungsjahr?: number | null;
  mitarbeitende?: number | null;
  umsatz?: number | null;
  ebitda?: number | null;
  estimated_value_mid?: number | null;
  firma_rechtsform?: string | null;
  /** Seed für deterministische Variation (z.B. inserat.id oder firma_name) */
  seed?: string | null;
};

/**
 * Smart-Titel: aus Branche + Region einen plausiblen Default-Titel
 * — variiert deterministisch mit dem Seed (Inserat-ID), so dass nicht
 * alle Immobilien-Firmen den gleichen Titel bekommen.
 */
export function suggestTitel(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const templates = BRANCHE_TO_TITEL_TEMPLATES[ctx.branche] ?? BRANCHE_TO_TITEL_TEMPLATES.andere;
  const region = ctx.kanton ? (KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}`) : 'der Schweiz';
  const idx = pickIndex(ctx.seed, templates.length);
  return templates[idx].replace(/\{region\}/g, region);
}

/**
 * Smart-Teaser: 1-2 Sätze, prägnant, anonymisiert — auch hier
 * variiert die Eröffnung damit Inserate sich unterscheiden.
 */
export function suggestTeaser(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const branche = BRANCHEN_MULTIPLES[ctx.branche]?.label ?? 'Dienstleistung';
  const region = ctx.kanton ? KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}` : 'der Schweiz';
  const margin = ctx.umsatz && ctx.ebitda ? (ctx.ebitda / ctx.umsatz) * 100 : 0;

  const eroeffnungen = [
    `${branche} in ${region}.`,
    `Etabliertes ${branche}-Unternehmen mit Sitz in ${region}.`,
    `Schweizer ${branche}-Spezialist aus ${region}.`,
  ];

  const altersHinweise: string[] = ctx.gruendungsjahr
    ? [
        `Seit ${new Date().getFullYear() - ctx.gruendungsjahr} Jahren etabliert.`,
        `${new Date().getFullYear() - ctx.gruendungsjahr} Jahre erfolgreiche Marktpräsenz.`,
        `Über ${new Date().getFullYear() - ctx.gruendungsjahr} Jahre Markterfahrung.`,
      ]
    : ['Seit vielen Jahren am Markt.'];

  const margeHinweise =
    margin >= 18 ? ['Top-Margen über dem Branchenschnitt.', 'Premium-Profitabilität.', 'Klare Marktposition mit überdurchschnittlicher Marge.'] :
    margin >= 10 ? ['Solide Profitabilität.', 'Stabile Erlös- und Margen-Struktur.', 'Verlässliche Cashflows.'] :
    ['Stabile Erlösbasis.', 'Klare Markt-Position.'];

  const maHinweise: string[] = ctx.mitarbeitende && ctx.mitarbeitende >= 10
    ? [
        `Eingespieltes Team von ${formatMaBucket(ctx.mitarbeitende)} Mitarbeitenden.`,
        `${formatMaBucket(ctx.mitarbeitende)} Mitarbeitende — eingespielte Mannschaft.`,
        `Operative Mannschaft mit ${formatMaBucket(ctx.mitarbeitende)} Mitarbeitenden.`,
      ]
    : ['Schlanke Struktur, klare Übergabe.', 'Klare Operations, übergabe-fähig.'];

  const seed = ctx.seed ?? '';
  return [
    eroeffnungen[pickIndex(seed + '-er', eroeffnungen.length)],
    altersHinweise[pickIndex(seed + '-alt', altersHinweise.length)],
    margeHinweise[pickIndex(seed + '-marge', margeHinweise.length)],
    maHinweise[pickIndex(seed + '-ma', maHinweise.length)],
  ].join(' ').trim();
}

/**
 * Smart-Beschreibung: vollständiger Text in 4 Blöcken — alle
 * Blöcke variieren mit dem Seed.
 */
export function suggestBeschreibung(ctx: SmartContext): string | null {
  if (!ctx.branche) return null;
  const branche = BRANCHEN_MULTIPLES[ctx.branche]?.label ?? 'Branche';
  const region = ctx.kanton ? KANTON_TO_REGION[ctx.kanton] ?? `Kanton ${ctx.kanton}` : 'der Schweiz';
  const alter = ctx.gruendungsjahr ? new Date().getFullYear() - ctx.gruendungsjahr : null;
  const margin = ctx.umsatz && ctx.ebitda ? (ctx.ebitda / ctx.umsatz) * 100 : null;
  const seed = ctx.seed ?? '';

  const teile: string[] = [];

  // Block 1: Eröffnung — variiert
  const eroeff = BESCHREIBUNG_EROEFFNUNGEN[pickIndex(seed + '-eroef', BESCHREIBUNG_EROEFFNUNGEN.length)]
    .replace(/\{branche\}/g, branche)
    .replace(/\{region\}/g, region);
  teile.push(eroeff);
  if (alter) {
    teile.push(` Seit ${alter} Jahren erfolgreich am Markt.`);
  }
  teile.push(' Wir bedienen einen treuen Kundenstamm und haben uns über die Jahre einen klaren Namen aufgebaut.');

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

  // Block 3: USP — variiert je nach Margen-Stärke
  if (margin && margin >= 18) {
    teile.push('\n\n' + BESCHREIBUNG_USP_HOCH[pickIndex(seed + '-usp', BESCHREIBUNG_USP_HOCH.length)]);
  } else if (margin && margin >= 10) {
    teile.push('\n\n' + BESCHREIBUNG_USP_MITTEL[pickIndex(seed + '-usp', BESCHREIBUNG_USP_MITTEL.length)]);
  }

  if (alter && alter >= 20) {
    teile.push(`\n\nMit ${alter} Jahren Markt-Tradition gehören wir zu den etablierten Anbietern in unserem Segment.`);
  }

  // Block 4: Übergabe — variiert
  teile.push('\n\n' + BESCHREIBUNG_UEBERGABE[pickIndex(seed + '-ueb', BESCHREIBUNG_UEBERGABE.length)]);

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
