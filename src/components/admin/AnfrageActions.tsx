'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setAnfrageStatusAction } from '@/app/admin/anfragen/actions';
import type { AnfrageStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

const TARGETS: { value: AnfrageStatus; label: string; variant: 'primary' | 'secondary' | 'bronze' | 'ghost' }[] = [
  { value: 'in_bearbeitung', label: 'In Bearbeitung', variant: 'secondary' },
  { value: 'akzeptiert', label: 'Akzeptieren', variant: 'primary' },
  { value: 'abgelehnt', label: 'Ablehnen', variant: 'ghost' },
  { value: 'offen', label: 'Auf Offen zurück', variant: 'ghost' },
];

export function AnfrageActions({
  id,
  currentStatus,
  currentNotes,
}: {
  id: string;
  currentStatus: AnfrageStatus;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const setStatus = (status: AnfrageStatus) => {
    setMsg(null);
    startTx(async () => {
      const res = await setAnfrageStatusAction(id, status, notes || undefined);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Aktualisiert.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const saveNotes = () => {
    setMsg(null);
    startTx(async () => {
      const res = await setAnfrageStatusAction(id, currentStatus, notes);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Notizen gespeichert.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  return (
    <section className="bg-paper border border-stone rounded-card p-6">
      <h3 className="font-serif text-xl text-navy mb-4">Aktionen</h3>

      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {TARGETS.filter((t) => t.value !== currentStatus).map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={t.variant}
            onClick={() => setStatus(t.value)}
            disabled={pending}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="border-t border-stone pt-4">
        <label className="overline text-quiet block mb-2">Admin-Notiz</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Interne Notiz zur Anfrage …"
          className="w-full px-3 py-2 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze resize-y mb-3"
        />
        <Button size="sm" variant="primary" onClick={saveNotes} disabled={pending}>
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Notiz speichern
        </Button>
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
