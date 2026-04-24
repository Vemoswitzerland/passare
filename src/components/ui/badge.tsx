import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'bronze' | 'navy' | 'success' | 'live';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
};

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-stone/60 text-ink',
  bronze: 'bg-bronze-soft text-bronze-ink',
  navy: 'bg-navy-soft text-navy',
  success: 'bg-success/10 text-success',
  live: 'bg-bronze/10 text-navy border border-bronze/30',
};

export function Badge({ className, variant = 'neutral', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-pill text-caption font-medium tracking-wide',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse-dot" />}
      {children}
    </span>
  );
}
