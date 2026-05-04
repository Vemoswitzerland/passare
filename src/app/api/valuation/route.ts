/**
 * POST /api/valuation
 *
 * Smart-Bewertungs-Endpoint für Pre-Reg-Funnel + öffentliches Bewertungstool.
 * Nutzt pure Function aus lib/valuation.ts.
 * Künstliches Delay (1500ms) für "Berechnung läuft"-Inszenierung.
 */
import { NextRequest, NextResponse } from 'next/server';
import { calculateValuation } from '@/lib/valuation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Rate-limit defensiv: nutze rate-limit-helper falls Tabelle existiert
  try {
    const rate = await checkRateLimit(ip, 'valuation', 30);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Rate-Limit erreicht.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
      );
    }
  } catch {
    // Wenn rate_limit_log-Tabelle (Käufer-Agent) noch nicht existiert: weiter ohne Limit
  }

  const body = await req.json().catch(() => ({}));
  const {
    branche_id, umsatz, ebitda, mitarbeitende, jahr,
    inhaber_dependency, eigenkapital,
    // Erweiterte Detail-Faktoren aus dem Bewertungs-Funnel
    wachstum_pct, recurring_pct, top3_kunden_pct, inhaberabhaengigkeit,
  } = body;

  if (!branche_id || typeof umsatz !== 'number' || typeof ebitda !== 'number') {
    return NextResponse.json(
      { error: 'Pflichtfelder fehlen: branche_id, umsatz, ebitda' },
      { status: 400 },
    );
  }

  // Künstliches Delay für "Berechnung läuft"-Inszenierung (Pre-Reg-Funnel)
  // Skip-via Header für Tests / Public-Tool
  const skipDelay = req.headers.get('x-skip-delay') === '1';
  if (!skipDelay) {
    await new Promise((r) => setTimeout(r, 1500));
  }

  const numOrNull = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const allowedInhaber = ['low', 'mid', 'high'] as const;
  type AllowedInhaber = typeof allowedInhaber[number];
  const inhaberLevel: AllowedInhaber | null =
    typeof inhaberabhaengigkeit === 'string' &&
    (allowedInhaber as readonly string[]).includes(inhaberabhaengigkeit)
      ? (inhaberabhaengigkeit as AllowedInhaber)
      : null;

  const result = calculateValuation({
    branche_id,
    umsatz: Number(umsatz),
    ebitda: Number(ebitda),
    mitarbeitende: Number(mitarbeitende ?? 0),
    jahr: Number(jahr ?? new Date().getFullYear()),
    inhaber_dependency,
    eigenkapital: eigenkapital ? Number(eigenkapital) : undefined,
    wachstum_pct: numOrNull(wachstum_pct),
    recurring_pct: numOrNull(recurring_pct),
    top3_kunden_pct: numOrNull(top3_kunden_pct),
    inhaberabhaengigkeit: inhaberLevel,
  });

  return NextResponse.json(result);
}
