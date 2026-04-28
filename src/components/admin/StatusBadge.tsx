import { cn } from '@/lib/utils';
import type { InseratStatus } from '@/lib/admin/types';
import { STATUS_LABELS } from '@/lib/admin/types';

const styles: Record<InseratStatus, string> = {
  entwurf: 'bg-stone/60 text-muted border-stone',
  pending: 'bg-warn/15 text-warn border-warn/30',
  zur_pruefung: 'bg-warn/15 text-warn border-warn/30',
  rueckfrage: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  live: 'bg-success/10 text-success border-success/30',
  pausiert: 'bg-quiet/15 text-quiet border-quiet/30',
  verkauft: 'bg-navy-soft text-navy border-navy/20',
  abgelaufen: 'bg-quiet/15 text-quiet border-quiet/30',
  abgelehnt: 'bg-danger/10 text-danger border-danger/30',
};

export function StatusBadge({
  status,
  className,
}: {
  status: InseratStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-[11px] font-medium border',
        styles[status] ?? styles.entwurf,
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
