'use client';

import { useEffect, useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'table' | 'grid';

export function ViewToggle({
  storageKey,
  value,
  onChange,
}: {
  storageKey: string;
  value: View;
  onChange: (v: View) => void;
}) {
  return (
    <div className="inline-flex border border-stone rounded-soft overflow-hidden bg-paper">
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'px-3 py-2 inline-flex items-center gap-2 text-caption font-medium transition-colors',
          value === 'table' ? 'bg-navy text-cream' : 'text-quiet hover:text-navy',
        )}
        aria-pressed={value === 'table'}
      >
        <List className="w-3.5 h-3.5" strokeWidth={1.5} />
        Tabelle
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'px-3 py-2 inline-flex items-center gap-2 text-caption font-medium border-l border-stone transition-colors',
          value === 'grid' ? 'bg-navy text-cream' : 'text-quiet hover:text-navy',
        )}
        aria-pressed={value === 'grid'}
      >
        <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
        Karten
      </button>
    </div>
  );
}

export function useViewToggle(storageKey: string, initial: View = 'table'): [View, (v: View) => void] {
  const [view, setView] = useState<View>(initial);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'table' || stored === 'grid') setView(stored);
    } catch {}
  }, [storageKey]);

  const set = (v: View) => {
    setView(v);
    try { localStorage.setItem(storageKey, v); } catch {}
  };

  return [view, set];
}
