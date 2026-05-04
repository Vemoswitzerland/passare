'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { extendInseratAction } from './actions';

/**
 * «Verlängern»- und «Upgrade»-Buttons für die Paket-Seite.
 * Verlängern: ruft extendInseratAction auf (default +6 Monate).
 * Upgrade: leitet zum Checkout mit neuem Paket weiter.
 */

export function ExtendButton({
  inseratId,
  monate = 6,
  label = 'Verlängern',
}: {
  inseratId: string;
  monate?: number;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(`Inserat um ${monate} Monate verlängern?`)) return;
    startTransition(async () => {
      const res = await extendInseratAction(inseratId, monate);
      if (!res.ok) {
        alert(`Fehler: ${res.error}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 px-4 py-2 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : null}
      {label}
    </button>
  );
}

export function UpgradeButton({
  inseratId,
  paket,
}: {
  inseratId: string;
  paket: 'pro' | 'premium';
}) {
  return (
    <Link
      href={`/dashboard/verkaeufer/checkout?inserat=${inseratId}&paket=${paket}`}
      className="mt-3 w-full inline-flex items-center justify-center gap-1 text-caption text-bronze-ink hover:underline"
    >
      Upgrade prüfen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
    </Link>
  );
}
