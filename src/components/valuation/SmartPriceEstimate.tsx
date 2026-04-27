'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Check, Info } from 'lucide-react';
import { NumberCounter } from './NumberCounter';
import { RangeBar } from './RangeBar';
import type { ValuationResult } from '@/lib/valuation';
import { cn } from '@/lib/utils';

type Props = {
  /** Wenn null: zeigt Loading-Skeleton */
  result: ValuationResult | null;
  /** Wenn true: berechnet gerade — zeigt Skeleton mit Pulse-Anim */
  loading: boolean;
};

/**
 * Bewertungs-Reveal-Component.
 * - Loading: Skeleton mit Pulse + "Wir analysieren …"
 * - Reveal: Number-Counter + RangeBar + Faktoren staggered
 */
export function SmartPriceEstimate({ result, loading }: Props) {
  const [showFactors, setShowFactors] = useState(false);

  useEffect(() => {
    if (!result || loading) {
      setShowFactors(false);
      return;
    }
    const t = window.setTimeout(() => setShowFactors(true), 2000);
    return () => window.clearTimeout(t);
  }, [result, loading]);

  if (loading || !result) {
    return (
      <div className="rounded-card bg-paper border border-stone p-8 md:p-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded-full bg-bronze/30 animate-pulse" />
          <div className="h-3 w-44 rounded-soft bg-stone animate-pulse" />
        </div>
        <div className="h-4 w-32 rounded-soft bg-stone/60 animate-pulse mb-4" />
        <div className="h-12 w-72 rounded-soft bg-stone animate-pulse mb-6" />
        <div className="h-3 w-full rounded-pill bg-stone/60 animate-pulse mb-2" />
        <div className="space-y-3 mt-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 w-full rounded-soft bg-stone/40 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className="text-caption text-quiet mt-6 text-center italic">
          Wir analysieren deine Firma …
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-paper border border-stone p-8 md:p-10 animate-fade-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <p className="overline text-bronze-ink">Indikativer Marktwert</p>
      </div>

      <div className="text-center mb-8">
        <p className="font-serif text-display-md text-navy font-light font-tabular leading-none tracking-tight">
          <NumberCounter to={result.mid} duration={1500} delay={300} />
        </p>
      </div>

      <div className="mb-8">
        <RangeBar low={result.low} mid={result.mid} high={result.high} delay={400} />
      </div>

      <div className="space-y-3 border-t border-stone pt-6">
        <Factor
          show={showFactors}
          delay={0}
          label="Branche"
          value={`${result.basis.branche} · ${result.basis.ebitda_multiple_base.toFixed(1)}× EBITDA`}
        />
        <Factor
          show={showFactors}
          delay={100}
          label="EBITDA-Multiple adjusted"
          value={`${result.basis.ebitda_multiple_adj.toFixed(2)}×`}
        />
        <Factor
          show={showFactors}
          delay={200}
          label="EBITDA-Marge"
          value={`${result.basis.margin_pct.toFixed(1)} %`}
        />
        <Factor
          show={showFactors}
          delay={300}
          label="Gewichtung EBITDA / Umsatz"
          value={`${(result.basis.weight_ebitda * 100).toFixed(0)} % / ${((1 - result.basis.weight_ebitda) * 100).toFixed(0)} %`}
        />
      </div>

      <div className="mt-8 flex items-start gap-2 text-caption text-quiet leading-relaxed">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p>
          Indikative Markt-Heuristik basierend auf Branchen-Multiples für Schweizer KMU
          (Quelle: con|cess M+A · DUB · NIMBO Q1/2026). Ersetzt keine professionelle
          Unternehmensbewertung — finale Bewertung erfolgt im Käufer-Dialog.
        </p>
      </div>
    </div>
  );
}

function Factor({
  show, delay, label, value,
}: {
  show: boolean;
  delay: number;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 transition-all duration-500 ease-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
      style={{ transitionDelay: show ? `${delay}ms` : '0ms' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Check className="w-3.5 h-3.5 text-bronze flex-shrink-0" strokeWidth={2} />
        <span className="text-body-sm text-muted">{label}</span>
      </div>
      <span className="text-body-sm text-navy font-mono font-medium text-right">{value}</span>
    </div>
  );
}
