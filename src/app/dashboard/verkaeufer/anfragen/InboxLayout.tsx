'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare, Send, ExternalLink, Sparkles, User, Inbox as InboxIcon,
  Paperclip, FileText, X as XIcon, CheckCircle2, XCircle, Pause as PauseIcon,
  CheckCheck, ShieldCheck,
} from 'lucide-react';
import { sendAnfrageMessage, listDatenraumFilesForAnfrage, type AnfrageAttachment } from './actions';
import { respondToRevisionAction } from '../inserat/actions';
import { sendInseratMessageAction } from '@/app/admin/inserate/actions';
import { cn } from '@/lib/utils';

/**
 * Inbox-Layout mit Liste links und Chat rechts (Slack/Linear-Stil).
 *
 * Cyrill 30.04.2026: «Konversation darf nicht im Mein-Inserat-Bereich
 * stattfinden — alle Chats (Käufer und passare-Team) gehören in
 * Anfragen / Nachrichten. Subtil mit Inserat-Tag im Chat-Header oben
 * rechts der zum Inserat zurück verlinkt.»
 */

export type InboxThread = {
  /** k:<anfrageId> oder p:<inseratId> */
  id: string;
  type: 'kaeufer' | 'passare';
  /** Anzeige-Titel (Käufer-Name oder «passare-Team») */
  title: string;
  initials: string;
  /** Letzte Nachricht für die Liste */
  lastMessage: string;
  lastAt: string;
  /** Inserat-Bezug für den Chat-Header */
  inseratId: string;
  inseratTitel: string | null;
  /** Verknüpfter Detail-Link (Käufer-Profil etc.) */
  detailHref: string | null;
  /** Status-Hinweis (für Käufer-Threads) */
  statusLabel: string | null;
  /** Ungelesen-Indikator (vorerst nur für neu) */
  unread: boolean;
};

export type InboxMessage = {
  id: string;
  fromMe: boolean;
  authorName: string;
  authorInitials: string;
  message: string;
  createdAt: string;
  /** für passare-Team-Threads: Audit-Kind als Label */
  kindLabel: string | null;
  /** Raw kind für Action-Karten-Rendering (freigabe/ablehnung/pause/rueckfrage) */
  kindRaw?: string | null;
  /** Anhänge — Datenraum-Files, Käufer-Dossier, Direkt-Upload */
  attachments?: AnfrageAttachment[];
};

type Props = {
  threads: InboxThread[];
  activeThreadId: string | null;
  activeThread: InboxThread | null;
  activeMessages: InboxMessage[];
  /** Bei passare-Team-Threads: ist Antworten erlaubt? */
  canReplyPassare: boolean;
  /** Aus welchem Bereich öffnen wir die Inbox? Bestimmt URL + erlaubte Features */
  basePath?: string;
  /** User-Rolle — bestimmt Attachment-Funktionen */
  senderRole?: 'verkaeufer' | 'kaeufer' | 'admin';
};

export function InboxLayout({
  threads, activeThreadId, activeThread, activeMessages, canReplyPassare,
  basePath = '/dashboard/verkaeufer/anfragen',
  senderRole = 'verkaeufer',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cyrill 02.05.2026: «zwischen Chats wechseln ist enorm langsam». Lösung:
  // (1) Optimistic-Click — der lokale State zeigt SOFORT den neuen Active
  //     auch wenn die Server-Component noch nicht refresht hat.
  // (2) useTransition — markiert den Refresh als Transition, blockiert
  //     keine UI-Updates und liefert isPending für subtile Lade-Animation.
  // (3) Prefetch beim Hover (router.prefetch) — beim Klick ist die neue
  //     Page-Variante oft schon im Cache.
  const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(activeThreadId);
  const [pendingNav, startNavTx] = useTransition();

  // Wenn der Server-Refresh durchläuft, holen wir den optimistischen State ein
  useEffect(() => {
    setOptimisticActiveId(activeThreadId);
  }, [activeThreadId]);

  const displayActiveId = optimisticActiveId ?? activeThreadId;

  const openThread = (threadId: string) => {
    if (threadId === displayActiveId) return;
    setOptimisticActiveId(threadId);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('thread', threadId);
    startNavTx(() => {
      router.push(`${basePath}?${sp.toString()}`);
    });
  };

  const prefetchThread = (threadId: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('thread', threadId);
    router.prefetch(`${basePath}?${sp.toString()}`);
  };

  // Cyrill 30.04.2026: «Inbox zu klein — links nur «Nachrichten»-Label,
  // Chat-Seite schön gross.» Layout füllt den ganzen verfügbaren Höhen-
  // raum (Eltern-Container ist in der Page auf calc(100vh - …) gesetzt),
  // linke Liste schmaler, Chat-Seite verschluckt den Rest.
  return (
    <div className="h-full rounded-card bg-paper border border-stone overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
      {/* ── LISTE LINKS ────────────────────────────────────────────── */}
      <aside className="border-b md:border-b-0 md:border-r border-stone bg-stone/20 flex flex-col min-h-0">
        <header className="px-4 py-3 border-b border-stone flex items-center gap-2 flex-shrink-0">
          <InboxIcon className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
          <p className="text-body-sm text-navy font-medium">Nachrichten</p>
          <span className="font-mono text-caption text-quiet ml-auto">{threads.length}</span>
        </header>

        {threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 text-quiet">
            <MessageSquare className="w-8 h-8 mb-3 text-quiet" strokeWidth={1.5} />
            <p className="text-body-sm">Noch keine Nachrichten.</p>
            <p className="text-caption mt-1">Sobald Käufer dein Inserat anschreiben oder das passare-Team eine Frage stellt, erscheint es hier.</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-stone/60 min-h-0">
            {threads.map((t) => {
              const isActive = t.id === displayActiveId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    onMouseEnter={() => prefetchThread(t.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150',
                      isActive
                        ? 'bg-paper border-l-2 border-bronze pl-[14px]'
                        : 'hover:bg-paper/60 border-l-2 border-transparent',
                    )}
                  >
                    <ThreadAvatar type={t.type} initials={t.initials} active={isActive} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={cn(
                          'text-body-sm truncate',
                          isActive ? 'text-navy font-medium' : 'text-ink',
                          t.unread && !isActive && 'font-medium',
                        )}>
                          {t.title}
                        </p>
                        <span className="font-mono text-[10px] text-quiet whitespace-nowrap flex-shrink-0">
                          {formatRelative(t.lastAt)}
                        </span>
                      </div>
                      <p className="text-caption text-quiet line-clamp-1">
                        {t.lastMessage}
                      </p>
                      {t.inseratTitel && (
                        <p className="mt-1 text-[10px] text-quiet truncate">
                          <span className="text-bronze-ink">Inserat:</span> {t.inseratTitel}
                        </p>
                      )}
                    </div>
                    {t.unread && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-bronze flex-shrink-0 mt-2" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── CHAT RECHTS — schluckt alle verbleibende Höhe + Breite ─── */}
      {/* Während pendingNav: kurze Opacity-Reduktion + Skeleton-Pulse als
          subtile Lade-Indikation. Cyrill 02.05.2026: «macht das Ganze
          auch schneller» — der Klick reagiert sofort, der Inhalt blendet
          smooth über. */}
      <section
        className={cn(
          'flex flex-col min-h-0 h-full transition-opacity duration-150',
          pendingNav && 'opacity-70',
        )}
      >
        {!activeThread ? (
          <EmptyState />
        ) : (
          <ChatPane
            // key auf Thread-ID erzwingt komplettes Re-Render des ChatPane
            // beim Wechsel — Auto-Scroll und Eingabe-State werden korrekt
            // zurückgesetzt, kein "alte Nachrichten kurz sichtbar"-Flash.
            key={activeThread.id}
            thread={activeThread}
            messages={activeMessages}
            canReply={activeThread.type === 'kaeufer' || canReplyPassare}
            senderRole={senderRole}
          />
        )}
      </section>
    </div>
  );
}

// ─── CHAT-PANE ────────────────────────────────────────────────────

function ChatPane({
  thread, messages, canReply, senderRole,
}: {
  thread: InboxThread;
  messages: InboxMessage[];
  canReply: boolean;
  senderRole: 'verkaeufer' | 'kaeufer' | 'admin';
}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Anhänge die mit der nächsten Nachricht mitgeschickt werden
  const [pendingAttachments, setPendingAttachments] = useState<AnfrageAttachment[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);

  // Auto-scroll an Ende des Verlaufs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    setError(null);
    const text = draft.trim();
    if (text.length < 1 && pendingAttachments.length === 0) return;

    startTx(async () => {
      try {
        let res: { ok: boolean; error?: string };
        if (thread.type === 'kaeufer') {
          res = await sendAnfrageMessage(thread.id.replace(/^k:/, ''), text, pendingAttachments);
        } else if (senderRole === 'admin') {
          // Admin schreibt in audit-messages mit from_role='admin'
          res = await sendInseratMessageAction({
            id: thread.id.replace(/^p:/, ''),
            message: text,
          });
        } else {
          // Verkäufer antwortet auf passare-Team-Rückfrage
          res = await respondToRevisionAction(thread.id.replace(/^p:/, ''), text);
        }
        if (res.ok) {
          setDraft('');
          setPendingAttachments([]);
          router.refresh();
        } else {
          setError(res.error ?? 'Senden fehlgeschlagen.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
      }
    });
  };

  return (
    <>
      {/* Header: Title links · Inserat-Tag rechts (subtil) */}
      <header className="px-5 py-3 border-b border-stone flex items-center gap-3 bg-paper">
        <ThreadAvatar type={thread.type} initials={thread.initials} active />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-navy font-medium truncate">
            {thread.title}
          </p>
          {thread.statusLabel && (
            <p className="text-caption text-quiet">{thread.statusLabel}</p>
          )}
        </div>
        {/* Subtile Inserat-Verlinkung oben rechts — Ziel je nach Rolle */}
        {thread.inseratTitel && (
          <Link
            href={
              senderRole === 'verkaeufer'
                ? '/dashboard/verkaeufer/inserat'
                : senderRole === 'admin'
                  ? `/admin/inserate/${thread.inseratId}`
                  : `/inserat/${thread.inseratId}`
            }
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-soft text-caption text-quiet hover:text-navy hover:bg-stone/40 transition-colors max-w-[260px]"
            title={`Zum Inserat «${thread.inseratTitel}»`}
          >
            <span className="text-bronze-ink">Inserat:</span>
            <span className="truncate">{thread.inseratTitel}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
          </Link>
        )}
        {thread.detailHref && (
          <Link
            href={thread.detailHref}
            className="text-caption text-bronze-ink hover:text-bronze inline-flex items-center gap-1"
          >
            Detail
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        )}
      </header>

      {/* Verlauf */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 bg-cream/30 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-quiet">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-caption">Noch keine Nachrichten in diesem Chat.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              // Action-Karten für passare-Team-Status: ganzbreite zentrierte Karten
              // statt normaler Chat-Bubble — visualisiert Status-Änderung im Verlauf.
              const isActionCard = !m.fromMe && m.kindRaw && ['freigabe', 'ablehnung', 'pause'].includes(m.kindRaw);
              if (isActionCard) {
                return <ActionCard key={m.id} kind={m.kindRaw!} message={m.message} createdAt={m.createdAt} />;
              }
              return (
                <li key={m.id} className={cn('flex gap-2', m.fromMe ? 'justify-end' : 'justify-start')}>
                  {!m.fromMe && (
                    <div className="w-7 h-7 rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                      {m.authorInitials}
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[78%] rounded-card px-3.5 py-2.5',
                    m.fromMe
                      ? 'bg-navy text-cream'
                      : 'bg-paper border border-stone text-ink',
                  )}>
                    {!m.fromMe && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-caption font-medium text-navy">{m.authorName}</p>
                        {m.kindLabel && (
                          <span className="font-mono text-[10px] uppercase tracking-wide text-bronze-ink">
                            {m.kindLabel}
                          </span>
                        )}
                      </div>
                    )}
                    {m.message && m.message !== '(Unterlagen)' && (
                      <p className={cn(
                        'text-body-sm whitespace-pre-wrap leading-relaxed',
                        m.fromMe ? 'text-cream' : 'text-ink',
                      )}>
                        {m.message}
                      </p>
                    )}
                    {m.attachments && m.attachments.length > 0 && (
                      <ul className={cn(
                        'space-y-1.5',
                        m.message && m.message !== '(Unterlagen)' ? 'mt-2' : '',
                      )}>
                        {m.attachments.map((a, i) => (
                          <li key={i}>
                            <AttachmentChip attachment={a} dark={m.fromMe} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className={cn(
                      'text-[10px] mt-1 text-right font-mono',
                      m.fromMe ? 'text-cream/60' : 'text-quiet',
                    )}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                  {m.fromMe && (
                    <div className="w-7 h-7 rounded-full bg-navy text-cream flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                      Du
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Eingabe */}
      {canReply ? (
        <footer className="border-t border-stone px-3 py-3 bg-paper">
          {/* Pending-Anhang-Liste — ausstehende Files vor dem Senden */}
          {pendingAttachments.length > 0 && (
            <ul className="mb-2 space-y-1">
              {pendingAttachments.map((a, i) => (
                <li
                  key={`${a.kind}:${a.file_id ?? a.name}:${i}`}
                  className="inline-flex items-center gap-2 mr-2 mb-1 px-2 py-1 rounded-soft bg-bronze/10 border border-bronze/30 text-caption"
                >
                  <FileText className="w-3 h-3 text-bronze-ink" strokeWidth={1.5} />
                  <span className="truncate max-w-[200px]">{a.name}</span>
                  {a.size && (
                    <span className="font-mono text-[10px] text-quiet">{formatBytes(a.size)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-quiet hover:text-danger transition-colors ml-1"
                    aria-label="Entfernen"
                  >
                    <XIcon className="w-3 h-3" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2">
            {/* Unterlagen-Knopf — nur Verkäufer (Datenraum) und Admin (alles) */}
            {thread.type === 'kaeufer' && senderRole !== 'kaeufer' && (
              <button
                type="button"
                onClick={() => setAttachOpen(true)}
                disabled={pending}
                className="inline-flex items-center justify-center w-9 h-9 rounded-soft border border-stone text-bronze-ink hover:bg-bronze/10 hover:border-bronze/40 transition-colors disabled:opacity-40 flex-shrink-0"
                title="Unterlagen aus dem Datenraum anhängen"
              >
                <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder={
                thread.type === 'kaeufer'
                  ? 'Antwort an den Käufer schreiben …'
                  : 'Antwort an das passare-Team schreiben …'
              }
              className="flex-1 resize-none rounded-soft border border-stone bg-cream/40 px-3 py-2 text-body-sm focus:outline-none focus:border-bronze focus:bg-paper transition-colors"
              disabled={pending}
            />
            <button
              type="button"
              onClick={send}
              disabled={pending || (draft.trim().length < 1 && pendingAttachments.length === 0)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              {pending ? 'Sendet …' : 'Senden'}
            </button>
          </div>
          {error && <p className="text-caption text-danger mt-2">{error}</p>}
          <p className="text-[10px] text-quiet mt-1">⌘/Ctrl + Enter zum Absenden</p>
        </footer>
      ) : (
        <footer className="border-t border-stone px-5 py-3 bg-stone/30">
          <p className="text-caption text-quiet text-center">
            Antworten in diesem Chat sind aktuell deaktiviert.
          </p>
        </footer>
      )}

      {/* Attachment-Modal: Datenraum-Files auswählen — nur Verkäufer/Admin */}
      {attachOpen && thread.type === 'kaeufer' && senderRole !== 'kaeufer' && (
        <AttachmentModal
          anfrageId={thread.id.replace(/^k:/, '')}
          alreadySelected={pendingAttachments}
          onClose={() => setAttachOpen(false)}
          onSelect={(files) => {
            setPendingAttachments((prev) => {
              const existingIds = new Set(prev.map((p) => p.file_id).filter(Boolean));
              const additions = files.filter((f) => !existingIds.has(f.file_id));
              return [...prev, ...additions];
            });
            setAttachOpen(false);
          }}
        />
      )}
    </>
  );
}

// ─── KLEINE HELPER ─────────────────────────────────────────────────

function ThreadAvatar({
  type, initials, active,
}: {
  type: 'kaeufer' | 'passare';
  initials: string;
  active?: boolean;
}) {
  if (type === 'passare') {
    return (
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
        active ? 'bg-bronze text-cream' : 'bg-bronze/15 text-bronze-ink',
      )}>
        <Sparkles className="w-4 h-4" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className={cn(
      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-caption font-medium',
      active ? 'bg-navy text-cream' : 'bg-stone text-quiet',
    )}>
      {initials || <User className="w-4 h-4" strokeWidth={1.5} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 text-quiet">
      <MessageSquare className="w-12 h-12 mb-3" strokeWidth={1.2} />
      <p className="font-serif text-head-sm text-navy font-light mb-1">
        Wähle eine Konversation
      </p>
      <p className="text-caption max-w-sm">
        Hier laufen alle Chats zusammen — Käufer-Anfragen und Nachrichten vom passare-Team. Klicke links auf einen Thread.
      </p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) return 'jetzt';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-CH', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── ATTACHMENT-CHIP — gerendert in der Chat-Bubble ────────────────

function AttachmentChip({
  attachment, dark,
}: {
  attachment: AnfrageAttachment;
  dark?: boolean;
}) {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-soft text-caption max-w-full',
      dark
        ? 'bg-cream/15 text-cream border border-cream/20'
        : 'bg-bronze/10 text-ink border border-bronze/30',
    )}>
      <FileText className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
      <span className="truncate">{attachment.name}</span>
      {attachment.size && (
        <span className={cn('font-mono text-[10px]', dark ? 'text-cream/60' : 'text-quiet')}>
          {formatBytes(attachment.size)}
        </span>
      )}
    </div>
  );
}

// ─── ACTION-CARD — passare-Team-Workflow-Status im Chat-Verlauf ───

function ActionCard({
  kind, message, createdAt,
}: {
  kind: string;
  message: string;
  createdAt: string;
}) {
  const map: Record<string, {
    label: string;
    icon: typeof CheckCircle2;
    cls: string;
  }> = {
    freigabe: {
      label: 'Inserat freigegeben',
      icon: CheckCircle2,
      cls: 'bg-success/10 border-success/30 text-success',
    },
    ablehnung: {
      label: 'Inserat abgelehnt',
      icon: XCircle,
      cls: 'bg-danger/10 border-danger/30 text-danger',
    },
    pause: {
      label: 'Inserat pausiert',
      icon: PauseIcon,
      cls: 'bg-stone text-muted border-stone',
    },
  };
  const m = map[kind] ?? map.freigabe;
  const Icon = m.icon;
  return (
    <li className="flex justify-center my-1">
      <div className={cn(
        'inline-flex items-start gap-3 max-w-[90%] rounded-card border px-4 py-3',
        m.cls,
      )}>
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-body-sm font-medium">{m.label}</p>
          {message && message !== '(Unterlagen)' && (
            <p className="text-caption mt-0.5 leading-relaxed text-ink whitespace-pre-wrap">{message}</p>
          )}
          <p className="text-[10px] text-quiet mt-1 font-mono">{formatTime(createdAt)}</p>
        </div>
      </div>
    </li>
  );
}

// ─── ATTACHMENT-MODAL — Datenraum-Files auswählen ──────────────────

function AttachmentModal({
  anfrageId, alreadySelected, onSelect, onClose,
}: {
  anfrageId: string;
  alreadySelected: AnfrageAttachment[];
  onSelect: (files: AnfrageAttachment[]) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Array<{
    id: string; name: string; ordner: string | null; size: number; mime: string | null;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await listDatenraumFilesForAnfrage(anfrageId);
      if (cancel) return;
      if (res.ok) setFiles(res.files);
      else setError(res.error);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [anfrageId]);

  const alreadyIds = new Set(alreadySelected.map((a) => a.file_id).filter(Boolean));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const picks = files
      .filter((f) => selectedIds.has(f.id))
      .map<AnfrageAttachment>((f) => ({
        kind: 'datenraum',
        file_id: f.id,
        name: f.name,
        size: f.size,
        mime: f.mime ?? undefined,
      }));
    onSelect(picks);
  };

  const selectAll = () => {
    setSelectedIds(new Set(files.filter((f) => !alreadyIds.has(f.id)).map((f) => f.id)));
  };

  // Group by ordner
  const grouped = files.reduce<Record<string, typeof files>>((acc, f) => {
    const o = f.ordner ?? 'Allgemein';
    (acc[o] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <div className="bg-paper rounded-card border border-stone shadow-elevated w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <header className="px-5 py-4 border-b border-stone flex items-center gap-3">
          <Paperclip className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-navy">Unterlagen aus Datenraum</p>
            <p className="text-caption text-quiet">Wähle Dateien die du dem Käufer zukommen lassen willst.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-quiet hover:text-navy transition-colors"
            aria-label="Schliessen"
          >
            <XIcon className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {loading && <p className="text-caption text-quiet text-center py-8">Lädt …</p>}
          {error && <p className="text-caption text-danger text-center py-8">{error}</p>}
          {!loading && !error && files.length === 0 && (
            <div className="text-center py-12 text-quiet">
              <FileText className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-caption">Noch keine Dateien im Datenraum.</p>
              <p className="text-[10px] mt-1">Lade Unterlagen unter «Datenraum» hoch.</p>
            </div>
          )}
          {!loading && files.length > 0 && (
            <div className="space-y-4">
              {Object.entries(grouped).map(([ordner, list]) => (
                <div key={ordner}>
                  <p className="overline text-bronze-ink mb-1.5">{ordner}</p>
                  <ul className="space-y-1">
                    {list.map((f) => {
                      const isAlready = alreadyIds.has(f.id);
                      const checked = selectedIds.has(f.id);
                      return (
                        <li key={f.id}>
                          <label className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-soft cursor-pointer transition-colors',
                            isAlready ? 'bg-stone/30 cursor-not-allowed' : checked ? 'bg-bronze/10' : 'hover:bg-stone/30',
                          )}>
                            <input
                              type="checkbox"
                              checked={checked || isAlready}
                              disabled={isAlready}
                              onChange={() => toggle(f.id)}
                              className="w-4 h-4 accent-bronze"
                            />
                            <FileText className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                              <p className="text-body-sm text-ink truncate">{f.name}</p>
                              <p className="text-[10px] text-quiet font-mono">{formatBytes(f.size)}</p>
                            </div>
                            {isAlready && (
                              <span className="text-[10px] text-quiet flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" strokeWidth={2} />
                                bereits ausgewählt
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-stone flex items-center gap-3 bg-stone/20">
          <button
            type="button"
            onClick={selectAll}
            disabled={loading || files.length === 0}
            className="text-caption text-bronze-ink hover:text-bronze transition-colors disabled:opacity-40"
          >
            Alle auswählen
          </button>
          <span className="ml-auto text-caption text-quiet">
            {selectedIds.size} ausgewählt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-caption text-quiet hover:text-navy transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anhängen
          </button>
        </footer>
      </div>
    </div>
  );
}
