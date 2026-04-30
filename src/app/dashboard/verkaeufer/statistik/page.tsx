import { BarChart3, Eye, MessageSquare, FileSignature, TrendingUp, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Statistik — passare Verkäufer' };

type Props = { searchParams: Promise<{ range?: string }> };

export default async function StatistikPage({ searchParams }: Props) {
  const { range = '30' } = await searchParams;
  const days = Number(range);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('inserate'))) {
    return <NoData />;
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, titel, views')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) return <NoData message="Erstelle zuerst ein Inserat." />;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Views
  let viewsTimeseries: Array<{ date: string; count: number }> = [];
  if (await hasTable('inserat_views')) {
    const { data: views } = await supabase
      .from('inserat_views')
      .select('viewed_at, viewer_id')
      .eq('inserat_id', inserat.id)
      .gte('viewed_at', since);
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const v of views ?? []) {
      const k = (v.viewed_at as string).slice(0, 10);
      if (k in buckets) buckets[k]++;
    }
    viewsTimeseries = Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  // Anfragen-Funnel
  let funnel = { neu: 0, akzeptiert: 0, nda_signed: 0, released: 0 };
  let perKanton: Record<string, number> = {};
  if (await hasTable('anfragen')) {
    const { data: anfragen } = await supabase
      .from('anfragen')
      .select('id, status, kaeufer_id, profiles:kaeufer_id(kanton)')
      .eq('inserat_id', inserat.id);
    for (const a of anfragen ?? []) {
      if (a.status === 'neu' || a.status === 'in_pruefung') funnel.neu++;
      if (['akzeptiert', 'nda_pending', 'nda_signed', 'released'].includes(a.status)) funnel.akzeptiert++;
      if (['nda_signed', 'released'].includes(a.status)) funnel.nda_signed++;
      if (a.status === 'released') funnel.released++;
      const k = (a as any).profiles?.kanton ?? '?';
      perKanton[k] = (perKanton[k] ?? 0) + 1;
    }
  }

  const totalAnfragen = Object.values(funnel).reduce((a, b) => a + b, 0) || 1;
  const ndaConvPct = funnel.akzeptiert > 0 ? Math.round((funnel.nda_signed / funnel.akzeptiert) * 100) : 0;
  const totalViews = viewsTimeseries.reduce((sum, v) => sum + v.count, 0);

  // Top Kantone
  const topKantone = Object.entries(perKanton)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="overline text-bronze-ink mb-2">Statistik</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Performance-Analyse
            </h1>
            <p className="text-body text-muted mt-2">
              Daten der letzten {days} Tage für «{inserat.titel ?? 'Inserat'}»
            </p>
          </div>
          <RangeSelector current={days} />
        </div>

        {/* KPI-Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Tile icon={Eye} label="Views (Total)" value={(inserat.views ?? 0).toString()} />
          <Tile icon={TrendingUp} label={`Views (${days} Tage)`} value={totalViews.toString()} />
          <Tile icon={MessageSquare} label="Anfragen Total" value={Object.values(funnel).reduce((a, b) => a + b, 0).toString()} />
          {/* NDA-Conversion-Tile entfernt — NDA wird nicht abgebildet (Cyrill). */}
          <Tile icon={FileSignature} label="Datenraum-Freigabe" value={`${funnel.released} / ${funnel.akzeptiert}`} />
        </div>

        {/* Views Chart */}
        <Section title="Views über Zeit" subtitle={`${totalViews} Views in den letzten ${days} Tagen`}>
          <ViewsChart data={viewsTimeseries} />
        </Section>

        {/* Funnel */}
        <Section title="Anfragen-Funnel" subtitle="Vom Erstkontakt bis zum Datenraum-Zugang">
          <FunnelChart data={funnel} />
        </Section>

        {/* Kantone */}
        {topKantone.length > 0 && (
          <Section title="Käufer-Demografie" subtitle="Anfragen pro Kanton">
            <KantonChart data={topKantone} />
          </Section>
        )}
      </div>
    </div>
  );
}

function NoData({ message }: { message?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <BarChart3 className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Keine Statistik verfügbar</h2>
      <p className="text-body text-muted">{message ?? 'Sobald dein Inserat live ist, kommen hier Daten rein.'}</p>
    </div>
  );
}

function RangeSelector({ current }: { current: number }) {
  const opts = [7, 30, 90, 365];
  return (
    <div className="inline-flex rounded-soft border border-stone bg-paper p-0.5">
      {opts.map((d) => (
        <a
          key={d}
          href={`/dashboard/verkaeufer/statistik?range=${d}`}
          className={
            current === d
              ? 'px-3 py-1.5 rounded-soft bg-navy text-cream text-caption font-medium'
              : 'px-3 py-1.5 rounded-soft text-caption text-muted hover:text-navy transition-colors'
          }
        >
          {d}T
        </a>
      ))}
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-card bg-paper border border-stone p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="overline text-quiet">{label}</span>
        <Icon className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
      </div>
      <p className="font-serif text-head-md text-navy font-light font-tabular">{value}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-paper border border-stone p-6 mb-6">
      <div className="mb-6">
        <h3 className="font-serif text-head-sm text-navy mb-1">{title}</h3>
        {subtitle && <p className="text-caption text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ViewsChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) return <p className="text-body-sm text-quiet text-center py-12">Noch keine Views.</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 800;
  const h = 200;
  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.count / max) * (h - 20) - 10}`)
    .join(' ');
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 600 }} preserveAspectRatio="none">
        {/* Y-axis grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={0} x2={w} y1={h - p * (h - 20) - 10} y2={h - p * (h - 20) - 10} stroke="#E8E6E0" strokeWidth="0.5" />
        ))}
        <polyline
          fill="rgba(184,147,90,0.1)"
          stroke="none"
          points={`0,${h - 10} ${points} ${w},${h - 10}`}
        />
        <polyline fill="none" stroke="#B8935A" strokeWidth="2" points={points} />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * w}
            cy={h - (d.count / max) * (h - 20) - 10}
            r={d.count > 0 ? 2.5 : 1.5}
            fill="#B8935A"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-caption font-mono text-quiet">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function FunnelChart({ data }: { data: Record<string, number> }) {
  // NDA-Stage entfernt — Cyrill: NDA wird nicht abgebildet.
  const stages = [
    { id: 'neu', label: 'Eingang', count: data.neu },
    { id: 'akzeptiert', label: 'Akzeptiert', count: data.akzeptiert },
    { id: 'released', label: 'Datenraum', count: data.released },
  ];
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-3">
      {stages.map((s) => (
        <div key={s.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-body-sm text-navy">{s.label}</span>
            <span className="text-body-sm font-mono text-bronze-ink font-medium">{s.count}</span>
          </div>
          <div className="h-3 rounded-pill bg-stone overflow-hidden">
            <div
              className="h-full bg-bronze rounded-pill transition-all duration-700"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KantonChart({ data }: { data: Array<[string, number]> }) {
  const max = Math.max(...data.map(([, n]) => n), 1);
  return (
    <div className="space-y-2">
      {data.map(([k, n]) => (
        <div key={k} className="grid grid-cols-[60px_1fr_40px] items-center gap-3">
          <span className="text-body-sm text-muted font-mono">{k}</span>
          <div className="h-2 rounded-pill bg-stone overflow-hidden">
            <div className="h-full bg-navy" style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span className="text-caption font-mono text-quiet text-right">{n}</span>
        </div>
      ))}
    </div>
  );
}
