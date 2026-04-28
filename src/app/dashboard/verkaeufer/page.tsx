import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Eye, MessageSquare, FileSignature, ArrowRight, Sparkles, FileText, Building2, Check, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { formatCHFShort } from '@/lib/valuation';

export const metadata = { title: 'Übersicht — passare Verkäufer' };

type Props = { searchParams: Promise<{ paid?: string; tab?: string }> };

export default async function VerkaeuferDashboard({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const sp = await searchParams;

  // Smart-Routing: wenn der User vom Pre-Reg-Funnel kommt (Cookie noch da
  // ODER bereits ein nicht-bezahltes Entwurf-Inserat existiert), schicken
  // wir ihn direkt weiter zum Inserat-Wizard. Vermeidet das "Ich komme
  // aufs Dashboard und weiss nicht was zu tun ist"-Problem.
  // ?tab=overview lässt User explizit das Dashboard sehen.
  if (sp.tab !== 'overview' && sp.paid !== '1') {
    const cookieStore = await cookies();
    const hasPreRegCookie = !!cookieStore.get('pre_reg_draft')?.value;

    if (hasPreRegCookie) {
      redirect('/dashboard/verkaeufer/inserat/new?from=pre-reg');
    }

    if (await hasTable('inserate')) {
      const { data: existing } = await supabase
        .from('inserate')
        .select('id, status, paid_at, titel')
        .eq('verkaeufer_id', userData.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Falls Entwurf existiert und noch nicht bezahlt → zum Edit
      if (existing && existing.status === 'entwurf' && !existing.paid_at) {
        redirect(`/dashboard/verkaeufer/inserat/${existing.id}/edit`);
      }
    }
  }

  let inserat: any = null;
  let viewsLast30Days = 0;
  let viewsSparkline: number[] = Array(30).fill(0);
  let anfragenTotal = 0;
  let anfragenNeu = 0;
  let ndaSigned = 0;
  let ndaTotal = 0;
  let datenraumCount = 0;

  if (await hasTable('inserate')) {
    const { data } = await supabase
      .from('inserate')
      .select('*')
      .eq('verkaeufer_id', userData.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    inserat = data;
  }

  if (inserat && (await hasTable('inserat_views'))) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: views } = await supabase
      .from('inserat_views')
      .select('viewed_at')
      .eq('inserat_id', inserat.id)
      .gte('viewed_at', since);
    viewsLast30Days = views?.length ?? 0;

    // Sparkline: views pro Tag (letzte 30 Tage)
    if (views) {
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      for (const v of views) {
        const key = (v.viewed_at as string).slice(0, 10);
        if (key in buckets) buckets[key]++;
      }
      viewsSparkline = Object.values(buckets);
    }
  }

  if (inserat && (await hasTable('anfragen'))) {
    const { data: anfr } = await supabase
      .from('anfragen')
      .select('id, status')
      .eq('inserat_id', inserat.id);
    if (anfr) {
      anfragenTotal = anfr.length;
      anfragenNeu = anfr.filter((a: any) => a.status === 'neu').length;
    }
  }

  if (inserat && (await hasTable('nda_signaturen'))) {
    const { data: ndas } = await supabase
      .from('nda_signaturen')
      .select('id, status, anfrage_id, anfragen!inner(inserat_id)')
      .eq('anfragen.inserat_id', inserat.id);
    if (ndas) {
      ndaTotal = ndas.length;
      ndaSigned = ndas.filter((n: any) => n.status === 'signed').length;
    }
  }

  if (inserat && (await hasTable('datenraum_files'))) {
    const { count } = await supabase
      .from('datenraum_files')
      .select('id', { count: 'exact', head: true })
      .eq('inserat_id', inserat.id);
    datenraumCount = count ?? 0;
  }

  const ndaConvPct = anfragenTotal > 0 ? Math.round((ndaSigned / anfragenTotal) * 100) : 0;

  // Onboarding-Checklist
  const checklist = [
    { label: 'Account erstellt', done: true },
    { label: 'Profil-Onboarding abgeschlossen', done: true },
    { label: 'Inserat-Daten erfasst', done: Boolean(inserat?.titel && inserat?.umsatz_chf) },
    { label: 'Cover-Bild gewählt', done: Boolean(inserat?.cover_url) },
    { label: 'Paket gebucht', done: Boolean(inserat?.paid_at) },
    { label: 'Datenraum vorbereitet (≥3 Dokumente)', done: datenraumCount >= 3 },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="overline text-bronze-ink mb-2">Verkäufer-Übersicht</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              {inserat?.firma_name ? `Willkommen zurück.` : 'Lass uns dein Inserat starten.'}
            </h1>
            {inserat?.firma_name && (
              <p className="text-body text-muted mt-2 inline-flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
                {inserat.firma_name}
              </p>
            )}
          </div>
          {!inserat ? (
            <Link
              href="/dashboard/verkaeufer/inserat/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Inserat erstellen
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          ) : (
            <Link
              href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              Inserat bearbeiten
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* KPI-Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPITile
            label="Inserat-Status"
            value={inserat ? statusLabel(inserat.status) : '—'}
            sub={inserat?.published_at ? `Live seit ${formatRelativeDate(inserat.published_at)}` : 'Noch nicht veröffentlicht'}
            tone={inserat?.status === 'live' ? 'success' : 'default'}
            icon={FileText}
          />
          <KPITile
            label="Views (30 Tage)"
            value={viewsLast30Days.toString()}
            sub={`${inserat?.views ?? 0} insgesamt`}
            sparkline={viewsSparkline}
            icon={Eye}
          />
          <KPITile
            label="Anfragen"
            value={anfragenTotal.toString()}
            sub={anfragenNeu > 0 ? `${anfragenNeu} neu` : 'Keine neuen'}
            tone={anfragenNeu > 0 ? 'bronze' : 'default'}
            icon={MessageSquare}
          />
          <KPITile
            label="NDA-Conversion"
            value={`${ndaConvPct}%`}
            sub={`${ndaSigned} von ${anfragenTotal}`}
            icon={FileSignature}
            progressPct={ndaConvPct}
          />
        </div>

        {/* Checklist */}
        {checklistDone < checklistTotal && (
          <div className="rounded-card bg-paper border border-stone p-6 md:p-8 mb-10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="overline text-bronze-ink mb-2">Onboarding</p>
                <h2 className="font-serif text-head-md text-navy">
                  Noch {checklistTotal - checklistDone} Schritt{checklistTotal - checklistDone !== 1 ? 'e' : ''} bis dein Inserat live ist
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-mono text-body-sm text-bronze-ink font-medium">{checklistDone} / {checklistTotal}</p>
                </div>
                <ProgressRing value={(checklistDone / checklistTotal) * 100} />
              </div>
            </div>
            <ul className="space-y-3">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className={item.done
                    ? 'w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0'
                    : 'w-5 h-5 rounded-full border-2 border-stone flex-shrink-0'
                  }>
                    {item.done && <Check className="w-3 h-3 text-cream" strokeWidth={3} />}
                  </div>
                  <span className={item.done ? 'text-body-sm text-muted line-through' : 'text-body-sm text-ink'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <QuickAction
            href="/dashboard/verkaeufer/anfragen"
            icon={MessageSquare}
            title="Anfragen prüfen"
            desc={anfragenNeu > 0 ? `${anfragenNeu} neue Anfragen warten` : 'Alle bearbeitet'}
            badge={anfragenNeu > 0 ? String(anfragenNeu) : undefined}
          />
          <QuickAction
            href="/dashboard/verkaeufer/datenraum"
            icon={FileText}
            title="Datenraum vorbereiten"
            desc={`${datenraumCount} Dokument${datenraumCount !== 1 ? 'e' : ''} hochgeladen`}
          />
          <QuickAction
            href="/dashboard/verkaeufer/statistik"
            icon={Sparkles}
            title="Statistik ansehen"
            desc="Views, Anfragen, NDA-Conversion über Zeit"
          />
        </div>

        {/* Bewertungs-Recap (wenn vorhanden) */}
        {inserat?.estimated_value_mid && (
          <div className="rounded-card bg-bronze/5 border border-bronze/30 p-6 md:p-8">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-bronze flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="overline text-bronze-ink mb-1">Deine Pre-Reg-Bewertung</p>
                <h3 className="font-serif text-head-md text-navy font-light">
                  {formatCHFShort(inserat.estimated_value_mid)}
                </h3>
                <p className="text-caption text-muted font-mono mt-1">
                  Range: {formatCHFShort(inserat.estimated_value_low)} – {formatCHFShort(inserat.estimated_value_high)}
                </p>
              </div>
            </div>
            <p className="text-caption text-quiet">
              Indikative Markt-Heuristik basierend auf Branchen-Multiples (Q1/2026).
              Finale Bewertung erfolgt im Käufer-Dialog.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── KPI Tile ─── */
function KPITile({
  label, value, sub, tone = 'default', icon: Icon, sparkline, progressPct,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'success' | 'bronze';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  sparkline?: number[];
  progressPct?: number;
}) {
  return (
    <div className="rounded-card bg-paper border border-stone p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="overline text-quiet">{label}</span>
        <Icon className={
          tone === 'success' ? 'w-4 h-4 text-success' :
          tone === 'bronze' ? 'w-4 h-4 text-bronze-ink' :
          'w-4 h-4 text-quiet'
        } strokeWidth={1.5} />
      </div>
      <p className="font-serif text-head-lg text-navy font-light font-tabular leading-none">{value}</p>
      {sub && <p className="text-caption text-muted mt-2">{sub}</p>}
      {sparkline && sparkline.length > 0 && (
        <Sparkline data={sparkline} className="mt-3" />
      )}
      {progressPct !== undefined && (
        <div className="mt-3 h-1 rounded-pill bg-stone overflow-hidden">
          <div
            className="h-full bg-bronze transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Sparkline (SVG) ─── */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" width="100%" height="24">
      <polyline
        fill="none"
        stroke="#B8935A"
        strokeWidth="1.5"
        points={points}
      />
      <polyline
        fill="rgba(184, 147, 90, 0.1)"
        stroke="none"
        points={`0,${h} ${points} ${w},${h}`}
      />
    </svg>
  );
}

/* ─── Progress Ring ─── */
function ProgressRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#E8E6E0" strokeWidth="3" />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke="#B8935A"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

/* ─── Quick Action ─── */
function QuickAction({
  href, icon: Icon, title, desc, badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card bg-paper border border-stone p-5 hover:border-bronze/40 hover:shadow-card hover:-translate-y-px transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
        {badge && (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-pill bg-bronze text-cream text-caption font-mono font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="font-serif text-head-sm text-navy mb-1">{title}</p>
      <p className="text-caption text-muted">{desc}</p>
      <p className="mt-3 text-caption text-bronze-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">
        Öffnen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </p>
    </Link>
  );
}

function statusLabel(s: string | null): string {
  switch (s) {
    case 'entwurf': return 'Entwurf';
    case 'zur_pruefung': return 'In Prüfung';
    case 'live': return 'Live';
    case 'pausiert': return 'Pausiert';
    case 'verkauft': return 'Verkauft';
    case 'abgelaufen': return 'Abgelaufen';
    case 'abgelehnt': return 'Abgelehnt';
    default: return '—';
  }
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 30) return `${days} Tagen`;
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
