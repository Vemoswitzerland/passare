'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle, CheckCircle2, XCircle, Pause, Reply, MessageSquare } from 'lucide-react';
import { respondToRevisionAction } from '@/app/dashboard/verkaeufer/inserat/actions';
import { cn } from '@/lib/utils';

type AuditKind = 'rueckfrage' | 'antwort' | 'ablehnung' | 'freigabe' | 'kommentar' | 'pause';

export type ChatMessage = {
  id: string;
  from_role: 'admin' | 'verkaeufer';
  kind: AuditKind;
  message: string;
  created_at: string;
  author_name: string | null;
  author_initials: string;
};

type Props = {
  inseratId: string;
  messages: ChatMessage[];
  status: string;
  /** Verkäufer kann nur antworten wenn rueckfrage offen ist. */
  canReply: boolean;
};

const KIND_ICON: Record<AuditKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  rueckfrage: MessageCircle,
  antwort: Reply,
  ablehnung: XCircle,
  freigabe: CheckCircle2,
  kommentar: MessageSquare,
  pause: Pause,
};

const KIND_LABEL: Record<AuditKind, string> = {
  rueckfrage: 'Rückfrage',
  antwort: 'Antwort',
  ablehnung: 'Abgelehnt',
  freigabe: 'Freigegeben',
  kommentar: 'Kommentar',
  pause: 'Pausiert',
};

/**
 * Chat-Fenster für die Konversation Verkäufer ↔ passare-Team.
 * Cyrill: «Bitte die Konversation im Chat-Fenster anzeigen und nicht
 * darunter. Soll für Verkäufer und Admin angenehm sein zu schreiben,
 * simpel, ebenfalls mit Unterlagen-Austausch».
 *
 * Aufbau:
 *   - Header mit Status
 *   - Body: chronologische Nachrichten-Bubbles (Verkäufer rechts,
 *     passare-Team links — wie iMessage/WhatsApp)
 *   - Footer: Textarea + Send-Knopf direkt im selben Container
 *
 * Hint-Texte («Mind. 3 Zeichen, max. 4000», «Schau dir die Nachricht
 * unten an…») wurden entfernt — Cyrill: «diese Infos weg».
 */
export function InseratChat({ inseratId, messages, status, canReply }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, startTx] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const submit = () => {
    setError(null);
    const trimmed = text.trim();
    if (trimmed.length < 1) {
      setError('Bitte etwas schreiben.');
      return;
    }
    startTx(async () => {
      const res = await respondToRevisionAction(inseratId, trimmed);
      if (res.ok) {
        setText('');
        router.refresh();
      } else {
        setError(res.error ?? 'Senden fehlgeschlagen.');
      }
    });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter sendet (wie Slack/Discord)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const statusLabel: Record<string, string> = {
    entwurf: 'Entwurf',
    pending: 'In Prüfung',
    zur_pruefung: 'In Prüfung',
    rueckfrage: 'Rückfrage offen',
    live: 'Live',
    pausiert: 'Pausiert',
    abgelehnt: 'Abgelehnt',
    verkauft: 'Verkauft',
  };
  const showInput = canReply;

  return (
    <section className="bg-paper border border-stone rounded-card overflow-hidden flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-stone bg-cream/40 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
          <h3 className="text-body-sm font-medium text-navy">Konversation mit dem passare-Team</h3>
        </div>
        <span className="text-caption text-quiet font-mono">{statusLabel[status] ?? status}</span>
      </header>

      {/* Nachrichten-Liste */}
      <div ref={scrollRef} className="flex-1 px-4 py-4 space-y-3 max-h-[420px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-caption text-quiet italic text-center py-6">
            Noch keine Nachricht. Sobald das passare-Team eine Rückfrage stellt, erscheint sie hier.
          </p>
        ) : (
          messages.map((msg) => <Bubble key={msg.id} msg={msg} />)
        )}
      </div>

      {/* Eingabe-Feld direkt im selben Container */}
      {showInput && (
        <div className="border-t border-stone bg-cream/20 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder="Nachricht an das passare-Team schreiben…"
              className="flex-1 px-3 py-2 bg-paper border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze resize-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || text.trim().length < 1}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              {pending ? 'Sendet …' : 'Senden'}
            </button>
          </div>
          {error && <p className="text-caption text-danger mt-1.5">{error}</p>}
        </div>
      )}
    </section>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.from_role === 'admin';
  const isOwn = !isAdmin; // Verkäufer = own message (right side)
  const Icon = KIND_ICON[msg.kind];
  return (
    <div className={cn('flex items-start gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-medium flex-shrink-0',
          isAdmin ? 'bg-navy text-cream' : 'bg-bronze text-cream',
        )}
      >
        {msg.author_initials}
      </div>
      <div className={cn('max-w-[80%] min-w-0', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div className={cn('flex items-baseline gap-1.5 mb-0.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[11px] text-ink font-medium">
            {msg.author_name ?? (isAdmin ? 'passare-Team' : 'Du')}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-quiet">
            <Icon className="w-2.5 h-2.5" strokeWidth={2} />
            {KIND_LABEL[msg.kind]}
          </span>
          <span className="text-[10px] text-quiet font-mono">
            {new Date(msg.created_at).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          className={cn(
            'rounded-card px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap',
            isAdmin
              ? 'bg-bronze/10 border border-bronze/30 text-ink rounded-tl-sm'
              : 'bg-navy text-cream rounded-tr-sm',
          )}
        >
          {msg.message}
        </div>
      </div>
    </div>
  );
}
