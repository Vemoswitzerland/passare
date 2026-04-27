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

/* ───────────── Strength + Requirements ───────────── */
function PasswordStrength({ pw }: { pw: string }) {
  const checks = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const met = Object.values(checks).filter(Boolean).length;

  const { label, color, width } =
    met <= 2
      ? { label: 'Schwach', color: 'bg-danger', width: 'w-1/4' }
      : met === 3
        ? { label: 'Mittel', color: 'bg-warn', width: 'w-2/4' }
        : met === 4
          ? { label: 'Stark', color: 'bg-success/80', width: 'w-3/4' }
          : { label: 'Sehr stark', color: 'bg-success', width: 'w-full' };

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-stone rounded-full overflow-hidden">
          <div className={cn('h-full transition-all duration-300', color, width)} />
        </div>
        <span className={cn(
          'text-caption font-mono uppercase tracking-widest',
          met <= 2 ? 'text-danger' : met === 3 ? 'text-warn' : 'text-success',
        )}>
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-caption">
        <Req ok={checks.length}>Mindestens 8 Zeichen</Req>
        <Req ok={checks.lower}>1 Kleinbuchstabe (a-z)</Req>
        <Req ok={checks.upper}>1 Grossbuchstabe (A-Z)</Req>
        <Req ok={checks.digit}>1 Ziffer (0-9)</Req>
        <Req ok={checks.special}>1 Sonderzeichen (!@#$…)</Req>
      </ul>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn(
      'flex items-center gap-1.5 leading-snug',
      ok ? 'text-success' : 'text-quiet',
    )}>
      <span className="w-3 inline-flex justify-center">{ok ? '✓' : '·'}</span>
      <span>{children}</span>
    </li>
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
