'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  MessageCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  approveInseratAction,
  requestRevisionAction,
  rejectInseratAction,
  pauseInseratAction,
  setInseratStatusAction,
  deleteInseratAction,
} from '@/app/admin/inserate/actions';
import { cn } from '@/lib/utils';

type Status =
  | 'entwurf'
  | 'pending'
  | 'zur_pruefung'
  | 'rueckfrage'
  | 'live'
  | 'pausiert'
  | 'verkauft'
  | 'abgelaufen'
  | 'abgelehnt';

type ActionMode = null | 'rueckfrage' | 'ablehnen' | 'pausieren';

/**
 * Audit-Aktions-Panel für Admin-Detail-Page eines Inserats.
 * Status-abhängige Buttons + Modal für Begründungen.
 */
export function InseratAuditPanel({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [pending, startTx] = useTransition();
  const [delPending, startDelTx] = useTransition();
  const [mode, setMode] = useState<ActionMode>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const closeModal = () => {
    setMode(null);
    setText('');
  };

  const handleApprove = () => {
    setMsg(null);
    startTx(async () => {
      const res = await approveInseratAction({ id });
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Inserat freigegeben.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const handleReactivate = () => {
    setMsg(null);
    startTx(async () => {
      const res = await setInseratStatusAction(id, 'live');
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Reaktiviert.' });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const handleSubmitModal = () => {
    setMsg(null);
    const trimmed = text.trim();
    if (mode !== 'pausieren' && trimmed.length < 3) {
      setMsg({ kind: 'err', text: 'Mindestens 3 Zeichen.' });
      return;
    }
    startTx(async () => {
      let res: { ok: boolean; error?: string } = { ok: false };
      if (mode === 'rueckfrage') {
        res = await requestRevisionAction({ id, message: trimmed });
      } else if (mode === 'ablehnen') {
        res = await rejectInseratAction({ id, reason: trimmed });
      } else if (mode === 'pausieren') {
        res = await pauseInseratAction({ id, reason: trimmed || undefined });
      }
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Aktualisiert.' });
        closeModal();
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const handleDelete = () => {
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

  const isPruefbar =
    currentStatus === 'pending' ||
    currentStatus === 'zur_pruefung' ||
    currentStatus === 'rueckfrage';

  const isLive = currentStatus === 'live';
  const isAbgelaufen = currentStatus === 'abgelaufen';
  const isPausiert = currentStatus === 'pausiert';

  return (
    <section className="bg-paper border border-stone rounded-soft p-4">
      <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
        Aktionen
      </h3>

      <div className="space-y-2">
        {isPruefbar && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={handleApprove}
              disabled={pending}
              className="w-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              Freigeben (live setzen)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMode('rueckfrage')}
              disabled={pending}
              className="w-full"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              Rückfrage stellen
            </Button>
            <button
              type="button"
              onClick={() => setMode('ablehnen')}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-soft border border-danger/30 bg-paper text-danger text-[12px] font-medium hover:bg-danger/5 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              Ablehnen
            </button>
          </>
        )}

        {isLive && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMode('pausieren')}
            disabled={pending}
            className="w-full"
          >
            <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
            Pausieren
          </Button>
        )}

        {(isPausiert || isAbgelaufen) && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleReactivate}
            disabled={pending}
            className="w-full"
          >
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            Reaktivieren (live setzen)
          </Button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={delPending}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-soft border border-danger/30 bg-danger/5 text-danger text-[12px] font-medium hover:bg-danger/10 transition-colors disabled:opacity-50 mt-2"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          {delPending ? 'Löscht …' : 'Löschen'}
        </button>
      </div>

      {msg && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-[11px] border',
            msg.kind === 'ok'
              ? 'text-success bg-success/10 border-success/30'
              : 'text-danger bg-danger/10 border-danger/30',
          )}
        >
          <AlertCircle className="w-3 h-3" strokeWidth={2} />
          {msg.text}
        </div>
      )}

      {/* Modal für Rückfrage / Ablehnen / Pausieren */}
      {mode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-paper border border-stone rounded-soft p-5 w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base text-navy font-semibold">
                {mode === 'rueckfrage' && 'Rückfrage an Verkäufer'}
                {mode === 'ablehnen' && 'Inserat ablehnen'}
                {mode === 'pausieren' && 'Inserat pausieren'}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 -mr-1 rounded-soft hover:bg-stone/40 transition-colors"
              >
                <X className="w-4 h-4 text-quiet" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-[12px] text-quiet mb-3">
              {mode === 'rueckfrage' &&
                'Der Verkäufer sieht deine Nachricht im Dashboard und kann darauf antworten. Status wechselt auf «Rückfrage offen».'}
              {mode === 'ablehnen' &&
                'Begründe die Ablehnung. Der Verkäufer sieht den Grund. Status wird «abgelehnt» (final).'}
              {mode === 'pausieren' &&
                'Optional: kurzer Hinweis warum pausiert. Verkäufer sieht den Status «pausiert».'}
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              autoFocus
              placeholder={
                mode === 'rueckfrage'
                  ? 'z. B. «Bitte präzisiere den Umsatz — die Bandbreite ist zu weit»'
                  : mode === 'ablehnen'
                    ? 'z. B. «Inserat enthält irreführende Angaben zum Umsatz»'
                    : 'z. B. «Auf Wunsch des Verkäufers pausiert»'
              }
              className="w-full px-2.5 py-2 bg-cream border border-stone rounded-soft text-[13px] focus:outline-none focus:border-bronze resize-y mb-3"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={pending}
                className="px-3 py-1.5 rounded-soft text-[12px] text-quiet hover:text-navy transition-colors"
              >
                Abbrechen
              </button>
              <Button
                size="sm"
                variant={mode === 'ablehnen' ? 'secondary' : 'primary'}
                onClick={handleSubmitModal}
                disabled={pending}
                className={cn(
                  mode === 'ablehnen' && '!border-danger/30 !text-danger hover:!bg-danger/10',
                )}
              >
                {pending
                  ? 'Sende …'
                  : mode === 'rueckfrage'
                    ? 'Rückfrage senden'
                    : mode === 'ablehnen'
                      ? 'Endgültig ablehnen'
                      : 'Pausieren'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
