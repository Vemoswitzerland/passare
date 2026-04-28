import * as React from 'react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string | number;
  label: string;
  hint?: string;
  className?: string;
};

/**
 * Kompakte KPI-Kachel im Admin-Tool-Stil.
 * — Border-only, kein Schatten, kein farbiger Pill.
 * — Label klein oben, Wert gross in Sans (Mono-Nummern), optional Hint darunter.
 */
export function StatCard({ icon: Icon, value, label, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-paper border border-stone rounded-soft px-4 py-3 flex flex-col gap-1',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-quiet">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
        <p className="text-caption uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-2xl text-navy font-semibold tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-caption text-quiet font-mono leading-tight">{hint}</p>}
    </div>
  );
}
