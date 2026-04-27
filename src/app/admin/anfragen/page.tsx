import { Info, Lock, Unlock } from 'lucide-react';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  ADMIN_DEMO_ANFRAGEN,
  ANFRAGE_STATUS_LABELS,
  type AdminAnfrageStatus,
} from '@/data/admin-demo';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Anfragen — passare',
  robots: { index: false, follow: false },
};

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

export default function AdminAnfragenPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">Verwaltung</p>
        <h1 className="font-serif text-display-sm text-navy font-light">Anfragen</h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Alle Käufer-Anfragen auf Inserate. NDA-Status, Bearbeitungs-Stand
          und Konversation auf einen Blick.
        </p>
      </header>

      <div className="bg-bronze/10 border border-bronze/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-navy">
          <strong>Demo-Daten</strong> — die Anfragen-Tabelle wird in Etappe 50
          in der Datenbank angelegt.
        </p>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Anfrage' },
          { key: 'inserat', label: 'Inserat' },
          { key: 'kaeufer', label: 'Käufer' },
          { key: 'nda', label: 'NDA' },
          { key: 'status', label: 'Status' },
          { key: 'created', label: 'Erstellt' },
        ]}
        empty="Keine Anfragen."
      >
        {ADMIN_DEMO_ANFRAGEN.map((a) => (
          <Tr key={a.id}>
            <Td className="font-mono text-caption text-quiet whitespace-nowrap">{a.id}</Td>
            <Td>
              <div>
                <p className="text-ink truncate max-w-[280px]">{a.inserat_titel}</p>
                <p className="text-caption text-quiet font-mono mt-0.5">{a.inserat_id}</p>
              </div>
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
          </Tr>
        ))}
      </DataTable>
    </div>
  );
}
