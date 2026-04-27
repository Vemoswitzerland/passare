'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LENGTH = 4;

export function StatusForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setDigit(i: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    setError(null);

    // Auto-advance
    if (cleaned && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }

    // Auto-submit wenn alle 4 Stellen befüllt
    if (cleaned && i === LENGTH - 1 && next.every((d) => d !== '')) {
      submit(next.join(''));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        // Wenn aktuelles Feld leer → ins vorherige springen + dort löschen
        const next = [...digits];
        next[i - 1] = '';
        setDigits(next);
        refs.current[i - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const code = digits.join('');
      if (code.length === LENGTH) submit(code);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    const next = Array(LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    if (pasted.length === LENGTH) {
      submit(pasted);
    } else {
      refs.current[pasted.length]?.focus();
    }
  }

  async function submit(code: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Falscher Code');
        setDigits(Array(LENGTH).fill(''));
        refs.current[0]?.focus();
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-quiet text-center mb-3">
        Code · 4 Stellen
      </p>

      <div className="flex justify-center gap-3" role="group" aria-label="4-stelliger Code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            disabled={pending}
            aria-label={`Stelle ${i + 1}`}
            className={`w-14 h-16 md:w-16 md:h-20 text-center font-serif text-3xl md:text-4xl font-light text-navy bg-cream border rounded-card transition-all duration-200 ease-out-expo
              ${d ? 'border-bronze' : 'border-stone'}
              ${error ? 'border-danger animate-pulse' : ''}
              focus:outline-none focus:border-bronze focus:shadow-focus
              disabled:opacity-50`}
          />
        ))}
      </div>

      <div className="text-center min-h-[20px]">
        {error && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-danger">
            {error}
          </p>
        )}
        {pending && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-quiet">
            prüfe…
          </p>
        )}
      </div>
    </div>
  );
}
