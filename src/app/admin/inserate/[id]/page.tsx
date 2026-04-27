import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Calendar,
  CalendarClock,
  Building2,
  MapPin,
  Users,
  TrendingUp,
  Wallet,
  Eye,
  Pencil,
  Pause,
  Play,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  ADMIN_DEMO_LISTINGS,
  ADMIN_DEMO_ANFRAGEN,
  ANFRAGE_STATUS_LABELS,
  PAKET_LABELS,
  type AdminAnfrageStatus,
} from '@/data/admin-demo';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Inserat-Detail — passare',
  robots: { index: false, follow: false },
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));

const PAKET_VARIANTS: Record<string, string> = {
  light: 'bg-stone/60 text-muted',
  pro: 'bg-bronze-soft text-bronze-ink',
  premium: 'bg-navy-soft text-navy',
};

const anfrageStatusStyles: Record<AdminAnfrageStatus, string> = {
  offen: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  in_bearbeitung: 'bg-navy-soft text-navy border-navy/20',
  akzeptiert: 'bg-success/10 text-success border-success/30',
  abgelehnt: 'bg-danger/10 text-danger border-danger/30',
};

export default async function AdminInseratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = ADMIN_DEMO_LISTINGS.find((l) => l.id === id);
  if (!listing) notFound();

  const anfragen = ADMIN_DEMO_ANFRAGEN.filter((a) => a.inserat_id === id);

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/inserate"
        className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Zurück zur Inserate-Liste
      </Link>

      <header className="bg-paper border border-stone rounded-card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={listing.admin_status} />
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-soft text-caption font-medium',
                PAKET_VARIANTS[listing.paket],
              )}
            >
              {PAKET_LABELS[listing.paket]}
            </span>
            <code className="font-mono text-caption text-quiet">{listing.id}</code>
          </div>
          <div className="flex gap-2">
            <a
              href={`/?inserat=${listing.id}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-soft border border-stone bg-paper text-navy text-caption hover:border-navy/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              Public-Ansicht
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </a>
            <ActionButton title="Bearbeiten" icon={Pencil} label="Bearbeiten" />
            {listing.admin_status === 'live' ? (
              <ActionButton title="Pausieren" icon={Pause} label="Pausieren" />
            ) : (
              <ActionButton title="Aktivieren" icon={Play} label="Aktivieren" />
            )}
          </div>
        </div>

        <h1 className="font-serif text-3xl text-navy leading-tight mb-2">{listing.titel}</h1>
        <p className="text-body text-muted">
          {listing.branche} · {listing.kanton} · gegründet {listing.jahr} ·{' '}
          <span className="text-quiet">Grund: {listing.grund}</span>
        </p>
      </header>

      <div className="bg-bronze/10 border border-bronze/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-navy">
          <strong>Demo-Daten</strong> — Aktionen sind aktuell deaktiviert. Echte
          Inserate-Verwaltung kommt in Etappe 47.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="bg-paper border border-stone rounded-card p-6">
            <h3 className="font-serif text-xl text-navy mb-4">Eckdaten</h3>
            <dl className="grid sm:grid-cols-2 gap-4">
              <Detail icon={Building2} label="Branche" value={listing.branche} />
              <Detail icon={MapPin} label="Kanton" value={listing.kanton} mono />
              <Detail icon={Calendar} label="Gründungsjahr" value={listing.jahr.toString()} mono />
              <Detail icon={Users} label="Mitarbeitende" value={listing.mitarbeitende.toString()} mono />
              <Detail icon={TrendingUp} label="Umsatz" value={listing.umsatz} mono />
              <Detail icon={TrendingUp} label="EBITDA" value={listing.ebitda} mono />
              <Detail icon={Wallet} label="Kaufpreis" value={listing.kaufpreis} mono />
              <Detail icon={Building2} label="Übergabegrund" value={listing.grund} />
            </dl>
          </section>

          <section className="bg-paper border border-stone rounded-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-navy">
                Anfragen ({anfragen.length})
              </h3>
              {anfragen.length > 0 && (
                <Link
                  href="/admin/anfragen"
                  className="text-caption text-quiet hover:text-navy transition-colors inline-flex items-center gap-1"
                >
                  Alle anzeigen <ArrowLeft className="w-3 h-3 rotate-180" strokeWidth={1.5} />
                </Link>
              )}
            </div>
            {anfragen.length === 0 ? (
              <p className="text-caption text-quiet italic">Noch keine Anfragen.</p>
            ) : (
              <ul className="divide-y divide-stone/60 -mx-2">
                {anfragen.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/anfragen/${a.id}`}
                      className="flex items-start gap-3 px-2 py-3 hover:bg-cream/60 transition-colors rounded-soft"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-body-sm text-ink truncate">{a.kaeufer_name}</p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-soft text-caption font-medium border',
                              anfrageStatusStyles[a.status],
                            )}
                          >
                            {ANFRAGE_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        <p className="text-caption text-quiet font-mono">{a.kaeufer_email}</p>
                        <p className="text-caption text-muted mt-1 line-clamp-2">{a.nachricht}</p>
                      </div>
                      <p className="text-caption text-quiet font-mono whitespace-nowrap">
                        {formatDate(a.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3">Verkäufer</h3>
            <p className="text-body-sm text-ink truncate">
              <Mail className="inline w-3.5 h-3.5 text-quiet mr-1.5" strokeWidth={1.5} />
              <code className="font-mono">{listing.verkaeufer_email}</code>
            </p>
            <p className="text-caption text-quiet italic mt-2">
              Verlinkung mit User-Profil folgt sobald Inserate-Tabelle in der DB existiert.
            </p>
          </section>

          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3">Laufzeit</h3>
            <ul className="space-y-2 text-caption">
              <DetailRow icon={Calendar} label="Erstellt" value={formatDate(listing.created_at)} />
              <DetailRow icon={CalendarClock} label="Läuft ab" value={formatDate(listing.expires_at)} />
              <DetailRow label="Paket" value={PAKET_LABELS[listing.paket]} />
              <DetailRow label="Anfragen" value={listing.pending_anfragen.toString()} />
            </ul>
          </section>

          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3">Verlängerung</h3>
            <p className="text-caption text-quiet leading-relaxed">
              Verkäufer kann sein Inserat eigenständig verlängern. Bei Ablauf
              werden automatische Reminder verschickt (Etappe 48).
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="overline text-quiet mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" strokeWidth={1.5} />}
        {label}
      </dt>
      <dd className={cn('text-body-sm', mono ? 'font-mono text-ink' : 'text-ink')}>{value}</dd>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-quiet flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {label}
      </span>
      <span className="font-mono text-ink">{value}</span>
    </li>
  );
}

function ActionButton({
  title,
  icon: Icon,
  label,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      title={`${title} (kommt in Etappe 47)`}
      disabled
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-soft border border-stone bg-paper text-quiet text-caption hover:text-navy hover:border-navy/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
      {label}
    </button>
  );
}
