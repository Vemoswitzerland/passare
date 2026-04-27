import {
  LogIn,
  FileEdit,
  CheckCircle2,
  Lock,
  MessageSquare,
  UserPlus,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import {
  ADMIN_DEMO_LOGS,
  LOG_TYPE_LABELS,
  type AdminLogType,
  type AdminDemoLog,
} from '@/data/admin-demo';

export const metadata = {
  title: 'Admin · Logs — passare',
  robots: { index: false, follow: false },
};

const TYPE_ICONS: Record<AdminLogType, LucideIcon> = {
  login: LogIn,
  inserat_edit: FileEdit,
  inserat_freigabe: CheckCircle2,
  nda_signed: Lock,
  anfrage: MessageSquare,
  register: UserPlus,
  profile_update: UserCog,
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const { data: termsData } = await supabase
    .from('terms_acceptances')
    .select('id, user_id, document_type, version, accepted_at')
    .order('accepted_at', { ascending: false })
    .limit(30);

  const termsLogs: AdminDemoLog[] = (termsData ?? []).map((t) => ({
    id: `terms-${t.id}`,
    type: 'profile_update' as AdminLogType,
    user_email: t.user_id?.toString().slice(0, 8) ?? '—',
    beschreibung: `${t.document_type === 'agb' ? 'AGB' : 'Datenschutz'} akzeptiert (v${t.version})`,
    created_at: t.accepted_at as string,
  }));

  const allLogs = [...termsLogs, ...ADMIN_DEMO_LOGS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">System</p>
        <h1 className="font-serif text-display-sm text-navy font-light">Logs</h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Audit-Trail aller Plattform-Aktivitäten. AGB-Akzeptanzen kommen
          live aus der Datenbank, weitere Events sind Mock-Daten bis das
          Audit-Log gebaut ist.
        </p>
      </header>

      <div className="bg-paper border border-stone rounded-card overflow-hidden">
        <ul className="divide-y divide-stone/60">
          {allLogs.length === 0 ? (
            <li className="px-5 py-12 text-center text-quiet text-body-sm">Noch keine Logs.</li>
          ) : (
            allLogs.map((log) => {
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
    </div>
  );
}
