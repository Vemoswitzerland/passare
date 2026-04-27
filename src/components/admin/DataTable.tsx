import * as React from 'react';
import { cn } from '@/lib/utils';

type Column = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

type DataTableProps = {
  columns: Column[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
};

export function DataTable({ columns, children, empty, className }: DataTableProps) {
  const childArray = React.Children.toArray(children);
  const isEmpty = childArray.length === 0;

  return (
    <div className={cn('bg-paper border border-stone rounded-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream border-b border-stone">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'px-4 py-3 overline text-quiet font-medium',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.align === 'left' && 'text-left',
                    !c.align && 'text-left',
                    c.className,
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/60">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-quiet text-body-sm">
                  {empty ?? 'Keine Einträge.'}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({
  children,
  className,
  align,
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-body-sm text-ink',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={cn('hover:bg-cream/60 transition-colors', className)}>{children}</tr>;
}
