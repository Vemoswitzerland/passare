'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteUserAction } from '@/app/admin/actions';

type Props = {
  userId: string;
  userName: string;
};

/**
 * Danger-Zone: User komplett löschen.
 * Zwei-Step-Bestätigung mit Tippen des Namens — kein versehentliches Klicken.
 */
export function UserDeleteSection({ userId, userName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  // Cyrill 02.05.2026: «nur der erste Buchstabe muss man eingeben, nicht
  // das erste Wort». Ein einziger Buchstabe als Bestätigung — case-
  // insensitive, leerer/whitespace-only Input wird abgelehnt.
  const firstChar = userName.trim().charAt(0);
  const canDelete =
    !!firstChar &&
    confirmInput.trim().toLowerCase() === firstChar.toLowerCase();

  const onDelete = () => {
    if (!canDelete) return;
    setError(null);
    startTx(async () => {
      const res = await deleteUserAction({ user_id: userId });
      if (!res.ok) {
        setError(res.error ?? 'Fehler beim Löschen.');
        return;
      }
      router.push('/admin/users');
      router.refresh();
    });
  };

  if (!open) {
    return (
      <section className="bg-paper border border-danger/20 rounded-soft p-4">
        <h3 className="text-[11px] uppercase tracking-wide font-medium text-danger mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
          Danger Zone
        </h3>
        <p className="text-[12px] text-quiet mb-3">
          User komplett aus der Datenbank entfernen. Inserate, Anfragen und alle Verknüpfungen werden mitgelöscht.
          <strong className="text-danger"> Nicht rückgängig.</strong>
        </p>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="text-danger hover:bg-danger/10">
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          User löschen …
        </Button>
      </section>
    );
  }

  return (
    <section className="bg-danger/5 border border-danger/30 rounded-soft p-4">
      <h3 className="text-[11px] uppercase tracking-wide font-medium text-danger mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
        User wirklich löschen?
      </h3>
      <p className="text-[12px] text-ink mb-3 leading-relaxed">
        Tippe <strong className="font-mono">{firstChar}</strong> ins Feld unten und klick «Endgültig löschen», um zu bestätigen.
        Das Konto, das Profil, alle Inserate, Anfragen und Verknüpfungen werden permanent entfernt.
      </p>
      <input
        type="text"
        value={confirmInput}
        onChange={(e) => setConfirmInput(e.target.value)}
        placeholder={firstChar}
        className="w-full px-2.5 py-1.5 bg-paper border border-stone rounded-soft text-[13px] focus:outline-none focus:border-danger mb-3"
        autoFocus
      />
      {error && (
        <p className="text-[12px] text-danger mb-3 inline-flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete || pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger text-cream rounded-soft text-[12px] font-medium hover:bg-danger/90 disabled:bg-stone disabled:text-quiet disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
          ) : (
            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          )}
          {pending ? 'Lösche …' : 'Endgültig löschen'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmInput('');
            setError(null);
          }}
          disabled={pending}
          className="text-[12px] text-quiet hover:text-navy transition-colors px-2 py-1.5"
        >
          Abbrechen
        </button>
      </div>
    </section>
  );
}
