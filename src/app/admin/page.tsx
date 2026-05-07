import Link from 'next/link';
import {
  FileText,
  Users,
  MessageSquare,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Activity,
  Briefcase,
  Search,
  ScrollText,
  Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/admin/types';

export const metadata = {
  title: 'Admin — passare',
  robots: { index: false, follow: false },
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  broker: 'Broker',
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
};

const roleVariant = (rolle: string | null): 'navy' | 'bronze' | 'neutral' => {
  if (rolle === 'admin') return 'navy';
  if (rolle === 'verkaeufer' || rolle === 'broker') return 'bronze';
  return 'neutral';
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    usersTotal,
    usersVerkaeufer,
    usersKaeufer,
    usersAdmin,
    inserateLive,
    inseratePending,
    inserateTotal,
    anfragenOffen,
    anfragenTotal,
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
    supabase.from('inserate').select('id', { count: 'exact', head: true }).in('status', ['pending', 'zur_pruefung', 'rueckfrage']),
    supabase.from('inserate').select('id', { count: 'exact', head: true }),
    supabase.from('anfragen').select('id', { count: 'exact', head: true }).eq('status', 'offen'),
    supabase.from('anfragen').select('id', { count: 'exact', head: true }),
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
      .limit(6),
  ]);

  const userCount = usersTotal.count ?? 0;
  const verkCount = usersVerkaeufer.count ?? 0;
  const kaufCount = usersKaeufer.count ?? 0;
  const adminCount = usersAdmin.count ?? 0;
  const liveCount = inserateLive.count ?? 0;
  const pendingCount = inseratePending.count ?? 0;
  const insTotal = inserateTotal.count ?? 0;
  const offenAnfr = anfragenOffen.count ?? 0;
  const anfrTotal = anfragenTotal.count ?? 0;
  const blogPub = blogPublished.count ?? 0;
  const blogDr = blogDraft.count ?? 0;

  const profiles = latestProfiles.data ?? [];
  const logs = latestLogs.data ?? [];

  // Aktivitäten + neue Profile zusammenführen, neueste 6 zeigen
  const latestActivity = [
    ...profiles.slice(0, 3).map((p) => ({
      id: `prof-${p.id}`,
      kind: 'register' as const,
      label: (p.full_name ?? 'Neuer User') as string,
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
    .slice(0, 6);

  const hasPending = pendingCount > 0 || offenAnfr > 0 || blogDr > 0;

  return (
    <div className="max-w-6xl">
      <PageHeader
        overline="Admin"
        title="Übersicht"
        description="Plattform-Status auf einen Blick."
      />

      {/* ── KPI-Grid ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={FileText}
          value={liveCount}
          label="Live-Inserate"
          sub={`${insTotal} gesamt · ${pendingCount} ausstehend`}
        />
        <KpiCard
          icon={Users}
          value={userCount}
          label="User"
          sub={`${verkCount} Verk · ${kaufCount} Käuf · ${adminCount} Admin`}
        />
        <KpiCard
          icon={MessageSquare}
          value={offenAnfr}
          label="Offene Anfragen"
          sub={`${anfrTotal} gesamt`}
        />
        <KpiCard
          icon={Newspaper}
          value={blogPub}
          label="Blog publiziert"
          sub={`${blogDr} Entwürfe`}
        />
      </section>

      {/* ── Quick-Actions (nur wenn Pending existiert) ──────── */}
      {hasPending && (
        <section className="mb-6">
          <h2 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-2">
            Erledige als Nächstes
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingCount > 0 && (
              <ActionCard
                href="/admin/inserate?status=pending"
                icon={CheckCircle2}
                label="Inserate freigeben"
                count={pendingCount}
              />
            )}
            {offenAnfr > 0 && (
              <ActionCard
                href="/admin/anfragen?status=offen"
                icon={MessageSquare}
                label="Anfragen prüfen"
                count={offenAnfr}
              />
            )}
            {blogDr > 0 && (
              <ActionCard
                href="/admin/blog"
                icon={Sparkles}
                label="Blog-Entwürfe"
                count={blogDr}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Bereiche-Navigation (immer sichtbar) ────────────── */}
      <section className="mb-8">
        <h2 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-2">
          Bereiche
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SectionLink href="/admin/inserate" icon={FileText} label="Inserate" />
          <SectionLink href="/admin/users" icon={Users} label="User" />
          <SectionLink href="/admin/anfragen" icon={MessageSquare} label="Anfragen" />
          <SectionLink href="/admin/experten" icon={Briefcase} label="Experten" />
          <SectionLink href="/admin/blog" icon={Newspaper} label="Blog" />
          <SectionLink href="/admin/search" icon={Search} label="Suche" />
          <SectionLink href="/admin/logs" icon={ScrollText} label="Logs" />
          <SectionLink href="/admin/settings" icon={Settings} label="Settings" />
        </div>
      </section>

      {/* ── Activity + Users (gleiche Höhe, je 6 Items) ─────── */}
      <section className="grid lg:grid-cols-2 gap-6">
        <Panel
          title="Letzte Aktivitäten"
          href="/admin/logs"
          empty={latestActivity.length === 0 ? 'Noch keine Aktivität.' : null}
        >
          <ul className="divide-y divide-stone/60">
            {latestActivity.map((entry) => (
              <li key={entry.id} className="px-4 py-3 flex items-center gap-3">
                <Activity className="w-3.5 h-3.5 text-quiet flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ink truncate leading-tight">{entry.desc}</p>
                  <p className="text-caption text-quiet truncate leading-tight mt-0.5">
                    {entry.label}
                  </p>
                </div>
                <span className="text-caption text-quiet font-mono whitespace-nowrap">
                  {formatRelative(entry.ts)}
                </span>
              </li>
            ))}
            {/* Filler-Items damit beide Spalten gleichhöhig sind */}
            {Array.from({ length: Math.max(0, 6 - latestActivity.length) }).map((_, i) => (
              <li key={`fill-act-${i}`} className="px-4 py-3 invisible" aria-hidden>
                <p className="text-body-sm leading-tight">·</p>
                <p className="text-caption leading-tight mt-0.5">·</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Letzte User"
          href="/admin/users"
          empty={profiles.length === 0 ? 'Noch keine Registrierung.' : null}
        >
          <ul className="divide-y divide-stone/60">
            {profiles.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/users/${p.id}`}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-cream/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-navy text-cream flex items-center justify-center font-mono text-[11px] flex-shrink-0">
                    {(p.full_name ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-ink truncate leading-tight">
                      {p.full_name ?? <em className="text-quiet not-italic">— ohne Namen</em>}
                    </p>
                    <p className="text-caption text-quiet font-mono leading-tight mt-0.5">
                      {formatRelative(p.created_at as string)}
                    </p>
                  </div>
                  {p.rolle && (
                    <Badge variant={roleVariant(p.rolle)}>{ROLLE_LABEL[p.rolle] ?? p.rolle}</Badge>
                  )}
                </Link>
              </li>
            ))}
            {Array.from({ length: Math.max(0, 6 - profiles.length) }).map((_, i) => (
              <li key={`fill-usr-${i}`} className="px-4 py-3 invisible" aria-hidden>
                <p className="text-body-sm leading-tight">·</p>
                <p className="text-caption leading-tight mt-0.5">·</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

/* ════════════════════════ Komponenten ════════════════════════ */

function KpiCard({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="bg-paper border border-stone rounded-card p-4 flex flex-col gap-2 min-h-[7rem]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide font-medium text-quiet leading-tight">
          {label}
        </p>
        <Icon className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
      </div>
      <p className="text-[2rem] text-navy font-serif font-light tabular-nums leading-none">
        {value}
      </p>
      <p className="text-caption text-quiet font-mono leading-tight mt-auto">{sub}</p>
    </div>
  );
}

function ActionCard({
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
      className="group bg-paper border border-stone rounded-card px-4 py-3.5 flex items-center gap-3 hover:border-bronze/50 hover:bg-bronze/[0.02] transition-colors min-h-[3.5rem]"
    >
      <div className="w-8 h-8 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
      </div>
      <p className="text-body-sm text-ink flex-1 truncate font-medium">{label}</p>
      <span className="text-body-sm text-bronze-ink font-mono font-semibold tabular-nums">
        {count}
      </span>
      <ArrowRight
        className="w-4 h-4 text-quiet group-hover:text-bronze transition-colors flex-shrink-0"
        strokeWidth={1.5}
      />
    </Link>
  );
}

function SectionLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-paper border border-stone rounded-card px-3 py-3 flex flex-col items-start gap-2 hover:border-bronze/50 hover:bg-cream/40 transition-colors min-h-[4.5rem]"
    >
      <Icon
        className="w-4 h-4 text-quiet group-hover:text-bronze-ink transition-colors"
        strokeWidth={1.5}
      />
      <p className="text-body-sm text-ink font-medium leading-tight">{label}</p>
    </Link>
  );
}

function Panel({
  title,
  href,
  empty,
  children,
}: {
  title: string;
  href: string;
  empty?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] uppercase tracking-wide font-medium text-quiet">{title}</h2>
        <Link
          href={href}
          className="text-caption text-quiet hover:text-navy transition-colors inline-flex items-center gap-1"
        >
          Alle <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>
      <div className="bg-paper border border-stone rounded-card overflow-hidden flex-1">
        {empty ? (
          <div className="px-4 py-12 text-center text-caption text-quiet">{empty}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
