'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteUserAction } from '@/app/admin/actions';

type Props = {
  userId: string;
  userName: string;
};

/**
 * Inline-Delete-Button in der User-Tabelle.
 * Öffnet Browser-Confirm-Dialog (klar verständlich) — kein zwei-Klick-Pattern.
 * Bei Erfolg: refresht die Liste (Server-Component re-fetcht).
 * Bei Fehler: alert mit Fehlertext (sichtbar, nicht versteckt im 10px-Span).
 */
export function UserRowDeleteButton({ userId, userName }: Props) {
  const router = useRouter();
  const [pending, startTx] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm(
      `User «${userName}» wirklich löschen?\n\nKonto, Inserate, Anfragen — alles weg.\nNicht rückgängig.`,
    );
    if (!ok) return;
    startTx(async () => {
      const res = await deleteUserAction({ user_id: userId });
      if (!res.ok) {
        alert(`Löschen fehlgeschlagen:\n${res.error ?? 'Unbekannter Fehler'}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title="User löschen"
      className="inline-flex items-center justify-center p-1 rounded-soft text-quiet hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
      aria-label={`User ${userName} löschen`}
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
      ) : (
        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
      )}
    </button>
  );
}
