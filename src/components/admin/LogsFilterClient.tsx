'use client';

import { useMemo, useState } from 'react';
import {
  LogIn,
  LogOut,
  FileEdit,
  CheckCircle2,
  Lock,
  MessageSquare,
  UserPlus,
  UserCog,
  Filter,
  RefreshCcw,
  Newspaper,
  PauseCircle,
  Trash2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AdminAuditLog } from '@/lib/admin/types';
import { formatDateTime } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, LucideIcon> = {
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  profile_update: UserCog,
  verification_change: ShieldCheck,
  inserat_create: FileEdit,
  inserat_edit: FileEdit,
  inserat_publish: CheckCircle2,
  inserat_pause: PauseCircle,
  inserat_delete: Trash2,
  anfrage_create: MessageSquare,
  anfrage_status_change: MessageSquare,
  nda_signed: Lock,
  blog_publish: Newspaper,
  blog_generate: Newspaper,
  admin_action: ShieldCheck,
};

const TYPE_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  register: 'Registrierung',
  profile_update: 'Profil',
  verification_change: 'Verifikation',
  inserat_create: 'Inserat erstellt',
  inserat_edit: 'Inserat-Edit',
  inserat_publish: 'Freigabe',
  inserat_pause: 'Pausiert',
  inserat_delete: 'Gelöscht',
  anfrage_create: 'Anfrage',
  anfrage_status_change: 'Anfrage-Status',
  nda_signed: 'NDA',
  blog_publish: 'Blog veröffentlicht',
  blog_generate: 'Blog generiert',
  admin_action: 'Admin-Aktion',
};

export function LogsFilterClient({ logs }: { logs: AdminAuditLog[] }) {
  const [filter, setFilter] = useState<string>('alle');

  const counts = useMemo(() => {
    const map: Record<string, number> = { alle: logs.length };
    for (const l of logs) {
      map[l.type] = (map[l.type] ?? 0) + 1;
    }
    return map;
  }, [logs]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.type);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (filter === 'alle') return logs;
    return logs.filter((l) => l.type === filter);
  }, [filter, logs]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-quiet" strokeWidth={1.5} />
          <button
            type="button"
            onClick={() => setFilter('alle')}
            className={cn(
              'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
              filter === 'alle'
                ? 'bg-navy text-cream'
                : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
            )}
          >
            Alle
            <span className={cn('ml-1.5 font-mono', filter === 'alle' ? 'opacity-80' : 'opacity-60')}>
              {counts.alle ?? 0}
            </span>
          </button>
          {types.map((t) => {
            const active = filter === t;
            const c = counts[t] ?? 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                  active
                    ? 'bg-navy text-cream'
                    : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
                )}
              >
                {TYPE_LABELS[t] ?? t}
                <span className={cn('ml-1.5 font-mono', active ? 'opacity-80' : 'opacity-60')}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft border border-stone bg-paper text-navy text-caption hover:border-navy/40 transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          Aktualisieren
        </button>
      </div>

      <div className="bg-paper border border-stone rounded-card overflow-hidden">
        <ul className="divide-y divide-stone/60">
          {filtered.length === 0 ? (
            <li className="px-5 py-12 text-center text-quiet text-body-sm">
              Keine Logs für diesen Filter.
            </li>
          ) : (
            filtered.map((log) => {
              const Icon = TYPE_ICONS[log.type] ?? UserCog;
              return (
                <li
                  key={log.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-cream/60 transition-colors"
                >
                  <div className="w-9 h-9 rounded-soft bg-stone/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-ink">{log.beschreibung}</p>
                    <p className="text-caption text-quiet mt-0.5 flex items-center gap-2 flex-wrap">
                      {log.user_email && <span className="font-mono">{log.user_email}</span>}
                      {log.user_id && !log.user_email && (
                        <span className="font-mono opacity-70">{log.user_id.slice(0, 8)}</span>
                      )}
                      {log.ip && <span className="font-mono opacity-70">· {log.ip}</span>}
                    </p>
                  </div>
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    {TYPE_LABELS[log.type] ?? log.type}
                  </Badge>
                  <span className="font-mono text-caption text-quiet whitespace-nowrap flex-shrink-0">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
