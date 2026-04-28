import Link from 'next/link';
import { ChevronRight, AlertTriangle, Users as UsersIcon, Crown } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { UsersFilterBar } from '@/components/admin/UsersFilterBar';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { UserRowDeleteButton } from '@/components/admin/UserRowDeleteButton';
import { formatDate } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin · User — passare',
  robots: { index: false, follow: false },
};

type SearchParams = {
  rolle?: string;
  q?: string;
};

type UserRow = {
  id: string;
  full_name: string | null;
  rolle: 'verkaeufer' | 'kaeufer' | 'admin' | null;
  kanton: string | null;
  sprache: string | null;
  subscription_tier: 'basic' | 'max' | null;
  created_at: string;
  onboarding_completed_at: string | null;
};

/** Subtile Text-Anzeige der Rolle — kleines Mono-Label statt Badge. */
const ROLLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: 'admin', color: 'text-navy' },
  verkaeufer: { label: 'verkäufer', color: 'text-bronze-ink' },
  kaeufer: { label: 'käufer', color: 'text-quiet' },
};

const ABO_DISPLAY: Record<string, { label: string; color: string }> = {
  basic: { label: 'Basic', color: 'text-quiet' },
  max: { label: 'MAX', color: 'text-bronze-ink font-medium' },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rolleFilter = params.rolle ?? 'alle';
  const query = (params.q ?? '').trim().toLowerCase();

  const supabase = await createClient();

  let q = supabase
    .from('profiles')
    .select(
      'id, full_name, rolle, kanton, sprache, subscription_tier, created_at, onboarding_completed_at',
    )
    .order('created_at', { ascending: false });

  if (rolleFilter !== 'alle' && ['verkaeufer', 'kaeufer', 'admin'].includes(rolleFilter)) {
    q = q.eq('rolle', rolleFilter);
  }

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
        <div className="bg-warn/10 border border-warn/30 rounded-soft px-3 py-2 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-[13px] text-navy">
            <strong>Service-Role-Key fehlt</strong> — E-Mail-Adressen sind nicht abrufbar.
          </p>
        </div>
      )}

      <UsersFilterBar counts={counts} initialQuery={query} />

      <p className="text-[11px] text-quiet font-mono mb-2">
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
            { key: 'abo', label: 'Abo' },
            { key: 'kanton', label: 'KT' },
            { key: 'sprache', label: 'Spr.' },
            { key: 'created', label: 'Registriert' },
            { key: 'actions', label: '', align: 'right' },
          ]}
        >
          {profiles.map((u) => {
            const rolle = u.rolle ? ROLLE_DISPLAY[u.rolle] : null;
            const abo = u.subscription_tier ? ABO_DISPLAY[u.subscription_tier] : null;
            const displayName = u.full_name || emails.get(u.id) || 'Ohne Namen';
            return (
              <Tr key={u.id} className="cursor-pointer">
                <Td className="text-ink">
                  <Link href={`/admin/users/${u.id}`} className="block hover:text-bronze-ink transition-colors">
                    {u.full_name || <span className="text-quiet italic">— ohne Namen</span>}
                  </Link>
                </Td>
                <Td className="font-mono text-[12px] text-ink">
                  {emails.get(u.id) ?? <span className="text-quiet">—</span>}
                </Td>
                <Td>
                  {rolle ? (
                    <span className={`font-mono text-[11px] tracking-wide ${rolle.color}`}>
                      {rolle.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-quiet italic">offen</span>
                  )}
                </Td>
                <Td>
                  {u.rolle === 'kaeufer' ? (
                    abo ? (
                      <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${abo.color}`}>
                        {u.subscription_tier === 'max' && <Crown className="w-3 h-3" strokeWidth={1.5} />}
                        {abo.label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-quiet">—</span>
                    )
                  ) : (
                    <span className="text-[11px] text-quiet">—</span>
                  )}
                </Td>
                <Td className="font-mono text-[12px] text-ink">
                  {u.kanton ?? <span className="text-quiet">—</span>}
                </Td>
                <Td className="text-[12px] text-quiet uppercase">{u.sprache ?? '—'}</Td>
                <Td className="font-mono text-[11px] text-quiet whitespace-nowrap">
                  {formatDate(u.created_at)}
                </Td>
                <Td align="right">
                  <div className="flex items-center gap-1 justify-end">
                    <UserRowDeleteButton userId={u.id} userName={displayName} />
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex p-1 text-quiet hover:text-bronze-ink transition-colors"
                      aria-label={`Detail von ${u.full_name ?? 'User'}`}
                    >
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </Link>
                  </div>
                </Td>
              </Tr>
            );
          })}
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
