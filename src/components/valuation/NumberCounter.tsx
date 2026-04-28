'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Zielwert (CHF) */
  to: number;
  /** Dauer in ms (default 1500) */
  duration?: number;
  /** Verzögerung bevor zählen startet (ms, default 0) */
  delay?: number;
  /** Optional: Format-Funktion (default: CHF mit ' Tausender) */
  format?: (n: number) => string;
  className?: string;
};

// easeOutQuart — smoother + ruhiger als easeOutExpo, fühlt sich
// professioneller an (kein "Ploppen" am Ende). Premium-Easing.
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Granularität für die Anzeige: bei grossen Beträgen runden wir auf
// nächste 1'000 / 10'000 — sonst wirkt der Counter "jittery" und
// hyperaktiv. Bei kleineren Werten 100er-Schritte.
function snap(value: number, target: number): number {
  if (target >= 1_000_000) return Math.round(value / 10_000) * 10_000;
  if (target >= 100_000) return Math.round(value / 1_000) * 1_000;
  if (target >= 10_000) return Math.round(value / 100) * 100;
  return Math.round(value);
}

const defaultFormat = (n: number): string =>
  `CHF ${Math.round(n).toLocaleString('de-CH').replace(/,/g, "'")}`;

/**
 * Animierter Zahlen-Counter mit easeOutQuart.
 * Zählt von 0 hoch zum Zielwert mit smooth-snapping (gerundete Steps).
 * Default-Dauer: 2200ms — institutionell ruhig, nicht hyperaktiv.
 */
export function NumberCounter({ to, duration = 2200, delay = 0, format, className }: Props) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const startTimeout = window.setTimeout(() => {
      const start = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const elapsed = Math.min(1, (now - start) / duration);
        const eased = easeOutQuart(elapsed);
        setValue(snap(eased * to, to));
        if (elapsed < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setValue(to);
        }
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, delay);

    return () => window.clearTimeout(startTimeout);
  }, [to, duration, delay]);

  const f = format ?? defaultFormat;
  return (
    <span className={className} suppressHydrationWarning>
      {f(value)}
    </span>
  );
}
