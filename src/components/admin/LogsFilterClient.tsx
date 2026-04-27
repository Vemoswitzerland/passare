'use client';

import { useMemo, useState } from 'react';
import {
  LogIn,
  FileEdit,
  CheckCircle2,
  Lock,
  MessageSquare,
  UserPlus,
  UserCog,
  Filter,
  RefreshCcw,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LOG_TYPE_LABELS, type AdminLogType, type AdminDemoLog } from '@/data/admin-demo';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<AdminLogType, LucideIcon> = {
  login: LogIn,
  inserat_edit: FileEdit,
  inserat_freigabe: CheckCircle2,
  nda_signed: Lock,
  anfrage: MessageSquare,
  register: UserPlus,
  profile_update: UserCog,
};

const FILTERS: { value: AdminLogType | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'login', label: 'Login' },
  { value: 'register', label: 'Registrierung' },
  { value: 'inserat_edit', label: 'Inserat-Edit' },
  { value: 'inserat_freigabe', label: 'Status-Wechsel' },
  { value: 'anfrage', label: 'Anfragen' },
  { value: 'nda_signed', label: 'NDA' },
  { value: 'profile_update', label: 'Profil' },
];

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export function LogsFilterClient({ logs }: { logs: AdminDemoLog[] }) {
  const [filter, setFilter] = useState<AdminLogType | 'alle'>('alle');

  const counts = useMemo(() => {
    const map: Record<string, number> = { alle: logs.length };
    for (const l of logs) {
      map[l.type] = (map[l.type] ?? 0) + 1;
    }
    return map;
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
          {FILTERS.map((f) => {
            const count = counts[f.value] ?? 0;
            const active = filter === f.value;
            if (count === 0 && f.value !== 'alle') return null;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-caption font-medium transition-colors',
                  active
                    ? 'bg-navy text-cream'
                    : 'bg-paper text-quiet border border-stone hover:border-navy/40 hover:text-navy',
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 font-mono', active ? 'opacity-80' : 'opacity-60')}>
                  {count}
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
              const Icon = TYPE_ICONS[log.type];
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
                      <span className="font-mono">{log.user_email}</span>
                      {log.ip && <span className="font-mono opacity-70">· {log.ip}</span>}
                    </p>
                  </div>
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    {LOG_TYPE_LABELS[log.type]}
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
