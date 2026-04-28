import Link from 'next/link';
import {
  FileText,
  Users,
  MessageSquare,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Database,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/StatCard';
import { PageHeader } from '@/components/admin/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin — passare',
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

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    usersTotal,
    usersVerkaeufer,
    usersKaeufer,
    usersAdmin,
    inserateAktiv,
    inseratePending,
    anfragenOffen,
    blogTotal,
    blogPublished,
    blogDraft,
    latestProfiles,
    latestLogs,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'verkaeufer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'kaeufer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'admin'),
    supabase.from('inserate').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('inserate').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('anfragen').select('id', { count: 'exact', head: true }).eq('status', 'offen'),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'veroeffentlicht'),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'entwurf'),
    supabase
      .from('profiles')
      .select('id, full_name, rolle, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('audit_log')
      .select('id, type, user_email, beschreibung, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const userCount = usersTotal.count ?? 0;
  const verkCount = usersVerkaeufer.count ?? 0;
  const kaufCount = usersKaeufer.count ?? 0;
  const adminCount = usersAdmin.count ?? 0;
  const aktivCount = inserateAktiv.count ?? 0;
  const pendingCount = inseratePending.count ?? 0;
  const offenAnfr = anfragenOffen.count ?? 0;
  const blogPub = blogPublished.count ?? 0;
  const blogDr = blogDraft.count ?? 0;
  const blogAll = blogTotal.count ?? 0;

  const profiles = latestProfiles.data ?? [];
  const logs = latestLogs.data ?? [];

  const latestActivity = [
    ...profiles.map((p) => ({
      id: `prof-${p.id}`,
      kind: 'register' as const,
      label: p.full_name ?? 'Neuer User',
      desc: `Neue ${ROLLE_LABEL[p.rolle ?? ''] ?? '—'}-Registrierung`,
      ts: p.created_at as string,
    })),
    ...logs.map((l) => ({
      id: l.id as string,
      kind: 'log' as const,
      label: (l.user_email as string | null) ?? '—',
      desc: l.beschreibung as string,
      ts: l.created_at as string,
    })),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 8);

  return (
    <div className="max-w-7xl">
      <PageHeader overline="Admin" title="Übersicht" />

      {/* KPIs — kompakte Tool-Kacheln */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        <StatCard
          icon={FileText}
          value={aktivCount}
          label="Aktive Inserate"
          hint={pendingCount > 0 ? `${pendingCount} pending` : undefined}
        />
        <StatCard
          icon={Users}
          value={userCount}
          label="User"
          hint={`${verkCount} Verk · ${kaufCount} Käuf · ${adminCount} Admin`}
        />
        <StatCard
          icon={MessageSquare}
          value={offenAnfr}
          label="Offene Anfragen"
        />
        <StatCard
          icon={Newspaper}
          value={blogPub}
          label="Blog publ."
          hint={blogDr > 0 ? `${blogDr} Entwürfe` : undefined}
        />
        <StatCard
          icon={Database}
          value={userCount + aktivCount + offenAnfr + blogAll}
          label="Datensätze"
        />
      </section>

      {/* Quick-Actions — schmaler Action-Strip */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        <QuickAction
          href="/admin/inserate?status=pending"
          icon={CheckCircle2}
          label="Inserate freigeben"
          count={pendingCount}
        />
        <QuickAction href="/admin/users" icon={Users} label="User verwalten" count={userCount} />
        <QuickAction
          href="/admin/anfragen?status=offen"
          icon={MessageSquare}
          label="Anfragen prüfen"
          count={offenAnfr}
        />
        <QuickAction href="/admin/blog" icon={Sparkles} label="Blog generieren" count={blogDr} />
      </section>

      {/* Activity + Latest Users */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionHeader title="Letzte Aktivitäten" href="/admin/logs" />

          {latestActivity.length === 0 ? (
            <div className="bg-paper border border-stone rounded-soft px-4 py-8 text-center text-caption text-quiet">
              Noch keine Aktivität.
            </div>
          ) : (
            <ul className="bg-paper border border-stone rounded-soft divide-y divide-stone/60 overflow-hidden">
              {latestActivity.map((entry) => (
                <li key={entry.id} className="px-4 py-2.5 flex items-center gap-3">
                  <Activity className="w-3.5 h-3.5 text-quiet flex-shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-ink truncate">{entry.desc}</p>
                    <p className="text-caption text-quiet truncate">{entry.label}</p>
                  </div>
                  <span className="text-caption text-quiet font-mono whitespace-nowrap">
                    {formatRelative(entry.ts)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionHeader title="Letzte User" href="/admin/users" />

          {profiles.length === 0 ? (
            <div className="bg-paper border border-stone rounded-soft px-4 py-8 text-center text-caption text-quiet">
              Noch keine Registrierung.
            </div>
          ) : (
            <ul className="bg-paper border border-stone rounded-soft divide-y divide-stone/60 overflow-hidden">
              {profiles.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/users/${p.id}`}
                    className="px-3 py-2.5 flex items-center gap-2.5 hover:bg-cream/60 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy text-cream flex items-center justify-center font-mono text-[11px] flex-shrink-0">
                      {(p.full_name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm text-ink truncate leading-tight">
                        {p.full_name ?? <em className="text-quiet">— ohne Namen</em>}
                      </p>
                      <p className="text-caption text-quiet font-mono leading-tight">
                        {formatRelative(p.created_at as string)}
                      </p>
                    </div>
                    {p.rolle && <Badge variant={roleVariant(p.rolle)}>{ROLLE_LABEL[p.rolle]}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-caption uppercase tracking-wide font-medium text-quiet">{title}</h2>
      <Link
        href={href}
        className="text-caption text-quiet hover:text-navy transition-colors inline-flex items-center gap-1"
      >
        Alle <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </Link>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="group bg-paper border border-stone rounded-soft px-3 py-2.5 flex items-center gap-2.5 hover:border-bronze/50 transition-colors"
    >
      <Icon className="w-4 h-4 text-quiet group-hover:text-bronze transition-colors flex-shrink-0" strokeWidth={1.5} />
      <p className="text-body-sm text-ink flex-1 truncate">{label}</p>
      <span className="text-caption text-navy font-mono font-semibold tabular-nums">{count}</span>
      <ArrowRight
        className="w-3.5 h-3.5 text-quiet group-hover:text-navy transition-colors flex-shrink-0"
        strokeWidth={1.5}
      />
    </Link>
  );
}
