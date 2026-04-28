'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Pause, Play, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setInseratStatusAction, deleteInseratAction } from '@/app/admin/inserate/actions';
import type { InseratStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export function InseratActions({
  id,
  currentStatus,
  publicId,
}: {
  id: string;
  currentStatus: InseratStatus;
  publicId: string | null;
}) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [delPending, startDelTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const setStatus = (status: InseratStatus, reason?: string) => {
    setMsg(null);
    startTx(async () => {
      const res = await setInseratStatusAction(id, status, reason);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Aktualisiert.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const remove = () => {
    if (!confirm('Inserat wirklich löschen? Kann nicht rückgängig gemacht werden.')) return;
    startDelTx(async () => {
      const res = await deleteInseratAction(id);
      if (res.ok) {
        router.push('/admin/inserate');
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Löschen fehlgeschlagen.' });
      }
    });
  };

  return (
    <section className="bg-paper border border-stone rounded-soft p-4">
      <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Aktionen</h3>
      <div className="space-y-2">
        {currentStatus === 'pending' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setStatus('live')}
            disabled={pending}
            className="w-full"
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Freigeben (live setzen)
          </Button>
        )}
        {currentStatus === 'live' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus('pausiert')}
            disabled={pending}
            className="w-full"
          >
            <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
            Pausieren
          </Button>
        )}
        {(currentStatus === 'pausiert' || currentStatus === 'entwurf') && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setStatus('live')}
            disabled={pending}
            className="w-full"
          >
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            Live setzen
          </Button>
        )}
        {currentStatus === 'abgelaufen' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus('live')}
            disabled={pending}
            className="w-full"
          >
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            Reaktivieren
          </Button>
        )}

        <button
          type="button"
          onClick={remove}
          disabled={delPending}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-soft border border-danger/30 bg-danger/5 text-danger text-caption hover:bg-danger/10 transition-colors disabled:opacity-50 mt-2"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          {delPending ? 'Löscht …' : 'Löschen'}
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-soft text-caption border',
            msg.kind === 'ok'
              ? 'text-success bg-success/10 border-success/30'
              : 'text-danger bg-danger/10 border-danger/30',
          )}
        >
          {msg.kind === 'ok' ? (
            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-3 h-3" strokeWidth={2} />
          )}
          {msg.text}
        </div>
      )}
    </section>
  );
}
