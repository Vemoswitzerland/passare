'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { approveInseratAction } from '@/app/admin/inserate/actions';
import { cn } from '@/lib/utils';

/**
 * Mini-Button für Tabellen-Zeile: «✓ Freigeben» mit einem Klick.
 * Klick stoppt die Row-Click-Propagation (kein Navigate zur Detail-Page).
 */
export function InlineApproveButton({ inseratId }: { inseratId: string }) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [done, setDone] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (pending || done) return;

    startTx(async () => {
      const res = await approveInseratAction({ id: inseratId });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      data-no-row-click
      title={done ? 'Freigegeben' : 'Mit einem Klick freigeben'}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-soft text-[11px] font-medium border transition-colors',
        done
          ? 'bg-success/15 text-success border-success/30'
          : 'bg-success/10 text-success border-success/30 hover:bg-success/20',
        pending && 'opacity-60',
      )}
    >
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
      ) : (
        <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
      )}
      {done ? 'Live' : pending ? 'Freigeben…' : 'Freigeben'}
    </button>
  );
}
