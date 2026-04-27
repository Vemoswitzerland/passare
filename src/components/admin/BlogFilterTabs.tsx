'use client';

import Link from 'next/link';
import { Filter } from 'lucide-react';
import { BLOG_KATEGORIEN } from '@/data/blog-topics';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'alle', label: 'Alle' },
  { value: 'entwurf', label: 'Entwürfe' },
  { value: 'veroeffentlicht', label: 'Veröffentlicht' },
] as const;

export function BlogFilterTabs({
  statusFilter,
  kategorieFilter,
  counts,
}: {
  statusFilter: string;
  kategorieFilter: string;
  counts: { alle: number; entwurf: number; veroeffentlicht: number };
}) {
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const status = overrides.status ?? statusFilter;
    const kategorie = overrides.kategorie ?? kategorieFilter;
    if (status && status !== 'alle') next.set('status', status);
    if (kategorie && kategorie !== 'alle') next.set('kategorie', kategorie);
    const qs = next.toString();
    return qs ? `/admin/blog?${qs}` : '/admin/blog';
  };

  return (
    <div className="space-y-3 mb-5">
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((t) => {
          const active = statusFilter === t.value;
          const count =
            t.value === 'alle' ? counts.alle : t.value === 'entwurf' ? counts.entwurf : counts.veroeffentlicht;
          return (
            <Link
              key={t.value}
              href={buildUrl({ status: t.value })}
              className={cn(
                'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                active
                  ? 'bg-navy text-cream'
                  : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
              )}
            >
              {t.label}
              <span className={cn('ml-1.5 font-mono', active ? 'opacity-80' : 'opacity-60')}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        <span className="overline text-quiet mr-1">Kategorie</span>
        <Link
          href={buildUrl({ kategorie: 'alle' })}
          className={cn(
            'px-3 py-1 rounded-pill text-caption transition-colors',
            kategorieFilter === 'alle'
              ? 'bg-navy text-cream'
              : 'bg-paper text-quiet border border-stone hover:border-navy/40',
          )}
        >
          Alle
        </Link>
        {BLOG_KATEGORIEN.map((k) => {
          const active = kategorieFilter === k.value;
          return (
            <Link
              key={k.value}
              href={buildUrl({ kategorie: k.value })}
              className={cn(
                'px-3 py-1 rounded-pill text-caption transition-colors',
                active
                  ? 'bg-navy text-cream'
                  : 'bg-paper text-quiet border border-stone hover:border-navy/40',
              )}
            >
              {k.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
