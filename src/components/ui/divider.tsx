import { cn } from '@/lib/utils';

type DividerProps = {
  className?: string;
  label?: string;
};

/** Hairline 0.5px Divider — Swiss-Design-Style */
export function Divider({ className, label }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <span className="h-px flex-1 bg-stone" />
        <span className="overline">{label}</span>
        <span className="h-px flex-1 bg-stone" />
      </div>
    );
  }
  return <hr className={cn('border-0 h-px bg-stone', className)} />;
}
