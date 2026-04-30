import { Inbox } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import {
  InboxLayout, type InboxThread, type InboxMessage,
} from '@/app/dashboard/verkaeufer/anfragen/InboxLayout';

export const metadata = {
  title: 'Nachrichten — passare Käufer',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ thread?: string }> };

/**
 * Käufer-Inbox: alle Käufer↔Verkäufer-Konversationen an einem Ort.
 *
 * Cyrill 30.04.2026: «Die gleiche Chat-Funktion bitte jetzt einbauen
 * noch im Käufer- und im Verwaltungsdashboard. Dort ist nämlich noch
 * das Alte drin.»
 *
 * Threads:
 *   • k:<anfrageId> = Käufer ↔ Verkäufer pro eigene Anfrage
 *
 * Aktiver Thread per ?thread=… in der URL.
 */
export default async function KaeuferInboxPage({ searchParams }: Props) {
  const { thread: threadParam } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('anfragen'))) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Nachrichten werden noch eingerichtet</h2>
        <p className="text-body text-muted">Sobald du eine Anfrage stellst, siehst du sie hier.</p>
      </div>
    );
  }

  // ── Eigene Anfragen laden — Käufer-Sicht ────────────────────────
  const { data: kaeuferAnfragen } = await supabase
    .from('anfragen')
    .select('id, kaeufer_id, inserat_id, status, nachricht, created_at, updated_at')
    .eq('kaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false });

  if (!kaeuferAnfragen || kaeuferAnfragen.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] px-3 py-3 md:px-4 md:py-4 flex items-center justify-center">
        <div className="rounded-card bg-paper border border-stone p-12 text-center max-w-md">
          <Inbox className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
          <h3 className="font-serif text-head-sm text-navy mb-1">Noch keine Nachrichten</h3>
          <p className="text-body-sm text-muted">Sobald du Verkäufer anschreibst, läuft hier euer Chat.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();
  const ids = kaeuferAnfragen.map((a) => a.id as string);
  const inseratIds = kaeuferAnfragen.map((a) => a.inserat_id as string);

  // Last-Message pro Thread
  type LastMsg = { anfrage_id: string; message: string; created_at: string };
  let lastMsgsByAnfrage = new Map<string, LastMsg>();
  if ((await hasTable('anfrage_messages'))) {
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

  // Inserate inkl. anonymitaet_level laden — Service-Role weil Käufer
  // nicht zwingend Read-Access hat.
  const { data: insRows } = await adminClient
    .from('inserate')
    .select('id, titel, verkaeufer_id, anonymitaet_level')
    .in('id', inseratIds);
  type InsInfo = {
    titel: string | null;
    verkaeufer_id: string;
    anonymitaet_level: string | null;
  };
  const insMap = new Map<string, InsInfo>();
  for (const i of (insRows ?? []) as Array<Record<string, unknown>>) {
    insMap.set(i.id as string, {
      titel: (i.titel as string | null) ?? null,
      verkaeufer_id: i.verkaeufer_id as string,
      anonymitaet_level: (i.anonymitaet_level as string | null) ?? null,
    });
  }

  // Verkäufer-Profile (für Threads die voll-offen sind)
  const verkaeuferIds = Array.from(new Set(Array.from(insMap.values()).map((i) => i.verkaeufer_id)));
  const verkaeuferProfMap = new Map<string, { name: string | null }>();
  if (verkaeuferIds.length > 0) {
    const { data: profs } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', verkaeuferIds);
    for (const p of (profs ?? []) as Array<Record<string, unknown>>) {
      verkaeuferProfMap.set(p.id as string, {
        name: (p.full_name as string | null) ?? null,
      });
    }
  }

  // ── Threads bauen ──────────────────────────────────────────────
  const threads: InboxThread[] = kaeuferAnfragen
    .map((a) => {
      const last = lastMsgsByAnfrage.get(a.id as string);
      const ins = insMap.get(a.inserat_id as string);
      const verkProf = ins ? verkaeuferProfMap.get(ins.verkaeufer_id) : null;
      // Bei voll_anonym oder vorname_funktion: pseudonymer Verkäufer-Name
      const showFullName = ins?.anonymitaet_level === 'voll_offen';
      const title = showFullName && verkProf?.name ? verkProf.name : 'Verkäufer';
      return {
        id: `k:${a.id}`,
        type: 'kaeufer' as const,
        title,
        initials: deriveInitials(title),
        lastMessage: last?.message ?? (a.nachricht as string | null) ?? '(keine Nachricht)',
        lastAt: last?.created_at ?? (a.updated_at as string),
        inseratId: a.inserat_id as string,
        inseratTitel: ins?.titel ?? null,
        detailHref: null,
        statusLabel: statusLabel(a.status as string),
        unread: false,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  // ── Aktiven Thread laden ───────────────────────────────────────
  const activeThreadId = threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  let activeMessages: InboxMessage[] = [];

  if (activeThread) {
    const anfrageId = activeThread.id.replace(/^k:/, '');
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
      const fromRole = m.from_role as string;
      const display = fromRole === 'admin'
        ? 'passare-Team'
        : fromRole === 'verkaeufer'
          ? activeThread.title
          : prof?.name ?? prof?.email ?? 'Käufer';
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
          ? (m.attachments as Array<Record<string, unknown>>).map((at) => ({
              kind: (at.kind as 'datenraum' | 'kaeufer_dossier' | 'upload') ?? 'upload',
              file_id: at.file_id as string | undefined,
              name: (at.name as string) ?? 'Datei',
              url: at.url as string | undefined,
              size: at.size as number | undefined,
              mime: at.mime as string | undefined,
            }))
          : [],
      };
    });
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] px-3 py-3 md:px-4 md:py-4">
      <InboxLayout
        threads={threads}
        activeThreadId={activeThreadId}
        activeThread={activeThread}
        activeMessages={activeMessages}
        canReplyPassare={false}
        basePath="/dashboard/kaeufer/anfragen"
        senderRole="kaeufer"
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
