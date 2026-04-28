/**
 * passare.ch — Format-Helper für Inserate (Client-safe, KEIN Supabase-Import)
 *
 * Kann sowohl in Server- als auch Client-Components verwendet werden.
 * Die Server-Helper (getListings etc.) sind in `@/lib/listings`.
 */

import { formatCHF } from '@/lib/utils';

/** "CHF 1.2 Mio" / "CHF 250'000" — kompakte Darstellung. */
export function formatCompactCHF(amount: number): string {
  if (amount >= 1_000_000) return `CHF ${(amount / 1_000_000).toFixed(1)} Mio`;
  return formatCHF(amount);
}

/**
 * Formatiert einen Umsatz-Wert (oder Bucket) für die Card.
 * Bevorzugt den präzisen `umsatz_chf` wenn vorhanden, sonst Bucket-String.
 */
export function formatUmsatz(input: { umsatz_chf?: number | null; umsatz_bucket?: string | null }): string {
  if (typeof input.umsatz_chf === 'number' && input.umsatz_chf > 0) {
    return formatCompactCHF(input.umsatz_chf);
  }
  return input.umsatz_bucket ?? '—';
}

/** Formatiert die EBITDA-Marge als Prozent-String, z.B. "18.2 %". */
export function formatEbitda(pct: number | null | undefined): string {
  if (pct == null) return '—';
  return `${pct.toFixed(1)} %`;
}

/**
 * Formatiert einen Kaufpreis. Wenn VHB → "VHB". Wenn Range → "CHF 6–8 Mio".
 * Wenn einzelner Wert → formatCHF. Sonst Bucket-String.
 */
export function formatKaufpreis(input: {
  kaufpreis_chf?: number | null;
  kaufpreis_min_chf?: number | null;
  kaufpreis_max_chf?: number | null;
  kaufpreis_bucket?: string | null;
  kaufpreis_vhb?: boolean;
}): string {
  if (input.kaufpreis_vhb) return 'VHB';
  const min = input.kaufpreis_min_chf;
  const max = input.kaufpreis_max_chf;
  if (typeof min === 'number' && typeof max === 'number' && min > 0 && max > 0) {
    return `${formatCompactCHF(min)} – ${formatCompactCHF(max).replace(/^CHF\s*/, '')}`;
  }
  if (typeof input.kaufpreis_chf === 'number' && input.kaufpreis_chf > 0) {
    return formatCompactCHF(input.kaufpreis_chf);
  }
  return input.kaufpreis_bucket ?? '—';
}

/** Formatiert Mitarbeitende mit Suffix MA. Bevorzugt exakten Wert, fällt auf Bucket. */
export function formatMitarbeitende(input: { mitarbeitende?: number | null; mitarbeitende_bucket?: string | null }): string {
  if (typeof input.mitarbeitende === 'number' && input.mitarbeitende > 0) {
    return `${input.mitarbeitende} MA`;
  }
  return input.mitarbeitende_bucket ?? '—';
}
