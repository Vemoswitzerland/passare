'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { setInseratStatus, deleteInserat } from '../actions';

/**
 * Aktive Pause/Live/Löschen-Buttons fürs Mein-Inserat-Cockpit.
 * Verbindet die existierenden Server-Actions mit einem Confirm-Dialog
 * für Lösch-Aktionen.
 */
type Props = {
  inseratId: string;
  isLive: boolean;
  isPaused: boolean;
};

export function InseratActionButtons({ inseratId, isLive, isPaused }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handlePause = () => {
    startTransition(async () => {
      const res = await setInseratStatus(inseratId, 'pausiert');
      if (!res.ok) {
        alert(`Fehler: ${res.error}`);
        return;
      }
      router.refresh();
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      const res = await setInseratStatus(inseratId, 'live');
      if (!res.ok) {
        alert(`Fehler: ${res.error}`);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Inserat wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    startTransition(async () => {
      const res = await deleteInserat(inseratId);
      if (!res.ok) {
        alert(`Fehler: ${res.error}`);
        return;
      }
      router.push('/dashboard/verkaeufer');
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      <div className="flex flex-wrap gap-2">
        {isLive && (
          <button
            type="button"
            onClick={handlePause}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone hover:border-navy/40 rounded-soft text-body-sm text-navy transition-all disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Pause className="w-4 h-4" strokeWidth={1.5} />}
            Pausieren
          </button>
        )}
        {isPaused && (
          <button
            type="button"
            onClick={handleResume}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone hover:border-navy/40 rounded-soft text-body-sm text-navy transition-all disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
            Wieder live
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-caption text-quiet hover:text-danger transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
        Inserat löschen
      </button>
    </div>
  );
}
