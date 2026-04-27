'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Info, Lock, Unlock, ChevronRight, Filter } from 'lucide-react';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  ADMIN_DEMO_ANFRAGEN,
  ANFRAGE_STATUS_LABELS,
  type AdminAnfrageStatus,
} from '@/data/admin-demo';
import { cn } from '@/lib/utils';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const statusStyles: Record<AdminAnfrageStatus, string> = {
  offen: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  in_bearbeitung: 'bg-navy-soft text-navy border-navy/20',
  akzeptiert: 'bg-success/10 text-success border-success/30',
  abgelehnt: 'bg-danger/10 text-danger border-danger/30',
};

const STATUS_FILTERS: { value: AdminAnfrageStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'offen', label: ANFRAGE_STATUS_LABELS.offen },
  { value: 'in_bearbeitung', label: ANFRAGE_STATUS_LABELS.in_bearbeitung },
  { value: 'akzeptiert', label: ANFRAGE_STATUS_LABELS.akzeptiert },
  { value: 'abgelehnt', label: ANFRAGE_STATUS_LABELS.abgelehnt },
];

const NDA_FILTERS = [
  { value: 'alle', label: 'Alle' },
  { value: 'signiert', label: 'NDA signiert' },
  { value: 'offen', label: 'NDA offen' },
] as const;

export default function AdminAnfragenPage() {
  const [statusFilter, setStatusFilter] = useState<AdminAnfrageStatus | 'alle'>('alle');
  const [ndaFilter, setNdaFilter] = useState<'alle' | 'signiert' | 'offen'>('alle');

  const filtered = useMemo(() => {
    return ADMIN_DEMO_ANFRAGEN.filter((a) => {
      if (statusFilter !== 'alle' && a.status !== statusFilter) return false;
      if (ndaFilter === 'signiert' && !a.nda_unterschrieben) return false;
      if (ndaFilter === 'offen' && a.nda_unterschrieben) return false;
      return true;
    });
  }, [statusFilter, ndaFilter]);

  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">Verwaltung</p>
        <h1 className="font-serif text-display-sm text-navy font-light">Anfragen</h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Alle Käufer-Anfragen auf Inserate. NDA-Status, Bearbeitungs-Stand
          und Konversation auf einen Blick. Klick auf eine Anfrage öffnet das Detail.
        </p>
      </header>

      <div className="bg-bronze/10 border border-bronze/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-navy">
          <strong>Demo-Daten</strong> — die Anfragen-Tabelle wird in Etappe 50 in der Datenbank angelegt.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-quiet" strokeWidth={1.5} />
          <span className="overline text-quiet mr-1">Status</span>
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'alle'
                ? ADMIN_DEMO_ANFRAGEN.length
                : ADMIN_DEMO_ANFRAGEN.filter((a) => a.status === f.value).length;
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
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

        <div className="flex items-center gap-2 flex-wrap">
          <span className="overline text-quiet mr-1 ml-6">NDA</span>
          {NDA_FILTERS.map((f) => {
            const active = ndaFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setNdaFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                  active
                    ? 'bg-navy text-cream'
                    : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-caption text-quiet mb-4">
        {filtered.length} {filtered.length === 1 ? 'Anfrage' : 'Anfragen'}
      </p>

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
        empty="Keine Anfragen für diesen Filter."
      >
        {filtered.map((a) => (
          <Tr key={a.id} className="cursor-pointer">
            <Td className="font-mono text-caption text-quiet whitespace-nowrap">
              <Link href={`/admin/anfragen/${a.id}`} className="hover:text-navy transition-colors">
                {a.id}
              </Link>
            </Td>
            <Td>
              <Link
                href={`/admin/anfragen/${a.id}`}
                className="block hover:text-bronze-ink transition-colors"
              >
                <p className="text-ink truncate max-w-[280px]">{a.inserat_titel}</p>
                <p className="text-caption text-quiet font-mono mt-0.5">{a.inserat_id}</p>
              </Link>
            </Td>
            <Td>
              <div>
                <p className="text-ink">{a.kaeufer_name}</p>
                <p className="text-caption text-quiet font-mono mt-0.5">{a.kaeufer_email}</p>
              </div>
            </Td>
            <Td>
              {a.nda_unterschrieben ? (
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
                className="inline-flex items-center text-quiet hover:text-bronze-ink transition-colors"
                aria-label={`Detail von ${a.id}`}
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </Td>
          </Tr>
        ))}
      </DataTable>
    </div>
  );
}
