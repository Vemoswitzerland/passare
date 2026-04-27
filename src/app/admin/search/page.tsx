import Link from 'next/link';
import { Search as SearchIcon, FileText, Users, MessageSquare } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { ADMIN_DEMO_LISTINGS, ADMIN_DEMO_ANFRAGEN } from '@/data/admin-demo';

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
  const lower = query.toLowerCase();

  let users: Array<{
    id: string;
    full_name: string | null;
    rolle: string | null;
    kanton: string | null;
    email?: string;
  }> = [];

  let listings = ADMIN_DEMO_LISTINGS.slice(0, 0);
  let anfragen = ADMIN_DEMO_ANFRAGEN.slice(0, 0);

  if (query) {
    listings = ADMIN_DEMO_LISTINGS.filter(
      (l) =>
        l.id.toLowerCase().includes(lower) ||
        l.titel.toLowerCase().includes(lower) ||
        l.branche.toLowerCase().includes(lower) ||
        l.kanton.toLowerCase().includes(lower) ||
        l.verkaeufer_email.toLowerCase().includes(lower),
    );

    anfragen = ADMIN_DEMO_ANFRAGEN.filter(
      (a) =>
        a.id.toLowerCase().includes(lower) ||
        a.kaeufer_name.toLowerCase().includes(lower) ||
        a.kaeufer_email.toLowerCase().includes(lower) ||
        a.inserat_titel.toLowerCase().includes(lower),
    );

    const supabase = await createClient();
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, rolle, kanton');

    const profiles = profilesData ?? [];

    let emailMap = new Map<string, string>();
    try {
      const admin = createAdminClient();
      const { data } = await admin.auth.admin.listUsers();
      type AdminAuthUser = { id: string; email?: string | null };
      const list = (data as { users?: AdminAuthUser[] }).users ?? [];
      emailMap = new Map(list.map((u) => [u.id, u.email ?? '']));
    } catch {
      /* SR-Key fehlt */
    }

    users = profiles
      .map((p) => ({
        ...p,
        email: emailMap.get(p.id),
      }))
      .filter(
        (p) =>
          (p.full_name ?? '').toLowerCase().includes(lower) ||
          (p.email ?? '').toLowerCase().includes(lower) ||
          (p.kanton ?? '').toLowerCase().includes(lower),
      );
  }

  const totalResults = users.length + listings.length + anfragen.length;

  return (
    <div>
      <header className="mb-8">
        <p className="overline text-bronze mb-3">Suche</p>
        <h1 className="font-serif text-display-sm text-navy font-light">
          {query ? <>Resultate für «{query}»</> : 'Globale Suche'}
        </h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          {query
            ? `${totalResults} Treffer in User, Inserate und Anfragen.`
            : 'Tippe oben in das Suchfeld einen Begriff — oder rufe direkt /admin/search?q=… auf.'}
        </p>
      </header>

      {!query && (
        <SearchForm />
      )}

      {query && (
        <div className="space-y-8">
          {/* User */}
          <ResultSection
            title="User"
            icon={Users}
            count={users.length}
            empty="Keine User gefunden."
          >
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
                        {u.full_name ?? <span className="italic text-quiet">— ohne Namen</span>}
                      </p>
                      {u.email && <p className="text-caption text-quiet font-mono truncate">{u.email}</p>}
                    </div>
                    {u.rolle && <Badge variant={roleVariant(u.rolle)}>{ROLLE_LABEL[u.rolle]}</Badge>}
                    {u.kanton && (
                      <span className="font-mono text-caption text-quiet">{u.kanton}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {users.length > 10 && (
              <p className="text-caption text-quiet mt-3">
                + {users.length - 10} weitere — verfeinere die Suche.
              </p>
            )}
          </ResultSection>

          {/* Inserate */}
          <ResultSection
            title="Inserate"
            icon={FileText}
            count={listings.length}
            empty="Keine Inserate gefunden."
          >
            <ul className="divide-y divide-stone/60">
              {listings.slice(0, 10).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/inserate/${l.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <FileText className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">{l.titel}</p>
                      <p className="text-caption text-quiet font-mono truncate">
                        {l.id} · {l.branche} · {l.kanton}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          {/* Anfragen */}
          <ResultSection
            title="Anfragen"
            icon={MessageSquare}
            count={anfragen.length}
            empty="Keine Anfragen gefunden."
          >
            <ul className="divide-y divide-stone/60">
              {anfragen.slice(0, 10).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/anfragen/${a.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/60 transition-colors rounded-soft"
                  >
                    <MessageSquare className="w-4 h-4 text-quiet flex-shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">
                        {a.kaeufer_name} → {a.inserat_titel}
                      </p>
                      <p className="text-caption text-quiet font-mono truncate">
                        {a.id} · {a.kaeufer_email}
                      </p>
                    </div>
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
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count: number;
  children: React.ReactNode;
  empty: string;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-navy mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        {title}
        <span className="font-mono text-caption text-quiet font-normal">({count})</span>
      </h2>
      <div className="bg-paper border border-stone rounded-card p-2">
        {count === 0 ? (
          <p className="px-3 py-6 text-center text-caption text-quiet">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function SearchForm() {
  return (
    <form className="bg-paper border border-stone rounded-card p-6" action="/admin/search">
      <label className="overline text-quiet mb-2 block">Suchbegriff</label>
      <div className="relative">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet"
          strokeWidth={1.5}
        />
        <input
          type="search"
          name="q"
          placeholder="Name, E-Mail, Inserat-ID, Branche, Kanton …"
          className="w-full pl-10 pr-4 py-3 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze"
          autoFocus
        />
      </div>
      <p className="text-caption text-quiet mt-3">
        Sucht in User, Inserate und Anfragen gleichzeitig.
      </p>
    </form>
  );
}
