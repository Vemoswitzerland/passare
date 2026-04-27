import Link from 'next/link';
import {
  FileText,
  Users,
  MessageSquare,
  Crown,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/StatCard';
import { ADMIN_DEMO_STATS, ADMIN_DEMO_LOGS, LOG_TYPE_LABELS } from '@/data/admin-demo';

export const metadata = {
  title: 'Admin · Übersicht — passare',
  robots: { index: false, follow: false },
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return `vor ${d} Tagen`;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: usersTotal }, { count: usersVerkaeufer }, { count: usersKaeufer }, { data: latestProfiles }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'verkaeufer'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rolle', 'kaeufer'),
      supabase
        .from('profiles')
        .select('id, full_name, rolle, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const realActivity = (latestProfiles ?? []).map((p) => ({
    id: `reg-${p.id}`,
    type: 'register' as const,
    user_email: p.full_name ?? 'Neuer User',
    beschreibung: `Neue ${p.rolle ?? '—'}-Registrierung`,
    created_at: p.created_at as string,
  }));

  const combined = [...realActivity, ...ADMIN_DEMO_LOGS]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="max-w-6xl">
      <header className="mb-10">
        <p className="overline text-bronze mb-3">Admin · Übersicht</p>
        <h1 className="font-serif text-display-sm text-navy font-light">
          Willkommen zurück.
        </h1>
        <p className="text-body text-muted mt-3 max-w-prose">
          Plattform-Status auf einen Blick. Inserate-, Anfragen- und Log-Daten
          sind aktuell teilweise als Demo gekennzeichnet — die Datenbank-
          Anbindung erfolgt schrittweise in den nächsten Etappen.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={FileText}
          value={ADMIN_DEMO_STATS.aktive_inserate}
          label="Aktive Inserate"
          trend={{ direction: 'up', text: ADMIN_DEMO_STATS.trend_inserate }}
          progress={Math.min(100, ADMIN_DEMO_STATS.aktive_inserate * 8)}
        />
        <StatCard
          icon={Users}
          value={usersTotal ?? 0}
          label="Registrierte User"
          trend={{
            direction: 'up',
            text: `${usersVerkaeufer ?? 0} V · ${usersKaeufer ?? 0} K`,
          }}
        />
        <StatCard
          icon={MessageSquare}
          value={ADMIN_DEMO_STATS.offene_anfragen}
          label="Offene Anfragen"
          trend={{ direction: 'up', text: ADMIN_DEMO_STATS.trend_anfragen }}
        />
        <StatCard
          icon={Crown}
          value={ADMIN_DEMO_STATS.max_abos}
          label="MAX-Abos"
          trend={{ direction: 'up', text: ADMIN_DEMO_STATS.trend_abos }}
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-10">
        <QuickAction
          href="/admin/inserate"
          icon={CheckCircle2}
          label="Inserate freigeben"
          count={ADMIN_DEMO_STATS.pending_inserate}
          countLabel="Pending"
        />
        <QuickAction
          href="/admin/users"
          icon={UserPlus}
          label="User verifizieren"
          count={usersTotal ?? 0}
          countLabel="Total"
        />
        <QuickAction
          href="/admin/anfragen"
          icon={MessageSquare}
          label="Anfragen prüfen"
          count={ADMIN_DEMO_STATS.offene_anfragen}
          countLabel="Offen"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="overline text-bronze mb-1">Letzte Aktivitäten</p>
            <h2 className="font-serif text-2xl text-navy">Activity-Stream</h2>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors"
          >
            Alle Logs
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="bg-paper border border-stone rounded-card overflow-hidden">
          <ul className="divide-y divide-stone/60">
            {combined.map((entry) => (
              <li key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-cream/60 transition-colors">
                <div className="w-9 h-9 rounded-soft bg-stone/50 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ink truncate">{entry.beschreibung}</p>
                  <p className="text-caption text-quiet truncate">
                    {entry.user_email} · {LOG_TYPE_LABELS[entry.type]}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-caption text-quiet font-mono">{formatRelative(entry.created_at)}</p>
                  <p className="text-caption text-quiet font-mono opacity-70 hidden sm:block">
                    {formatDateTime(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  count,
  countLabel,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  count: number;
  countLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-paper border border-stone rounded-card p-5 flex items-center gap-4 hover:border-bronze/50 hover:shadow-card transition-all"
    >
      <div className="w-11 h-11 rounded-soft bg-bronze-soft flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-ink font-medium">{label}</p>
        <p className="text-caption text-quiet">
          {count} {countLabel}
        </p>
      </div>
      <ArrowRight
        className="w-4 h-4 text-quiet group-hover:text-bronze group-hover:translate-x-0.5 transition-all"
        strokeWidth={1.5}
      />
    </Link>
  );
}
