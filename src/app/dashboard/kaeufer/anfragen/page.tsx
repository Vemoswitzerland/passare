import Link from 'next/link';
import { ArrowRight, MessageSquare, FileLock2, Clock, Check, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Nachrichten — Käufer · passare', robots: { index: false, follow: false } };

type Anfrage = {
  id: string;
  inserat_id: string;
  inserat_titel?: string | null;
  branche?: string | null;
  kanton?: string | null;
  status: string;
  letzte_antwort?: string | null;
  unread?: boolean;
  created_at: string;
};

export default async function AnfragenPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  let anfragen: Anfrage[] = [];
  const anfragenExists = await hasTable('anfragen');
  if (anfragenExists) {
    const { data } = await supabase
      .from('anfragen')
      .select('*')
      .eq('kaeufer_id', u.user.id)
      .order('created_at', { ascending: false });
    anfragen = (data ?? []) as Anfrage[];
  }

  return (
    <div className="space-y-6 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Posteingang</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Nachrichten<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Alle Dossier-Anfragen mit den Antworten der Verkäufer plus Nachrichten vom passare-Team — an einem Ort.
        </p>
      </div>

      {/* Templates-Banner */}
      <div className="bg-bronze/5 border border-bronze/20 rounded-card p-5">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-body-sm text-navy font-medium mb-1">Anfrage-Vorlagen</p>
            <p className="text-caption text-muted leading-relaxed">
              Sobald du im Marktplatz auf «Dossier anfragen» klickst, kannst du aus 3 vorgefertigten Nachrichten wählen («Vorstellung + Budget + Timing» / «Kurz und neugierig» / «Konkretes Angebot») und sie anpassen.
            </p>
          </div>
        </div>
      </div>

      {/* Status-Filter */}
      <div className="inline-flex bg-paper border border-stone rounded-soft p-0.5 flex-wrap">
        {(['Alle', 'Offen', 'In Bearbeitung', 'Akzeptiert', 'Abgelehnt', 'Archiviert'] as const).map((label, i) => (
          <button
            key={label}
            className={cn(
              'px-3 py-1.5 rounded-soft text-caption font-medium transition-colors',
              i === 0 ? 'bg-navy text-cream' : 'text-muted hover:text-navy',
            )}
            disabled
          >
            {label}
          </button>
        ))}
      </div>

      {!anfragenExists || anfragen.length === 0 ? (
        <EmptyState defensiv={!anfragenExists} />
      ) : (
        <div className="bg-paper border border-stone rounded-card overflow-hidden">
          <ul className="divide-y divide-stone">
            {anfragen.map((a) => (
              <AnfrageRow key={a.id} anfrage={a} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmptyState({ defensiv }: { defensiv: boolean }) {
  return (
    <div className="bg-paper border border-dashed border-stone rounded-card p-12 text-center">
      <p className="overline text-bronze-ink mb-3">Noch keine Anfragen</p>
      <h3 className="font-serif text-head-md text-navy font-normal mb-3">
        Hier werden deine Dossier-Anfragen erscheinen<span className="text-bronze">.</span>
      </h3>
      <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
        Stöbere im Marktplatz und klicke auf «Dossier anfragen» bei Inseraten die dich interessieren — der Verkäufer bekommt eine Nachricht und kann dir das NDA freigeben.
      </p>
      {defensiv && (
        <p className="text-caption text-quiet bg-warn/5 border border-warn/20 rounded-soft px-3 py-2 inline-flex items-center gap-2 mb-6">
          <AlertCircle className="w-3.5 h-3.5 text-warn" strokeWidth={1.5} />
          Tabelle „anfragen" wird gerade vom Verkäufer-Bereich aufgebaut
        </p>
      )}
      <div>
        <Link
          href="/kaufen"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
        >
          Zum Marktplatz <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

function AnfrageRow({ anfrage }: { anfrage: Anfrage }) {
  const statusInfo = STATUS_MAP[anfrage.status] ?? { label: anfrage.status, color: 'bg-stone/60 text-ink', icon: Clock };
  const StatusIcon = statusInfo.icon;

  return (
    <li>
      <Link
        href={`/dashboard/kaeufer/anfragen/${anfrage.id}`}
        className="flex items-start gap-4 px-5 py-4 hover:bg-stone/30 transition-colors"
      >
        {anfrage.unread && (
          <span className="w-2 h-2 rounded-full bg-bronze flex-shrink-0 mt-2.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <p className="font-mono text-caption text-quiet">
              {anfrage.inserat_id} · {anfrage.branche ?? '—'} · {anfrage.kanton ?? '—'}
            </p>
            <p className="font-mono text-caption text-quiet">
              {new Date(anfrage.created_at).toLocaleDateString('de-CH')}
            </p>
          </div>
          <p className="text-body-sm text-navy font-medium leading-snug mb-1">
            {anfrage.inserat_titel ?? 'Inserat'}
          </p>
          {anfrage.letzte_antwort && (
            <p className="text-caption text-muted line-clamp-1">
              <FileLock2 className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
              {anfrage.letzte_antwort}
            </p>
          )}
        </div>
        <span className={cn('inline-flex items-center gap-1.5 text-caption font-medium px-2.5 py-1 rounded-pill', statusInfo.color)}>
          <StatusIcon className="w-3 h-3" strokeWidth={2} />
          {statusInfo.label}
        </span>
      </Link>
    </li>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  offen:           { label: 'Offen',          color: 'bg-stone/60 text-ink',           icon: Clock },
  pending:         { label: 'Pending',        color: 'bg-warn/10 text-warn',           icon: Clock },
  in_bearbeitung:  { label: 'In Bearbeitung', color: 'bg-navy-soft text-navy',         icon: MessageSquare },
  akzeptiert:      { label: 'Akzeptiert',     color: 'bg-success/10 text-success',     icon: Check },
  approved:        { label: 'Akzeptiert',     color: 'bg-success/10 text-success',     icon: Check },
  abgelehnt:       { label: 'Abgelehnt',      color: 'bg-danger/5 text-danger',        icon: X },
  declined:        { label: 'Abgelehnt',      color: 'bg-danger/5 text-danger',        icon: X },
};
