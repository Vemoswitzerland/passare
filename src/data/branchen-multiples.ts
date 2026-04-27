// ════════════════════════════════════════════════════════════════════
// passare.ch — Branchen-Multiples für Smart-Bewertung
// ════════════════════════════════════════════════════════════════════
// Q1/2026 — Quellen: con|cess M+A Schweiz, DUB Multiples, NIMBO,
// saner-consulting.ch (vom Bundesrat KMU-Portal empfohlen).
// CH-Aufschlag +0.5x ggü. DACH-Schnitt (höheres Margen-/Lohnniveau).

export type BrancheMultiple = {
  id: string;
  label: string;
  ebitda: number;
  umsatz: number;
  // Keywords für Auto-Matching aus Zefix `purpose`-String
  nogaKeywords: string[];
};

export const BRANCHEN_MULTIPLES: Record<string, BrancheMultiple> = {
  software_saas: {
    id: 'software_saas',
    label: 'Software & SaaS',
    ebitda: 7.0,
    umsatz: 1.4,
    nogaKeywords: ['software', 'saas', 'it-entwicklung', 'programmierung', 'app', 'plattform'],
  },
  it_services: {
    id: 'it_services',
    label: 'IT-Services',
    ebitda: 6.0,
    umsatz: 1.0,
    nogaKeywords: ['it-service', 'managed-service', 'hosting', 'cloud', 'support', 'systeme'],
  },
  healthcare: {
    id: 'healthcare',
    label: 'Gesundheit & Medtech',
    ebitda: 6.5,
    umsatz: 1.2,
    nogaKeywords: ['gesundheit', 'medizin', 'praxis', 'medtech', 'pflege', 'arzt', 'physiotherapie'],
  },
  maschinenbau: {
    id: 'maschinenbau',
    label: 'Maschinen- & Anlagenbau',
    ebitda: 6.5,
    umsatz: 0.9,
    nogaKeywords: ['maschinen', 'anlagen', 'fertigung', 'produktion', 'präzision', 'spezialmaschinen'],
  },
  bau_handwerk: {
    id: 'bau_handwerk',
    label: 'Bau & Handwerk',
    ebitda: 5.5,
    umsatz: 0.6,
    nogaKeywords: ['bau', 'handwerk', 'maler', 'schreiner', 'sanitär', 'elektriker', 'gartenbau'],
  },
  beratung_treuhand: {
    id: 'beratung_treuhand',
    label: 'Beratung & Treuhand',
    ebitda: 5.5,
    umsatz: 0.9,
    nogaKeywords: ['beratung', 'treuhand', 'consulting', 'wirtschaftsprüfer', 'steuer', 'revision'],
  },
  industrie_chemie: {
    id: 'industrie_chemie',
    label: 'Industrie & Chemie',
    ebitda: 5.5,
    umsatz: 0.8,
    nogaKeywords: ['industrie', 'chemie', 'kunststoff', 'verarbeitung', 'pharma'],
  },
  elektrotechnik: {
    id: 'elektrotechnik',
    label: 'Elektrotechnik',
    ebitda: 5.5,
    umsatz: 0.7,
    nogaKeywords: ['elektro', 'elektronik', 'sensorik', 'messtechnik', 'automation'],
  },
  lebensmittel: {
    id: 'lebensmittel',
    label: 'Lebensmittel & Getränke',
    ebitda: 5.5,
    umsatz: 0.7,
    nogaKeywords: ['lebensmittel', 'bäckerei', 'metzgerei', 'getränke', 'brauerei', 'käserei'],
  },
  telco_utilities: {
    id: 'telco_utilities',
    label: 'Telco & Energie',
    ebitda: 5.5,
    umsatz: 1.0,
    nogaKeywords: ['telekom', 'energie', 'wasser', 'strom', 'utilities', 'versorgung'],
  },
  automotive: {
    id: 'automotive',
    label: 'Automotive',
    ebitda: 5.0,
    umsatz: 0.5,
    nogaKeywords: ['auto', 'garage', 'carrosserie', 'fahrzeug', 'motorsport'],
  },
  handel_ecommerce: {
    id: 'handel_ecommerce',
    label: 'Handel & E-Commerce',
    ebitda: 4.5,
    umsatz: 0.5,
    nogaKeywords: ['handel', 'detailhandel', 'grosshandel', 'e-commerce', 'onlineshop', 'verkauf'],
  },
  medien_verlage: {
    id: 'medien_verlage',
    label: 'Medien & Verlage',
    ebitda: 4.5,
    umsatz: 0.7,
    nogaKeywords: ['medien', 'verlag', 'druckerei', 'grafik', 'werbung', 'agentur'],
  },
  logistik_transport: {
    id: 'logistik_transport',
    label: 'Logistik & Transport',
    ebitda: 4.5,
    umsatz: 0.5,
    nogaKeywords: ['logistik', 'transport', 'spedition', 'kurier', 'lager'],
  },
  textil: {
    id: 'textil',
    label: 'Textil & Bekleidung',
    ebitda: 4.5,
    umsatz: 0.5,
    nogaKeywords: ['textil', 'bekleidung', 'mode', 'näherei'],
  },
  gastro_hotel: {
    id: 'gastro_hotel',
    label: 'Gastro & Hotellerie',
    ebitda: 3.5,
    umsatz: 0.4,
    nogaKeywords: ['gastro', 'restaurant', 'hotel', 'gasthaus', 'bar', 'café', 'beherbergung'],
  },
  immobilien: {
    id: 'immobilien',
    label: 'Immobilien',
    ebitda: 5.5,
    umsatz: 1.0,
    nogaKeywords: ['immobilien', 'liegenschaft', 'verwaltung', 'makler'],
  },
  andere: {
    id: 'andere',
    label: 'Andere Dienstleistungen',
    ebitda: 5.0,
    umsatz: 0.7,
    nogaKeywords: [],
  },
};

export const BRANCHEN_LIST = Object.values(BRANCHEN_MULTIPLES).sort((a, b) =>
  a.label.localeCompare(b.label, 'de'),
);

/**
 * Heuristisches Matching: Zefix `purpose`-String → beste Branche
 * Returns null wenn kein Match gefunden.
 */
export function matchBrancheFromPurpose(purpose: string | null | undefined): string | null {
  if (!purpose) return null;
  const lower = purpose.toLowerCase();
  let bestId: string | null = null;
  let bestScore = 0;

  for (const branche of BRANCHEN_LIST) {
    const score = branche.nogaKeywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestId = branche.id;
    }
  }
  return bestId;
}
