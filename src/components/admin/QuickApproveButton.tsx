'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { approveInseratAction } from '@/app/admin/inserate/actions';
import { cn } from '@/lib/utils';

/**
 * Prominenter Hero-Button oben auf der Inserat-Detail-Page.
 * Bei prüfbaren Inseraten zeigt er gross «Inserat freigeben» — ein Klick reicht.
 * Für Rückfrage / Ablehnen / Pausieren bleibt das InseratAuditPanel rechts.
 */
export function QuickApproveButton({
  inseratId,
  status,
}: {
  inseratId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const handleApprove = () => {
    setMsg(null);
    startTx(async () => {
      const res = await approveInseratAction({ id: inseratId });
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Inserat ist live!' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const labelText =
    status === 'rueckfrage'
      ? 'Verkäufer hat geantwortet — bereit zur Freigabe?'
      : 'Bereit zur Freigabe?';
  const subText =
    status === 'rueckfrage'
      ? 'Schau dir die Konversation unten an. Wenn alles geklärt ist, ein Klick und das Inserat geht live.'
      : 'Alle Daten geprüft? Ein Klick — Inserat geht live im Marktplatz.';

  return (
    <section
      className={cn(
        'mb-4 rounded-soft border-2 p-4 flex items-center justify-between gap-4 flex-wrap',
        status === 'rueckfrage'
          ? 'bg-bronze/10 border-bronze/40'
          : 'bg-success/5 border-success/30',
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <CheckCircle2
          className={cn(
            'w-5 h-5 mt-0.5 flex-shrink-0',
            status === 'rueckfrage' ? 'text-bronze-ink' : 'text-success',
          )}
          strokeWidth={1.5}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-navy">{labelText}</p>
          <p className="text-[12px] text-muted mt-0.5">{subText}</p>
          {msg && (
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-[11px]',
                msg.kind === 'ok' ? 'text-success' : 'text-danger',
              )}
            >
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {msg.text}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleApprove}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-soft text-[13px] font-medium transition-colors flex-shrink-0',
          'bg-success text-cream hover:bg-success/90',
          'disabled:opacity-60',
        )}
      >
        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
        {pending ? 'Gibt frei …' : 'Inserat freigeben'}
      </button>
    </section>
  );
}
