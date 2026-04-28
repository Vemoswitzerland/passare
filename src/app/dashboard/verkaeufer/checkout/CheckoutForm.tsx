'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
      // Hard-Redirect — bypassed Tunnel-Mode auch wenn etwas mit dem
      // Layout-Cache hickt
      window.location.href = `/dashboard/verkaeufer?paid=1`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Demo-Hinweis */}
      <div className="rounded-soft bg-warn/5 border border-warn/30 p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-caption text-warn leading-relaxed">
          <strong>Demo-Modus</strong> — keine echte Zahlung. Klick «Bezahlen» und das
          Inserat geht direkt zur Prüfung.
        </p>
      </div>

      {error && (
        <div className="rounded-soft bg-danger/5 border border-danger/30 px-4 py-3 text-body-sm text-danger">
          {error}
        </div>
      )}

      {/* Hauptbutton */}
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
            CHF {total.toFixed(2).replace(/\.00$/, '').replace(/,/g, "'")} bezahlen
          </>
        )}
      </button>

      {/* Trust-Footer */}
      <div className="flex items-center gap-2 justify-center pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
        <p className="text-caption text-quiet">
          Verschlüsselte Zahlung · Schweizer Datenschutz
        </p>
      </div>
    </div>
  );
}
