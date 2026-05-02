import { Inbox } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  InboxLayout, type InboxThread, type InboxMessage,
} from '@/app/dashboard/verkaeufer/anfragen/InboxLayout';

export const metadata = {
  title: 'Admin · Nachrichten — passare',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ thread?: string }> };

/**
 * Admin-Inbox: alle Konversationen plattformweit.
 *
 * Cyrill 30.04.2026: «Die gleiche Chat-Funktion bitte jetzt einbauen
 * noch im Käufer- und im Verwaltungsdashboard. Dort ist nämlich noch
 * das Alte drin.»
 *
 * Threads:
 *   • k:<anfrageId> = Käufer↔Verkäufer (admin liest mit, kann eingreifen)
 *   • p:<inseratId> = passare-Team↔Verkäufer (audit-messages)
 */
export default async function AdminAnfragenPage({ searchParams }: Props) {
  const { thread: threadParam } = await searchParams;
  const adminClient = createAdminClient();

  // Aktuellen Admin-User identifizieren (für fromMe-Check)
  const sb = await createClient();
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return null;
  const meId = userData.user.id;

  // ── Alle Käufer-Anfragen laden (plattformweit) ─────────────────
  // Cyrill 01.05.2026: «steht nur noch keine Konversationen» — Bug war
  // dass die Page früh aussteigt wenn keine Käufer-Anfragen existieren.
  // passare↔Verkäufer-Threads sollen aber AUCH ohne Käufer-Anfragen
  // sichtbar sein. Daher hier KEIN Early-Return mehr — wir aggregieren
  // alle Quellen und zeigen den Empty-State erst nach der Threads-Liste.
  const { data: allAnfragen } = await adminClient
    .from('anfragen')
    .select('id, kaeufer_id, inserat_id, status, nachricht, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const anfrageList = (allAnfragen ?? []) as Array<Record<string, unknown>>;
  const anfrageIds = anfrageList.map((a) => a.id as string);
  // Inserat-IDs aus Anfragen — werden gleich um Audit-Inserate ergänzt
  const inseratIdsSet = new Set<string>(anfrageList.map((a) => a.inserat_id as string));

  // Audit-Messages zuerst — daraus kommen weitere Inserat-IDs (passare-Threads
  // ohne Käufer-Anfragen). Cyrill 01.05.2026: «steht nur noch keine
  // Konversationen» wenn nur passare↔Verkäufer-Threads existieren.
  const passareLastByInserat = new Map<string, { message: string; created_at: string }>();
  const { data: auditRaw } = await adminClient
    .from('inserat_audit_messages')
    .select('inserat_id, message, created_at')
    .order('created_at', { ascending: false });
  for (const m of (auditRaw ?? []) as Array<Record<string, unknown>>) {
    const iid = m.inserat_id as string;
    inseratIdsSet.add(iid);
    if (!passareLastByInserat.has(iid)) {
      passareLastByInserat.set(iid, {
        message: m.message as string,
        created_at: m.created_at as string,
      });
    }
  }

  const inseratIds = Array.from(inseratIdsSet);

  // Inserate (Titel + Verkäufer + Status) für ALLE relevanten Inserate
  const { data: insRows } = await adminClient
    .from('inserate')
    .select('id, titel, verkaeufer_id, status')
    .in('id', inseratIds);
  const insMap = new Map<string, { titel: string | null; verkaeufer_id: string; status: string | null }>();
  for (const i of (insRows ?? []) as Array<Record<string, unknown>>) {
    insMap.set(i.id as string, {
      titel: (i.titel as string | null) ?? null,
      verkaeufer_id: i.verkaeufer_id as string,
      status: (i.status as string | null) ?? null,
    });
  }

  // Profile (Käufer + Verkäufer)
  const allUserIds = Array.from(new Set([
    ...anfrageList.map((a) => a.kaeufer_id as string),
    ...Array.from(insMap.values()).map((i) => i.verkaeufer_id),
  ]));
  const profMap = new Map<string, { name: string | null; email: string | null }>();
  if (allUserIds.length > 0) {
    const { data: profs } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', allUserIds);
    for (const p of (profs ?? []) as Array<Record<string, unknown>>) {
      profMap.set(p.id as string, {
        name: (p.full_name as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      });
    }
  }

  // Last-Message pro Käufer-Thread
  type LastMsg = { anfrage_id: string; message: string; created_at: string };
  const lastMsgsByAnfrage = new Map<string, LastMsg>();
  if (anfrageIds.length > 0) {
    const { data: rawLasts } = await adminClient
      .from('anfrage_messages')
      .select('anfrage_id, message, created_at')
      .in('anfrage_id', anfrageIds)
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

  // ── Threads bauen ──────────────────────────────────────────────
  // Cyrill 02.05.2026: «im Chat selber beide anzeigt … zeigt doch nur den
  // anderen an, nicht beide». Also: Title = der GEGENÜBER-Name (nicht
  // «Käufer ↔ Verkäufer» oder «passare ↔ Verkäufer»). Im Käufer-Thread
  // (Admin liest mit) zeigen wir den Käufer als Haupttitel; der Verkäufer
  // steht als Status-Label drunter. Im passare-Thread (Admin schreibt mit
  // Verkäufer) zeigen wir nur den Verkäufer.
  const kaeuferThreads: InboxThread[] = anfrageList.map((a) => {
    const last = lastMsgsByAnfrage.get(a.id as string);
    const ins = insMap.get(a.inserat_id as string);
    const kaeuferProf = profMap.get(a.kaeufer_id as string);
    const verkProf = ins ? profMap.get(ins.verkaeufer_id) : null;
    const kaeuferName = kaeuferProf?.name ?? kaeuferProf?.email ?? 'Käufer';
    const verkName = verkProf?.name ?? verkProf?.email ?? 'Verkäufer';
    return {
      id: `k:${a.id}`,
      type: 'kaeufer' as const,
      title: kaeuferName,
      initials: deriveInitials(kaeuferName),
      lastMessage: last?.message ?? (a.nachricht as string | null) ?? '(keine Nachricht)',
      lastAt: last?.created_at ?? (a.updated_at as string),
      inseratId: a.inserat_id as string,
      inseratTitel: ins?.titel ?? null,
      detailHref: `/admin/anfragen/${a.id}`,
      statusLabel: `${statusLabel(a.status as string) ?? 'Anfrage'} · an ${verkName}`,
      unread: false,
    };
  });

  const passareThreads: InboxThread[] = [];
  for (const [iid, info] of passareLastByInserat) {
    const ins = insMap.get(iid);
    if (!ins) continue;
    const verkProf = profMap.get(ins.verkaeufer_id);
    const verkName = verkProf?.name ?? verkProf?.email ?? 'Verkäufer';
    passareThreads.push({
      id: `p:${iid}`,
      type: 'passare' as const,
      title: verkName,
      initials: deriveInitials(verkName),
      lastMessage: info.message,
      lastAt: info.created_at,
      inseratId: iid,
      inseratTitel: ins.titel,
      detailHref: `/admin/inserate/${iid}`,
      statusLabel: ins.status ? `passare-Team · ${ins.status}` : 'passare-Team',
      unread: false,
    });
  }

  const threads = [...kaeuferThreads, ...passareThreads].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );

  if (threads.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] px-3 py-3 md:px-4 md:py-4 flex items-center justify-center">
        <div className="rounded-card bg-paper border border-stone p-12 text-center max-w-md">
          <Inbox className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
          <h3 className="font-serif text-head-sm text-navy mb-1">Noch keine Konversationen</h3>
          <p className="text-body-sm text-muted">
            Sobald Käufer Anfragen stellen oder du als passare-Team einem
            Verkäufer schreibst, erscheint es hier.
          </p>
        </div>
      </div>
    );
  }

  // ── Aktiven Thread laden ───────────────────────────────────────
  const activeThreadId = threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  let activeMessages: InboxMessage[] = [];

  if (activeThread) {
    if (activeThread.type === 'kaeufer') {
      const anfrageId = activeThread.id.replace(/^k:/, '');
      const { data: msgs } = await adminClient
        .from('anfrage_messages')
        .select('id, from_user, from_role, message, attachments, created_at')
        .eq('anfrage_id', anfrageId)
        .order('created_at', { ascending: true });
      const msgList = (msgs ?? []) as Array<Record<string, unknown>>;
      activeMessages = msgList.map((m) => {
        const prof = profMap.get(m.from_user as string);
        const isMe = (m.from_user as string) === meId;
        const fromRole = m.from_role as string;
        const display = fromRole === 'admin'
          ? 'passare-Team'
          : prof?.name ?? prof?.email ?? (fromRole === 'kaeufer' ? 'Käufer' : 'Verkäufer');
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
    } else {
      const inseratId = activeThread.id.replace(/^p:/, '');
      const { data: msgs } = await adminClient
        .from('inserat_audit_messages')
        .select('id, from_user, from_role, kind, message, created_at')
        .eq('inserat_id', inseratId)
        .order('created_at', { ascending: true });
      const msgList = (msgs ?? []) as Array<Record<string, unknown>>;
      activeMessages = msgList.map((m) => {
        const prof = profMap.get(m.from_user as string);
        const isMe = (m.from_user as string) === meId;
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
        canReplyPassare={true}
        basePath="/admin/anfragen"
        senderRole="admin"
      />
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────

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
    case 'offen': return 'Offen';
    case 'in_bearbeitung': return 'In Bearbeitung';
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
