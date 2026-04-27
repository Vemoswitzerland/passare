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
        'mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {overline && <p className="overline text-bronze mb-2">{overline}</p>}
        <h1 className="font-serif text-3xl md:text-display-sm text-navy font-light leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-body text-muted mt-2 max-w-prose">{description}</p>
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
    <div className="bg-paper border border-stone rounded-card p-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-soft bg-stone/50 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-5 h-5 text-quiet" strokeWidth={1.5} />
        </div>
      )}
      <p className="font-serif text-xl text-navy mb-2">{title}</p>
      {description && (
        <p className="text-body-sm text-muted max-w-md mx-auto mb-6">{description}</p>
      )}
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
