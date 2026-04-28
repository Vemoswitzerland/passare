'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/constants';

/**
 * Sort-Select für den Marktplatz: ändert die URL-Search-Param `sort` ohne Reload-Klick.
 * Alle anderen aktuellen Filter werden via existierende searchParams beibehalten.
 */
export function SortSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('sort', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={defaultValue}
      onChange={onChange}
      className="bg-transparent border border-stone rounded-soft px-3 py-1.5 text-body-sm focus:outline-none focus:border-bronze"
    >
      {SORT_OPTIONS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
