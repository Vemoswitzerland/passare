'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare, Send, ExternalLink, Sparkles, User, Inbox as InboxIcon,
} from 'lucide-react';
import { sendAnfrageMessage } from './actions';
import { respondToRevisionAction } from '../inserat/actions';
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
};

type Props = {
  threads: InboxThread[];
  activeThreadId: string | null;
  activeThread: InboxThread | null;
  activeMessages: InboxMessage[];
  /** Bei passare-Team-Threads: ist Antworten erlaubt? */
  canReplyPassare: boolean;
};

export function InboxLayout({
  threads, activeThreadId, activeThread, activeMessages, canReplyPassare,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openThread = (threadId: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('thread', threadId);
    router.push(`/dashboard/verkaeufer/anfragen?${sp.toString()}`);
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
              const isActive = t.id === activeThreadId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors',
                      isActive ? 'bg-paper' : 'hover:bg-paper/60',
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
      <section className="flex flex-col min-h-0 h-full">
        {!activeThread ? (
          <EmptyState />
        ) : (
          <ChatPane
            thread={activeThread}
            messages={activeMessages}
            canReply={activeThread.type === 'kaeufer' || canReplyPassare}
          />
        )}
      </section>
    </div>
  );
}

// ─── CHAT-PANE ────────────────────────────────────────────────────

function ChatPane({
  thread, messages, canReply,
}: {
  thread: InboxThread;
  messages: InboxMessage[];
  canReply: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll an Ende des Verlaufs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    setError(null);
    const text = draft.trim();
    if (text.length < 1) return;

    startTx(async () => {
      const res = thread.type === 'kaeufer'
        ? await sendAnfrageMessage(thread.id.replace(/^k:/, ''), text)
        : await respondToRevisionAction(thread.id.replace(/^p:/, ''), text);
      if (res.ok) {
        setDraft('');
        router.refresh();
      } else {
        setError(res.error ?? 'Senden fehlgeschlagen.');
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
        {/* Subtile Inserat-Verlinkung oben rechts */}
        {thread.inseratTitel && (
          <Link
            href={`/dashboard/verkaeufer/inserat`}
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
            {messages.map((m) => (
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
                  <p className={cn(
                    'text-body-sm whitespace-pre-wrap leading-relaxed',
                    m.fromMe ? 'text-cream' : 'text-ink',
                  )}>
                    {m.message}
                  </p>
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
            ))}
          </ul>
        )}
      </div>

      {/* Eingabe */}
      {canReply ? (
        <footer className="border-t border-stone px-3 py-3 bg-paper">
          <div className="flex items-end gap-2">
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
              disabled={pending || draft.trim().length < 1}
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
