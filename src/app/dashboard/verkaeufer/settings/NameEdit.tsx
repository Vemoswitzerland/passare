'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Edit2, X } from 'lucide-react';
import { updateFullName } from '@/app/dashboard/settings-actions';
import { cn } from '@/lib/utils';

/**
 * Inline-Edit für full_name (Settings-Page).
 * Cyrill: «Wenn man beim Profil seinen Namen eingibt, soll der auch
 * gleich beim Profil oben übernommen werden — nicht den Google-Namen
 * behalten».
 *
 * Beim Save wird der Name in profiles.full_name geschrieben + die
 * Page revalidiert, damit Sidebar-Footer + alle anderen Stellen
 * sofort den neuen Namen zeigen.
 */
export function NameEdit({ initial }: { initial: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError('Name zu kurz.');
      return;
    }
    startTx(async () => {
      const res = await updateFullName(trimmed);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error ?? 'Speichern fehlgeschlagen.');
      }
    });
  };

  const cancel = () => {
    setValue(initial);
    setEditing(false);
    setError(null);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-body text-navy">{initial || '—'}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-caption text-bronze-ink hover:text-bronze transition-colors"
          title="Bearbeiten"
        >
          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        maxLength={80}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        className="px-2.5 py-1.5 bg-paper border border-bronze rounded-soft text-body focus:outline-none focus:shadow-focus"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1.5 bg-bronze text-cream rounded-soft text-caption font-medium hover:bg-bronze-ink transition-colors',
          pending && 'opacity-60',
        )}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={2} />
        {pending ? 'Speichert …' : 'Speichern'}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-caption text-quiet hover:text-navy transition-colors"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        Abbrechen
      </button>
      {error && <p className="basis-full text-caption text-danger">{error}</p>}
    </div>
  );
}
