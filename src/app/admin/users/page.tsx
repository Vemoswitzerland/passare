import Link from 'next/link';
import { ChevronRight, Phone, ShieldCheck, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { UsersFilterBar } from '@/components/admin/UsersFilterBar';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { formatDate } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin · User — passare',
  robots: { index: false, follow: false },
};

type SearchParams = {
  rolle?: string;
  verified?: string;
  q?: string;
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rolleFilter = params.rolle ?? 'alle';
  const verifiedFilter = params.verified ?? 'alle';
  const query = (params.q ?? '').trim().toLowerCase();

  const supabase = await createClient();

  let q = supabase
    .from('profiles')
    .select(
      'id, full_name, rolle, kanton, sprache, verified_phone, verified_kyc, qualitaets_score, created_at, onboarding_completed_at',
    )
    .order('created_at', { ascending: false });

  if (rolleFilter !== 'alle' && ['verkaeufer', 'kaeufer', 'admin'].includes(rolleFilter)) {
    q = q.eq('rolle', rolleFilter);
  }
  if (verifiedFilter === 'phone') q = q.eq('verified_phone', true);
  if (verifiedFilter === 'kyc') q = q.eq('verified_kyc', true);
  if (verifiedFilter === 'beide') q = q.eq('verified_phone', true).eq('verified_kyc', true);
  if (verifiedFilter === 'keine') q = q.eq('verified_phone', false).eq('verified_kyc', false);

  const { data: profilesData } = await q;
  let profiles: UserRow[] = (profilesData ?? []) as UserRow[];

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

  if (query) {
    profiles = profiles.filter((p) => {
      const email = emails.get(p.id) ?? '';
      return (
        (p.full_name ?? '').toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        (p.kanton ?? '').toLowerCase().includes(query)
      );
    });
  }

  const counts = await getCounts(supabase);

  return (
    <div className="max-w-6xl">
      <PageHeader overline="Verwaltung" title="User" />

      {!serviceRoleAvailable && (
        <div className="bg-warn/10 border border-warn/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-body-sm text-navy">
            <strong>Service-Role-Key fehlt</strong> — E-Mail-Adressen sind nicht abrufbar. Trage{' '}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in den Vercel-ENV-Variablen ein.
          </p>
        </div>
      )}

      <UsersFilterBar counts={counts} initialQuery={query} />

      <p className="text-caption text-quiet mb-4">
        {profiles.length} {profiles.length === 1 ? 'User' : 'User'}
        {query && <> für «{query}»</>}
      </p>

      {profiles.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={query ? 'Keine Treffer' : 'Noch keine User'}
          description={
            query
              ? `Keine User für «${query}». Andere Schreibweise probieren?`
              : 'Sobald sich der erste User registriert, erscheint er hier.'
          }
        />
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'E-Mail' },
            { key: 'rolle', label: 'Rolle' },
            { key: 'kanton', label: 'Kanton' },
            { key: 'sprache', label: 'Spr.' },
            { key: 'verified', label: 'Verifiziert' },
            { key: 'score', label: 'Score', align: 'right' },
            { key: 'created', label: 'Registriert' },
            { key: 'arrow', label: '', align: 'right' },
          ]}
        >
          {profiles.map((u) => (
            <Tr key={u.id} className="cursor-pointer">
              <Td className="text-ink">
                <Link href={`/admin/users/${u.id}`} className="block hover:text-bronze-ink transition-colors">
                  {u.full_name || <span className="text-quiet italic">— ohne Namen</span>}
                </Link>
              </Td>
              <Td className="font-mono text-caption text-ink">
                {emails.get(u.id) ?? <span className="text-quiet">—</span>}
              </Td>
              <Td>
                {u.rolle ? (
                  <Badge variant={roleVariant(u.rolle)}>{ROLLE_LABEL[u.rolle]}</Badge>
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
              <Td align="right">
                <Link
                  href={`/admin/users/${u.id}`}
                  className="inline-flex p-1 text-quiet hover:text-bronze-ink transition-colors"
                  aria-label={`Detail von ${u.full_name ?? 'User'}`}
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

async function getCounts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ count: total }, { count: verkaeufer }, { count: kaeufer }, { count: admins }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'verkaeufer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'kaeufer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'admin'),
  ]);
  return {
    alle: total ?? 0,
    verkaeufer: verkaeufer ?? 0,
    kaeufer: kaeufer ?? 0,
    admin: admins ?? 0,
  };
}
