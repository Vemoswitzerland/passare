import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  overline?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ overline, title, description, actions, className }: Props) {
  return (
    <header
      className={cn(
        'mb-4 pb-3 border-b border-stone flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {overline && (
          <p className="text-[11px] text-quiet uppercase tracking-wide font-medium mb-0.5 leading-tight">
            {overline}
          </p>
        )}
        <h1 className="text-base text-navy font-semibold leading-tight">{title}</h1>
        {description && (
          <p className="text-caption text-muted mt-1 max-w-prose">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-paper border border-stone rounded-soft p-8 text-center">
      {Icon && (
        <div className="w-9 h-9 rounded-soft bg-stone/50 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-[13px] text-navy font-semibold mb-1">{title}</p>
      {description && (
        <p className="text-caption text-muted max-w-md mx-auto mb-4">{description}</p>
      )}
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
