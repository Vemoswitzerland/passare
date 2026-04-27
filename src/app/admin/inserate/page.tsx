'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Eye,
  Pencil,
  Pause,
  Play,
  Info,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ViewToggle, useViewToggle } from '@/components/admin/ViewToggle';
import {
  ADMIN_DEMO_LISTINGS,
  STATUS_LABELS,
  PAKET_LABELS,
  type AdminListingStatus,
  type AdminDemoListing,
} from '@/data/admin-demo';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: AdminListingStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'pending', label: STATUS_LABELS.pending },
  { value: 'live', label: STATUS_LABELS.live },
  { value: 'entwurf', label: STATUS_LABELS.entwurf },
  { value: 'pausiert', label: STATUS_LABELS.pausiert },
  { value: 'abgelaufen', label: STATUS_LABELS.abgelaufen },
];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

const PAKET_VARIANTS: Record<string, string> = {
  light: 'bg-stone/60 text-muted',
  pro: 'bg-bronze-soft text-bronze-ink',
  premium: 'bg-navy-soft text-navy',
};

export default function AdminInseratePage() {
  const [statusFilter, setStatusFilter] = useState<AdminListingStatus | 'alle'>('alle');
  const [view, setView] = useViewToggle('admin_inserate_view', 'table');

  const filtered = useMemo(() => {
    if (statusFilter === 'alle') return ADMIN_DEMO_LISTINGS;
    return ADMIN_DEMO_LISTINGS.filter((l) => l.admin_status === statusFilter);
  }, [statusFilter]);

  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">Verwaltung</p>
        <h1 className="font-serif text-display-sm text-navy font-light">Inserate</h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Übersicht aller Inserate auf der Plattform. Verkäufer pflegen die
          Daten selbst — du kannst Inserate freigeben, pausieren oder bei
          Verstößen entfernen.
        </p>
      </header>

      <div className="bg-bronze/10 border border-bronze/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-navy">
          <strong>Demo-Daten</strong> — die Inserate-Tabelle in der Datenbank
          wird in Etappe 47 angelegt. Aktionen sind aktuell deaktiviert.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-quiet" strokeWidth={1.5} />
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'alle'
                ? ADMIN_DEMO_LISTINGS.length
                : ADMIN_DEMO_LISTINGS.filter((l) => l.admin_status === f.value).length;
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-soft text-caption font-medium transition-colors',
                  active
                    ? 'bg-navy text-cream'
                    : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 font-mono', active ? 'opacity-80' : 'opacity-60')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ViewToggle storageKey="admin_inserate_view" value={view} onChange={setView} />
      </div>

      {view === 'table' ? <TableView listings={filtered} /> : <GridView listings={filtered} />}
    </div>
  );
}

function TableView({ listings }: { listings: AdminDemoListing[] }) {
  return (
    <DataTable
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'titel', label: 'Inserat' },
        { key: 'paket', label: 'Paket' },
        { key: 'status', label: 'Status' },
        { key: 'created', label: 'Erstellt' },
        { key: 'anfragen', label: 'Anfragen', align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ]}
      empty="Keine Inserate für diesen Filter."
    >
      {listings.map((l) => (
        <Tr key={l.id} className="cursor-pointer">
          <Td className="font-mono text-caption text-quiet whitespace-nowrap">
            <Link href={`/admin/inserate/${l.id}`} className="hover:text-navy transition-colors">
              {l.id}
            </Link>
          </Td>
          <Td>
            <Link href={`/admin/inserate/${l.id}`} className="block hover:text-bronze-ink transition-colors">
              <p className="text-ink">{l.titel}</p>
              <p className="text-caption text-quiet mt-0.5">
                {l.branche} · {l.kanton} · {l.umsatz}
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
            <StatusBadge status={l.admin_status} />
          </Td>
          <Td className="text-caption text-quiet font-mono whitespace-nowrap">
            {formatDate(l.created_at)}
          </Td>
          <Td align="right" className="font-mono text-caption">
            {l.pending_anfragen > 0 ? (
              <span className="text-bronze-ink font-medium">{l.pending_anfragen}</span>
            ) : (
              <span className="text-quiet">—</span>
            )}
          </Td>
          <Td align="right">
            <div className="inline-flex gap-1 items-center">
              <Link
                href={`/admin/inserate/${l.id}`}
                title="Detail öffnen"
                className="p-2 rounded-soft border border-stone bg-paper text-quiet hover:text-navy hover:border-navy/40 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
              <ActionButton title="Bearbeiten" icon={Pencil} />
              {l.admin_status === 'live' ? (
                <ActionButton title="Pausieren" icon={Pause} />
              ) : (
                <ActionButton title="Aktivieren" icon={Play} />
              )}
              <Link
                href={`/admin/inserate/${l.id}`}
                className="ml-1 p-1 text-quiet hover:text-bronze-ink transition-colors"
                aria-label={`Detail von ${l.id}`}
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </Td>
        </Tr>
      ))}
    </DataTable>
  );
}

function GridView({ listings }: { listings: AdminDemoListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="bg-paper border border-stone rounded-card p-12 text-center text-quiet text-body-sm">
        Keine Inserate für diesen Filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((l) => (
        <Link
          key={l.id}
          href={`/admin/inserate/${l.id}`}
          className="bg-paper border border-stone rounded-card p-5 flex flex-col gap-4 hover:border-bronze/40 hover:shadow-card transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={l.admin_status} />
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-soft text-caption font-medium',
                PAKET_VARIANTS[l.paket],
              )}
            >
              {PAKET_LABELS[l.paket]}
            </span>
          </div>
          <div>
            <p className="font-mono text-caption text-quiet mb-1">{l.id}</p>
            <h3 className="font-serif text-lg text-navy leading-snug">{l.titel}</h3>
            <p className="text-caption text-quiet mt-1">
              {l.branche} · {l.kanton} · seit {l.jahr}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-caption">
            <div>
              <dt className="overline text-quiet mb-0.5">Umsatz</dt>
              <dd className="font-mono text-ink">{l.umsatz}</dd>
            </div>
            <div>
              <dt className="overline text-quiet mb-0.5">EBITDA</dt>
              <dd className="font-mono text-ink">{l.ebitda}</dd>
            </div>
            <div>
              <dt className="overline text-quiet mb-0.5">Erstellt</dt>
              <dd className="font-mono text-ink">{formatDate(l.created_at)}</dd>
            </div>
            <div>
              <dt className="overline text-quiet mb-0.5">Anfragen</dt>
              <dd className="font-mono text-ink">
                {l.pending_anfragen > 0 ? l.pending_anfragen : '—'}
              </dd>
            </div>
          </dl>
          <div className="flex items-center justify-between gap-1 pt-3 border-t border-stone">
            <span className="text-caption text-bronze-ink inline-flex items-center gap-1">
              Detail öffnen <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
            </span>
            <span className="text-caption text-quiet font-mono">
              {l.pending_anfragen > 0 ? `${l.pending_anfragen} Anfragen` : '— Anfragen'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActionButton({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <button
      type="button"
      title={`${title} (kommt in Etappe 47)`}
      disabled
      className="p-2 rounded-soft border border-stone bg-paper text-quiet hover:text-navy hover:border-navy/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  );
}
