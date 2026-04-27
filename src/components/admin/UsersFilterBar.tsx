'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type Counts = { alle: number; verkaeufer: number; kaeufer: number; admin: number };

const ROLE_FILTERS = [
  { value: 'alle', label: 'Alle' },
  { value: 'verkaeufer', label: 'Verkäufer' },
  { value: 'kaeufer', label: 'Käufer' },
  { value: 'admin', label: 'Admin' },
] as const;

const VERIFY_FILTERS = [
  { value: 'alle', label: 'Alle' },
  { value: 'phone', label: 'Telefon ✓' },
  { value: 'kyc', label: 'KYC ✓' },
  { value: 'beide', label: 'Voll verifiziert' },
  { value: 'keine', label: 'Keine Verifikation' },
] as const;

export function UsersFilterBar({
  counts,
  initialQuery,
}: {
  counts: Counts;
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const rolle = searchParams.get('rolle') ?? 'alle';
  const verified = searchParams.get('verified') ?? 'alle';

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'alle') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`/admin/users${next.toString() ? `?${next}` : ''}`);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (query !== initialQuery) {
        setParam('q', query || null);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const countMap: Record<string, number> = {
    alle: counts.alle,
    verkaeufer: counts.verkaeufer,
    kaeufer: counts.kaeufer,
    admin: counts.admin,
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet" strokeWidth={1.5} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, E-Mail oder Kanton suchen …"
          className="w-full pl-10 pr-9 py-2 bg-paper border border-stone rounded-soft text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-quiet hover:text-navy"
            aria-label="Suche löschen"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        <span className="overline text-quiet mr-1">Rolle</span>
        {ROLE_FILTERS.map((f) => {
          const active = rolle === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setParam('rolle', f.value === 'alle' ? null : f.value)}
              className={cn(
                'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                active
                  ? 'bg-navy text-cream'
                  : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
              )}
            >
              {f.label}
              <span className={cn('ml-1.5 font-mono', active ? 'opacity-80' : 'opacity-60')}>
                {countMap[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="overline text-quiet mr-1 ml-6">Verifikation</span>
        {VERIFY_FILTERS.map((f) => {
          const active = verified === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setParam('verified', f.value === 'alle' ? null : f.value)}
              className={cn(
                'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                active
                  ? 'bg-navy text-cream'
                  : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
