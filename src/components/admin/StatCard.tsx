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
 * — Linear/Stripe-Dashboard-Density.
 */
export function StatCard({ icon: Icon, value, label, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-paper border border-stone rounded-soft px-3 py-2.5 flex flex-col gap-0.5',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-quiet">
        {Icon && <Icon className="w-3 h-3" strokeWidth={1.5} />}
        <p className="text-[11px] uppercase tracking-wide font-medium leading-tight">{label}</p>
      </div>
      <p className="text-lg text-navy font-semibold tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-[11px] text-quiet font-mono leading-tight">{hint}</p>}
    </div>
  );
}
