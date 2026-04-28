// ════════════════════════════════════════════════════════════════════
// Completeness-Engine
// ────────────────────────────────────────────────────────────────────
// Berechnet wie vollständig ein Inserat oder ein Profil ausgefüllt
// ist. Pflicht-Felder zählen für den Live-Status, optionale Felder
// erhöhen den Vertrauens-Score für Käufer.
// ════════════════════════════════════════════════════════════════════

export type CompletenessItem = {
  key: string;
  label: string;
  filled: boolean;
  weight: number;
  /** 'pflicht' = blockt Live-Schaltung, 'empfohlen' = trust-relevant, 'bonus' = Premium-Touch */
  category: 'pflicht' | 'empfohlen' | 'bonus';
  /** Slug zum Sprung in die Settings-Sektion */
  href?: string;
};

export type CompletenessReport = {
  percent: number;
  pflichtPercent: number;
  filledCount: number;
  totalCount: number;
  pflichtFehlt: number;
  items: CompletenessItem[];
};

// ════════════════════════════════════════════════════════════════════
// INSERAT-COMPLETENESS
// ════════════════════════════════════════════════════════════════════
export function inseratCompleteness(i: any): CompletenessReport {
  const items: CompletenessItem[] = [
    // ── PFLICHT (Live-Bedingungen) ─────────────────────────────────
    { key: 'titel', label: 'Titel', filled: nonEmpty(i?.titel), weight: 5, category: 'pflicht' },
    { key: 'beschreibung', label: 'Beschreibung', filled: lenAtLeast(i?.beschreibung, 50), weight: 5, category: 'pflicht' },
    { key: 'branche', label: 'Branche', filled: nonEmpty(i?.branche ?? i?.branche_id), weight: 4, category: 'pflicht' },
    { key: 'kanton', label: 'Kanton', filled: nonEmpty(i?.kanton), weight: 3, category: 'pflicht' },
    { key: 'gruendungsjahr', label: 'Gründungsjahr', filled: !!(i?.gruendungsjahr ?? i?.jahr), weight: 3, category: 'pflicht' },
    { key: 'mitarbeitende', label: 'Mitarbeitende', filled: !!i?.mitarbeitende, weight: 3, category: 'pflicht' },
    { key: 'umsatz_chf', label: 'Jahresumsatz', filled: numAbove(i?.umsatz_chf, 0), weight: 4, category: 'pflicht' },
    { key: 'ebitda_chf', label: 'EBITDA', filled: i?.ebitda_chf != null, weight: 4, category: 'pflicht' },
    { key: 'kaufpreis', label: 'Kaufpreis', filled: numAbove(i?.kaufpreis_chf, 0) || numAbove(i?.kaufpreis_min_chf, 0), weight: 4, category: 'pflicht' },
    { key: 'grund', label: 'Übergabe-Grund', filled: nonEmpty(i?.grund ?? i?.uebergabe_grund), weight: 2, category: 'pflicht' },
    { key: 'uebergabe_zeitpunkt', label: 'Übergabe-Zeitpunkt', filled: nonEmpty(i?.uebergabe_zeitpunkt), weight: 2, category: 'pflicht' },
    { key: 'cover_url', label: 'Cover-Bild', filled: nonEmpty(i?.cover_url), weight: 4, category: 'pflicht' },
    { key: 'sales_points', label: 'Highlights (mind. 3)', filled: arrLenAtLeast(i?.sales_points, 3), weight: 3, category: 'pflicht' },

    // ── EMPFOHLEN (Trust-relevant) ─────────────────────────────────
    { key: 'teaser', label: 'Teaser-Text', filled: lenAtLeast(i?.teaser, 30), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#inserat' },
    { key: 'kategorie', label: 'Kategorie bestätigt', filled: nonEmpty(i?.kategorie), weight: 1, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#inserat' },
    { key: 'art', label: 'Art (Angebot/Gesuch)', filled: nonEmpty(i?.art), weight: 1, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#inserat' },
    { key: 'finanzierung', label: 'Finanzierungs-Bereitschaft', filled: nonEmpty(i?.finanzierung), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#konditionen' },
    { key: 'immobilien', label: 'Immobilien-Status', filled: nonEmpty(i?.immobilien), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#konditionen' },
    { key: 'eigenkapital_chf', label: 'Eigenkapital-Bedarf', filled: numAbove(i?.eigenkapital_chf, 0), weight: 1, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#konditionen' },
    { key: 'rechtsform_typ', label: 'Rechtsform', filled: nonEmpty(i?.rechtsform_typ ?? i?.firma_rechtsform), weight: 1, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#inserat' },
    { key: 'website_url', label: 'Webseite', filled: nonEmpty(i?.website_url), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#kontakte' },

    // ── BONUS (Premium-Touch) ──────────────────────────────────────
    { key: 'wir_anteil', label: 'WIR-Anteil-Möglichkeit', filled: i?.wir_anteil_moeglich === true, weight: 1, category: 'bonus', href: '/dashboard/verkaeufer/settings#konditionen' },
    { key: 'galerie', label: 'Mehrere Bilder (Galerie)', filled: (i?._gallery_count ?? 0) >= 3, weight: 2, category: 'bonus', href: '/dashboard/verkaeufer/settings#bilder' },
    { key: 'video', label: 'Video-Tour', filled: (i?._video_count ?? 0) > 0, weight: 2, category: 'bonus', href: '/dashboard/verkaeufer/settings#bilder' },
    { key: 'mehrere_kontakte', label: 'Mehrere Kontakte', filled: (i?._kontakte_count ?? 0) > 1, weight: 1, category: 'bonus', href: '/dashboard/verkaeufer/settings#kontakte' },
    { key: 'linkedin', label: 'LinkedIn-Link', filled: nonEmpty(i?.linkedin_url), weight: 1, category: 'bonus', href: '/dashboard/verkaeufer/settings#kontakte' },
    { key: 'expose_pdf', label: 'PDF-Exposé generiert', filled: !!i?._has_expose_pdf, weight: 2, category: 'bonus', href: '/dashboard/verkaeufer/datenraum?gen=expose' },
    { key: 'nda', label: 'NDA generiert', filled: !!i?._has_nda, weight: 1, category: 'bonus', href: '/dashboard/verkaeufer/datenraum?gen=nda' },
  ];

  const totalWeight = items.reduce((s, x) => s + x.weight, 0);
  const filledWeight = items.filter((x) => x.filled).reduce((s, x) => s + x.weight, 0);
  const percent = Math.round((filledWeight / totalWeight) * 100);

  const pflichtItems = items.filter((x) => x.category === 'pflicht');
  const pflichtTotal = pflichtItems.reduce((s, x) => s + x.weight, 0);
  const pflichtFilled = pflichtItems.filter((x) => x.filled).reduce((s, x) => s + x.weight, 0);
  const pflichtPercent = Math.round((pflichtFilled / pflichtTotal) * 100);
  const pflichtFehlt = pflichtItems.filter((x) => !x.filled).length;

  return {
    percent,
    pflichtPercent,
    filledCount: items.filter((x) => x.filled).length,
    totalCount: items.length,
    pflichtFehlt,
    items,
  };
}

// ════════════════════════════════════════════════════════════════════
// PROFIL-COMPLETENESS
// ════════════════════════════════════════════════════════════════════
export function profilCompleteness(p: any): CompletenessReport {
  const items: CompletenessItem[] = [
    // Pflicht
    { key: 'full_name', label: 'Voller Name', filled: lenAtLeast(p?.full_name, 3), weight: 3, category: 'pflicht' },
    { key: 'email', label: 'E-Mail bestätigt', filled: !!p?.email_confirmed_at || !!p?.email, weight: 3, category: 'pflicht' },
    { key: 'kanton', label: 'Kanton', filled: nonEmpty(p?.kanton), weight: 2, category: 'pflicht' },
    { key: 'sprache', label: 'Sprache', filled: nonEmpty(p?.sprache), weight: 1, category: 'pflicht' },

    // Empfohlen
    { key: 'avatar_url', label: 'Profilbild', filled: nonEmpty(p?.avatar_url), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#profil' },
    { key: 'bio', label: 'Über mich (Bio)', filled: lenAtLeast(p?.bio, 50), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#profil' },
    { key: 'telefon', label: 'Telefonnummer', filled: nonEmpty(p?.telefon), weight: 2, category: 'empfohlen', href: '/dashboard/verkaeufer/settings#profil' },

    // Bonus
    { key: 'linkedin', label: 'LinkedIn-Profil', filled: nonEmpty(p?.linkedin_url), weight: 1, category: 'bonus', href: '/dashboard/verkaeufer/settings#profil' },
    { key: 'verifiziert', label: 'KYC-Verifizierung', filled: !!p?.kyc_verified, weight: 3, category: 'bonus', href: '/dashboard/verkaeufer/settings#verifizierung' },
  ];

  const totalWeight = items.reduce((s, x) => s + x.weight, 0);
  const filledWeight = items.filter((x) => x.filled).reduce((s, x) => s + x.weight, 0);
  const percent = Math.round((filledWeight / totalWeight) * 100);
  const pflichtItems = items.filter((x) => x.category === 'pflicht');
  const pflichtFilled = pflichtItems.filter((x) => x.filled).reduce((s, x) => s + x.weight, 0);
  const pflichtTotal = pflichtItems.reduce((s, x) => s + x.weight, 0);

  return {
    percent,
    pflichtPercent: Math.round((pflichtFilled / pflichtTotal) * 100),
    filledCount: items.filter((x) => x.filled).length,
    totalCount: items.length,
    pflichtFehlt: pflichtItems.filter((x) => !x.filled).length,
    items,
  };
}

// ── Helpers ────────────────────────────────────────────────────────
function nonEmpty(v: any): boolean {
  return v != null && String(v).trim().length > 0;
}
function lenAtLeast(v: any, n: number): boolean {
  return typeof v === 'string' && v.trim().length >= n;
}
function arrLenAtLeast(v: any, n: number): boolean {
  return Array.isArray(v) && v.length >= n;
}
function numAbove(v: any, n: number): boolean {
  const x = typeof v === 'string' ? parseFloat(v) : v;
  return typeof x === 'number' && Number.isFinite(x) && x > n;
}
