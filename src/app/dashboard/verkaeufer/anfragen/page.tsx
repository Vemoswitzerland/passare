import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageSquare, Inbox, Clock, Check, X as XIcon, FileSignature, ArrowRight, Sparkles } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { AnfragenList } from './AnfragenList';

export const metadata = { title: 'Nachrichten — passare Verkäufer' };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AnfragenPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('anfragen'))) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Anfragen werden noch eingerichtet</h2>
        <p className="text-body text-muted">Sobald ein Käufer dein Inserat anschreibt, siehst du es hier.</p>
      </div>
    );
  }

  // Alle Inserate des Users laden — wir aggregieren die Audit-Messages über
  // alle, damit Cyrill (oder ein Verkäufer mit mehreren Inseraten) alle
  // passare-Team-Nachrichten an einem Ort sieht. Für die Käufer-Anfragen-
  // Tabelle nehmen wir weiterhin das jüngste Inserat als Fokus (legacy UX).
  const { data: alleInserate } = await supabase
    .from('inserate')
    .select('id, titel, status')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false });

  const inserat = alleInserate?.[0] ?? null;

  if (!inserat) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Noch kein Inserat</h2>
        <p className="text-body text-muted">Erstelle zuerst ein Inserat, dann kommen hier Anfragen rein.</p>
      </div>
    );
  }

  // ── passare-Team-Nachrichten (über alle eigenen Inserate aggregiert) ──
  // Cyrill 30.04.2026: «Anfragen vom Admin sollen im Chat-Bereich landen,
  // nicht jedes Mal ein neuer Chat — alles im gleichen Bereich, mit
  // Inserat-Tag falls Inserat-bezogen.»
  type PassareMsg = {
    id: string;
    inserat_id: string;
    inserat_titel: string | null;
    inserat_status: string | null;
    message: string;
    kind: string;
    created_at: string;
  };
  // Service-Role: RLS auf inserat_audit_messages ist für den Verkäufer
  // restriktiv (nur eigene Inserate via Join lesbar). Wir umgehen das mit
  // dem Service-Role-Client und scopen auf die eigenen Inserat-IDs — der
  // Owner-Check kommt indirekt über alleInserate (wurde mit User-Auth
  // gefiltert auf verkaeufer_id == auth.uid()).
  // hasTable-Check entfernt: wenn Tabelle nicht existiert wirft die Query
  // einen 42P01-Error den wir abfangen. Vorher hat der hasTable-Check ggf.
  // false-positive false geliefert wegen RLS, dann waren die Nachrichten
  // unsichtbar — Cyrill: «sehe die Anfragen nicht».
  let passareMessages: PassareMsg[] = [];
  if ((alleInserate ?? []).length > 0) {
    try {
      const inseratIds = (alleInserate ?? []).map((i: { id: string }) => i.id);
      const inseratLookup = new Map<string, { titel: string | null; status: string | null }>();
      for (const i of alleInserate ?? []) {
        inseratLookup.set(i.id as string, {
          titel: (i.titel as string | null) ?? null,
          status: (i.status as string | null) ?? null,
        });
      }
      const adminClient = createAdminClient();
      const { data: rawMsgs, error } = await adminClient
        .from('inserat_audit_messages')
        .select('id, inserat_id, message, kind, created_at, from_role')
        .in('inserat_id', inseratIds)
        .eq('from_role', 'admin')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.warn('[anfragen] passareMessages query failed:', error.message);
      } else {
        passareMessages = (rawMsgs ?? []).map((m: Record<string, unknown>) => {
          const meta = inseratLookup.get(m.inserat_id as string);
          return {
            id: m.id as string,
            inserat_id: m.inserat_id as string,
            inserat_titel: meta?.titel ?? null,
            inserat_status: meta?.status ?? null,
            message: m.message as string,
            kind: m.kind as string,
            created_at: m.created_at as string,
          };
        });
      }
    } catch (err) {
      console.warn('[anfragen] passareMessages threw:', err);
    }
  }

  let q = supabase
    .from('anfragen')
    .select('id, kaeufer_id, message, status, score, created_at, decline_reason, profiles:kaeufer_id(full_name, kanton, sprache, verified_phone, verified_kyc, created_at)')
    .eq('inserat_id', inserat.id)
    .order('created_at', { ascending: false });

  if (filter === 'neu') q = q.eq('status', 'neu');
  else if (filter === 'aktiv') q = q.in('status', ['neu', 'in_pruefung', 'akzeptiert', 'nda_pending', 'nda_signed']);
  else if (filter === 'abgeschlossen') q = q.in('status', ['released', 'abgelehnt', 'geschlossen']);

  const { data: anfragen } = await q;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Nachrichten</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Posteingang
          </h1>
          <p className="text-body text-muted mt-2">
            Käufer-Anfragen und Nachrichten vom passare-Team — alles an einem Ort.
          </p>
        </div>

        {/* ── Nachrichten vom passare-Team (aggregiert über alle eigenen
              Inserate) — Cyrill: alles im gleichen Chat-Bereich, mit
              Inserat-Tag falls Inserat-bezogen ─────────────────────────── */}
        {passareMessages.length > 0 && (
          <div className="mb-6 rounded-card bg-bronze/5 border border-bronze/30 overflow-hidden">
            <header className="px-5 py-3 border-b border-bronze/20 bg-bronze/10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-bronze" strokeWidth={1.5} />
              <h2 className="text-body-sm text-navy font-medium">
                Nachrichten vom passare-Team
              </h2>
              <span className="font-mono text-caption text-bronze-ink ml-1">
                {passareMessages.length}
              </span>
            </header>
            <ul className="divide-y divide-bronze/15">
              {passareMessages.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/dashboard/verkaeufer/inserat`}
                    className="block px-5 py-3 hover:bg-bronze/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] uppercase tracking-wide text-bronze-ink font-medium">
                            {kindLabel(m.kind)}
                          </span>
                          {m.inserat_titel && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-soft text-[10px] font-medium bg-paper border border-stone text-navy">
                              <span className="text-quiet">Inserat:</span>
                              <span className="truncate max-w-[220px]">{m.inserat_titel}</span>
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-quiet ml-auto whitespace-nowrap">
                            {formatRelative(m.created_at)}
                          </span>
                        </div>
                        <p className="text-body-sm text-ink leading-snug line-clamp-2">
                          {m.message}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-quiet mt-1 flex-shrink-0" strokeWidth={1.5} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FilterPill href="/dashboard/verkaeufer/anfragen" active={!filter} label="Alle" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=neu" active={filter === 'neu'} label="Neu" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=aktiv" active={filter === 'aktiv'} label="In Bearbeitung" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=abgeschlossen" active={filter === 'abgeschlossen'} label="Abgeschlossen" />
        </div>

        <AnfragenList anfragen={(anfragen ?? []) as any} />
      </div>
    </div>
  );
}

/** Audit-Kind in lesbares Label übersetzen (für die passare-Team-Liste). */
function kindLabel(kind: string): string {
  switch (kind) {
    case 'rueckfrage':
      return 'Rückfrage';
    case 'kommentar':
      return 'Nachricht';
    case 'freigabe':
      return 'Freigegeben';
    case 'ablehnung':
      return 'Abgelehnt';
    case 'pause':
      return 'Pausiert';
    case 'antwort':
      return 'Antwort';
    default:
      return kind;
  }
}

/** Relative Zeit in Schweizer Schreibweise (heute, gestern, vor X Tagen). */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) return 'soeben';
  if (diffMin < 60) return `vor ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'gestern';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return new Date(iso).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={
        active
          ? 'inline-flex items-center px-4 py-2 rounded-pill bg-navy text-cream text-caption font-medium whitespace-nowrap'
          : 'inline-flex items-center px-4 py-2 rounded-pill border border-stone bg-paper text-caption text-muted hover:border-bronze/40 hover:text-navy whitespace-nowrap transition-colors'
      }
    >
      {label}
    </a>
  );
}
