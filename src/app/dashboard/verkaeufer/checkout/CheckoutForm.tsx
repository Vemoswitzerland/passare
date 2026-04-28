'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPayAction } from './actions';

type Props = {
  inseratId: string;
  paketId: string;
  powerupIds: string[];
  total: number;
};

export function CheckoutForm({ inseratId, paketId, powerupIds, total }: Props) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe-Style Form-State
  const [email, setEmail] = useState('');
  const [cardNum, setCardNum] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('CH');

  async function handlePay() {
    setError(null);
    setPaying(true);
    try {
      const res = await mockPayAction({ inseratId, paketId, powerupIds });
      if (!res.ok) {
        setError(res.error ?? 'Zahlung fehlgeschlagen');
        setPaying(false);
        return;
      }
      // Erfolg → Confirmation
      router.push(`/dashboard/verkaeufer/inserat?paid=1&inserat=${inseratId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Email */}
      <Field label="E-Mail">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dein@email.ch"
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        />
      </Field>

      {/* Zahlungsmethode-Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-soft border-2 border-bronze bg-bronze/5 text-body-sm font-medium text-navy"
        >
          <CreditCard className="w-4 h-4" strokeWidth={1.5} />
          Karte
        </button>
        <button type="button" disabled className="flex-1 px-4 py-3 rounded-soft border border-stone bg-paper text-body-sm text-quiet">
          TWINT
        </button>
        <button type="button" disabled className="flex-1 px-4 py-3 rounded-soft border border-stone bg-paper text-body-sm text-quiet">
          Apple Pay
        </button>
      </div>

      {/* Karten-Felder im Stripe-Style */}
      <Field label="Karteninformationen">
        <div className="border border-stone rounded-soft bg-paper overflow-hidden focus-within:border-bronze focus-within:shadow-focus transition-all">
          <input
            type="text"
            value={cardNum}
            onChange={(e) => setCardNum(formatCard(e.target.value))}
            placeholder="1234 1234 1234 1234"
            className="w-full px-4 py-3 text-body font-mono bg-transparent focus:outline-none border-b border-stone"
            autoComplete="cc-number"
            inputMode="numeric"
          />
          <div className="grid grid-cols-2 divide-x divide-stone">
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM / JJ"
              className="px-4 py-3 text-body font-mono bg-transparent focus:outline-none"
              autoComplete="cc-exp"
              inputMode="numeric"
            />
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="CVC"
              className="px-4 py-3 text-body font-mono bg-transparent focus:outline-none"
              autoComplete="cc-csc"
              inputMode="numeric"
            />
          </div>
        </div>
        <p className="text-caption text-quiet mt-2 font-mono">
          Demo: 4242 4242 4242 4242 wird automatisch akzeptiert
        </p>
      </Field>

      <Field label="Name auf der Karte">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Max Mustermann"
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        />
      </Field>

      <Field label="Land">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        >
          <option value="CH">Schweiz</option>
          <option value="DE">Deutschland</option>
          <option value="AT">Österreich</option>
          <option value="LI">Liechtenstein</option>
          <option value="FR">Frankreich</option>
          <option value="IT">Italien</option>
        </select>
      </Field>

      {error && (
        <div className="rounded-soft bg-danger/5 border border-danger/30 px-4 py-3 text-body-sm text-danger">
          {error}
        </div>
      )}

      {/* Bezahlen-Button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={paying}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-soft text-body font-medium transition-all',
          paying
            ? 'bg-stone text-quiet cursor-not-allowed'
            : 'bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px',
        )}
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            Verarbeite Zahlung …
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" strokeWidth={1.5} />
            CHF {total.toFixed(2).replace(/,/g, "'")} bezahlen
          </>
        )}
      </button>

      {/* Trust-Footer */}
      <div className="flex items-start gap-2 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-caption text-quiet leading-relaxed">
          Verschlüsselte Zahlung über Stripe · Schweizer Datenschutz · keine
          Kartendaten werden bei passare gespeichert.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="overline text-bronze-ink mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function formatCard(s: string): string {
  return s.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(s: string): string {
  const digits = s.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}
