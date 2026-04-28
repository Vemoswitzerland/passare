import { Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { LogsFilterClient } from '@/components/admin/LogsFilterClient';
import type { AdminAuditLog } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin · Logs — passare',
  robots: { index: false, follow: false },
};

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const [{ data: auditData }, { data: termsData }] = await Promise.all([
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('terms_acceptances')
      .select('id, user_id, document_type, version, accepted_at, ip_address')
      .order('accepted_at', { ascending: false })
      .limit(50),
  ]);

  const audit = (auditData ?? []) as AdminAuditLog[];
  const termsAsLogs: AdminAuditLog[] = (termsData ?? []).map((t) => ({
    id: `terms-${t.id}`,
    type: 'profile_update',
    user_id: (t.user_id as string | null) ?? null,
    user_email: null,
    beschreibung: `${t.document_type === 'agb' ? 'AGB' : 'Datenschutz'} akzeptiert (v${t.version})`,
    metadata: { document_type: t.document_type, version: t.version },
    ip: (t.ip_address as string | null) ?? null,
    created_at: t.accepted_at as string,
  }));

  const allLogs = [...audit, ...termsAsLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="max-w-6xl">
      <PageHeader overline="System" title="Audit-Log" />

      {allLogs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Noch keine Events"
          description="Sobald User sich registrieren, einloggen oder Aktionen ausführen, sammelt das System Log-Einträge hier."
        />
      ) : (
        <LogsFilterClient logs={allLogs as never[]} />
      )}
    </div>
  );
}
