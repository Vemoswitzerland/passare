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

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const defaultFormat = (n: number): string =>
  `CHF ${Math.round(n).toLocaleString('de-CH').replace(/,/g, "'")}`;

/**
 * Animierter Zahlen-Counter mit easeOutExpo.
 * Zählt von 0 hoch zum Zielwert. Trigger via Mount.
 */
export function NumberCounter({ to, duration = 1500, delay = 0, format, className }: Props) {
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
        const eased = easeOutExpo(elapsed);
        setValue(eased * to);
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
