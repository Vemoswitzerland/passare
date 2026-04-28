import { createAdminClient } from '@/lib/supabase/server';
import { MessageSquare, CheckCircle2, XCircle, Pause, Reply, MessageCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

type AuditKind = 'rueckfrage' | 'antwort' | 'ablehnung' | 'freigabe' | 'kommentar' | 'pause';

type AuditMessage = {
  id: string;
  inserat_id: string;
  from_user: string;
  from_role: 'admin' | 'verkaeufer';
  kind: AuditKind;
  message: string;
  read_at: string | null;
  created_at: string;
};

type EnrichedMessage = AuditMessage & {
  author_name: string | null;
  author_initials: string;
};

const KIND_LABEL: Record<AuditKind, string> = {
  rueckfrage: 'Rückfrage',
  antwort: 'Antwort',
  ablehnung: 'Ablehnung',
  freigabe: 'Freigabe',
  kommentar: 'Kommentar',
  pause: 'Pause',
};

const KIND_ICON: Record<AuditKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  rueckfrage: MessageCircle,
  antwort: Reply,
  ablehnung: XCircle,
  freigabe: CheckCircle2,
  kommentar: MessageSquare,
  pause: Pause,
};

const KIND_TONE: Record<AuditKind, string> = {
  rueckfrage: 'text-bronze-ink bg-bronze/10 border-bronze/30',
  antwort: 'text-navy bg-navy-soft border-navy/20',
  ablehnung: 'text-danger bg-danger/10 border-danger/30',
  freigabe: 'text-success bg-success/10 border-success/30',
  kommentar: 'text-quiet bg-stone/40 border-stone',
  pause: 'text-quiet bg-stone/40 border-stone',
};

/**
 * Konversations-Thread für ein Inserat.
 * Zeigt Rückfragen / Antworten / Ablehnungen / Freigaben chronologisch.
 *
 * Verwendung: Admin-Detail (/admin/inserate/[id]) + Verkäufer-Dashboard.
 * Daten via createAdminClient() (umgeht RLS) — die Page selbst muss
 * den Owner-Check machen.
 */
export async function InseratAuditThread({
  inseratId,
  emptyHint = 'Noch keine Konversation.',
}: {
  inseratId: string;
  emptyHint?: string;
}) {
  const admin = createAdminClient();

  const { data: messagesRaw } = await admin
    .from('inserat_audit_messages')
    .select('*')
    .eq('inserat_id', inseratId)
    .order('created_at', { ascending: true });

  const messages = (messagesRaw ?? []) as AuditMessage[];

  if (messages.length === 0) {
    return (
      <p className="text-[12px] text-quiet italic px-3 py-2">{emptyHint}</p>
    );
  }

  // Author-Namen sammeln
  const userIds = Array.from(new Set(messages.map((m) => m.from_user)));
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const profileMap = new Map<string, { name: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id as string, {
      name: (p.full_name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
    });
  }

  const enriched: EnrichedMessage[] = messages.map((m) => {
    const profile = profileMap.get(m.from_user);
    const display = profile?.name ?? profile?.email ?? null;
    const initials = display
      ? display
          .split(/[\s@]/)
          .map((s) => s[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : m.from_role === 'admin'
        ? 'AD'
        : 'VK';
    return {
      ...m,
      author_name: display,
      author_initials: initials,
    };
  });

  return (
    <ul className="space-y-3">
      {enriched.map((msg) => {
        const Icon = KIND_ICON[msg.kind];
        const isAdmin = msg.from_role === 'admin';
        return (
          <li key={msg.id} className="flex items-start gap-2.5">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-medium flex-shrink-0',
                isAdmin ? 'bg-navy text-cream' : 'bg-bronze text-cream',
              )}
            >
              {msg.author_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                <span className="text-[12px] text-ink font-medium">
                  {msg.author_name ?? (isAdmin ? 'Admin' : 'Verkäufer')}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-px rounded-soft text-[10px] font-medium border',
                    KIND_TONE[msg.kind],
                  )}
                >
                  <Icon className="w-2.5 h-2.5" strokeWidth={2} />
                  {KIND_LABEL[msg.kind]}
                </span>
                <span className="text-[11px] text-quiet font-mono">
                  {formatDateTime(msg.created_at)}
                </span>
              </div>
              <p className="text-[13px] text-ink whitespace-pre-wrap leading-snug">
                {msg.message}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
