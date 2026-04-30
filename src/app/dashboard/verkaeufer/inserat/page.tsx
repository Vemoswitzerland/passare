import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Edit2, Eye, FileText, ArrowRight, CheckCircle, Sparkles, Image as ImageIcon,
  Type as TypeIcon, BarChart3, Users, Heart, MessageSquare, ShieldCheck, Tag,
  Pause, Play, Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { submitForReview } from './actions';
import { formatCHFShort } from '@/lib/valuation';
import { InseratStatusBanner } from '@/components/verkaeufer/InseratStatusBanner';
import { InseratAuditThread } from '@/components/admin/InseratAuditThread';

export const metadata = { title: 'Mein Inserat — passare Verkäufer' };

/**
 * Mein-Inserat-Cockpit (statt nur Bearbeitungs-Funnel).
 *
 * Cyrill: «Wenn man auf Inserat bearbeiten klickt, kommt man auf Mein
 * Inserat — diese Ansicht deutlich schlauer machen, dass man sein
 * eigenes Inserat sauber sieht, Status sieht und gezielt einzelne
 * Bereiche bearbeiten kann».
 *
 * Aufbau:
 *   1. Header mit Titel + Status-Badge + Hauptaktionen rechts
 *   2. Status-Banner (Rückfrage / Abgelehnt / In-Prüfung-Hinweis)
 *   3. Konversations-Thread mit Admin (nur bei Rückfrage etc.)
 *   4. KPI-Strip: Aufrufe · Anfragen · Favoriten · Tage live
 *   5. 2-Spalten:
 *      - Links: Vorschau-Karte (so wie Käufer es sieht)
 *      - Rechts: Sektionen-Liste mit «Bearbeiten →» pro Bereich
 *   6. Footer mit Pausieren / Wieder live / Löschen
 */

export default async function InseratIndexPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('inserate'))) {
    return <NoTableYet />;
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('*, branchen(label_de)')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) {
    redirect('/dashboard/verkaeufer/inserat/new');
  }

  // ── KPIs parallel laden — 3 Roundtrips in einem Rutsch ──────────
  const [viewsRes, anfragenRes, favoritenRes] = await Promise.all([
    (await hasTable('inserat_views'))
      ? supabase.from('inserat_views').select('*', { count: 'exact', head: true }).eq('inserat_id', inserat.id)
      : null,
    (await hasTable('anfragen'))
      ? supabase.from('anfragen').select('*', { count: 'exact', head: true }).eq('inserat_id', inserat.id)
      : null,
    (await hasTable('favoriten'))
      ? supabase.from('favoriten').select('*', { count: 'exact', head: true }).eq('inserat_id', inserat.id)
      : null,
  ]);
  const aufrufe = viewsRes?.count ?? 0;
  const anfragenTotal = anfragenRes?.count ?? 0;
  const favoritenTotal = favoritenRes?.count ?? 0;
  const liveSeit = inserat.live_at
    ? Math.max(0, Math.floor((Date.now() - new Date(inserat.live_at).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // ── Sektionen-Status (was ist gefüllt, was fehlt?) ──────────────
  const sektionen = [
    {
      id: 'eckdaten',
      icon: Tag,
      label: 'Eckdaten',
      sub: 'Branche, Kanton, Umsatz, EBITDA',
      step: 2,
      done: Boolean(inserat.branche && inserat.kanton && inserat.umsatz_chf && inserat.ebitda_chf),
    },
    {
      id: 'titel',
      icon: TypeIcon,
      label: 'Titel & Beschreibung',
      sub: 'Marketing-Texte für Käufer',
      step: 2,
      done: Boolean(inserat.titel && inserat.beschreibung && inserat.beschreibung.length > 80),
    },
    {
      id: 'cover',
      icon: ImageIcon,
      label: 'Bilder',
      sub: 'Titelbild + Galerie',
      step: 3,
      done: Boolean(inserat.cover_url),
    },
    {
      id: 'staerken',
      icon: Sparkles,
      label: 'Stärken',
      sub: '3-5 Highlights',
      step: 4,
      done: Array.isArray(inserat.sales_points) && inserat.sales_points.length >= 3,
    },
    {
      id: 'sichtbarkeit',
      icon: ShieldCheck,
      label: 'Sichtbarkeit',
      sub: 'Anonymität, Kontaktdaten',
      step: 4,
      done: Boolean(inserat.anonymitaet_level),
    },
    {
      id: 'paket',
      icon: BarChart3,
      label: 'Paket & Preis',
      sub: inserat.paket ? inserat.paket.toUpperCase() : 'Noch nicht gewählt',
      step: 5,
      done: Boolean(inserat.paid_at),
    },
  ];
  const sektionenDone = sektionen.filter((s) => s.done).length;

  const isLive = inserat.status === 'live';
  const isEntwurf = inserat.status === 'entwurf';
  const isPaused = inserat.status === 'pausiert';
  const showSubmit = isEntwurf && inserat.titel && inserat.cover_url;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        {/* ─── HEADER ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="overline text-bronze-ink mb-2">Mein Inserat</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight truncate">
              {inserat.titel || inserat.firma_name || 'Entwurf'}
            </h1>
            <p className="text-caption text-quiet font-mono mt-1">
              ID {inserat.id.slice(0, 8)} · zuletzt geändert {formatRelative(inserat.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={inserat.status} />
            <Link
              href={`/dashboard/verkaeufer/preview/${inserat.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone hover:border-navy/40 text-navy rounded-soft text-body-sm font-medium transition-all"
            >
              <Eye className="w-4 h-4" strokeWidth={1.5} />
              Vorschau
            </Link>
            <Link
              href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-subtle transition-all"
            >
              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
              Bearbeiten
            </Link>
          </div>
        </div>

        {/* ─── STATUS-BANNER ───────────────────────────────────── */}
        <div className="mb-6">
          <InseratStatusBanner
            inseratId={inserat.id}
            status={inserat.status}
            rejectionReason={inserat.rejection_reason ?? inserat.status_reason ?? null}
          />
        </div>

        {/* ─── KONVERSATION mit Admin (nur bei Rückfrage etc.) ── */}
        {(['rueckfrage', 'pending', 'zur_pruefung', 'abgelehnt'] as const).includes(
          inserat.status as 'rueckfrage' | 'pending' | 'zur_pruefung' | 'abgelehnt',
        ) && (
          <section className="mb-6 bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Konversation mit dem passare-Team
            </h3>
            <InseratAuditThread
              inseratId={inserat.id}
              emptyHint="Noch keine Nachricht. Sobald das Team eine Rückfrage stellt, erscheint sie hier."
            />
          </section>
        )}

        {/* ─── KPI-STRIP ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard icon={Eye} label="Aufrufe" value={aufrufe.toLocaleString('de-CH')} />
          <KpiCard
            icon={MessageSquare}
            label="Anfragen"
            value={anfragenTotal.toString()}
            href={anfragenTotal > 0 ? '/dashboard/verkaeufer/anfragen' : undefined}
          />
          <KpiCard icon={Heart} label="Favoriten" value={favoritenTotal.toString()} />
          <KpiCard
            icon={Users}
            label="Tage live"
            value={liveSeit !== null ? liveSeit.toString() : '—'}
          />
        </div>

        {/* ─── 2-SPALTEN: Vorschau LINKS · Sektionen RECHTS ────── */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-8">
          {/* Vorschau-Karte (so wie Käufer es sieht, kompakt) */}
          <div className="rounded-card bg-paper border border-stone overflow-hidden">
            {inserat.cover_url ? (
              <div className="aspect-[16/9] bg-stone overflow-hidden relative">
                {inserat.cover_url.startsWith('http') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inserat.cover_url} alt={inserat.titel ?? ''} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] bg-stone/60 flex items-center justify-center text-quiet">
                <ImageIcon className="w-10 h-10" strokeWidth={1.5} />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="overline text-bronze-ink">Wie Käufer es sehen</p>
                <Link
                  href={`/dashboard/verkaeufer/preview/${inserat.id}`}
                  target="_blank"
                  className="text-caption text-navy hover:text-bronze inline-flex items-center gap-1"
                >
                  Volle Detail-Seite <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </Link>
              </div>
              <h2 className="font-serif text-head-md text-navy font-light leading-tight mb-2">
                {inserat.titel || 'Noch kein Titel'}
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-4 text-caption">
                <Detail label="Branche" value={inserat.branchen?.label_de ?? '—'} />
                <Detail label="Kanton" value={inserat.kanton ?? '—'} />
                <Detail label="MA" value={inserat.mitarbeitende?.toString() ?? '—'} />
                <Detail label="Gegründet" value={inserat.gruendungsjahr?.toString() ?? '—'} />
                {inserat.umsatz_chf && <Detail label="Umsatz" value={formatCHFShort(Number(inserat.umsatz_chf))} mono />}
                {inserat.ebitda_marge_pct && <Detail label="EBITDA-Marge" value={`${inserat.ebitda_marge_pct}%`} mono />}
              </div>
              {inserat.beschreibung && (
                <p className="text-body-sm text-muted leading-relaxed mb-4 line-clamp-3">{inserat.beschreibung}</p>
              )}
              {Array.isArray(inserat.sales_points) && inserat.sales_points.length > 0 && (
                <ul className="space-y-1.5">
                  {(inserat.sales_points as string[]).slice(0, 5).map((p, i) => (
                    <li key={i} className="text-body-sm text-ink flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-bronze flex-shrink-0 mt-1" strokeWidth={1.5} />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sektionen-Liste mit Edit-Links pro Bereich */}
          <aside className="bg-paper border border-stone rounded-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="overline text-bronze-ink">Sektionen</p>
              <span className="font-mono text-caption text-quiet">
                {sektionenDone} / {sektionen.length} fertig
              </span>
            </div>
            <ul className="space-y-1.5">
              {sektionen.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit?step=${s.step}`}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-soft hover:bg-stone/40 transition-colors"
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.done ? 'bg-success/15 text-success' : 'bg-stone text-quiet'
                      }`}>
                        {s.done ? <CheckCircle className="w-4 h-4" strokeWidth={2} /> : <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <p className="text-body-sm text-navy font-medium truncate">{s.label}</p>
                        <p className="text-caption text-quiet truncate">{s.sub}</p>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-quiet group-hover:text-bronze transition-colors flex-shrink-0" strokeWidth={1.5} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {/* ─── ENTWURF: Submit-CTA ─────────────────────────────── */}
        {showSubmit && (
          <div className="rounded-card bg-bronze/5 border border-bronze/30 p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-navy mb-1">Bereit für die Prüfung?</p>
              <p className="text-body-sm text-muted">
                Das passare-Team prüft dein Inserat innerhalb von 24 Stunden und stellt es online.
              </p>
            </div>
            <form action={async () => { 'use server'; await submitForReview(inserat.id); }}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-all flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                Zur Prüfung einreichen
              </button>
            </form>
          </div>
        )}

        {/* ─── FOOTER-AKTIONEN ─────────────────────────────────── */}
        <div className="border-t border-stone pt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {isLive && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone rounded-soft text-body-sm text-muted cursor-not-allowed opacity-60"
                title="Pausieren — kommt in der nächsten Etappe"
              >
                <Pause className="w-4 h-4" strokeWidth={1.5} />
                Pausieren
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone rounded-soft text-body-sm text-muted cursor-not-allowed opacity-60"
                title="Wieder live setzen — kommt in der nächsten Etappe"
              >
                <Play className="w-4 h-4" strokeWidth={1.5} />
                Wieder live
              </button>
            )}
            <Link
              href="/dashboard/verkaeufer/statistik"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone hover:border-navy/40 rounded-soft text-body-sm text-navy transition-all"
            >
              <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
              Detail-Statistik
            </Link>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 text-caption text-quiet hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Inserat löschen — kommt in der nächsten Etappe"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Inserat löschen
          </button>
        </div>
      </div>
    </div>
  );
}

function NoTableYet() {
  return (
    <div className="px-6 md:px-10 py-16 text-center">
      <FileText className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Datenbank noch nicht bereit</h2>
      <p className="text-body text-muted">Migration läuft. Bitte in Kürze erneut versuchen.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    entwurf: { label: 'Entwurf', cls: 'bg-stone text-quiet' },
    zur_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    rueckfrage: { label: 'Rückfrage', cls: 'bg-warn/15 text-warn' },
    pending: { label: 'Wartet', cls: 'bg-warn/15 text-warn' },
    live: { label: 'Live', cls: 'bg-success/15 text-success' },
    pausiert: { label: 'Pausiert', cls: 'bg-stone text-muted' },
    verkauft: { label: 'Verkauft', cls: 'bg-bronze-soft text-bronze-ink' },
    abgelaufen: { label: 'Abgelaufen', cls: 'bg-stone text-quiet' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-danger/15 text-danger' },
  };
  const m = map[status] ?? map.entwurf;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-pill text-caption font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function KpiCard({
  icon: Icon, label, value, href,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-paper border border-stone rounded-soft p-4 transition-all hover:border-bronze/40 h-full">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
        <p className="text-caption text-quiet uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-serif text-[1.6rem] text-navy font-light leading-none font-tabular">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="inline-flex items-baseline gap-1.5">
      <span className="text-quiet">{label}:</span>
      <span className={mono ? 'text-navy font-mono' : 'text-navy'}>{value}</span>
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`;
  return d.toLocaleDateString('de-CH');
}
