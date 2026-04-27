import { cn } from '@/lib/utils';
import type { AdminListingStatus } from '@/data/admin-demo';
import { STATUS_LABELS } from '@/data/admin-demo';

const styles: Record<AdminListingStatus, string> = {
  entwurf: 'bg-stone/60 text-muted border-stone',
  pending: 'bg-warn/15 text-warn border-warn/30',
  live: 'bg-success/10 text-success border-success/30',
  pausiert: 'bg-quiet/15 text-quiet border-quiet/30',
  abgelaufen: 'bg-danger/10 text-danger border-danger/30',
};

export function StatusBadge({
  status,
  className,
}: {
  status: AdminListingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-caption font-medium border',
        styles[status],
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}
