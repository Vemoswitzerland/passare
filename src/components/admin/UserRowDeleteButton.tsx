'use client';

import { useState, useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteUserAction } from '@/app/admin/actions';

type Props = {
  userId: string;
  userName: string;
};

export function UserRowDeleteButton({ userId, userName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    startTx(async () => {
      setError(null);
      const res = await deleteUserAction({ user_id: userId });
      if (!res.ok) {
        setError(res.error ?? 'Fehler');
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {error && <span className="text-[10px] text-danger">{error}</span>}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title={confirming ? `«${userName}» wirklich löschen?` : 'User löschen'}
        className={`inline-flex items-center justify-center p-1 rounded-soft transition-all ${
          confirming
            ? 'bg-danger/15 text-danger hover:bg-danger/25'
            : 'text-quiet hover:text-danger hover:bg-danger/10'
        }`}
        aria-label={`User ${userName} löschen`}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
