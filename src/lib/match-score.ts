/**
 * Heuristik-Match-Score zwischen einem Suchprofil und einem Inserat.
 *
 * Kein AI/pgvector heute — kommt in Etappe 63. Hier eine simple, transparente
 * Gewichtung aus Branche + Kanton + Budget-Range.
 *
 * Score: 0–100. >70 = Top-Match, 40–70 = Mittel, <40 = Schwach.
 */

export type Suchprofil = {
  branche: string[];
  kantone: string[];
  umsatz_min?: number | null;
  umsatz_max?: number | null;
  ebitda_min?: number | null;
};

export type Inserat = {
  branche: string;
  kanton: string;
  umsatz: string;     // z.B. "CHF 8.4M"
  ebitda: string;     // z.B. "18.2%"
  kaufpreis: string;  // optional für Budget-Match
};

/** Versucht aus Strings wie "CHF 8.4M" oder "CHF 1.2 Mio" einen Wert in CHF zu extrahieren. */
function parseUmsatz(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[CHF\s]/gi, '');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return null;
  if (/m|mio/i.test(s)) return num * 1_000_000;
  if (/k|tsd/i.test(s)) return num * 1_000;
  return num;
}

/**
 * Normalisiert Branche-Werte für Vergleich: ID, Display-Label oder gemischte
 * Eingabe → einheitliche lowercase-Form (Whitespace, Sonderzeichen entfernt).
 *
 * Vorher: `profil.branche` enthielt IDs (z.B. 'software_saas'), während
 * `inserat.branche` das Display-Label (z.B. 'Software & SaaS') hatte —
 * Vergleich schlug immer fehl. Jetzt matchen ID↔ID, Label↔Label,
 * sowie ID↔Label-Heuristik via Slug-Normalisierung.
 */
function normalizeBranche(value: string): string {
  return value
    .toLowerCase()
    .replace(/[äöüé&]/g, (c) =>
      ({ ä: 'a', ö: 'o', ü: 'u', é: 'e', '&': 'und' })[c] ?? c,
    )
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function matchScore(profil: Suchprofil, inserat: Inserat): number {
  let score = 0;
  let possible = 0;

  // Branche-Match (Gewicht 40) — beide Seiten normalisieren, dann Set-Lookup.
  possible += 40;
  const inseratNorm = normalizeBranche(inserat.branche);
  const profilNormSet = new Set(profil.branche.map(normalizeBranche));
  if (profil.branche.length === 0 || profilNormSet.has(inseratNorm)) {
    score += 40;
  }

  // Kanton-Match (Gewicht 25)
  possible += 25;
  const wantsCH = profil.kantone.includes('CH') || profil.kantone.length === 0;
  if (wantsCH || profil.kantone.includes(inserat.kanton)) {
    score += 25;
  }

  // Umsatz-Range (Gewicht 20)
  possible += 20;
  const u = parseUmsatz(inserat.umsatz);
  if (u !== null) {
    const minOk = profil.umsatz_min == null || u >= profil.umsatz_min;
    const maxOk = profil.umsatz_max == null || u <= profil.umsatz_max;
    if (minOk && maxOk) score += 20;
    else if (minOk || maxOk) score += 10;
  } else {
    score += 10; // Fallback wenn nicht parsebar
  }

  // EBITDA-Marge (Gewicht 15)
  possible += 15;
  const ebitda = parseFloat(inserat.ebitda);
  if (Number.isFinite(ebitda)) {
    const minE = profil.ebitda_min ?? 0;
    if (ebitda >= minE) score += 15;
    else if (ebitda >= minE - 5) score += 8;
  } else {
    score += 8;
  }

  return Math.round((score / possible) * 100);
}

export function matchLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Top-Match', color: 'text-success' };
  if (score >= 60) return { label: 'Guter Match', color: 'text-bronze-ink' };
  if (score >= 40) return { label: 'Mittel', color: 'text-quiet' };
  return { label: 'Schwach', color: 'text-quiet' };
}
