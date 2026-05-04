import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare, Building2, Calendar, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getMandatLabel } from '@/lib/broker/labels';

export const metadata = { title: 'Anfrage — passare Broker', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function BrokerAnfrageDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) notFound();

  const { data: anfrage } = await supabase
    .from('anfragen')
    .select('id, inserat_id, kaeufer_id, nachricht, status, created_at, updated_at, dossier_requested_at, datenraum_granted_at')
    .eq('id', id)
    .maybeSingle();

  if (!anfrage) notFound();

  // Zugriffs-Check: Broker darf nur eigene Anfragen sehen — entweder als
  // Käufer (kaeufer_id) oder als Inseratsbesitzer (inserat.broker_id).
  const userId = u.user.id;
  let isOwner = anfrage.kaeufer_id === userId;
  let inseratData: { id: string; titel: string | null; firma_name: string | null; broker_id: string | null; verkaeufer_id: string | null } | null = null;

  const { data: ins } = await supabase
    .from('inserate')
    .select('id, titel, firma_name, broker_id, verkaeufer_id')
    .eq('id', anfrage.inserat_id)
    .maybeSingle();
  inseratData = ins;

  if (!isOwner && inseratData?.broker_id === userId) isOwner = true;
  if (!isOwner) notFound();

  const isAlsKaeufer = anfrage.kaeufer_id === userId;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/broker/anfragen"
          className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück zur Anfragen-Übersicht
        </Link>

        <div>
          <p className="overline text-bronze-ink mb-2">
            {isAlsKaeufer ? 'Anfrage gesendet' : 'Anfrage erhalten'}
          </p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            {inseratData ? getMandatLabel(inseratData) : 'Anfrage'}
          </h1>
          <p className="text-caption text-quiet font-mono mt-1">
            ID {anfrage.id.slice(0, 8)} · {new Date(anfrage.created_at).toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Status-Karte */}
        <div className="rounded-card bg-paper border border-stone p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="overline text-quiet">Status</span>
            <StatusBadge status={anfrage.status} />
          </div>
          <div className="space-y-2 text-caption">
            <Row icon={Calendar} label="Gesendet">
              {new Date(anfrage.created_at).toLocaleString('de-CH')}
            </Row>
            {anfrage.dossier_requested_at && (
              <Row icon={FileText} label="Dossier angefragt">
                {new Date(anfrage.dossier_requested_at).toLocaleDateString('de-CH')}
              </Row>
            )}
            {anfrage.datenraum_granted_at && (
              <Row icon={FileText} label="Datenraum freigegeben">
                {new Date(anfrage.datenraum_granted_at).toLocaleDateString('de-CH')}
              </Row>
            )}
            <Row icon={Building2} label="Inserat">
              <Link
                href={`/inserat/${anfrage.inserat_id}`}
                className="text-bronze-ink hover:text-bronze underline-offset-2 hover:underline"
              >
                Öffnen ↗
              </Link>
            </Row>
          </div>
        </div>

        {/* Nachricht */}
        {anfrage.nachricht && (
          <div className="rounded-card bg-paper border border-stone p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
              <h2 className="font-serif text-head-sm text-navy">
                {isAlsKaeufer ? 'Deine Nachricht' : 'Käufer-Nachricht'}
              </h2>
            </div>
            <p className="text-body-sm text-ink whitespace-pre-wrap leading-relaxed">
              {anfrage.nachricht}
            </p>
          </div>
        )}

        {!isAlsKaeufer && (
          <div className="rounded-card bg-cream/40 border border-stone p-5 text-caption text-muted">
            Detaillierte Status-Aktionen (Akzeptieren · Datenraum freigeben · Ablehnen) folgen in Kürze.
            Bis dahin kannst du Anfragen direkt mit dem Käufer per E-Mail bearbeiten.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-quiet flex-shrink-0" strokeWidth={1.5} />
      <span className="text-quiet w-32 flex-shrink-0">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    neu: { label: 'Neu', cls: 'bg-bronze/15 text-bronze-ink' },
    in_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    akzeptiert: { label: 'Akzeptiert', cls: 'bg-success/15 text-success' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-danger/10 text-danger' },
    nda_pending: { label: 'NDA Pending', cls: 'bg-navy/10 text-navy' },
    nda_signed: { label: 'NDA Signed', cls: 'bg-success/15 text-success' },
    released: { label: 'Freigegeben', cls: 'bg-success/15 text-success' },
    geschlossen: { label: 'Geschlossen', cls: 'bg-stone text-quiet' },
  };
  const entry = map[status] ?? { label: status, cls: 'bg-stone text-quiet' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-caption font-medium uppercase ${entry.cls}`}>
      {entry.label}
    </span>
  );
}
