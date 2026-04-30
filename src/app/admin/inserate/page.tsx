import Link from 'next/link';
import { FileText, ChevronRight, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { DataTable, Td } from '@/components/admin/DataTable';
import { RowLink } from '@/components/admin/RowLink';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { InlineApproveButton } from '@/components/admin/InlineApproveButton';
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

// Cyrill 30.04.2026: «zweimal geprüft» — in den Status-Labels haben
// pending UND zur_pruefung beide das Label «In Prüfung». Wir behandeln
// den Filter «pending» als Sammler für beide echten DB-Status, damit nicht
// zwei Reiter mit demselben Wort und unterschiedlichen Inseraten zu sehen
// sind. zur_pruefung kommt nicht mehr als eigener Filter — wer im Detail
// schaut sieht den präzisen Status weiterhin.
const STATUS_FILTERS: { value: InseratStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'pending', label: 'In Prüfung' },
  { value: 'rueckfrage', label: STATUS_LABELS.rueckfrage },
  { value: 'live', label: STATUS_LABELS.live },
  { value: 'entwurf', label: STATUS_LABELS.entwurf },
  { value: 'pausiert', label: STATUS_LABELS.pausiert },
  { value: 'abgelehnt', label: STATUS_LABELS.abgelehnt },
  { value: 'abgelaufen', label: STATUS_LABELS.abgelaufen },
];

const VALID_STATUS = [
  'entwurf',
  'pending',
  'zur_pruefung',
  'rueckfrage',
  'live',
  'pausiert',
  'verkauft',
  'abgelaufen',
  'abgelehnt',
];

const PRUEFBAR = ['pending', 'zur_pruefung', 'rueckfrage'];

// «In Prüfung»-Filter sammelt pending + zur_pruefung zusammen.
const PENDING_GROUP = ['pending', 'zur_pruefung'];

export default async function AdminInseratePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'alle';

  const supabase = await createClient();

  // Performance: Liste + Counts parallel
  const listQuery = supabase
    .from('inserate')
    .select(
      'id, public_id, titel, branche, kanton, paket, status, created_at, verkaeufer_id, umsatz_chf, mitarbeitende',
    )
    .order('created_at', { ascending: false });

  const filteredQuery =
    statusFilter === 'pending'
      ? listQuery.in('status', PENDING_GROUP)
      : statusFilter !== 'alle' && VALID_STATUS.includes(statusFilter)
        ? listQuery.eq('status', statusFilter)
        : listQuery;

  const [{ data: list }, { data: allRows }] = await Promise.all([
    filteredQuery,
    supabase.from('inserate').select('status'),
  ]);

  const inserate = (list ?? []) as AdminInserat[];

  // Counts — pending sammelt pending + zur_pruefung zusammen, damit der
  // Filter-Counter zur tatsächlichen Tabelle passt (sonst Verwirrung).
  const counts: Record<string, number> = { alle: 0 };
  for (const f of STATUS_FILTERS) counts[f.value] = 0;
  for (const r of allRows ?? []) {
    counts.alle = (counts.alle ?? 0) + 1;
    const s = r.status as string;
    if (PENDING_GROUP.includes(s)) {
      counts.pending = (counts.pending ?? 0) + 1;
    } else {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }

  const buildHref = (status: string) =>
    status === 'alle' ? '/admin/inserate' : `/admin/inserate?status=${status}`;

  return (
    <div className="max-w-6xl">
      <PageHeader overline="Verwaltung" title="Inserate" />

      <div className="flex items-center gap-1 flex-wrap mb-3">
        <Filter className="w-3.5 h-3.5 text-quiet mr-1" strokeWidth={1.5} />
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          const c = counts[f.value] ?? 0;
          return (
            <Link
              key={f.value}
              href={buildHref(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-soft text-[12px] font-medium transition-colors inline-flex items-center gap-1.5',
                active ? 'bg-navy text-cream' : 'text-quiet hover:text-navy hover:bg-stone/40',
              )}
            >
              {f.label}
              <span
                className={cn('font-mono tabular-nums text-[11px]', active ? 'opacity-80' : 'opacity-50')}
              >
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
            { key: 'actions', label: '', align: 'right' },
          ]}
        >
          {inserate.map((l) => {
            const href = `/admin/inserate/${l.id}`;
            const isPruefbar = PRUEFBAR.includes(l.status);
            return (
              <RowLink key={l.id} href={href}>
                <Td className="font-mono text-[12px] text-quiet whitespace-nowrap">
                  {l.public_id ?? l.id.slice(0, 8)}
                </Td>
                <Td>
                  <p className="text-ink">
                    {l.titel || <em className="text-quiet">Ohne Titel</em>}
                  </p>
                  <p className="text-[11px] text-quiet mt-0.5">
                    {[l.branche, l.kanton].filter(Boolean).join(' · ') || '—'}
                  </p>
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-soft text-[11px] font-medium',
                      PAKET_VARIANTS[l.paket],
                    )}
                  >
                    {PAKET_LABELS[l.paket]}
                  </span>
                </Td>
                <Td>
                  <StatusBadge status={l.status} />
                </Td>
                <Td className="font-mono text-[11px] text-quiet whitespace-nowrap">
                  {formatDate(l.created_at)}
                </Td>
                <Td align="right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    {isPruefbar && <InlineApproveButton inseratId={l.id} />}
                    <ChevronRight className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                  </div>
                </Td>
              </RowLink>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
