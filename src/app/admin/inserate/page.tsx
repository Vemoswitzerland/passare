import Link from 'next/link';
import { FileText, ChevronRight, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  type AdminInserat,
  type InseratStatus,
  STATUS_LABELS,
  PAKET_LABELS,
  PAKET_VARIANTS,
  formatDate,
} from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Inserate — passare',
  robots: { index: false, follow: false },
};

const STATUS_FILTERS: { value: InseratStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'pending', label: STATUS_LABELS.pending },
  { value: 'live', label: STATUS_LABELS.live },
  { value: 'entwurf', label: STATUS_LABELS.entwurf },
  { value: 'pausiert', label: STATUS_LABELS.pausiert },
  { value: 'abgelaufen', label: STATUS_LABELS.abgelaufen },
];

export default async function AdminInseratePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'alle';

  const supabase = await createClient();
  let q = supabase.from('inserate').select('*').order('created_at', { ascending: false });
  if (
    statusFilter !== 'alle' &&
    ['entwurf', 'pending', 'live', 'pausiert', 'abgelaufen'].includes(statusFilter)
  ) {
    q = q.eq('status', statusFilter);
  }
  const { data } = await q;
  const inserate = (data ?? []) as AdminInserat[];

  // Counts pro Status für Tabs
  const counts: Record<string, number> = { alle: 0 };
  for (const f of STATUS_FILTERS) counts[f.value] = 0;
  const { data: allRows } = await supabase.from('inserate').select('status');
  for (const r of allRows ?? []) {
    counts.alle = (counts.alle ?? 0) + 1;
    const s = r.status as string;
    counts[s] = (counts[s] ?? 0) + 1;
  }

  const buildHref = (status: string) =>
    status === 'alle' ? '/admin/inserate' : `/admin/inserate?status=${status}`;

  return (
    <div className="max-w-6xl">
      <PageHeader overline="Verwaltung" title="Inserate" />

      <div className="flex items-center gap-1 flex-wrap mb-4">
        <Filter className="w-3.5 h-3.5 text-quiet mr-1" strokeWidth={1.5} />
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          const c = counts[f.value] ?? 0;
          return (
            <Link
              key={f.value}
              href={buildHref(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-soft text-caption font-medium transition-colors inline-flex items-center gap-1.5',
                active
                  ? 'bg-navy text-cream'
                  : 'text-quiet hover:text-navy hover:bg-stone/40',
              )}
            >
              {f.label}
              <span className={cn('font-mono tabular-nums', active ? 'opacity-80' : 'opacity-50')}>
                {c}
              </span>
            </Link>
          );
        })}
      </div>

      {inserate.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Noch keine Inserate"
          description={
            statusFilter === 'alle'
              ? 'Sobald der erste Verkäufer ein Inserat einreicht, erscheint es hier zur Freigabe.'
              : `Keine Inserate mit Status «${STATUS_LABELS[statusFilter as InseratStatus] ?? statusFilter}».`
          }
        />
      ) : (
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'titel', label: 'Inserat' },
            { key: 'paket', label: 'Paket' },
            { key: 'status', label: 'Status' },
            { key: 'created', label: 'Erstellt' },
            { key: 'arrow', label: '', align: 'right' },
          ]}
        >
          {inserate.map((l) => (
            <Tr key={l.id} className="cursor-pointer">
              <Td className="font-mono text-caption text-quiet whitespace-nowrap">
                <Link href={`/admin/inserate/${l.id}`} className="hover:text-navy transition-colors">
                  {l.public_id ?? l.id.slice(0, 8)}
                </Link>
              </Td>
              <Td>
                <Link
                  href={`/admin/inserate/${l.id}`}
                  className="block hover:text-bronze-ink transition-colors"
                >
                  <p className="text-ink">{l.titel}</p>
                  <p className="text-caption text-quiet mt-0.5">
                    {[l.branche, l.kanton].filter(Boolean).join(' · ') || '—'}
                  </p>
                </Link>
              </Td>
              <Td>
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-soft text-caption font-medium',
                    PAKET_VARIANTS[l.paket],
                  )}
                >
                  {PAKET_LABELS[l.paket]}
                </span>
              </Td>
              <Td>
                <StatusBadge status={l.status} />
              </Td>
              <Td className="font-mono text-caption text-quiet whitespace-nowrap">
                {formatDate(l.created_at)}
              </Td>
              <Td align="right">
                <Link
                  href={`/admin/inserate/${l.id}`}
                  className="inline-flex p-1 text-quiet hover:text-bronze-ink transition-colors"
                  aria-label="Detail"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
