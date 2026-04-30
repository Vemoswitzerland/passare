/**
 * Klassifiziert Verkäufer-Änderungen am Inserat:
 *  - relevant   → Inserat geht zurück in Prüfung (status=pending)
 *  - irrelevant → Inserat bleibt live (z.B. Stockfoto getauscht, Social-URL geändert)
 *
 * Genutzt im Edit-Flow `/dashboard/verkaeufer/inserat/[id]/edit`.
 * Vorbild: companymarket macht NULL Prüfung — passare differenziert sich
 * mit «jedes wesentliche Update wird geprüft».
 */

/**
 * Felder die NIE einen Re-Review auslösen — Verkäufer kann sie
 * jederzeit ändern, auch wenn das Inserat live ist.
 *
 * Begründung:
 *  - Cover/Stockfoto: rein optisch
 *  - Web-/Social-URLs: Verkäufer kann LinkedIn-Url tauschen ohne dass
 *    sich das Inserat-Inhalt ändert
 *  - Chat-Features: Kontaktkanal-Konfiguration, kein Inhalt
 */
const IRRELEVANT_FIELDS = new Set([
  'cover_url',
  'cover_source',
  'website_url',
  'linkedin_url',
  'twitter_url',
  'facebook_url',
  'whatsapp_enabled',
  'live_chat_enabled',
  'chat_zeiten',
  // Cyrill 30.04.2026: «Admin muss nur sicherheitsrelevante Dinge prüfen».
  // Anonymitäts-Level ist Verkäufer-Entscheidung, nicht Käufer-Täuschung —
  // er entscheidet selbst wieviel er von sich zeigt. Kontakt-Daten sind
  // ebenfalls Verkäufer-eigene Daten (er kann sich umbenennen, andere Mail
  // nehmen, WhatsApp wechseln). Das ist keine Sicherheitsfrage.
  'anonymitaet_level',
  'kontakt_vorname',
  'kontakt_nachname',
  'kontakt_funktion',
  'kontakt_foto_url',
  'kontakt_email_public',
  'kontakt_whatsapp_nr',
  // Auto-tracked oder nur intern:
  'views',
  'updated_at',
  'last_edited_at',
  'paid_at',
  'stripe_session_id',
  'expires_at',
  'published_at',
  'paused_at',
  'featured_until',
  'live_at',
  'public_id',
  // Status selber wird vom Audit-Flow gesetzt, nicht vom Verkäufer
  'status',
  'rejection_reason',
  'status_reason',
  'admin_notes',
  // Wert-Schätzung ist intern berechnet
  'estimated_value_low',
  'estimated_value_mid',
  'estimated_value_high',
  'estimated_value_basis',
]);

/** Felder die IMMER kritisch sind und Re-Review auslösen müssen. */
const RELEVANT_FIELDS = new Set([
  // Inhalt
  'titel',
  'teaser',
  'beschreibung',
  'sales_points',
  // Branche / Geo
  'branche',
  'kanton',
  // Zahlen — wichtigster Grund für Re-Review
  'umsatz_chf',
  'umsatz_min_chf',
  'umsatz_max_chf',
  'ebitda_chf',
  'ebitda_pct',
  'kaufpreis_chf',
  'kaufpreis_min_chf',
  'kaufpreis_max_chf',
  'kaufpreis_min',
  'kaufpreis_max',
  'kaufpreis_label',
  'kaufpreis_vhb',
  'eigenkapital_chf',
  // Eckdaten
  'mitarbeitende',
  'gruendungsjahr',
  // Firma-Identität
  'firma_name',
  'firma_rechtsform',
  'firma_sitz_gemeinde',
  'zefix_uid',
  'rechtsform_typ',
  // Konfiguration
  'art',
  'kategorie',
  'immobilien',
  'finanzierung',
  'wir_anteil_moeglich',
  // Cyrill: anonymitaet_level ist KEIN sicherheits-/inhaltskritisches
  // Feld — Verkäufer-Selbstentscheidung. Liegt jetzt in IRRELEVANT_FIELDS.
  // Übergabe
  'grund',
  'uebergabe_zeitpunkt',
]);

export type ChangeClassification = {
  /** Mind. 1 relevantes Feld geändert → Re-Review nötig */
  needsReview: boolean;
  /** Welche relevanten Felder geändert wurden (für Audit-Message) */
  relevantChanges: string[];
  /** Welche irrelevanten Felder geändert wurden (zur Info) */
  irrelevantChanges: string[];
  /** Felder die wir nicht klassifiziert haben — defaulten konservativ auf relevant */
  unknownChanges: string[];
};

/**
 * Vergleicht alte und neue Inserat-Daten und klassifiziert die Änderungen.
 *
 * @param before — vorheriger Stand (z.B. aus DB vor Update)
 * @param after  — neuer Stand (was eingereicht wurde)
 * @returns ChangeClassification mit needsReview-Flag
 */
export function classifyChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ChangeClassification {
  const relevantChanges: string[] = [];
  const irrelevantChanges: string[] = [];
  const unknownChanges: string[] = [];

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (IRRELEVANT_FIELDS.has(key)) {
      if (!deepEqual(before[key], after[key])) {
        irrelevantChanges.push(key);
      }
      continue;
    }

    if (!deepEqual(before[key], after[key])) {
      if (RELEVANT_FIELDS.has(key)) {
        relevantChanges.push(key);
      } else {
        // Unknown field → konservativ als relevant behandeln
        unknownChanges.push(key);
      }
    }
  }

  return {
    needsReview: relevantChanges.length > 0 || unknownChanges.length > 0,
    relevantChanges,
    irrelevantChanges,
    unknownChanges,
  };
}

/** Tiefer Vergleich für Arrays + Objekte (genug für unsere Inserat-Felder). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;

  // Numbers (DB liefert manchmal string, manchmal number — normalisieren)
  if (typeof a === 'number' && typeof b === 'string') return String(a) === b;
  if (typeof a === 'string' && typeof b === 'number') return a === String(b);

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  // Objects (für jsonb-Felder)
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
}

/** Hübsche Label-Map für Audit-Messages. */
export const FIELD_LABEL: Record<string, string> = {
  titel: 'Titel',
  teaser: 'Teaser',
  beschreibung: 'Beschreibung',
  sales_points: 'Schlüsselargumente',
  branche: 'Branche',
  kanton: 'Kanton',
  umsatz_chf: 'Umsatz',
  ebitda_chf: 'EBITDA',
  kaufpreis_chf: 'Kaufpreis',
  kaufpreis_label: 'Kaufpreis',
  mitarbeitende: 'Mitarbeitende',
  gruendungsjahr: 'Gründungsjahr',
  firma_name: 'Firmenname',
  firma_rechtsform: 'Rechtsform',
  firma_sitz_gemeinde: 'Sitz-Gemeinde',
  zefix_uid: 'UID',
  art: 'Art',
  kategorie: 'Kategorie',
  immobilien: 'Immobilien',
  finanzierung: 'Finanzierung',
  anonymitaet_level: 'Anonymität',
  grund: 'Übergabegrund',
  uebergabe_zeitpunkt: 'Übergabe-Zeitpunkt',
  cover_url: 'Cover-Bild',
  website_url: 'Website',
  linkedin_url: 'LinkedIn',
  twitter_url: 'Twitter/X',
  facebook_url: 'Facebook',
  whatsapp_enabled: 'WhatsApp',
  live_chat_enabled: 'Live-Chat',
};
