'use client';

import { useState, useTransition } from 'react';
import { ArrowRight } from 'lucide-react';

type Props = {
  tier: 'starter' | 'pro';
  interval: 'monthly' | 'yearly';
  label: string;
  className?: string;
};

export default function BrokerCheckoutButton({ tier, interval, label, className }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/broker-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, interval }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error ?? 'Checkout fehlgeschlagen');
          return;
        }
        if (data?.redirect) {
          window.location.assign(data.redirect);
        } else {
          window.location.assign('/dashboard/broker/welcome?paid=1');
        }
      } catch (e) {
        setError('Netzwerkfehler');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={
          className ??
          'inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        {isPending ? 'Lade…' : label}
        {!isPending && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
      </button>
      {error && <p className="mt-2 text-body-sm text-red-700">{error}</p>}
    </>
  );
}
