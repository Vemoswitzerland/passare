/**
 * Key-Facts-Algorithmus für die Inserat-Cover.
 *
 * Cyrills Vorgabe (2026-04-27):
 * «Aus den Onboarding-Daten die relevantesten Sales-Strength-Points pro Firma
 *  herauspicken — das was Käufer als erstes sehen sollen.»
 *
 * Auswahl-Logik (max 3 Slots, Pipe-getrennt):
 *   Slot 1: Mitarbeitende (wenn ≥ 5 — ist immer relevant)
 *   Slot 2: Umsatz (wenn freigegeben)
 *   Slot 3: das stärkste der folgenden:
 *           - Tradition («seit 1985»)  ← wenn ≥ 30 Jahre alt
 *           - EBITDA-Marge             ← wenn ≥ 15 %
 *           - Gründungsjahr            ← Fallback
 */

export type ListingForFacts = {
  jahr: number;
  mitarbeitende: number;
  umsatz: string;     // z.B. "CHF 8.4M"
  ebitda: string;     // z.B. "18.2%"
};

const CURRENT_YEAR = 2026;

export function renderKeyFacts(l: ListingForFacts): string {
  const parts: string[] = [];

  if (l.mitarbeitende >= 5) parts.push(`${l.mitarbeitende} MA`);

  if (l.umsatz) parts.push(l.umsatz.replace(/^CHF\s*/i, ''));

  const age = CURRENT_YEAR - l.jahr;
  const ebitdaNum = parseFloat(l.ebitda);

  if (age >= 30) {
    parts.push(`seit ${l.jahr}`);
  } else if (Number.isFinite(ebitdaNum) && ebitdaNum >= 15) {
    parts.push(`EBITDA ${l.ebitda}`);
  } else {
    parts.push(`gegr. ${l.jahr}`);
  }

  return parts.slice(0, 3).join(' · ');
}
