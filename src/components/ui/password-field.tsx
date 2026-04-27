'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  /** Wenn true → Strength-Bar + Requirements anzeigen + onChange propagieren */
  showStrength?: boolean;
  value?: string;
  onChange?: (v: string) => void;
};

export function PasswordField({
  id, name, label, placeholder, required, disabled, autoComplete,
  showStrength = false, value, onChange,
}: Props) {
  const [reveal, setReveal] = useState(false);
  const [internal, setInternal] = useState('');
  const pw = value !== undefined ? value : internal;

  return (
    <div>
      <label htmlFor={id} className="overline block mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={reveal ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          minLength={showStrength ? 8 : undefined}
          maxLength={72}
          placeholder={placeholder}
          value={pw}
          onChange={(e) => {
            const v = e.target.value;
            if (value === undefined) setInternal(v);
            onChange?.(v);
          }}
          className={cn(
            'w-full bg-paper border border-stone rounded-soft',
            'px-4 py-3 pr-11 text-body font-sans text-ink',
            'placeholder:text-quiet placeholder:font-light',
            'transition-colors duration-200 ease-out-expo',
            'focus:outline-none focus:border-bronze focus:shadow-focus',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-quiet hover:text-navy transition-colors"
          aria-label={reveal ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {reveal ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      {showStrength && pw.length > 0 && <PasswordStrength pw={pw} />}
    </div>
  );
}

/* ───────────── Strength + Requirements (kompakt & ruhig) ───────────── */
function PasswordStrength({ pw }: { pw: string }) {
  const checks = [
    { label: '8 Zeichen', ok: pw.length >= 8 },
    { label: 'a-z', ok: /[a-z]/.test(pw) },
    { label: 'A-Z', ok: /[A-Z]/.test(pw) },
    { label: '0-9', ok: /[0-9]/.test(pw) },
    { label: '!@#', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const met = checks.filter((c) => c.ok).length;

  const { label, color } =
    met <= 2
      ? { label: 'Schwach', color: 'bg-danger' }
      : met === 3
        ? { label: 'Mittel', color: 'bg-warn' }
        : met === 4
          ? { label: 'Stark', color: 'bg-success/80' }
          : { label: 'Sehr stark', color: 'bg-success' };

  const labelColor =
    met <= 2 ? 'text-danger' : met === 3 ? 'text-warn' : 'text-success';

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bar mit 5 Segmenten */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 flex gap-1">
          {checks.map((c, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-300',
                i < met ? color : 'bg-stone',
              )}
            />
          ))}
        </div>
        <span className={cn('text-caption font-mono tracking-tight tabular-nums', labelColor)}>
          {label}
        </span>
      </div>

      {/* Requirements: ruhige Pills, alle in einer Zeile */}
      <ul className="flex flex-wrap gap-x-2.5 gap-y-1 text-caption text-quiet">
        {checks.map((c) => (
          <li key={c.label} className={cn('inline-flex items-center gap-1', c.ok && 'text-success')}>
            <span className="font-mono w-2 inline-flex justify-center">{c.ok ? '✓' : '·'}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isStrongPassword(pw: string): boolean {
  return (
    pw.length >= 8
    && /[a-z]/.test(pw)
    && /[A-Z]/.test(pw)
    && /[0-9]/.test(pw)
    && /[^A-Za-z0-9]/.test(pw)
  );
}
