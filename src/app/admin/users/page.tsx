import { Phone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Admin · User — passare',
  robots: { index: false, follow: false },
};

type UserRow = {
  id: string;
  full_name: string | null;
  rolle: 'verkaeufer' | 'kaeufer' | 'admin' | null;
  kanton: string | null;
  sprache: string | null;
  verified_phone: boolean | null;
  verified_kyc: boolean | null;
  qualitaets_score: number | null;
  created_at: string;
  onboarding_completed_at: string | null;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
};

const roleVariant = (rolle: string | null): 'navy' | 'bronze' | 'neutral' => {
  if (rolle === 'admin') return 'navy';
  if (rolle === 'verkaeufer') return 'bronze';
  return 'neutral';
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profilesData } = await supabase
    .from('profiles')
    .select(
      'id, full_name, rolle, kanton, sprache, verified_phone, verified_kyc, qualitaets_score, created_at, onboarding_completed_at',
    )
    .order('created_at', { ascending: false });

  const profiles: UserRow[] = (profilesData ?? []) as UserRow[];

  let emails: Map<string, string> = new Map();
  let serviceRoleAvailable = true;

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error || !data) throw new Error(error?.message ?? 'No data');
    type AdminAuthUser = { id: string; email?: string | null };
    const usersList = (data as { users?: AdminAuthUser[] }).users ?? [];
    emails = new Map(usersList.map((u) => [u.id, u.email ?? '—']));
  } catch {
    serviceRoleAvailable = false;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">Verwaltung</p>
        <h1 className="font-serif text-display-sm text-navy font-light">User</h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Alle registrierten Verkäufer, Käufer und Admins. Die Daten kommen
          live aus der Datenbank.
        </p>
      </header>

      {!serviceRoleAvailable && (
        <div className="bg-warn/10 border border-warn/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-body-sm text-navy">
            <strong>Service-Role-Key fehlt</strong> — E-Mail-Adressen sind
            nicht abrufbar. Trage <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in den Vercel-Variablen ein.
          </p>
        </div>
      )}

      <div className="mb-4 text-caption text-quiet">
        {profiles.length} Profile total
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'E-Mail' },
          { key: 'rolle', label: 'Rolle' },
          { key: 'kanton', label: 'Kanton' },
          { key: 'sprache', label: 'Sprache' },
          { key: 'verified', label: 'Verifiziert' },
          { key: 'score', label: 'Score', align: 'right' },
          { key: 'created', label: 'Registriert' },
          { key: 'onboarding', label: 'Onboarding' },
        ]}
        empty="Noch keine User registriert."
      >
        {profiles.map((u) => (
          <Tr key={u.id}>
            <Td className="text-ink">{u.full_name || <span className="text-quiet">—</span>}</Td>
            <Td className="font-mono text-caption text-ink">
              {emails.get(u.id) ?? <span className="text-quiet">—</span>}
            </Td>
            <Td>
              {u.rolle ? (
                <Badge variant={roleVariant(u.rolle)}>{ROLLE_LABEL[u.rolle] ?? u.rolle}</Badge>
              ) : (
                <span className="text-caption text-quiet italic">offen</span>
              )}
            </Td>
            <Td className="font-mono text-caption text-ink">
              {u.kanton ?? <span className="text-quiet">—</span>}
            </Td>
            <Td className="text-caption text-quiet uppercase">{u.sprache ?? '—'}</Td>
            <Td>
              <div className="inline-flex gap-1.5">
                <span
                  title={u.verified_phone ? 'Telefon verifiziert' : 'Telefon nicht verifiziert'}
                  className={u.verified_phone ? 'text-success' : 'text-stone'}
                >
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
                </span>
                <span
                  title={u.verified_kyc ? 'KYC abgeschlossen' : 'KYC ausstehend'}
                  className={u.verified_kyc ? 'text-success' : 'text-stone'}
                >
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                </span>
              </div>
            </Td>
            <Td align="right" className="font-mono text-caption">
              {u.qualitaets_score ?? <span className="text-quiet">—</span>}
            </Td>
            <Td className="font-mono text-caption text-quiet whitespace-nowrap">
              {formatDate(u.created_at)}
            </Td>
            <Td>
              {u.onboarding_completed_at ? (
                <span className="text-caption text-success">✓</span>
              ) : (
                <span className="text-caption text-quiet italic">offen</span>
              )}
            </Td>
          </Tr>
        ))}
      </DataTable>
    </div>
  );
}
