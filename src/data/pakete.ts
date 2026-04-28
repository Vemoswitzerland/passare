// ════════════════════════════════════════════════════════════════════
// passare.ch — Inserat-Pakete + Powerups
// ────────────────────────────────────────────────────────────────────
// Smart-Auto-Tier-Pricing: aus dem Pre-Reg-Funnel kennen wir den
// Verkaufswert bereits. Statt 6 verwirrende Pakete wie bei
// Companymarket schlagen wir AUTOMATISCH das richtige vor.
//
// Strategie: ÜBERALL leicht günstiger als Companymarket, aber smarter
// (Auto-Tier, transparente Powerups, "Bis Verkauf" als Default).
// ════════════════════════════════════════════════════════════════════

export type PaketTier = 'mini' | 'standard' | 'premium' | 'enterprise';

export type Paket = {
  id: PaketTier;
  label: string;
  /** "Bei Verkaufswert X bis Y" */
  bewertungsbereich: { min: number; max: number | null };
  preis: number;
  preisRefCompanymarket: number;
  /** Laufzeit in Monaten — null = unbegrenzt bis Verkauf */
  laufzeitMonate: number | null;
  features: string[];
  highlight?: boolean;
};

// Verkaufspsychologie:
//  - Charm-Pricing (.49 / .99 / .9 endings)
//  - Standard ist der ANCHOR + "Beliebtester"-Badge
//  - Abnehmende Aufschläge zwischen Tiers (höher der Tier, kleinerer
//    relativer Sprung) — User spürt "Premium ist nur ein bisschen mehr"
//  - Enterprise knapp unter Companymarket-Komplett-Paket-Preis
//    (0.1% Differenz wirkt psychologisch wie "gleich, aber günstiger")
export const PAKETE: Record<PaketTier, Paket> = {
  mini: {
    id: 'mini',
    label: 'Mini',
    bewertungsbereich: { min: 0, max: 250_000 },
    preis: 249,                                  // 249 vs CM 275 (−9%)
    preisRefCompanymarket: 275,
    laufzeitMonate: null,
    features: [
      'Inserat live bis zum Verkauf',           // CM: nur 6 Monate
      'Smart-Bewertung mit Faktoren-Analyse',
      'Anfragen-Inbox mit Käufer-Scoring',
      'NDA-Pipeline',
      'Datenraum mit Audit-Log',
      'Pauschalpreis · keine Folgekosten',
      'KMU-Rabatt automatisch erkannt',
    ],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    bewertungsbereich: { min: 250_000, max: 2_000_000 },
    preis: 449,                                  // 449 vs CM 550 (−18%)
    preisRefCompanymarket: 550,
    laufzeitMonate: null,
    features: [
      'Inserat live bis zum Verkauf',
      'KI-Teaser-Generator',
      'Anfragen-Scoring + Drawer',
      'NDA-Pipeline mit Versionierung',
      'Datenraum + Käufer-Audit',
      'Mehrsprachiges Inserat (DE/EN/FR/IT)',
      'Pauschalpreis · keine Folgekosten',
    ],
    highlight: true,                             // ANCHOR / "Beliebtester"
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    bewertungsbereich: { min: 2_000_000, max: 10_000_000 },
    preis: 699,                                  // 699 vs CM 900 (−22%)
    preisRefCompanymarket: 900,
    laufzeitMonate: null,
    features: [
      'Alles aus Standard',
      'PDF-Exposé-Generator (KI) inklusive',
      'Featured-Listing Goldrand 30 Tage',
      'Top-3-Boost 1× pro Quartal',
      'Priority-Anfragen-Routing',
    ],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    bewertungsbereich: { min: 10_000_000, max: null },
    preis: 949,                                  // 949 vs CM 1'000 (−5%)
    preisRefCompanymarket: 1_000,
    laufzeitMonate: null,
    features: [
      'Alles aus Premium',
      'NDA-Generator (Schweizer Recht, KI-personalisiert)',
      'Letter-of-Interest-Generator',
      'Persönlicher Konzierge-Service',
      'Newsletter-Erwähnung MAX-Käufer',
      'Featured-Listing 90 Tage',
    ],
  },
};
// Sprünge: Mini 249 → Standard 449 (+80%) → Premium 699 (+56%) →
// Enterprise 949 (+36%). Abnehmende Aufschläge — psychologisch sauber.

export const PAKETE_LIST: Paket[] = [
  PAKETE.mini,
  PAKETE.standard,
  PAKETE.premium,
  PAKETE.enterprise,
];

/**
 * Smart-Auto-Tier: empfiehlt das passende Paket basierend auf dem
 * eingewerteten Verkaufspreis (aus Pre-Reg-Smart-Bewertung).
 */
export function recommendPaket(verkaufswertChf: number | null | undefined): PaketTier {
  if (!verkaufswertChf || verkaufswertChf <= 0) return 'standard';
  if (verkaufswertChf < 250_000) return 'mini';
  if (verkaufswertChf < 2_000_000) return 'standard';
  if (verkaufswertChf < 10_000_000) return 'premium';
  return 'enterprise';
}

// ════════════════════════════════════════════════════════════════════
// POWERUPS — einzeln dazubuchbar, transparent
// ────────────────────────────────────────────────────────────────────
export type PowerupKategorie = 'sichtbarkeit' | 'reichweite' | 'tools' | 'service';

export type Powerup = {
  id: string;
  label: string;
  kategorie: PowerupKategorie;
  preis: number;
  preisRefCompanymarket: number | null;
  beschreibung: string;
  einheit: string;
  icon: string; // Lucide-Name
  premiumOnly?: boolean;
};

export const POWERUPS: Powerup[] = [
  // ── Sichtbarkeit ────────────────────────────────────────────────
  {
    id: 'top3_boost',
    label: 'Top-3-Boost',
    kategorie: 'sichtbarkeit',
    preis: 79,
    preisRefCompanymarket: null,
    beschreibung: 'Dein Inserat erscheint 7 Tage lang in den Top-3 der Marktplatz-Liste — egal ob neu oder älter.',
    einheit: '7 Tage',
    icon: 'Rocket',
  },
  {
    id: 'featured_goldrand',
    label: 'Featured-Listing',
    kategorie: 'sichtbarkeit',
    preis: 179,
    preisRefCompanymarket: null,
    beschreibung: 'Goldrand-Hervorhebung im Marktplatz, 5× mehr Klicks im Schnitt.',
    einheit: '30 Tage',
    icon: 'Sparkles',
  },

  // ── Reichweite ──────────────────────────────────────────────────
  {
    id: 'leaderboard',
    label: 'Leaderboard-Banner',
    kategorie: 'reichweite',
    preis: 449,
    preisRefCompanymarket: 500,
    beschreibung: 'Volle Bildschirmbreite oben auf der Marktplatz-Hauptseite — eine Woche prominent.',
    einheit: '1 Woche',
    icon: 'TrendingUp',
  },
  {
    id: 'rechteckbanner',
    label: 'Rechteck-Banner',
    kategorie: 'reichweite',
    preis: 249,
    preisRefCompanymarket: 275,
    beschreibung: 'Rechteck-Banner in der Marktplatz-Sidebar.',
    einheit: '30 Tage',
    icon: 'Square',
  },
  {
    id: 'skyscraper',
    label: 'Skyscraper-Banner',
    kategorie: 'reichweite',
    preis: 39,
    preisRefCompanymarket: 50,
    beschreibung: 'Schmaler Banner seitlich — günstige Dauer-Sichtbarkeit.',
    einheit: '7 Tage',
    icon: 'Tower',
  },
  {
    id: 'newsletter_max',
    label: 'MAX-Käufer Newsletter',
    kategorie: 'reichweite',
    preis: 129,
    preisRefCompanymarket: null,
    beschreibung: 'Eintrag im wöchentlichen Newsletter an alle MAX-abonnierten Käufer.',
    einheit: '1 Newsletter',
    icon: 'Mail',
  },

  // ── Tools (alle Generators — KI-personalisiert, kein Template) ──
  {
    id: 'pdf_expose',
    label: 'PDF-Exposé-Generator',
    kategorie: 'tools',
    preis: 49,
    preisRefCompanymarket: 50,
    beschreibung: 'Auf Knopfdruck KI-generiertes 1-Pager-Exposé mit allen Eckdaten — perfekt formatiert für Käufer-Versand.',
    einheit: 'einmalig',
    icon: 'FileText',
  },
  {
    id: 'nda_generator',
    label: 'NDA-Generator',
    kategorie: 'tools',
    preis: 49,
    preisRefCompanymarket: 50,
    beschreibung: 'KI-personalisierter NDA nach Schweizer Recht — auf deine Firma + Käufer-Profil zugeschnitten.',
    einheit: 'einmalig',
    icon: 'FileSignature',
  },
  {
    id: 'loi_generator',
    label: 'Letter-of-Interest-Generator',
    kategorie: 'tools',
    preis: 49,
    preisRefCompanymarket: null,
    beschreibung: 'KI-generierter LoI für ernsthafte Käufer — formelles Interesse-Bekenntnis vor NDA-Phase.',
    einheit: 'einmalig',
    icon: 'Handshake',
  },

  // ── Service ─────────────────────────────────────────────────────
  {
    id: 'video_tour',
    label: '1-Min Video-Tour',
    kategorie: 'service',
    preis: 179,
    preisRefCompanymarket: null,
    beschreibung: 'Wir produzieren ein 1-Minuten-Video deiner Firma (KI-Voiceover + B-Roll).',
    einheit: 'einmalig',
    icon: 'Video',
  },
  {
    id: 'concierge_session',
    label: 'Konzierge-Beratung',
    kategorie: 'service',
    preis: 249,
    preisRefCompanymarket: null,
    beschreibung: '60-Minuten 1:1-Call mit einem M&A-Experten zur Inserat-Optimierung.',
    einheit: '1 Session',
    icon: 'Users',
  },
];

// ════════════════════════════════════════════════════════════════════
// BERATER-ABO
// ────────────────────────────────────────────────────────────────────
export type BeraterTier = {
  id: 'solo' | 'pro';
  label: string;
  preisJahr: number;
  preisRefCompanymarket: number;
  inserateMax: number | 'unlimited';
  features: string[];
};

export const BERATER_TIERS: BeraterTier[] = [
  {
    id: 'solo',
    label: 'Berater Solo',
    preisJahr: 2_490,
    preisRefCompanymarket: 3_000,
    inserateMax: 10,
    features: [
      '10 aktive Inserate gleichzeitig',
      'Beliebige Verkaufspreise',
      'Übersichtliche Mandanten-Verwaltung',
      'Sammel-Anfragen-Inbox',
      'Priority-Support per E-Mail',
    ],
  },
  {
    id: 'pro',
    label: 'Berater Pro',
    preisJahr: 4_490,
    preisRefCompanymarket: 5_000,
    inserateMax: 'unlimited',
    features: [
      'Unbegrenzt Inserate',
      'White-Label-Profilseite',
      'Eigene Subdomain möglich',
      'API-Zugang für Mandanten-Sync',
      'Telefon-Priority-Support',
      'Konzierge-Onboarding für Erstinseraten',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
// HELPER: Preis-Vergleich für UI
// ────────────────────────────────────────────────────────────────────
export function getCompanymarketDifference(passarePreis: number, cmPreis: number | null): string | null {
  if (!cmPreis || cmPreis <= passarePreis) return null;
  const diff = cmPreis - passarePreis;
  const pct = Math.round((diff / cmPreis) * 100);
  return `Bei Companymarket CHF ${cmPreis} — ${pct} % günstiger`;
}
