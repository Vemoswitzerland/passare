import Link from 'next/link';
import { MessageSquare, ChevronRight, Filter, Lock, Unlock } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  type AdminAnfrage,
  type AnfrageStatus,
  ANFRAGE_STATUS_LABELS,
  formatDate,
} from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Anfragen — passare',
  robots: { index: false, follow: false },
};

const STATUS_FILTERS: { value: AnfrageStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'offen', label: ANFRAGE_STATUS_LABELS.offen },
  { value: 'in_bearbeitung', label: ANFRAGE_STATUS_LABELS.in_bearbeitung },
  { value: 'akzeptiert', label: ANFRAGE_STATUS_LABELS.akzeptiert },
  { value: 'abgelehnt', label: ANFRAGE_STATUS_LABELS.abgelehnt },
];

const statusStyles: Record<AnfrageStatus, string> = {
  offen: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  in_bearbeitung: 'bg-navy-soft text-navy border-navy/20',
  akzeptiert: 'bg-success/10 text-success border-success/30',
  abgelehnt: 'bg-danger/10 text-danger border-danger/30',
};

export default async function AdminAnfragenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; inserat?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'alle';
  const inseratFilter = params.inserat;

  const supabase = await createClient();
  let q = supabase
    .from('anfragen')
    .select('*, inserate(titel, public_id)')
    .order('created_at', { ascending: false });
  if (
    statusFilter !== 'alle' &&
    ['offen', 'in_bearbeitung', 'akzeptiert', 'abgelehnt'].includes(statusFilter)
  ) {
    q = q.eq('status', statusFilter);
  }
  if (inseratFilter) q = q.eq('inserat_id', inseratFilter);

  const { data } = await q;
  type Row = AdminAnfrage & {
    inserate: { titel: string | null; public_id: string | null } | null;
  };
  const anfragen = (data ?? []) as Row[];

  // Counts pro Status
  const counts: Record<string, number> = { alle: 0 };
  for (const f of STATUS_FILTERS) counts[f.value] = 0;
  const { data: allRows } = await supabase.from('anfragen').select('status');
  for (const r of allRows ?? []) {
    counts.alle = (counts.alle ?? 0) + 1;
    counts[r.status as string] = (counts[r.status as string] ?? 0) + 1;
  }

  // Käufer-Names (für Anzeige)
  const kaeuferIds = anfragen.map((a) => a.kaeufer_id).filter(Boolean) as string[];
  let kaeuferMap = new Map<string, { full_name: string | null; email?: string | null }>();
  if (kaeuferIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', kaeuferIds);
    for (const p of profiles ?? []) {
      kaeuferMap.set(p.id as string, { full_name: (p.full_name as string | null) ?? null });
    }
    try {
      const adminClient = createAdminClient();
      const { data: au } = await adminClient.auth.admin.listUsers();
      type AdminAuthUser = { id: string; email?: string | null };
      const list = (au as { users?: AdminAuthUser[] }).users ?? [];
      for (const u of list) {
        if (kaeuferMap.has(u.id)) {
          kaeuferMap.set(u.id, { ...kaeuferMap.get(u.id)!, email: u.email ?? null });
        }
      }
    } catch {
      /* ignore */
    }
  }

  const buildHref = (status: string) => {
    const sp = new URLSearchParams();
    if (status !== 'alle') sp.set('status', status);
    if (inseratFilter) sp.set('inserat', inseratFilter);
    const qs = sp.toString();
    return qs ? `/admin/anfragen?${qs}` : '/admin/anfragen';
  };

  return (
    <div className="max-w-6xl">
      <PageHeader overline="Verwaltung" title="Anfragen" />

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
                active ? 'bg-navy text-cream' : 'text-quiet hover:text-navy hover:bg-stone/40',
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

      {anfragen.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Noch keine Anfragen"
          description={
            statusFilter === 'alle'
              ? 'Sobald ein Käufer eine Anfrage zu einem Inserat stellt, erscheint sie hier.'
              : `Keine Anfragen mit Status «${ANFRAGE_STATUS_LABELS[statusFilter as AnfrageStatus] ?? statusFilter}».`
          }
        />
      ) : (
        <DataTable
          columns={[
            { key: 'id', label: 'Anfrage' },
            { key: 'inserat', label: 'Inserat' },
            { key: 'kaeufer', label: 'Käufer' },
            { key: 'nda', label: 'NDA' },
            { key: 'status', label: 'Status' },
            { key: 'created', label: 'Erstellt' },
            { key: 'arrow', label: '', align: 'right' },
          ]}
        >
          {anfragen.map((a) => {
            const k = a.kaeufer_id ? kaeuferMap.get(a.kaeufer_id) : null;
            return (
              <Tr key={a.id} className="cursor-pointer">
                <Td className="font-mono text-caption text-quiet whitespace-nowrap">
                  <Link href={`/admin/anfragen/${a.id}`} className="hover:text-navy transition-colors">
                    {a.public_id ?? a.id.slice(0, 8)}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={`/admin/anfragen/${a.id}`}
                    className="block hover:text-bronze-ink transition-colors"
                  >
                    <p className="text-ink truncate max-w-[280px]">
                      {a.inserate?.titel ?? <em className="text-quiet">— Inserat gelöscht</em>}
                    </p>
                    {a.inserate?.public_id && (
                      <p className="text-caption text-quiet font-mono mt-0.5">
                        {a.inserate.public_id}
                      </p>
                    )}
                  </Link>
                </Td>
                <Td>
                  {a.kaeufer_id ? (
                    <Link href={`/admin/users/${a.kaeufer_id}`} className="block hover:text-bronze-ink transition-colors">
                      <p className="text-ink">{k?.full_name ?? '— ohne Namen'}</p>
                      {k?.email && (
                        <p className="text-caption text-quiet font-mono mt-0.5">{k.email}</p>
                      )}
                    </Link>
                  ) : (
                    <span className="text-caption text-quiet italic">Anonym</span>
                  )}
                </Td>
                <Td>
                  {a.nda_signed_at ? (
                    <Badge variant="success">
                      <Lock className="w-3 h-3" strokeWidth={2} />
                      Signiert
                    </Badge>
                  ) : (
                    <Badge variant="neutral">
                      <Unlock className="w-3 h-3" strokeWidth={2} />
                      Offen
                    </Badge>
                  )}
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-caption font-medium border',
                      statusStyles[a.status],
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {ANFRAGE_STATUS_LABELS[a.status]}
                  </span>
                </Td>
                <Td className="text-caption text-quiet font-mono whitespace-nowrap">
                  {formatDate(a.created_at)}
                </Td>
                <Td align="right">
                  <Link
                    href={`/admin/anfragen/${a.id}`}
                    className="inline-flex p-1 text-quiet hover:text-bronze-ink transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </Link>
                </Td>
              </Tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
