// ════════════════════════════════════════════════════════════════════
// passare.ch — Verkäufer-Pakete + Powerups
// ────────────────────────────────────────────────────────────────────
// Drei Pakete: Light / Pro / Premium.
// Zwei Laufzeiten: 12 oder 6 Monate (6 Monate = +20 % Aufschlag pro
// Monat — kürzer kostet relativ mehr).
// Klein-Inserat-Rabatt: 25 % bei Verkaufspreis < CHF 500'000
// (gleiche Schwelle wie companymarket).
//
// Decoy-Logik: Light → Pro nur 180 CHF Sprung (= "Pull zu Pro"),
// Pro → Premium 1'000 CHF Sprung (= klares Power-Tier).
// Pro liegt psychologisch unter 1'000 CHF.
// ════════════════════════════════════════════════════════════════════

export type PaketTier = 'light' | 'pro' | 'premium';
export type Laufzeit = 6 | 12; // Monate

// ── Klein-Inserat-Rabatt ────────────────────────────────────────────
/** Schwellenwert für Klein-Inserat-Rabatt (gleich wie companymarket). */
export const KLEIN_INSERAT_SCHWELLE_CHF = 500_000;
/** Rabatt in Prozent für Klein-Inserate. */
export const KLEIN_INSERAT_RABATT_PCT = 25;

// ── Paket-Features (Was ist drin?) ──────────────────────────────────
export type PaketFeatures = {
  inseratLive: boolean;
  anfragenEmpfangen: boolean;
  inAppChat: boolean;
  vollStatistik: boolean;
  datenraum: boolean;
  /** Wie viele Hervorhebungen (Seite 1 + Top Branchenfilter) pro Jahr inklusive */
  hervorhebungProJahr: number;
  /** Wie viele Newsletter-Slots pro Jahr inklusive */
  newsletterProJahr: number;
  /** Wie viele zusätzliche Mitarbeiter-Logins erlaubt */
  mitarbeiterSeats: number;
  /** Verkäufer sieht Käuferprofil-Eckdaten bei Anfrage */
  kaeuferprofilEinsicht: boolean;
};

export type Paket = {
  id: PaketTier;
  label: string;
  /** Tagline für Marketing-Karten */
  tagline: string;
  /** Reguläre Preise pro Laufzeit (NEU) */
  preis: Record<Laufzeit, number>;
  /** Klein-Inserat-Rabatt-Preise (25 % unter regulär) */
  preisKlein: Record<Laufzeit, number>;
  /** Strukturierte Features (NEU) */
  features: PaketFeatures;
  /** "Beliebtester"-Anchor für UI */
  highlight?: boolean;

  // ── BACKWARDS-COMPAT (deprecated, für InseratWizard.tsx) ─────────
  /** @deprecated Default-Preis = 12M-Variante. Nutze paket.preis[12]. */
  preisDefault: number;
  /** @deprecated Standard-Laufzeit = 12 Monate. Nutze direkt 12. */
  laufzeitMonate: number;
  /** @deprecated Bewertungsbereich-Stub für alten Wizard. */
  bewertungsbereich: { min: number; max: number | null };
  /** @deprecated Feature-Liste (string-basiert) für alten Wizard. */
  featuresList: string[];
  /** @deprecated CM-Vergleichspreis. Nutze getCompanymarketReferenz(). */
  preisRefCompanymarket: number;
};

// ── Pakete ──────────────────────────────────────────────────────────
export const PAKETE: Record<PaketTier, Paket> = {
  light: {
    id: 'light',
    label: 'Light',
    tagline: 'Inserier deine Firma unkompliziert.',
    preis: { 12: 710, 6: 425 },
    preisKlein: { 12: 535, 6: 320 },
    features: {
      inseratLive: true,
      anfragenEmpfangen: true,
      inAppChat: true,
      vollStatistik: true,
      datenraum: false,
      hervorhebungProJahr: 0,
      newsletterProJahr: 0,
      mitarbeiterSeats: 0,
      kaeuferprofilEinsicht: false,
    },
    // Backwards-Compat
    preisDefault: 710,
    laufzeitMonate: 12,
    bewertungsbereich: { min: 0, max: 500_000 },
    featuresList: [
      'Inserat live · 12 Monate',
      'Anfragen empfangen · In-App-Chat',
      'Vollständige Statistik · Charts + Conversion',
      'Pauschalpreis · keine Folgekosten',
      '0 % Erfolgsprovision',
    ],
    preisRefCompanymarket: 550,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    tagline: 'Verkauf wie ein Profi — mit Datenraum und Hervorhebung.',
    preis: { 12: 890, 6: 535 },
    preisKlein: { 12: 670, 6: 400 },
    features: {
      inseratLive: true,
      anfragenEmpfangen: true,
      inAppChat: true,
      vollStatistik: true,
      datenraum: true,
      hervorhebungProJahr: 4,
      newsletterProJahr: 0,
      mitarbeiterSeats: 0,
      kaeuferprofilEinsicht: false,
    },
    highlight: true, // ANCHOR — "Beliebteste Wahl"
    // Backwards-Compat
    preisDefault: 890,
    laufzeitMonate: 12,
    bewertungsbereich: { min: 500_000, max: 5_000_000 },
    featuresList: [
      'Alles aus Light',
      'Datenraum mit Audit-Log',
      'Hervorhebung 4× pro Jahr · Seite 1 + Top Branchenfilter',
      'Pauschalpreis · keine Folgekosten',
    ],
    preisRefCompanymarket: 900,
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    tagline: 'Maximaler Schaufenster-Effekt — wir pushen dich.',
    preis: { 12: 1_890, 6: 1_140 },
    preisKlein: { 12: 1_420, 6: 855 },
    features: {
      inseratLive: true,
      anfragenEmpfangen: true,
      inAppChat: true,
      vollStatistik: true,
      datenraum: true,
      hervorhebungProJahr: 12,
      newsletterProJahr: 2,
      mitarbeiterSeats: 3,
      kaeuferprofilEinsicht: true,
    },
    // Backwards-Compat
    preisDefault: 1_890,
    laufzeitMonate: 12,
    bewertungsbereich: { min: 5_000_000, max: null },
    featuresList: [
      'Alles aus Pro',
      'Hervorhebung 12× pro Jahr',
      'Newsletter-Slot 2× pro Jahr',
      'Bis 3 Mitarbeiter onboarden',
      'Käuferprofil-Einsicht bei Anfragen',
    ],
    preisRefCompanymarket: 1_000,
  },
};

export const PAKETE_LIST: Paket[] = [
  PAKETE.light,
  PAKETE.pro,
  PAKETE.premium,
];

// ── Helpers: Pricing-Logik ──────────────────────────────────────────

/**
 * Prüft ob ein Inserat als Klein-Inserat gilt (Rabatt-berechtigt).
 * Bei VHB-Range zählt das obere Range-Ende.
 */
export function isKleinInserat(input: {
  kaufpreis_chf?: number | null;
  kaufpreis_max_chf?: number | null;
  kaufpreis_vhb?: boolean;
}): boolean {
  // Bei Range: oberes Ende ausschlaggebend
  if (input.kaufpreis_max_chf && input.kaufpreis_max_chf > 0) {
    return input.kaufpreis_max_chf < KLEIN_INSERAT_SCHWELLE_CHF;
  }
  // Bei festem Preis
  if (input.kaufpreis_chf && input.kaufpreis_chf > 0) {
    return input.kaufpreis_chf < KLEIN_INSERAT_SCHWELLE_CHF;
  }
  // Bei VHB ohne Wert: kein Rabatt (nicht eindeutig klein)
  return false;
}

/**
 * Berechnet den effektiven Preis für ein Paket basierend auf Laufzeit
 * und Klein-Inserat-Status.
 */
export function getPaketPreis(
  tier: PaketTier,
  laufzeit: Laufzeit,
  klein: boolean,
): number {
  const paket = PAKETE[tier];
  return klein ? paket.preisKlein[laufzeit] : paket.preis[laufzeit];
}

/**
 * Berechnet wie viele Hervorhebungen pro Laufzeit inklusive sind.
 * Bei 6 Monaten anteilig (halbiert).
 */
export function getInkludierteHervorhebungen(
  tier: PaketTier,
  laufzeit: Laufzeit,
): number {
  const proJahr = PAKETE[tier].features.hervorhebungProJahr;
  return laufzeit === 12 ? proJahr : Math.floor(proJahr / 2);
}

/**
 * Berechnet wie viele Newsletter-Slots pro Laufzeit inklusive sind.
 * Bei 6 Monaten anteilig (halbiert).
 */
export function getInkludierteNewsletterSlots(
  tier: PaketTier,
  laufzeit: Laufzeit,
): number {
  const proJahr = PAKETE[tier].features.newsletterProJahr;
  return laufzeit === 12 ? proJahr : Math.floor(proJahr / 2);
}

/**
 * Smart-Empfehlung: welches Paket schlagen wir vor?
 * Default = Pro (Mittelpaket, Decoy-Anker).
 * Bei sehr grossen Firmen (>5 Mio Verkaufswert) → Premium.
 */
export function recommendPaket(verkaufswertChf: number | null | undefined): PaketTier {
  if (verkaufswertChf && verkaufswertChf > 5_000_000) return 'premium';
  return 'pro';
}

// ════════════════════════════════════════════════════════════════════
// POWERUPS — drei Boosts, einzeln zubuchbar
// ────────────────────────────────────────────────────────────────────

export type PowerupKategorie = 'sichtbarkeit' | 'reichweite' | 'service';

export type Powerup = {
  id: string;
  label: string;
  /** Marketing-Tagline (kurz) */
  tagline: string;
  /** Vollständige Beschreibung */
  beschreibung: string;
  preis: number;
  /** Sichtbares Einheits-Label ("7 Tage", "einmalig", "+6 Monate") */
  einheit: string;
  /** Laufzeit in Tagen — null = einmalig ohne Verfall */
  laufzeitTage: number | null;
  /** Lucide-Icon-Name */
  icon: string;
  /** Kategorie für Wizard-Gruppierung (Backwards-Compat) */
  kategorie: PowerupKategorie;
  /**
   * Bei "verlaengerung_6m": addiert 180 Tage zu inserat.expires_at
   * Bei "hervorhebung": setzt featured_until = now + 7 Tage
   * Bei "newsletter_slot": legt Eintrag in newsletter_queue an
   */
  effekt: 'hervorhebung' | 'newsletter_slot' | 'verlaengerung_6m';
};

export const POWERUPS: Powerup[] = [
  {
    id: 'hervorhebung',
    label: 'Hervorhebung',
    tagline: '7 Tage Top-Position im Marktplatz.',
    beschreibung:
      '7 Tage auf Seite 1 und Top-Position im Branchenfilter — sichtbar für jeden Käufer der im Marktplatz stöbert.',
    preis: 49,
    einheit: '7 Tage',
    laufzeitTage: 7,
    icon: 'Zap',
    kategorie: 'sichtbarkeit',
    effekt: 'hervorhebung',
  },
  {
    id: 'newsletter_slot',
    label: 'Newsletter-Slot',
    tagline: 'Eine prominente Erwähnung im Wochen-Newsletter.',
    beschreibung:
      'Eine prominente Erwähnung im nächsten passare-Wochen-Newsletter. Erreicht alle aktiven Käufer mit passendem Suchprofil.',
    preis: 86,
    einheit: 'einmalig',
    laufzeitTage: null,
    icon: 'Mail',
    kategorie: 'reichweite',
    effekt: 'newsletter_slot',
  },
  {
    id: 'laufzeit_6m',
    label: '+6 Monate Laufzeit',
    tagline: 'Inserat bleibt 6 Monate länger online.',
    beschreibung:
      'Verlängere dein Inserat um 6 Monate — ohne Neu-Veröffentlichung, ohne Datenverlust. Statistik, Anfragen und Datenraum laufen einfach weiter.',
    preis: 490,
    einheit: 'einmalig',
    laufzeitTage: 180,
    icon: 'Clock',
    kategorie: 'service',
    effekt: 'verlaengerung_6m',
  },
];

// ════════════════════════════════════════════════════════════════════
// BERATER-ABO (Phase 2 — kommt später)
// ────────────────────────────────────────────────────────────────────
// Vorbereitet aber im UI noch nicht aktiv. Für Broker-Registrierung
// auf der Verkaufen-Seite.

export type BeraterTier = {
  id: 'starter' | 'pro';
  label: string;
  preisJahr: number;
  preisMonat: number;
  inserateMax: number | 'unlimited';
  teamSeats: number;
  features: string[];
};

export const BERATER_TIERS: BeraterTier[] = [
  {
    id: 'starter',
    label: 'Broker Starter',
    preisJahr: 2_900,
    preisMonat: 290,
    inserateMax: 5,
    teamSeats: 0,
    features: [
      'Bis 5 aktive Inserate',
      'Multi-Mandat-Dashboard',
      'Brand-Profil mit Logo',
      'Eigene Profil-URL /broker/[slug]',
      'Agentur-Badge auf Inseraten',
      'Kombinierte Anfragen-Inbox',
    ],
  },
  {
    id: 'pro',
    label: 'Broker Pro',
    preisJahr: 8_900,
    preisMonat: 890,
    inserateMax: 25,
    teamSeats: 5,
    features: [
      'Bis 25 aktive Inserate',
      'Bis 5 Team-Mitglieder',
      'White-Label-Option (eigene Domain)',
      'Featured-Badge auf allen Inseraten',
      'Atlas-Highlight auf allen Inseraten',
      'Monatlicher Push-Boost (alle Inserate)',
      'Erweiterte Analytics + CSV-Export',
      'Prioritärer Account-Kontakt',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
// HELPER: companymarket-Vergleich für Marketing-Anker
// ────────────────────────────────────────────────────────────────────
// CM-Referenzpreise (Stand 04.2026):
//  - Small Business <250k: CHF 275
//  - Standard >250k: CHF 550 (+ 12M "Suche")
//  - Unlimitiert bis Verkauf: CHF 900
//  - Komplett-Paket: CHF 1'000

export const COMPANYMARKET_PREISE = {
  smallBusiness: 275,
  standard: 550,
  unlimitiert: 900,
  komplett: 1_000,
} as const;

/**
 * Findet den passenden CM-Referenzpreis für ein passare-Paket+Laufzeit.
 * Konservative Mappings:
 *   Light 12M → CM Standard (550)
 *   Pro 12M → CM Unlimitiert (900)
 *   Premium 12M → CM Komplett (1'000)
 */
export function getCompanymarketReferenz(tier: PaketTier, _laufzeit: Laufzeit): number {
  switch (tier) {
    case 'light':
      return COMPANYMARKET_PREISE.standard;
    case 'pro':
      return COMPANYMARKET_PREISE.unlimitiert;
    case 'premium':
      return COMPANYMARKET_PREISE.komplett;
  }
}

/**
 * Marketing-String "X % günstiger als companymarket" (oder null wenn passare teurer).
 */
export function getCompanymarketDifference(passarePreis: number, cmPreis: number | null): string | null {
  if (!cmPreis || cmPreis <= passarePreis) return null;
  const pct = Math.round(((cmPreis - passarePreis) / cmPreis) * 100);
  return `Bei companymarket CHF ${cmPreis.toLocaleString('de-CH')} — ${pct} % günstiger`;
}
