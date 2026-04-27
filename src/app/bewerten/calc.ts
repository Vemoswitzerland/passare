/**
 * passare.ch — Public-Bewertungs-Engine (DB-gestützt)
 *
 * Pure Function — keine DB-Calls hier drin. Multiples werden vom Caller
 * geladen (kmu_multiples-Tabelle).
 *
 * Für die interne Smart-Bewertung (verkaufsfertig, mit Size/Age/Owner-Mods)
 * existiert separat src/lib/valuation.ts. Hier bleibt es bewusst simpel:
 * öffentliche Tool-User sollen die Logik nachvollziehen können.
 */

export type Multiples = {
  branche: string;
  ebitda_multiple_min: number;
  ebitda_multiple_max: number;
  umsatz_multiple_min: number | null;
  umsatz_multiple_max: number | null;
  quelle: string | null;
};

export type CalcInput = {
  branche: string;
  mitarbeitende: number;
  umsatz_chf: number;        // Jahresumsatz in CHF
  ebitda_pct: number;        // EBITDA-Marge in %
  kanton: string;
  wachstum_pct: number;      // p.a. in %
  multiples: Multiples;
};

export type CalcResult = {
  marktwert_min: number;
  marktwert_max: number;
  ebitda_chf: number;
  multiple_min_used: number;
  multiple_max_used: number;
  growth_factor: number;
  quelle: string;
  warning?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function roundToNearestThousand(n: number) {
  return Math.round(n / 1000) * 1000;
}

export function calculateBewertung(input: CalcInput): CalcResult {
  const ebitda = Math.max(0, input.umsatz_chf * (input.ebitda_pct / 100));

  // Basis-Range aus EBITDA-Multiple
  let min = ebitda * input.multiples.ebitda_multiple_min;
  let max = ebitda * input.multiples.ebitda_multiple_max;

  // Cross-Check mit Umsatz-Multiple (falls EBITDA-Marge atypisch)
  if (input.multiples.umsatz_multiple_min && input.multiples.umsatz_multiple_max) {
    const umsatzMin = input.umsatz_chf * input.multiples.umsatz_multiple_min * 0.7;
    const umsatzMax = input.umsatz_chf * input.multiples.umsatz_multiple_max * 1.3;
    min = Math.max(min, umsatzMin);
    max = Math.min(max, umsatzMax);
  }

  // Wachstums-Adjustment: ±15% (für >10% growth +15%, <0% -15%)
  // Linear zwischen wachstum=5% (Faktor 1.0) und wachstum=15% (Faktor 1.15)
  const growthFactor = 1 + clamp((input.wachstum_pct - 5) / 100 * 1.5, -0.15, 0.15);
  min = min * growthFactor;
  max = max * growthFactor;

  // Mindest-Range-Spreizung garantieren
  if (max - min < min * 0.15) {
    const mid = (min + max) / 2;
    min = mid * 0.92;
    max = mid * 1.08;
  }

  let warning: string | undefined;
  if (input.ebitda_pct < 3) {
    warning = 'EBITDA-Marge unter 3% — Bewertung mit erhöhter Unsicherheit.';
  } else if (input.umsatz_chf < 200_000) {
    warning = 'Umsatz unter CHF 200\'000 — Multiple-Bewertung nur bedingt aussagekräftig.';
  }

  return {
    marktwert_min: Math.max(0, roundToNearestThousand(min)),
    marktwert_max: Math.max(0, roundToNearestThousand(max)),
    ebitda_chf: roundToNearestThousand(ebitda),
    multiple_min_used: input.multiples.ebitda_multiple_min,
    multiple_max_used: input.multiples.ebitda_multiple_max,
    growth_factor: Number(growthFactor.toFixed(3)),
    quelle: input.multiples.quelle ?? 'passare-Multiples-DB',
    warning,
  };
}

/** Schweizer CHF mit Hochkomma. */
export function formatCHF(amount: number): string {
  return `CHF ${Math.round(amount).toLocaleString('de-CH').replace(/,/g, "'")}`;
}

export function formatCHFShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `CHF ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 2)}M`;
  }
  if (amount >= 1_000) return `CHF ${Math.round(amount / 1_000)}k`;
  return `CHF ${Math.round(amount)}`;
}
