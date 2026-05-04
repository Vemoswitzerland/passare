import { Inbox } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { InboxLayout, type InboxThread, type InboxMessage } from '../../verkaeufer/anfragen/InboxLayout';
import { getMandatLabel } from '@/lib/broker/labels';

export const metadata = { title: 'Nachrichten — passare Broker' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ thread?: string }> };

/**
 * Broker-Inbox: alle Konversationen an einem Ort (analog Verkäufer-Inbox).
 *
 * Threads:
 *   • k:<anfrageId> = Käufer ↔ Broker (auf Mandat des Brokers, anfrage_messages)
 *   • g:<anfrageId> = Broker als Käufer ↔ Verkäufer (eigene gesendete Anfrage)
 *   • p:<inseratId> = passare-Team ↔ Broker (inserat_audit_messages)
 *
 * Der Broker tritt also in zwei Rollen auf: als Inserats-Inhaber (broker_id)
 * und als Anfrage-Sender (kaeufer_id). Beide Threads-Arten landen hier.
 */
export default async function BrokerAnfragenInboxPage({ searchParams }: Props) {
  const { thread: threadParam } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('anfragen'))) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Nachrichten werden noch eingerichtet</h2>
        <p className="text-body text-muted">Sobald jemand auf dein Mandat anfragt, siehst du es hier.</p>
      </div>
    );
  }

  // ── Mandate des Brokers (für eingehende Käufer-Anfragen) ────────
  const { data: alleMandate } = await supabase
    .from('inserate')
    .select('id, titel, firma_name, status')
    .eq('broker_id', userData.user.id)
    .order('updated_at', { ascending: false });

  const mandatIds = (alleMandate ?? []).map((i) => i.id as string);
  const mandatLookup = new Map<string, { titel: string | null; firma_name: string | null; status: string | null }>();
  for (const i of alleMandate ?? []) {
    mandatLookup.set(i.id as string, {
      titel: (i.titel as string | null) ?? null,
      firma_name: (i.firma_name as string | null) ?? null,
      status: (i.status as string | null) ?? null,
    });
  }

  const adminClient = createAdminClient();

  // ── KÄUFER-THREADS auf Mandate (Broker als «Verkäufer-Seite») ───
  let kaeuferAnfragen: Array<Record<string, unknown>> = [];
  if (mandatIds.length > 0) {
    const { data } = await supabase
      .from('anfragen')
      .select(`
        id, kaeufer_id, inserat_id, status, nachricht, created_at, updated_at,
        profiles:kaeufer_id (full_name, kanton)
      `)
      .in('inserat_id', mandatIds)
      .order('updated_at', { ascending: false });
    kaeuferAnfragen = (data ?? []) as Array<Record<string, unknown>>;
  }

  // Last-Message-Lookup für Käufer-Threads
  type LastMsg = { anfrage_id: string; message: string; created_at: string };
  const lastMsgsByAnfrage = new Map<string, LastMsg>();
  if (kaeuferAnfragen.length > 0 && (await hasTable('anfrage_messages'))) {
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

  // ── BROKER-EIGENE GESENDETE ANFRAGEN (als Käufer) ───────────────
  const { data: gesendetAnfragen } = await supabase
    .from('anfragen')
    .select('id, kaeufer_id, inserat_id, status, nachricht, created_at, updated_at')
    .eq('kaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false });

  // Inserat-Lookup für gesendete (Verkäufer-Inhaber des Inserats)
  const gesendetInseratIds = Array.from(
    new Set((gesendetAnfragen ?? []).map((g) => g.inserat_id as string)),
  );
  const gesendetInseratLookup = new Map<string, {
    titel: string | null;
    firma_name: string | null;
    verkaeufer_id: string | null;
    status: string | null;
  }>();
  if (gesendetInseratIds.length > 0) {
    const { data: gIns } = await adminClient
      .from('inserate')
      .select('id, titel, firma_name, verkaeufer_id, status')
      .in('id', gesendetInseratIds);
    for (const i of (gIns ?? []) as Array<Record<string, unknown>>) {
      gesendetInseratLookup.set(i.id as string, {
        titel: (i.titel as string | null) ?? null,
        firma_name: (i.firma_name as string | null) ?? null,
        verkaeufer_id: (i.verkaeufer_id as string | null) ?? null,
        status: (i.status as string | null) ?? null,
      });
    }
  }

  // Last-Message für gesendete Threads
  const gesendetLastMsg = new Map<string, LastMsg>();
  if ((gesendetAnfragen ?? []).length > 0 && (await hasTable('anfrage_messages'))) {
    const ids = (gesendetAnfragen ?? []).map((g) => g.id as string);
    const { data: rawLasts } = await adminClient
      .from('anfrage_messages')
      .select('anfrage_id, message, created_at')
      .in('anfrage_id', ids)
      .order('created_at', { ascending: false });
    for (const m of (rawLasts ?? []) as Array<Record<string, unknown>>) {
      const aid = m.anfrage_id as string;
      if (!gesendetLastMsg.has(aid)) {
        gesendetLastMsg.set(aid, {
          anfrage_id: aid,
          message: m.message as string,
          created_at: m.created_at as string,
        });
      }
    }
  }

  // ── PASSARE-TEAM-THREADS pro Mandat ─────────────────────────────
  const passareLastByInserat = new Map<
    string,
    { message: string; created_at: string; count: number }
  >();
  if (mandatIds.length > 0 && (await hasTable('inserat_audit_messages'))) {
    const { data: auditRaw } = await adminClient
      .from('inserat_audit_messages')
      .select('inserat_id, message, created_at')
      .in('inserat_id', mandatIds)
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

  // ── Verkäufer-Profile für gesendete Threads laden ───────────────
  const verkaeuferIds = Array.from(
    new Set(
      Array.from(gesendetInseratLookup.values())
        .map((i) => i.verkaeufer_id)
        .filter((v): v is string => Boolean(v)),
    ),
  );
  const verkaeuferProfMap = new Map<string, { name: string | null }>();
  if (verkaeuferIds.length > 0) {
    const { data: vps } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', verkaeuferIds);
    for (const p of vps ?? []) {
      verkaeuferProfMap.set(p.id as string, {
        name: (p.full_name as string | null) ?? null,
      });
    }
  }

  // ── THREADS-LISTE bauen ─────────────────────────────────────────
  const kaeuferThreads: InboxThread[] = kaeuferAnfragen.map((a) => {
    const profile = (a.profiles as unknown as {
      full_name: string | null; kanton: string | null;
    } | null);
    const last = lastMsgsByAnfrage.get(a.id as string);
    const meta = mandatLookup.get(a.inserat_id as string);
    const name = profile?.full_name ?? 'Käufer';
    return {
      id: `k:${a.id}`,
      type: 'kaeufer',
      title: name,
      initials: deriveInitials(name),
      lastMessage: last?.message ?? (a.nachricht as string | null) ?? '(keine Nachricht)',
      lastAt: last?.created_at ?? (a.updated_at as string),
      inseratId: a.inserat_id as string,
      inseratTitel: meta ? getMandatLabel(meta) : null,
      detailHref: `/dashboard/broker/anfragen/${a.id}`,
      statusLabel: statusLabel(a.status as string),
      unread: (a.status as string) === 'neu',
    };
  });

  const gesendetThreads: InboxThread[] = (gesendetAnfragen ?? []).map((g) => {
    const ins = gesendetInseratLookup.get(g.inserat_id as string);
    const verkProf = ins?.verkaeufer_id ? verkaeuferProfMap.get(ins.verkaeufer_id) : null;
    const inseratTitel = ins ? getMandatLabel(ins) : null;
    // Titel: Verkäufer-Name oder Inserat-Titel als Fallback
    const titleName = verkProf?.name ?? inseratTitel ?? 'Inserat-Inhaber';
    const last = gesendetLastMsg.get(g.id as string);
    return {
      id: `g:${g.id}`,
      type: 'broker_gesendet',
      title: titleName,
      initials: deriveInitials(titleName),
      lastMessage: last?.message ?? (g.nachricht as string | null) ?? '(keine Nachricht)',
      lastAt: last?.created_at ?? (g.updated_at as string),
      inseratId: g.inserat_id as string,
      inseratTitel,
      detailHref: `/dashboard/broker/anfragen/${g.id}`,
      statusLabel: statusLabel(g.status as string),
      unread: false,
    };
  });

  const passareThreads: InboxThread[] = [];
  for (const [iid, info] of passareLastByInserat) {
    const meta = mandatLookup.get(iid);
    passareThreads.push({
      id: `p:${iid}`,
      type: 'passare',
      title: 'passare-Team',
      initials: 'PT',
      lastMessage: info.message,
      lastAt: info.created_at,
      inseratId: iid,
      inseratTitel: meta ? getMandatLabel(meta) : null,
      detailHref: null,
      statusLabel: meta?.status ? `Mandat-Status: ${meta.status}` : null,
      unread: false,
    });
  }

  const threads = [...kaeuferThreads, ...gesendetThreads, ...passareThreads].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );

  if (threads.length === 0) {
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
            <h3 className="font-serif text-head-sm text-navy mb-1">Noch keine Nachrichten</h3>
            <p className="text-body-sm text-muted">
              Sobald Käufer auf deine Mandate anfragen oder du selbst eine Anfrage stellst, erscheint hier alles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Aktiven Thread + Nachrichten laden ──────────────────────────
  const activeThreadId = threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  let activeMessages: InboxMessage[] = [];
  let canReplyPassare = true;

  if (activeThread) {
    if (activeThread.type === 'kaeufer' || activeThread.type === 'broker_gesendet') {
      const prefix = activeThread.type === 'kaeufer' ? /^k:/ : /^g:/;
      const anfrageId = activeThread.id.replace(prefix, '');
      const { data: msgs } = await adminClient
        .from('anfrage_messages')
        .select('id, from_user, from_role, message, attachments, created_at')
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
          : prof?.name ?? prof?.email ?? (m.from_role as string === 'kaeufer' ? 'Käufer' : 'Inserat-Inhaber');
        return {
          id: m.id as string,
          fromMe: isMe,
          authorName: display,
          authorInitials: deriveInitials(display),
          message: m.message as string,
          createdAt: m.created_at as string,
          kindLabel: null,
          kindRaw: null,
          attachments: Array.isArray(m.attachments)
            ? (m.attachments as Array<Record<string, unknown>>).map((a) => ({
                kind: (a.kind as 'datenraum' | 'kaeufer_dossier' | 'upload') ?? 'upload',
                file_id: a.file_id as string | undefined,
                name: (a.name as string) ?? 'Datei',
                url: a.url as string | undefined,
                size: a.size as number | undefined,
                mime: a.mime as string | undefined,
              }))
            : [],
        };
      });
    } else {
      const inseratId = activeThread.id.replace(/^p:/, '');
      const inseratStatus = mandatLookup.get(inseratId)?.status ?? '';
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
          : prof?.name ?? prof?.email ?? 'Broker';
        return {
          id: m.id as string,
          fromMe: isMe,
          authorName: display,
          authorInitials: deriveInitials(display),
          message: m.message as string,
          createdAt: m.created_at as string,
          kindLabel: kindLabel(m.kind as string),
          kindRaw: m.kind as string,
          attachments: [],
        };
      });
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] px-3 py-3 md:px-4 md:py-4">
      <InboxLayout
        threads={threads}
        activeThreadId={activeThreadId}
        activeThread={activeThread}
        activeMessages={activeMessages}
        canReplyPassare={canReplyPassare}
        basePath="/dashboard/broker/anfragen"
        senderRole="broker"
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
