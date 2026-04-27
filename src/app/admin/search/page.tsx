import Link from 'next/link';
import { Search as SearchIcon, FileText, Users, MessageSquare, Newspaper } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';

export const metadata = {
  title: 'Admin · Suche — passare',
  robots: { index: false, follow: false },
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
};

const roleVariant = (rolle: string | null): 'navy' | 'bronze' | 'neutral' => {
  if (rolle === 'admin') return 'navy';
  if (rolle === 'verkaeufer') return 'bronze';
  return 'neutral';
};

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();

  if (!query) {
    return (
      <div className="max-w-3xl">
        <PageHeader
          overline="Admin"
          title="Globale Suche"
          description="Durchsucht User, Inserate, Anfragen und Blog-Artikel gleichzeitig."
        />
        <SearchForm />
      </div>
    );
  }

  const like = `%${query}%`;
  const supabase = await createClient();

  // Inserate
  const { data: inserateData } = await supabase
    .from('inserate')
    .select('id, public_id, titel, branche, kanton, status')
    .or(`titel.ilike.${like},branche.ilike.${like},kanton.ilike.${like},public_id.ilike.${like}`)
    .limit(20);

  // Anfragen
  const { data: anfragenData } = await supabase
    .from('anfragen')
    .select('id, public_id, status, nachricht')
    .or(`public_id.ilike.${like},nachricht.ilike.${like}`)
    .limit(20);

  // Blog
  const { data: blogData } = await supabase
    .from('blog_posts')
    .select('id, slug, titel, kategorie, status')
    .or(`titel.ilike.${like},slug.ilike.${like},excerpt.ilike.${like}`)
    .limit(20);

  // Profile + Email
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, rolle, kanton')
    .or(`full_name.ilike.${like},kanton.ilike.${like}`)
    .limit(50);

  let users = (profilesData ?? []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string | null) ?? null,
    rolle: (p.rolle as string | null) ?? null,
    kanton: (p.kanton as string | null) ?? null,
    email: undefined as string | undefined,
  }));

  // Email match: braucht Service-Role
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient.auth.admin.listUsers();
    type AdminAuthUser = { id: string; email?: string | null };
    const list = (data as { users?: AdminAuthUser[] }).users ?? [];
    const emailMap = new Map(list.map((u) => [u.id, u.email ?? '']));
    users = users.map((u) => ({ ...u, email: emailMap.get(u.id) }));
    // Plus alle die per Email matchen aber Profil-Felder nicht treffen
    const lq = query.toLowerCase();
    const emailMatches = list.filter((u) => (u.email ?? '').toLowerCase().includes(lq));
    const existing = new Set(users.map((u) => u.id));
    for (const u of emailMatches) {
      if (existing.has(u.id)) continue;
      // Profil holen
      const { data: p } = await supabase.from('profiles').select('full_name, rolle, kanton').eq('id', u.id).maybeSingle();
      users.push({
        id: u.id,
        full_name: (p?.full_name as string | null) ?? null,
        rolle: (p?.rolle as string | null) ?? null,
        kanton: (p?.kanton as string | null) ?? null,
        email: u.email ?? undefined,
      });
    }
  } catch {
    /* SR-Key fehlt */
  }

  const total =
    users.length + (inserateData?.length ?? 0) + (anfragenData?.length ?? 0) + (blogData?.length ?? 0);

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Suche"
        title={`Resultate für «${query}»`}
        description={`${total} Treffer in User, Inserate, Anfragen und Blog.`}
      />

      <SearchForm initial={query} />

      {total === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Keine Treffer"
          description={`Keine Daten zu «${query}» gefunden. Andere Schreibweise probieren?`}
        />
      ) : (
        <div className="space-y-8 mt-8">
          <ResultSection title="User" icon={Users} count={users.length}>
            <ul className="divide-y divide-stone/60">
              {users.slice(0, 10).map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <Users className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">
                        {u.full_name ?? <em className="text-quiet">— ohne Namen</em>}
                      </p>
                      {u.email && <p className="text-caption text-quiet font-mono truncate">{u.email}</p>}
                    </div>
                    {u.rolle && <Badge variant={roleVariant(u.rolle)}>{ROLLE_LABEL[u.rolle]}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
            {users.length > 10 && (
              <p className="text-caption text-quiet mt-3 px-3">+ {users.length - 10} weitere</p>
            )}
          </ResultSection>

          <ResultSection title="Inserate" icon={FileText} count={inserateData?.length ?? 0}>
            <ul className="divide-y divide-stone/60">
              {(inserateData ?? []).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/inserate/${l.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <FileText className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">{l.titel}</p>
                      <p className="text-caption text-quiet font-mono truncate">
                        {l.public_id ?? l.id.slice(0, 8)} · {l.branche ?? '—'} · {l.kanton ?? '—'}
                      </p>
                    </div>
                    <Badge variant="neutral">{l.status as string}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Anfragen" icon={MessageSquare} count={anfragenData?.length ?? 0}>
            <ul className="divide-y divide-stone/60">
              {(anfragenData ?? []).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/anfragen/${a.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <MessageSquare className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">
                        {a.public_id ?? a.id.slice(0, 8)}
                      </p>
                      {a.nachricht && (
                        <p className="text-caption text-quiet truncate">{a.nachricht}</p>
                      )}
                    </div>
                    <Badge variant="neutral">{a.status as string}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Blog" icon={Newspaper} count={blogData?.length ?? 0}>
            <ul className="divide-y divide-stone/60">
              {(blogData ?? []).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/blog/${b.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <Newspaper className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">{b.titel}</p>
                      <p className="text-caption text-quiet font-mono truncate">/{b.slug}</p>
                    </div>
                    <Badge variant="neutral">{b.status as string}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-xl text-navy mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        {title}
        <span className="font-mono text-caption text-quiet font-normal">({count})</span>
      </h2>
      <div className="bg-paper border border-stone rounded-card p-2">{children}</div>
    </section>
  );
}

function SearchForm({ initial = '' }: { initial?: string }) {
  return (
    <form className="bg-paper border border-stone rounded-card p-4" action="/admin/search">
      <div className="relative">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet"
          strokeWidth={1.5}
        />
        <input
          type="search"
          name="q"
          defaultValue={initial}
          placeholder="Name, E-Mail, Inserat-ID, Titel, Branche, Kanton …"
          className="w-full pl-10 pr-4 py-3 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze"
          autoFocus={!initial}
        />
      </div>
    </form>
  );
}
