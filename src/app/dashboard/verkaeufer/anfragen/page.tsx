import { Inbox } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { InboxLayout, type InboxThread, type InboxMessage } from './InboxLayout';

export const metadata = { title: 'Nachrichten — passare Verkäufer' };

type Props = { searchParams: Promise<{ thread?: string }> };

/**
 * Verkäufer-Inbox: alle Konversationen an einem Ort.
 *
 * Cyrill 30.04.2026: «Konversation soll als Thread unter Anfragen
 * laufen — Käufer-Anfragen und Nachrichten vom passare-Team in einer
 * gemeinsamen Liste, mit subtilem Inserat-Tag im Chat-Header.»
 *
 * Threads:
 *   • k:<anfrageId> = Käufer ↔ Verkäufer (anfrage_messages)
 *   • p:<inseratId> = passare-Team ↔ Verkäufer (inserat_audit_messages)
 *
 * Aktiver Thread per ?thread=… in der URL.
 */
export default async function AnfragenInboxPage({ searchParams }: Props) {
  const { thread: threadParam } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('anfragen'))) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Nachrichten werden noch eingerichtet</h2>
        <p className="text-body text-muted">Sobald ein Käufer dein Inserat anschreibt, siehst du es hier.</p>
      </div>
    );
  }

  // ── Eigene Inserate als Lookup ──────────────────────────────────
  const { data: alleInserate } = await supabase
    .from('inserate')
    .select('id, titel, status')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false });

  if (!alleInserate || alleInserate.length === 0) {
    return (
      <div className="px-6 md:px-10 py-8 md:py-12">
        <div className="max-w-content mx-auto">
          <div className="mb-6">
            <p className="overline text-bronze-ink mb-2">Nachrichten</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Inbox
            </h1>
          </div>
          <div className="rounded-card bg-paper border border-stone p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-head-sm text-navy mb-1">Noch kein Inserat</h3>
            <p className="text-body-sm text-muted">Erstelle zuerst ein Inserat, dann kommen hier Nachrichten rein.</p>
          </div>
        </div>
      </div>
    );
  }

  const inseratIds = alleInserate.map((i) => i.id as string);
  const inseratLookup = new Map<string, { titel: string | null; status: string | null }>();
  for (const i of alleInserate) {
    inseratLookup.set(i.id as string, {
      titel: (i.titel as string | null) ?? null,
      status: (i.status as string | null) ?? null,
    });
  }

  // ── KÄUFER-THREADS (anfragen) ───────────────────────────────────
  const { data: kaeuferAnfragen } = await supabase
    .from('anfragen')
    .select(`
      id, kaeufer_id, inserat_id, status, nachricht, created_at, updated_at,
      profiles:kaeufer_id (full_name, kanton)
    `)
    .in('inserat_id', inseratIds)
    .order('updated_at', { ascending: false });

  // Last-Message + Counter pro Käufer-Thread (anfrage_messages)
  const adminClient = createAdminClient();
  type LastMsg = { anfrage_id: string; message: string; created_at: string };
  let lastMsgsByAnfrage = new Map<string, LastMsg>();
  if (kaeuferAnfragen && kaeuferAnfragen.length > 0 && (await hasTable('anfrage_messages'))) {
    const ids = kaeuferAnfragen.map((a) => a.id as string);
    const { data: rawLasts } = await adminClient
      .from('anfrage_messages')
      .select('anfrage_id, message, created_at')
      .in('anfrage_id', ids)
      .order('created_at', { ascending: false });
    for (const m of (rawLasts ?? []) as Array<Record<string, unknown>>) {
      const aid = m.anfrage_id as string;
      if (!lastMsgsByAnfrage.has(aid)) {
        lastMsgsByAnfrage.set(aid, {
          anfrage_id: aid,
          message: m.message as string,
          created_at: m.created_at as string,
        });
      }
    }
  }

  // ── PASSARE-TEAM-THREADS (audit_messages aggregiert pro Inserat) ─
  let passareLastByInserat = new Map<
    string,
    { message: string; created_at: string; count: number }
  >();
  if (await hasTable('inserat_audit_messages')) {
    const { data: auditRaw } = await adminClient
      .from('inserat_audit_messages')
      .select('inserat_id, message, created_at')
      .in('inserat_id', inseratIds)
      .order('created_at', { ascending: false });
    for (const m of (auditRaw ?? []) as Array<Record<string, unknown>>) {
      const iid = m.inserat_id as string;
      const ex = passareLastByInserat.get(iid);
      if (!ex) {
        passareLastByInserat.set(iid, {
          message: m.message as string,
          created_at: m.created_at as string,
          count: 1,
        });
      } else {
        ex.count += 1;
      }
    }
  }

  // ── THREADS-LISTE bauen ─────────────────────────────────────────
  const kaeuferThreads: InboxThread[] = (kaeuferAnfragen ?? []).map((a) => {
    const profile = (a.profiles as unknown as {
      full_name: string | null; kanton: string | null;
    } | null);
    const last = lastMsgsByAnfrage.get(a.id as string);
    const meta = inseratLookup.get(a.inserat_id as string);
    const name = profile?.full_name ?? 'Käufer';
    return {
      id: `k:${a.id}`,
      type: 'kaeufer',
      title: name,
      initials: deriveInitials(name),
      lastMessage: last?.message ?? (a.nachricht as string | null) ?? '(keine Nachricht)',
      lastAt: last?.created_at ?? (a.updated_at as string),
      inseratId: a.inserat_id as string,
      inseratTitel: meta?.titel ?? null,
      detailHref: `/dashboard/verkaeufer/anfragen/${a.id}`,
      statusLabel: statusLabel(a.status as string),
      unread: (a.status as string) === 'neu',
    };
  });

  const passareThreads: InboxThread[] = [];
  for (const [iid, info] of passareLastByInserat) {
    const meta = inseratLookup.get(iid);
    passareThreads.push({
      id: `p:${iid}`,
      type: 'passare',
      title: 'passare-Team',
      initials: 'PT',
      lastMessage: info.message,
      lastAt: info.created_at,
      inseratId: iid,
      inseratTitel: meta?.titel ?? null,
      detailHref: null,
      statusLabel: meta?.status ? `Inserat-Status: ${meta.status}` : null,
      unread: false,
    });
  }

  const threads = [...kaeuferThreads, ...passareThreads].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );

  // ── Aktiven Thread + Nachrichten laden ──────────────────────────
  const activeThreadId = threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  let activeMessages: InboxMessage[] = [];
  let canReplyPassare = true;

  if (activeThread) {
    if (activeThread.type === 'kaeufer') {
      const anfrageId = activeThread.id.replace(/^k:/, '');
      const { data: msgs } = await adminClient
        .from('anfrage_messages')
        .select('id, from_user, from_role, message, created_at')
        .eq('anfrage_id', anfrageId)
        .order('created_at', { ascending: true });
      const msgList = (msgs ?? []) as Array<Record<string, unknown>>;
      const userIds = Array.from(new Set(msgList.map((m) => m.from_user as string)));
      const profMap = await loadProfiles(adminClient, userIds);
      activeMessages = msgList.map((m) => {
        const prof = profMap.get(m.from_user as string);
        const isMe = (m.from_user as string) === userData.user!.id;
        const display = (m.from_role as string) === 'admin'
          ? 'passare-Team'
          : prof?.name ?? prof?.email ?? (m.from_role as string === 'kaeufer' ? 'Käufer' : 'Verkäufer');
        return {
          id: m.id as string,
          fromMe: isMe,
          authorName: display,
          authorInitials: deriveInitials(display),
          message: m.message as string,
          createdAt: m.created_at as string,
          kindLabel: null,
        };
      });
    } else {
      const inseratId = activeThread.id.replace(/^p:/, '');
      const inseratStatus = inseratLookup.get(inseratId)?.status ?? '';
      // Antworten erlaubt wenn Inserat in aktivem Workflow
      canReplyPassare = !['entwurf', 'verkauft', 'abgelaufen', 'abgelehnt'].includes(inseratStatus);
      const { data: msgs } = await adminClient
        .from('inserat_audit_messages')
        .select('id, from_user, from_role, kind, message, created_at')
        .eq('inserat_id', inseratId)
        .order('created_at', { ascending: true });
      const msgList = (msgs ?? []) as Array<Record<string, unknown>>;
      const userIds = Array.from(new Set(msgList.map((m) => m.from_user as string)));
      const profMap = await loadProfiles(adminClient, userIds);
      activeMessages = msgList.map((m) => {
        const prof = profMap.get(m.from_user as string);
        const isMe = (m.from_user as string) === userData.user!.id;
        const display = (m.from_role as string) === 'admin'
          ? 'passare-Team'
          : prof?.name ?? prof?.email ?? 'Verkäufer';
        return {
          id: m.id as string,
          fromMe: isMe,
          authorName: display,
          authorInitials: deriveInitials(display),
          message: m.message as string,
          createdAt: m.created_at as string,
          kindLabel: kindLabel(m.kind as string),
        };
      });
    }
  }

  // Cyrill 30.04.2026: «Inbox ist zu klein, Titel nimmt zu viel Platz —
  // mach die Chat-Seite schön gross.» Header weg, Inbox füllt die ganze
  // Bildschirmfläche (minus Sidebar-Breite + minimaler Padding).
  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] px-3 py-3 md:px-4 md:py-4">
      <InboxLayout
        threads={threads}
        activeThreadId={activeThreadId}
        activeThread={activeThread}
        activeMessages={activeMessages}
        canReplyPassare={canReplyPassare}
      />
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────

async function loadProfiles(
  client: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, { name: string | null; email: string | null }>> {
  const map = new Map<string, { name: string | null; email: string | null }>();
  if (userIds.length === 0) return map;
  const { data } = await client
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
  for (const p of data ?? []) {
    map.set(p.id as string, {
      name: (p.full_name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
    });
  }
  return map;
}

function deriveInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/[\s@]/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusLabel(status: string): string | null {
  switch (status) {
    case 'neu': return 'Neue Anfrage';
    case 'in_pruefung': return 'In Prüfung';
    case 'akzeptiert': return 'Akzeptiert';
    case 'abgelehnt': return 'Abgelehnt';
    case 'nda_pending': return 'NDA ausstehend';
    case 'nda_signed': return 'NDA unterzeichnet';
    case 'released': return 'Datenraum freigegeben';
    case 'geschlossen': return 'Geschlossen';
    default: return null;
  }
}

function kindLabel(kind: string): string | null {
  switch (kind) {
    case 'rueckfrage': return 'Rückfrage';
    case 'antwort': return 'Antwort';
    case 'ablehnung': return 'Abgelehnt';
    case 'freigabe': return 'Freigegeben';
    case 'kommentar': return 'Notiz';
    case 'pause': return 'Pausiert';
    default: return null;
  }
}
