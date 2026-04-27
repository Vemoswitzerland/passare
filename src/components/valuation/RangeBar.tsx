'use client';

import { useEffect, useState } from 'react';
import { formatCHFShort } from '@/lib/valuation';

type Props = {
  low: number;
  mid: number;
  high: number;
  /** Verzögerung bevor Animation startet */
  delay?: number;
};

/**
 * Animierte Range-Bar für Bewertungs-Reveal.
 * Bar fillt von 0 → 100% Width, Marker für Mid scheint später ein.
 */
export function RangeBar({ low, mid, high, delay = 0 }: Props) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  const midPct = high - low > 0 ? ((mid - low) / (high - low)) * 100 : 50;

  return (
    <div className="w-full">
      <div className="relative h-3 bg-stone/60 rounded-pill overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-bronze-soft via-bronze to-bronze-ink rounded-pill transition-all duration-[1500ms] ease-out"
          style={{ width: filled ? '100%' : '0%' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-navy ring-4 ring-cream transition-all duration-[1500ms] ease-out"
          style={{
            left: filled ? `calc(${midPct}% - 6px)` : '-12px',
            opacity: filled ? 1 : 0,
          }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between mt-2 text-caption font-mono text-quiet">
        <span>{formatCHFShort(low)}</span>
        <span className="text-bronze-ink">↑ Indikative Range</span>
        <span>{formatCHFShort(high)}</span>
      </div>
    </div>
  );
}
