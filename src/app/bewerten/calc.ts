/**
 * passare.ch — Public-Bewertungs-Engine (DB-gestützt)
 *
 * Pure Function — keine DB-Calls hier drin. Multiples werden vom Caller
 * geladen (kmu_multiples-Tabelle).
 *
 * Erweitert (Mai 2026): Neben den Basis-Inputs (Branche, Mitarbeitende,
 * Umsatz, EBITDA, Wachstum, Standort) berücksichtigt die Engine jetzt
 * vier qualitative Detail-Faktoren — wiederkehrender Umsatzanteil,
 * Kundenkonzentration (Top-3), Inhaberabhängigkeit und Firmenalter.
 * Jeder Faktor moduliert das Multiple zwischen −20 % und +20 %, damit
 * die Range realistischer wird, ohne in den Black-Box-Modus zu kippen.
 *
 * Für die interne Smart-Bewertung (Inserat-Funnel) existiert separat
 * src/lib/valuation.ts. Hier bleibt es bewusst nachvollziehbar.
 */

export type Multiples = {
  branche: string;
  ebitda_multiple_min: number;
  ebitda_multiple_max: number;
  umsatz_multiple_min: number | null;
  umsatz_multiple_max: number | null;
  quelle: string | null;
};

export type Inhaberabhaengigkeit = 'low' | 'mid' | 'high';

export type CalcInput = {
  branche: string;
  mitarbeitende: number;
  umsatz_chf: number;        // Jahresumsatz in CHF
  ebitda_pct: number;        // EBITDA-Marge in %
  kanton: string;
  wachstum_pct: number;      // p.a. in %
  multiples: Multiples;

  // Optionale Detail-Faktoren (alle sind safe-defaults wenn weggelassen).
  recurring_pct?: number;             // 0–100 — Anteil wiederkehrender Umsätze
  top3_kunden_pct?: number;           // 0–100 — Anteil Top-3-Kunden am Umsatz
  inhaberabhaengigkeit?: Inhaberabhaengigkeit;  // 'low' | 'mid' | 'high'
  alter_jahre?: number;               // Firmenalter in Jahren
};

export type CalcResult = {
  marktwert_min: number;
  marktwert_max: number;
  ebitda_chf: number;
  multiple_min_used: number;
  multiple_max_used: number;
  growth_factor: number;
  detail_factor: number;            // kombinierter Faktor aus den 4 Detail-Inputs
  detail_breakdown: {
    recurring: number;              // ±, z.B. 0.12 = +12 %
    konzentration: number;          // ±
    inhaber: number;                // ±
    alter: number;                  // ±
  };
  quelle: string;
  warning?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function roundToNearestThousand(n: number) {
  return Math.round(n / 1000) * 1000;
}

/* ─────────────── Detail-Modifier ─────────────── */

/** Recurring Revenue — bis +20 % bei 80 % wiederkehrendem Umsatz. */
function recurringMod(pct: number | undefined): number {
  if (pct == null || pct <= 0) return 0;
  // 0 % → 0, 80 % → +0.20 (linear gedeckelt)
  return clamp((pct / 80) * 0.20, 0, 0.20);
}

/** Klumpenrisiko — Abschlag wenn Top-3 > 30 % vom Umsatz. */
function konzentrationMod(pct: number | undefined): number {
  if (pct == null || pct <= 30) return 0;
  if (pct >= 70) return -0.20;
  if (pct >= 50) return -0.12;
  return -0.06;
}

/** Inhaberabhängigkeit. */
function inhaberMod(level: Inhaberabhaengigkeit | undefined): number {
  switch (level) {
    case 'low':  return  0.08;   // läuft ohne Inhaber
    case 'high': return -0.15;   // Inhaber = Firma
    case 'mid':
    default:     return  0;
  }
}

/** Firmenalter — Aufschlag bei langer Historie, Abschlag bei <5 Jahren. */
function alterMod(jahre: number | undefined): number {
  if (jahre == null) return 0;
  if (jahre < 3) return -0.10;
  if (jahre < 5) return -0.05;
  if (jahre >= 30) return 0.05;
  return 0;
}

/* ─────────────── Hauptberechnung ─────────────── */

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

  // Wachstums-Adjustment: ±15 % (für >10 % growth +15 %, <0 % -15 %)
  const growthFactor = 1 + clamp((input.wachstum_pct - 5) / 100 * 1.5, -0.15, 0.15);
  min = min * growthFactor;
  max = max * growthFactor;

  // Detail-Faktoren — werden additiv summiert, dann auf ±0.30 gedeckelt
  const recurring = recurringMod(input.recurring_pct);
  const konzentration = konzentrationMod(input.top3_kunden_pct);
  const inhaber = inhaberMod(input.inhaberabhaengigkeit);
  const alter = alterMod(input.alter_jahre);
  const detailSum = recurring + konzentration + inhaber + alter;
  const detailFactor = 1 + clamp(detailSum, -0.30, 0.30);
  min = min * detailFactor;
  max = max * detailFactor;

  // Mindest-Range-Spreizung garantieren
  if (max - min < min * 0.15) {
    const mid = (min + max) / 2;
    min = mid * 0.92;
    max = mid * 1.08;
  }

  let warning: string | undefined;
  if (input.ebitda_pct < 3) {
    warning = 'EBITDA-Marge unter 3 % — Bewertung mit erhöhter Unsicherheit.';
  } else if (input.umsatz_chf < 200_000) {
    warning = 'Umsatz unter CHF 200\'000 — Multiple-Bewertung nur bedingt aussagekräftig.';
  } else if (inhaber <= -0.10 && (input.top3_kunden_pct ?? 0) >= 50) {
    warning = 'Hohe Inhaberabhängigkeit kombiniert mit Klumpenrisiko — Käufer werden hier deutlich mehr Earn-out und Übergangs-Phase verlangen.';
  }

  return {
    marktwert_min: Math.max(0, roundToNearestThousand(min)),
    marktwert_max: Math.max(0, roundToNearestThousand(max)),
    ebitda_chf: roundToNearestThousand(ebitda),
    multiple_min_used: input.multiples.ebitda_multiple_min,
    multiple_max_used: input.multiples.ebitda_multiple_max,
    growth_factor: Number(growthFactor.toFixed(3)),
    detail_factor: Number(detailFactor.toFixed(3)),
    detail_breakdown: {
      recurring: Number(recurring.toFixed(3)),
      konzentration: Number(konzentration.toFixed(3)),
      inhaber: Number(inhaber.toFixed(3)),
      alter: Number(alter.toFixed(3)),
    },
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
