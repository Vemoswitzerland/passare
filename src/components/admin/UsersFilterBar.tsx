'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
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
  { value: 'phone', label: 'Tel ✓' },
  { value: 'kyc', label: 'KYC ✓' },
  { value: 'beide', label: 'Voll' },
  { value: 'keine', label: 'Keine' },
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
    <div className="flex flex-col gap-2 mb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-caption text-quiet uppercase tracking-wide font-medium mr-1">
          Rolle
        </span>
        {ROLE_FILTERS.map((f) => {
          const active = rolle === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setParam('rolle', f.value === 'alle' ? null : f.value)}
              className={cn(
                'px-2.5 py-1 rounded-soft text-caption font-medium transition-colors inline-flex items-center gap-1.5',
                active ? 'bg-navy text-cream' : 'text-quiet hover:text-navy hover:bg-stone/40',
              )}
            >
              {f.label}
              <span className={cn('font-mono tabular-nums', active ? 'opacity-80' : 'opacity-50')}>
                {countMap[f.value]}
              </span>
            </button>
          );
        })}

        <span className="text-caption text-quiet uppercase tracking-wide font-medium ml-3 mr-1">
          Verifik.
        </span>
        {VERIFY_FILTERS.map((f) => {
          const active = verified === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setParam('verified', f.value === 'alle' ? null : f.value)}
              className={cn(
                'px-2.5 py-1 rounded-soft text-caption font-medium transition-colors',
                active ? 'bg-navy text-cream' : 'text-quiet hover:text-navy hover:bg-stone/40',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full lg:w-72">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-quiet"
          strokeWidth={1.5}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche Name, E-Mail, Kanton …"
          className="w-full pl-8 pr-8 py-1.5 bg-paper border border-stone rounded-soft text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-quiet hover:text-navy"
            aria-label="Suche löschen"
          >
            <X className="w-3 h-3" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
