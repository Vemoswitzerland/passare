// ════════════════════════════════════════════════════════════════════
// passare.ch — Smart-Bewertungs-Engine
// ════════════════════════════════════════════════════════════════════
// Pure Function — keine DB-Calls, keine Side-Effects.
// Einsatz im Pre-Reg-Funnel und im öffentlichen Bewertungstool.
// Quellen: con|cess M+A / DUB / NIMBO Q1/2026 — siehe branchen-multiples.ts

import { BRANCHEN_MULTIPLES, type BrancheMultiple } from '@/data/branchen-multiples';

export type ValuationInput = {
  branche_id: string;
  umsatz: number;             // CHF Jahresumsatz
  ebitda: number;             // CHF EBITDA
  mitarbeitende: number;      // FTE
  jahr: number;               // Gründungsjahr
  inhaber_dependency?: 1 | 2 | 3 | 4 | 5;  // optional, 1=keine, 5=extrem
  eigenkapital?: number;      // optional Buchwert-Floor
  // Erweiterte Detail-Faktoren (Bewertungs-Funnel) — alle optional. Werden
  // sie weggelassen, fällt der jeweilige Modulator auf 1.0 (= neutral).
  wachstum_pct?: number | null;             // p.a. in % (-50 … 200)
  recurring_pct?: number | null;            // 0–100 — Anteil wiederkehrend
  top3_kunden_pct?: number | null;          // 0–100 — Top-3-Klumpenrisiko
  inhaberabhaengigkeit?: 'low' | 'mid' | 'high' | null;
};

export type ValuationBasis = {
  branche: string;
  ebitda_multiple_base: number;
  umsatz_multiple_base: number;
  size_mod: number;
  age_mod: number;
  owner_mod: number;
  margin_mod: number;
  ebitda_multiple_adj: number;
  umsatz_multiple_adj: number;
  weight_ebitda: number;
  margin_pct: number;
};

export type ValuationResult = {
  low: number;
  mid: number;
  high: number;
  basis: ValuationBasis;
  /** Optionale Warnung — z.B. bei negativem EBITDA. */
  warning?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function sizeModFromMa(ma: number): number {
  if (ma < 3) return 0.7;
  if (ma <= 10) return 0.85;
  if (ma <= 25) return 1.0;
  if (ma <= 50) return 1.1;
  if (ma < 100) return 1.2;
  return 1.3;
}

function ageModFromYear(year: number): number {
  const now = new Date().getFullYear();
  const age = now - year;
  if (age < 3) return 0.75;
  if (age <= 10) return 0.95;
  if (age <= 25) return 1.0;
  return 1.05;
}

function ownerModFromDep(dep: number | undefined): number {
  if (!dep || dep === 3) return 1.0;
  if (dep <= 2) return 1.1;
  if (dep === 4) return 0.85;
  return 0.7; // dep === 5
}

function marginModFromMargin(margin: number): number {
  if (margin > 0.2) return 1.15;
  if (margin > 0.1) return 1.05;
  if (margin > 0.05) return 1.0;
  return 0.85;
}

/* ────────── Detail-Faktoren-Modulatoren ────────── */
function growthMod(pct: number | null | undefined): number {
  if (pct == null || !Number.isFinite(pct)) return 1.0;
  if (pct >= 25) return 1.18;
  if (pct >= 15) return 1.12;
  if (pct >= 8)  return 1.06;
  if (pct >= 0)  return 1.0;
  if (pct >= -5) return 0.92;
  return 0.82;
}

function recurringMod(pct: number | null | undefined): number {
  if (pct == null || !Number.isFinite(pct)) return 1.0;
  if (pct >= 70) return 1.18;
  if (pct >= 50) return 1.10;
  if (pct >= 30) return 1.05;
  if (pct >= 10) return 1.0;
  return 0.97;
}

function top3Mod(pct: number | null | undefined): number {
  if (pct == null || !Number.isFinite(pct)) return 1.0;
  if (pct >= 70) return 0.78;
  if (pct >= 50) return 0.85;
  if (pct >= 30) return 0.95;
  return 1.02;
}

function inhaberMod(level: 'low' | 'mid' | 'high' | null | undefined): number {
  if (level === 'low')  return 1.10;
  if (level === 'high') return 0.80;
  return 1.0; // 'mid' oder unset
}

function roundToNearestThousand(n: number) {
  return Math.round(n / 1000) * 1000;
}

export function calculateValuation(input: ValuationInput): ValuationResult {
  const branche: BrancheMultiple =
    BRANCHEN_MULTIPLES[input.branche_id] ?? BRANCHEN_MULTIPLES.andere;

  const sizeMod = sizeModFromMa(input.mitarbeitende || 0);
  const ageMod = ageModFromYear(input.jahr || new Date().getFullYear());
  // ownerMod kommt aus zwei Quellen: numerischer Inhaber-Dependency-Wert
  // (alter Heuristik) ODER aus dem 'low|mid|high' Wert des Bewertungs-Funnel.
  // Wenn beide gesetzt sind, gewinnt der explizite low/mid/high.
  const ownerModNumeric = ownerModFromDep(input.inhaber_dependency);
  const ownerModExplicit = input.inhaberabhaengigkeit ? inhaberMod(input.inhaberabhaengigkeit) : null;
  const ownerMod = ownerModExplicit ?? ownerModNumeric;
  const margin = input.umsatz > 0 ? input.ebitda / input.umsatz : 0;
  const marginMod = marginModFromMargin(margin);

  // Detail-Faktor-Modulatoren — neutral (1.0) wenn nicht gesetzt
  const gMod = growthMod(input.wachstum_pct);
  const rMod = recurringMod(input.recurring_pct);
  const k3Mod = top3Mod(input.top3_kunden_pct);

  const ebitdaMultAdj = branche.ebitda * sizeMod * ageMod * ownerMod * marginMod * gMod * rMod * k3Mod;
  const umsatzMultAdj = branche.umsatz * sizeMod * ageMod * ownerMod * gMod * rMod * k3Mod;

  const valEbitda = Math.max(input.ebitda, 0) * ebitdaMultAdj;
  const valUmsatz = (input.umsatz || 0) * umsatzMultAdj;

  const wEbitda = clamp(0.4 + margin * 2, 0.4, 0.85);
  const mid = valEbitda * wEbitda + valUmsatz * (1 - wEbitda);

  let low = mid * 0.8;
  let high = mid * 1.2;
  if (input.eigenkapital && input.eigenkapital > 0) {
    low = Math.max(low, input.eigenkapital * 0.9);
  }

  // Warnung bei negativem EBITDA — Bewertung dann nur Umsatz-basiert.
  const warning = input.ebitda < 0
    ? 'Negative EBITDA — Bewertung nur Umsatz-basiert, ggf. unrealistisch'
    : undefined;

  return {
    low: roundToNearestThousand(low),
    mid: roundToNearestThousand(mid),
    high: roundToNearestThousand(high),
    basis: {
      branche: branche.label,
      ebitda_multiple_base: branche.ebitda,
      umsatz_multiple_base: branche.umsatz,
      size_mod: Number(sizeMod.toFixed(2)),
      age_mod: Number(ageMod.toFixed(2)),
      owner_mod: Number(ownerMod.toFixed(2)),
      margin_mod: Number(marginMod.toFixed(2)),
      ebitda_multiple_adj: Number(ebitdaMultAdj.toFixed(2)),
      umsatz_multiple_adj: Number(umsatzMultAdj.toFixed(2)),
      weight_ebitda: Number(wEbitda.toFixed(2)),
      margin_pct: Number((margin * 100).toFixed(1)),
    },
    ...(warning ? { warning } : {}),
  };
}

/** Formatiert CHF mit Schweizer Hochkomma-Trennzeichen */
export function formatCHF(amount: number): string {
  return `CHF ${Math.round(amount).toLocaleString('de-CH').replace(/,/g, "'")}`;
}

/** Kurz-Formatierung "CHF 2.4M" für Hero-Zahlen */
export function formatCHFShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `CHF ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 2)}M`;
  }
  if (amount >= 1_000) return `CHF ${Math.round(amount / 1_000)}k`;
  return `CHF ${Math.round(amount)}`;
}
