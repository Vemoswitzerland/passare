import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  CalendarClock,
  Users,
  TrendingUp,
  Wallet,
  Mail,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { InseratActions } from '@/components/admin/InseratActions';
import {
  type AdminInserat,
  type AdminAnfrage,
  type AnfrageStatus,
  PAKET_LABELS,
  PAKET_VARIANTS,
  ANFRAGE_STATUS_LABELS,
  formatDate,
  formatCHF,
} from '@/lib/admin/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Inserat — passare',
  robots: { index: false, follow: false },
};

const anfrageStatusStyles: Record<AnfrageStatus, string> = {
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
  const supabase = await createClient();
  const { data } = await supabase.from('inserate').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const listing = data as AdminInserat;

  const { data: anfrData } = await supabase
    .from('anfragen')
    .select('*')
    .eq('inserat_id', id)
    .order('created_at', { ascending: false });
  const anfragen = (anfrData ?? []) as AdminAnfrage[];

  let verkaeufer: { id: string; full_name: string | null; email: string | null } | null = null;
  if (listing.verkaeufer_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', listing.verkaeufer_id)
      .maybeSingle();
    let email: string | null = null;
    try {
      const admin = createAdminClient();
      const { data: au } = await admin.auth.admin.getUserById(listing.verkaeufer_id);
      type AuthUserShape = { email?: string | null };
      email = ((au as { user?: AuthUserShape } | null)?.user?.email ?? null) || null;
    } catch {
      /* ignore */
    }
    if (profile) verkaeufer = { id: profile.id as string, full_name: (profile.full_name as string | null) ?? null, email };
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/inserate"
        className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Zurück zur Inserate-Liste
      </Link>

      <header className="bg-paper border border-stone rounded-soft p-4 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={listing.status} />
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-soft text-caption font-medium',
                PAKET_VARIANTS[listing.paket],
              )}
            >
              {PAKET_LABELS[listing.paket]}
            </span>
            <code className="font-mono text-caption text-quiet">
              {listing.public_id ?? listing.id.slice(0, 8)}
            </code>
          </div>
          {listing.status === 'live' && (
            <a
              href={`/?inserat=${listing.public_id ?? listing.id}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-soft border border-stone bg-paper text-navy text-caption hover:border-navy/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              Public-Ansicht
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </a>
          )}
        </div>

        <h1 className="text-base text-navy font-semibold leading-tight mb-1">{listing.titel}</h1>
        <p className="text-body-sm text-muted">
          {[listing.branche, listing.kanton, listing.gruendungsjahr ? `gegründet ${listing.gruendungsjahr}` : null]
            .filter(Boolean)
            .join(' · ') || 'Keine Eckdaten erfasst.'}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Eckdaten</h3>
            <dl className="grid sm:grid-cols-2 gap-4">
              <Detail icon={Building2} label="Branche" value={listing.branche ?? '—'} />
              <Detail icon={MapPin} label="Kanton" value={listing.kanton ?? '—'} mono />
              <Detail
                icon={Calendar}
                label="Gründungsjahr"
                value={listing.gruendungsjahr?.toString() ?? '—'}
                mono
              />
              <Detail
                icon={Users}
                label="Mitarbeitende"
                value={listing.mitarbeitende?.toString() ?? '—'}
                mono
              />
              <Detail
                icon={TrendingUp}
                label="Umsatz"
                value={formatCHF(listing.umsatz_chf)}
                mono
              />
              <Detail
                icon={TrendingUp}
                label="EBITDA-Marge"
                value={listing.ebitda_pct !== null ? `${listing.ebitda_pct} %` : '—'}
                mono
              />
              <Detail
                icon={Wallet}
                label="Kaufpreis"
                value={listing.kaufpreis_label ?? '—'}
                mono
              />
              <Detail icon={Building2} label="Übergabegrund" value={listing.grund ?? '—'} />
            </dl>
          </section>

          <section className="bg-paper border border-stone rounded-soft p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-caption uppercase tracking-wide font-medium text-quiet">Anfragen ({anfragen.length})</h3>
              {anfragen.length > 0 && (
                <Link
                  href={`/admin/anfragen?inserat=${listing.id}`}
                  className="text-caption text-quiet hover:text-navy transition-colors"
                >
                  Alle anzeigen →
                </Link>
              )}
            </div>
            {anfragen.length === 0 ? (
              <p className="text-caption text-quiet italic">Noch keine Anfragen.</p>
            ) : (
              <ul className="divide-y divide-stone/60 -mx-2">
                {anfragen.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/anfragen/${a.id}`}
                      className="flex items-start gap-3 px-2 py-3 hover:bg-cream/60 transition-colors rounded-soft"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-body-sm text-ink">{a.public_id ?? a.id.slice(0, 8)}</p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-soft text-caption font-medium border',
                              anfrageStatusStyles[a.status],
                            )}
                          >
                            {ANFRAGE_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        {a.nachricht && (
                          <p className="text-caption text-muted line-clamp-2">{a.nachricht}</p>
                        )}
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
          <InseratActions
            id={listing.id}
            currentStatus={listing.status}
            publicId={listing.public_id ?? null}
          />

          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="font-serif text-lg text-navy mb-3">Verkäufer</h3>
            {verkaeufer ? (
              <Link
                href={`/admin/users/${verkaeufer.id}`}
                className="block hover:bg-cream/60 -mx-2 px-2 py-2 rounded-soft transition-colors"
              >
                <p className="text-body-sm text-ink mb-1">{verkaeufer.full_name ?? '— ohne Namen'}</p>
                {verkaeufer.email && (
                  <p className="text-caption text-quiet font-mono break-all">
                    <Mail className="inline w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                    {verkaeufer.email}
                  </p>
                )}
                <p className="text-caption text-bronze-ink mt-2">User-Profil öffnen →</p>
              </Link>
            ) : (
              <p className="text-caption text-quiet italic">Kein Verkäufer-Profil verknüpft.</p>
            )}
          </section>

          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="font-serif text-lg text-navy mb-3">Laufzeit</h3>
            <ul className="space-y-2 text-caption">
              <DetailRow icon={Calendar} label="Erstellt" value={formatDate(listing.created_at)} />
              {listing.published_at && (
                <DetailRow icon={Calendar} label="Veröffentlicht" value={formatDate(listing.published_at)} />
              )}
              {listing.expires_at && (
                <DetailRow icon={CalendarClock} label="Läuft ab" value={formatDate(listing.expires_at)} />
              )}
              <DetailRow label="Paket" value={PAKET_LABELS[listing.paket]} />
            </ul>
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
