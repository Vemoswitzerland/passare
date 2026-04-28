'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: number | string | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Wenn false: kein CHF-Prefix (nur Trennstriche). Default true. */
  prefix?: boolean;
  id?: string;
  'aria-label'?: string;
};

/**
 * Schweizer Currency-Input mit Trennstrichen (1'000'000).
 * - Zeigt formatierte Zahl im Blur-State
 * - Im Focus-State zeigt rohe Zahl für einfaches Editieren
 * - CHF-Prefix optional
 * - onChange gibt Number zurück (null wenn leer)
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  prefix = true,
  id,
  'aria-label': ariaLabel,
}: Props) {
  const [focused, setFocused] = useState(false);
  const numericValue = (() => {
    if (value == null || value === '') return null;
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(n) ? n : null;
  })();

  const [raw, setRaw] = useState<string>(numericValue != null ? String(numericValue) : '');

  // Sync wenn parent-value sich extern ändert
  useEffect(() => {
    if (!focused) setRaw(numericValue != null ? String(numericValue) : '');
  }, [numericValue, focused]);

  const formatted = (() => {
    if (focused) return raw;
    if (numericValue == null) return '';
    return formatCHSwiss(numericValue);
  })();

  return (
    <div className={cn('relative', className)}>
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-quiet font-mono text-body-sm pointer-events-none">
          CHF
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={formatted}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          setRaw(cleaned);
          onChange(cleaned ? Number(cleaned) : null);
        }}
        onFocus={() => {
          setFocused(true);
          setRaw(numericValue != null ? String(numericValue) : '');
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full py-3 bg-paper border border-stone rounded-soft text-body font-mono tabular-nums',
          'focus:outline-none focus:border-bronze focus:shadow-focus transition-all',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          prefix ? 'pl-14 pr-4' : 'px-4',
        )}
      />
    </div>
  );
}

/** Schweizer Tausender-Trennzeichen: Apostroph */
export function formatCHSwiss(n: number): string {
  if (!Number.isFinite(n)) return '';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}
