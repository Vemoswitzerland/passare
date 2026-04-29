'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Klickbare Tabellen-Zeile: ganze Reihe ist hover-/click-target,
 * navigiert per `useRouter().push()`. Inline-Buttons (z.B. Quick-Approve)
 * funktionieren weiter weil sie `e.stopPropagation()` aufrufen müssen
 * oder mit `data-no-row-click` markiert sind.
 *
 * Performance: prefetch beim Hover via router.prefetch().
 */
export function RowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Wenn Klick auf interaktives Element kam, nicht navigieren
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [data-no-row-click]')) return;
    // Cmd/Ctrl-Click → neuer Tab
    if (e.metaKey || e.ctrlKey) {
      window.open(href, '_blank');
      return;
    }
    router.push(href);
  };

  return (
    <tr
      onClick={handleClick}
      onMouseEnter={() => router.prefetch(href)}
      className={cn('cursor-pointer hover:bg-cream/60 transition-colors', className)}
    >
      {children}
    </tr>
  );
}
