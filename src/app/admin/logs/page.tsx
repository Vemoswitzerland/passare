import { createClient } from '@/lib/supabase/server';
import { LogsFilterClient } from '@/components/admin/LogsFilterClient';
import { ADMIN_DEMO_LOGS, type AdminDemoLog, type AdminLogType } from '@/data/admin-demo';

export const metadata = {
  title: 'Admin · Logs — passare',
  robots: { index: false, follow: false },
};

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

      <LogsFilterClient logs={allLogs} />
    </div>
  );
}
