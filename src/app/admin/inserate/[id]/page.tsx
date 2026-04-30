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
  Phone,
  Eye,
  ExternalLink,
  EyeOff,
  Globe,
  MessageSquare,
  CheckCircle2,
  Star,
  Clock,
  FileText,
  Languages,
  Tag,
} from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { InseratAuditPanel } from '@/components/admin/InseratAuditPanel';
import { InseratAuditThread } from '@/components/admin/InseratAuditThread';
import { QuickApproveButton } from '@/components/admin/QuickApproveButton';
import { InseratZefixWarning } from '@/components/admin/InseratZefixWarning';
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

const ANONYMITAET_LABEL: Record<string, string> = {
  voll_anonym: 'Voll anonym',
  vorname_funktion: 'Vorname + Funktion',
  voll_offen: 'Voll offen',
};

const KATEGORIE_LABEL: Record<string, string> = {
  m_a: 'M&A',
  kapital: 'Kapital',
  teilnahme: 'Teilnahme',
  franchise: 'Franchise',
  handelsvertretung: 'Handelsvertretung',
  shareit: 'ShareIt',
};

const ART_LABEL: Record<string, string> = {
  angebot: 'Angebot',
  gesuch: 'Gesuch',
};

const IMMO_LABEL: Record<string, string> = {
  keine: 'Keine',
  eigentum: 'Eigentum',
  miete: 'Miete',
  auf_anfrage: 'Auf Anfrage',
};

const FIN_LABEL: Record<string, string> = {
  selbst: 'Selbstfinanzierung',
  abzahlung: 'Abzahlung möglich',
  verhandlungsfaehig: 'Verhandelbar',
};

const GRUND_LABEL: Record<string, string> = {
  pensionierung: 'Pensionierung',
  altersnachfolge: 'Altersnachfolge',
  generationenwechsel: 'Generationenwechsel',
  strategischer_exit: 'Strategischer Exit',
  gesundheit: 'Gesundheit',
  andere: 'Andere',
};

type FullInserat = AdminInserat & {
  // Inhalte
  teaser: string | null;
  beschreibung: string | null;
  sales_points: string[] | null;
  cover_url: string | null;
  cover_source: string | null;
  // Firma
  firma_name: string | null;
  firma_rechtsform: string | null;
  firma_sitz_gemeinde: string | null;
  zefix_uid: string | null;
  rechtsform_typ: string | null;
  // Zahlen erweitert
  ebitda_chf: number | null;
  kaufpreis_chf: number | null;
  kaufpreis_min_chf: number | null;
  kaufpreis_max_chf: number | null;
  kaufpreis_vhb: boolean | null;
  umsatz_min_chf: number | null;
  umsatz_max_chf: number | null;
  eigenkapital_chf: number | null;
  // Wert-Schätzung
  estimated_value_low: number | null;
  estimated_value_mid: number | null;
  estimated_value_high: number | null;
  // Konfiguration
  art: string | null;
  kategorie: string | null;
  immobilien: string | null;
  finanzierung: string | null;
  wir_anteil_moeglich: boolean | null;
  uebergabe_zeitpunkt: string | null;
  // Anonymität & Kommunikation
  anonymitaet_level: string | null;
  whatsapp_enabled: boolean | null;
  live_chat_enabled: boolean | null;
  chat_zeiten: string | null;
  // Web
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  // Stats
  views: number | null;
  // Lifecycle
  paused_at: string | null;
  // Notizen
  admin_notes: string | null;
  rejection_reason: string | null;
  status_reason: string | null;
};

export default async function AdminInseratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  // Alles parallel laden — vorher 4 sequentielle Round-Trips
  const [
    { data: inseratData },
    { data: anfrData },
  ] = await Promise.all([
    supabase.from('inserate').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('anfragen')
      .select('id, public_id, status, nachricht, created_at')
      .eq('inserat_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (!inseratData) notFound();
  const listing = inseratData as FullInserat;
  const anfragen = (anfrData ?? []) as AdminAnfrage[];

  // Verkäufer-Profil + andere Inserate dieses Verkäufers + Anfragen-Total parallel
  type VerkaeuferProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    kanton: string | null;
    sprache: string | null;
    verified_phone: boolean;
    verified_kyc: boolean;
    qualitaets_score: number | null;
    avg_response_time_hours: number | null;
    tags: string[] | null;
    admin_notes: string | null;
    created_at: string | null;
  };
  type InseratPeer = {
    id: string;
    public_id: string | null;
    titel: string | null;
    status: string;
    paket: string | null;
    created_at: string;
  };

  let verkaeufer: VerkaeuferProfile | null = null;
  let andereInserate: InseratPeer[] = [];
  let anfragenTotalVerkaeufer = 0;

  // DB-Spalte heisst `owner_id` (siehe verkaeufer-Migration); der TypeScript-
  // Type referenziert `verkaeufer_id`. Wir akzeptieren beides als Quelle —
  // der echte Wert liegt unter owner_id.
  const listingRaw = listing as unknown as Record<string, unknown>;
  const verkaeuferUserId =
    (listingRaw.owner_id as string | null | undefined) ??
    listing.verkaeufer_id ??
    null;

  if (verkaeuferUserId) {
    const [{ data: profile }, { data: peerInserate }] = await Promise.all([
      admin
        .from('profiles')
        .select(
          'id, full_name, email, phone, kanton, sprache, verified_phone, verified_kyc, qualitaets_score, avg_response_time_hours, tags, admin_notes, created_at',
        )
        .eq('id', verkaeuferUserId)
        .maybeSingle(),
      admin
        .from('inserate')
        .select('id, public_id, titel, status, paket, created_at')
        .eq('owner_id', verkaeuferUserId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (profile) {
      const tagsRaw = (profile as Record<string, unknown>).tags;
      verkaeufer = {
        id: profile.id as string,
        full_name: (profile.full_name as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
        phone: (profile.phone as string | null) ?? null,
        kanton: (profile.kanton as string | null) ?? null,
        sprache: (profile.sprache as string | null) ?? null,
        verified_phone: Boolean(profile.verified_phone),
        verified_kyc: Boolean(profile.verified_kyc),
        qualitaets_score: (profile.qualitaets_score as number | null) ?? null,
        avg_response_time_hours: (profile.avg_response_time_hours as number | null) ?? null,
        tags: Array.isArray(tagsRaw) ? (tagsRaw as string[]) : null,
        admin_notes: (profile.admin_notes as string | null) ?? null,
        created_at: (profile.created_at as string | null) ?? null,
      };
    }

    andereInserate = (peerInserate ?? []) as InseratPeer[];

    // Anfragen-Total über alle Inserate des Verkäufers
    if (andereInserate.length > 0) {
      const ids = andereInserate.map((i) => i.id);
      const { count } = await admin
        .from('anfragen')
        .select('id', { count: 'exact', head: true })
        .in('inserat_id', ids);
      anfragenTotalVerkaeufer = count ?? 0;
    }
  }

  // Position dieses Inserats unter allen Inseraten des Verkäufers (1-basiert).
  // Liste ist nach created_at DESC sortiert — Position = neuestes ist 1.
  const inseratPosition =
    andereInserate.length > 0 ? andereInserate.findIndex((i) => i.id === listing.id) + 1 || 1 : 1;
  const inseratTotalVerkaeufer = andereInserate.length || 1;

  const isPruefbar = ['pending', 'zur_pruefung', 'rueckfrage'].includes(listing.status);
  const ebitdaPct =
    listing.ebitda_pct ??
    (listing.ebitda_chf && listing.umsatz_chf && Number(listing.umsatz_chf) > 0
      ? (Number(listing.ebitda_chf) / Number(listing.umsatz_chf)) * 100
      : null);

  // Kaufpreis-Display: Range > Single > VHB > Label
  const kaufpreis =
    listing.kaufpreis_min_chf && listing.kaufpreis_max_chf
      ? `${formatCHF(Number(listing.kaufpreis_min_chf))} – ${formatCHF(Number(listing.kaufpreis_max_chf))}`
      : listing.kaufpreis_chf
        ? formatCHF(Number(listing.kaufpreis_chf))
        : listing.kaufpreis_vhb
          ? 'VHB'
          : listing.kaufpreis_label ?? '—';

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin/inserate"
        className="inline-flex items-center gap-1.5 text-[13px] text-quiet hover:text-navy transition-colors mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur Inserate-Liste
      </Link>

      <header className="bg-paper border border-stone rounded-soft p-4 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            <span
              className={cn(
                'inline-flex px-2 py-0.5 rounded-soft text-[11px] font-medium',
                PAKET_VARIANTS[listing.paket],
              )}
            >
              {PAKET_LABELS[listing.paket]}
            </span>
            <code className="font-mono text-[11px] text-quiet">
              {listing.public_id ?? listing.id.slice(0, 8)}
            </code>
            {listing.anonymitaet_level && (
              <span className="inline-flex items-center gap-1 text-[11px] text-quiet font-mono">
                <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                {ANONYMITAET_LABEL[listing.anonymitaet_level] ?? listing.anonymitaet_level}
              </span>
            )}
            {listing.views != null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-quiet font-mono">
                <Eye className="w-3 h-3" strokeWidth={1.5} />
                {listing.views} Views
              </span>
            )}
          </div>
          {listing.status === 'live' && (
            <a
              href={`/inserat/${listing.public_id ?? listing.id}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-soft border border-stone bg-paper text-navy text-[12px] hover:border-navy/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              Public-Ansicht
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </a>
          )}
        </div>

        <h1 className="text-lg text-navy font-semibold leading-tight mb-1">
          {listing.titel ?? <em className="text-quiet">Ohne Titel</em>}
        </h1>
        <p className="text-[13px] text-muted">
          {[
            listing.branche,
            listing.kanton,
            listing.gruendungsjahr ? `gegründet ${listing.gruendungsjahr}` : null,
            listing.firma_name,
          ]
            .filter(Boolean)
            .join(' · ') || 'Keine Eckdaten erfasst.'}
        </p>
      </header>

      {/* Zefix-Sicherheits-Check — Warnung bei Abweichungen zum Handelsregister */}
      <InseratZefixWarning
        zefix_uid={listing.zefix_uid}
        firma_name={listing.firma_name}
        firma_rechtsform={listing.firma_rechtsform ?? listing.rechtsform_typ}
        firma_sitz_gemeinde={listing.firma_sitz_gemeinde}
        kanton={listing.kanton}
        gruendungsjahr={listing.gruendungsjahr}
      />

      {/* Quick-Approve Hero — nur bei prüfbaren Status */}
      {isPruefbar && (
        <QuickApproveButton
          inseratId={listing.id}
          status={listing.status}
        />
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Cover */}
          {listing.cover_url && (
            <section className="bg-paper border border-stone rounded-soft overflow-hidden">
              <div className="aspect-[16/7] bg-stone overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.cover_url}
                  alt={listing.titel ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
              {listing.cover_source && (
                <p className="px-3 py-1.5 text-[11px] text-quiet font-mono border-t border-stone">
                  Cover-Quelle: {listing.cover_source}
                </p>
              )}
            </section>
          )}

          {/* Teaser & Beschreibung */}
          {(listing.teaser || listing.beschreibung) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Inhalt
              </h3>
              {listing.teaser && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-1">
                    Teaser
                  </p>
                  <p className="text-[13px] text-ink leading-snug whitespace-pre-wrap">
                    {listing.teaser}
                  </p>
                </div>
              )}
              {listing.beschreibung && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-1">
                    Beschreibung
                  </p>
                  <p className="text-[13px] text-ink leading-snug whitespace-pre-wrap">
                    {listing.beschreibung}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Sales Points */}
          {listing.sales_points && listing.sales_points.length > 0 && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Schlüsselargumente ({listing.sales_points.length})
              </h3>
              <ul className="space-y-1.5">
                {listing.sales_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Eckdaten */}
          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Eckdaten
            </h3>
            <dl className="grid sm:grid-cols-2 gap-3">
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
                value={
                  listing.umsatz_min_chf && listing.umsatz_max_chf
                    ? `${formatCHF(Number(listing.umsatz_min_chf))} – ${formatCHF(Number(listing.umsatz_max_chf))}`
                    : formatCHF(listing.umsatz_chf ? Number(listing.umsatz_chf) : null)
                }
                mono
              />
              <Detail
                icon={TrendingUp}
                label="EBITDA"
                value={
                  listing.ebitda_chf
                    ? `${formatCHF(Number(listing.ebitda_chf))} (${ebitdaPct ? ebitdaPct.toFixed(1) : '—'} %)`
                    : ebitdaPct != null
                      ? `${ebitdaPct.toFixed(1)} %`
                      : '—'
                }
                mono
              />
              <Detail icon={Wallet} label="Kaufpreis" value={kaufpreis} mono />
              <Detail
                icon={Wallet}
                label="Eigenkapital"
                value={listing.eigenkapital_chf ? formatCHF(Number(listing.eigenkapital_chf)) : '—'}
                mono
              />
              <Detail
                icon={Building2}
                label="Übergabegrund"
                value={
                  listing.grund
                    ? GRUND_LABEL[listing.grund] ?? listing.grund
                    : '—'
                }
              />
              {listing.uebergabe_zeitpunkt && (
                <Detail
                  icon={CalendarClock}
                  label="Übergabe-Zeitpunkt"
                  value={listing.uebergabe_zeitpunkt}
                />
              )}
            </dl>
          </section>

          {/* Konfiguration */}
          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Konfiguration
            </h3>
            <dl className="grid sm:grid-cols-2 gap-3">
              <Detail label="Art" value={listing.art ? ART_LABEL[listing.art] ?? listing.art : '—'} />
              <Detail label="Kategorie" value={listing.kategorie ? KATEGORIE_LABEL[listing.kategorie] ?? listing.kategorie : '—'} />
              <Detail label="Immobilien" value={listing.immobilien ? IMMO_LABEL[listing.immobilien] ?? listing.immobilien : '—'} />
              <Detail label="Finanzierung" value={listing.finanzierung ? FIN_LABEL[listing.finanzierung] ?? listing.finanzierung : '—'} />
              <Detail
                label="Anteilsverkauf möglich"
                value={listing.wir_anteil_moeglich ? 'Ja' : 'Nein'}
              />
              <Detail
                label="Anonymität"
                value={listing.anonymitaet_level ? ANONYMITAET_LABEL[listing.anonymitaet_level] ?? listing.anonymitaet_level : '—'}
              />
            </dl>
          </section>

          {/* Firma-Stammdaten */}
          {(listing.firma_name || listing.firma_rechtsform || listing.zefix_uid || listing.firma_sitz_gemeinde) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Firma (Handelsregister)
              </h3>
              <dl className="grid sm:grid-cols-2 gap-3">
                <Detail label="Firmenname" value={listing.firma_name ?? '—'} />
                <Detail label="Rechtsform" value={listing.firma_rechtsform ?? listing.rechtsform_typ ?? '—'} />
                <Detail label="Sitz-Gemeinde" value={listing.firma_sitz_gemeinde ?? '—'} />
                <Detail label="Zefix-UID" value={listing.zefix_uid ?? '—'} mono />
              </dl>
            </section>
          )}

          {/* Web & Social */}
          {(listing.website_url || listing.linkedin_url || listing.twitter_url || listing.facebook_url) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Web & Social
              </h3>
              <ul className="space-y-1.5">
                {listing.website_url && <UrlRow icon={Globe} label="Website" url={listing.website_url} />}
                {listing.linkedin_url && <UrlRow icon={Globe} label="LinkedIn" url={listing.linkedin_url} />}
                {listing.twitter_url && <UrlRow icon={Globe} label="X / Twitter" url={listing.twitter_url} />}
                {listing.facebook_url && <UrlRow icon={Globe} label="Facebook" url={listing.facebook_url} />}
              </ul>
            </section>
          )}

          {/* Kommunikation */}
          {(listing.whatsapp_enabled || listing.live_chat_enabled) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Kommunikation
              </h3>
              <ul className="space-y-1 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-quiet">WhatsApp</span>
                  <span className="font-mono">{listing.whatsapp_enabled ? '✓ aktiv' : '—'}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-quiet">Live-Chat</span>
                  <span className="font-mono">{listing.live_chat_enabled ? '✓ aktiv' : '—'}</span>
                </li>
                {listing.chat_zeiten && (
                  <li className="flex items-center justify-between">
                    <span className="text-quiet">Chat-Zeiten</span>
                    <span className="font-mono text-ink">{listing.chat_zeiten}</span>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Wert-Schätzung */}
          {(listing.estimated_value_low || listing.estimated_value_mid || listing.estimated_value_high) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Wert-Schätzung (intern)
              </h3>
              <div className="grid grid-cols-3 gap-3 text-[13px]">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5">Low</p>
                  <p className="font-mono text-ink">{formatCHF(listing.estimated_value_low ? Number(listing.estimated_value_low) : null)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5">Mid</p>
                  <p className="font-mono text-navy font-semibold">{formatCHF(listing.estimated_value_mid ? Number(listing.estimated_value_mid) : null)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5">High</p>
                  <p className="font-mono text-ink">{formatCHF(listing.estimated_value_high ? Number(listing.estimated_value_high) : null)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Anfragen */}
          <section className="bg-paper border border-stone rounded-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet">
                Anfragen ({anfragen.length})
              </h3>
              {anfragen.length > 0 && (
                <Link
                  href={`/admin/anfragen?inserat=${listing.id}`}
                  className="text-[11px] text-quiet hover:text-navy transition-colors"
                >
                  Alle anzeigen →
                </Link>
              )}
            </div>
            {anfragen.length === 0 ? (
              <p className="text-[12px] text-quiet italic">Noch keine Anfragen.</p>
            ) : (
              <ul className="divide-y divide-stone/60 -mx-2">
                {anfragen.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/anfragen/${a.id}`}
                      className="flex items-start gap-3 px-2 py-2 hover:bg-cream/60 transition-colors rounded-soft"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-quiet mt-1 flex-shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-[13px] text-ink">{a.public_id ?? a.id.slice(0, 8)}</p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-px rounded-soft text-[10px] font-medium border',
                              anfrageStatusStyles[a.status],
                            )}
                          >
                            {ANFRAGE_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        {a.nachricht && (
                          <p className="text-[12px] text-muted line-clamp-2">{a.nachricht}</p>
                        )}
                      </div>
                      <p className="text-[11px] text-quiet font-mono whitespace-nowrap">
                        {formatDate(a.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Audit-Konversation */}
          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Audit-Konversation
            </h3>
            <InseratAuditThread
              inseratId={listing.id}
              emptyHint="Noch keine Konversation. Stelle eine Rückfrage oder gib das Inserat frei."
            />
          </section>
        </div>

        <aside className="space-y-4">
          <InseratAuditPanel id={listing.id} currentStatus={listing.status} />

          {/* ═══════════════════════════════════════════════════════════════
              VERKÄUFER — alle Profil-Infos ausgeklappt zum direkten Abgleich.
              Cyrill: «rechts alle Infos vom Verkäufer schön ausgeklappt».
              ═══════════════════════════════════════════════════════════════ */}
          <section className="bg-paper border border-stone rounded-soft overflow-hidden">
            <header className="px-4 py-2.5 border-b border-stone bg-stone/20 flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet">
                Verkäufer
              </h3>
              {verkaeufer && (
                <Link
                  href={`/admin/users/${verkaeufer.id}`}
                  className="text-[11px] text-bronze-ink hover:underline inline-flex items-center gap-1"
                >
                  Volles Profil
                  <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
                </Link>
              )}
            </header>

            {!verkaeufer ? (
              <div className="p-4">
                <p className="text-[12px] text-quiet italic">Kein Verkäufer-Profil verknüpft.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Identität */}
                <div>
                  <p className="text-[14px] text-navy font-semibold leading-snug">
                    {verkaeufer.full_name ?? <em className="text-quiet font-normal">— ohne Namen</em>}
                  </p>
                  {verkaeufer.created_at && (
                    <p className="text-[11px] text-quiet font-mono mt-0.5">
                      Mitglied seit {formatDate(verkaeufer.created_at)}
                    </p>
                  )}
                </div>

                {/* Verifikations-Badges */}
                <div className="flex flex-wrap gap-1">
                  <VerifyBadge ok={verkaeufer.verified_phone} label="Telefon" />
                  <VerifyBadge ok={verkaeufer.verified_kyc} label="KYC" />
                </div>

                {/* Kontakt — alle Felder direkt sichtbar */}
                <dl className="space-y-1.5 text-[12px] border-t border-stone/60 pt-3">
                  {verkaeufer.email && (
                    <SidebarRow icon={Mail} label="E-Mail">
                      <a
                        href={`mailto:${verkaeufer.email}`}
                        className="font-mono text-ink hover:text-bronze-ink truncate"
                      >
                        {verkaeufer.email}
                      </a>
                    </SidebarRow>
                  )}
                  {verkaeufer.phone && (
                    <SidebarRow icon={Phone} label="Telefon">
                      <a
                        href={`tel:${verkaeufer.phone}`}
                        className="font-mono text-ink hover:text-bronze-ink"
                      >
                        {verkaeufer.phone}
                      </a>
                    </SidebarRow>
                  )}
                  {verkaeufer.kanton && (
                    <SidebarRow icon={MapPin} label="Kanton">
                      <span className="font-mono text-ink">{verkaeufer.kanton}</span>
                    </SidebarRow>
                  )}
                  {verkaeufer.sprache && (
                    <SidebarRow icon={Languages} label="Sprache">
                      <span className="font-mono text-ink uppercase">{verkaeufer.sprache}</span>
                    </SidebarRow>
                  )}
                </dl>

                {/* Performance */}
                {(verkaeufer.qualitaets_score != null ||
                  verkaeufer.avg_response_time_hours != null) && (
                  <dl className="space-y-1.5 text-[12px] border-t border-stone/60 pt-3">
                    {verkaeufer.qualitaets_score != null && (
                      <SidebarRow icon={Star} label="Quality-Score">
                        <span className="font-mono text-ink">{verkaeufer.qualitaets_score} / 100</span>
                      </SidebarRow>
                    )}
                    {verkaeufer.avg_response_time_hours != null && (
                      <SidebarRow icon={Clock} label="Ø Antwortzeit">
                        <span className="font-mono text-ink">
                          {verkaeufer.avg_response_time_hours.toFixed(1)} h
                        </span>
                      </SidebarRow>
                    )}
                  </dl>
                )}

                {/* Aktivität: dieses Inserat innerhalb des Verkäufer-Pools + Anfragen */}
                <dl className="space-y-1.5 text-[12px] border-t border-stone/60 pt-3">
                  <SidebarRow icon={FileText} label="Inserate">
                    <span className="font-mono text-ink">
                      {/* Smart-Counter: bei genau 1 nicht «1 von 1» — das ist redundant */}
                      {inseratTotalVerkaeufer === 1
                        ? 'Einziges Inserat'
                        : `${inseratPosition} von ${inseratTotalVerkaeufer}`}
                    </span>
                  </SidebarRow>
                  <SidebarRow icon={MessageSquare} label="Anfragen total">
                    <span className="font-mono text-ink">{anfragenTotalVerkaeufer}</span>
                  </SidebarRow>
                </dl>

                {/* Andere Inserate dieses Verkäufers — kompakte Liste, max 5 */}
                {andereInserate.length > 1 && (
                  <div className="border-t border-stone/60 pt-3">
                    <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-2">
                      Andere Inserate ({andereInserate.length - 1})
                    </p>
                    <ul className="space-y-1">
                      {andereInserate
                        .filter((i) => i.id !== listing.id)
                        .slice(0, 5)
                        .map((i) => (
                          <li key={i.id}>
                            <Link
                              href={`/admin/inserate/${i.id}`}
                              className="flex items-center gap-2 px-2 py-1 -mx-2 rounded-soft hover:bg-cream/60 transition-colors"
                              title={i.titel ?? 'Ohne Titel'}
                            >
                              <span className="flex-shrink-0">
                                <StatusBadge status={i.status as Parameters<typeof StatusBadge>[0]['status']} />
                              </span>
                              <span className="text-[12px] text-ink truncate flex-1 min-w-0">
                                {i.titel || (
                                  <em className="text-quiet">Ohne Titel</em>
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                    </ul>
                    {andereInserate.length - 1 > 5 && (
                      <p className="text-[11px] text-quiet mt-1.5 italic">
                        + {andereInserate.length - 1 - 5} weitere
                      </p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {verkaeufer.tags && verkaeufer.tags.length > 0 && (
                  <div className="border-t border-stone/60 pt-3">
                    <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3" strokeWidth={1.5} />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {verkaeufer.tags.map((tag, i) => (
                        <span
                          key={`${tag}-${i}`}
                          className="inline-flex px-1.5 py-0.5 rounded-soft text-[10px] font-mono bg-stone/40 text-ink"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin-Notizen über den Verkäufer (separat von Inserat-Admin-Notes) */}
                {verkaeufer.admin_notes && (
                  <div className="border-t border-stone/60 pt-3">
                    <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-1">
                      Admin-Notiz (zum Verkäufer)
                    </p>
                    <p className="text-[12px] text-ink whitespace-pre-wrap leading-snug">
                      {verkaeufer.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Laufzeit & Paket
            </h3>
            <ul className="space-y-1.5 text-[12px]">
              <DetailRow label="Erstellt" value={formatDate(listing.created_at)} />
              {listing.published_at && (
                <DetailRow label="Veröffentlicht" value={formatDate(listing.published_at)} />
              )}
              {listing.paused_at && (
                <DetailRow label="Pausiert seit" value={formatDate(listing.paused_at)} />
              )}
              {listing.expires_at && (
                <DetailRow label="Läuft ab" value={formatDate(listing.expires_at)} />
              )}
              <DetailRow label="Paket" value={PAKET_LABELS[listing.paket]} />
            </ul>
          </section>

          {(listing.rejection_reason || listing.status_reason || listing.admin_notes) && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
                Notizen & Begründungen
              </h3>
              {listing.rejection_reason && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wide font-medium text-danger mb-0.5">
                    Ablehnungs-Grund
                  </p>
                  <p className="text-[12px] text-ink whitespace-pre-wrap">{listing.rejection_reason}</p>
                </div>
              )}
              {listing.status_reason && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5">
                    Status-Notiz
                  </p>
                  <p className="text-[12px] text-ink whitespace-pre-wrap">{listing.status_reason}</p>
                </div>
              )}
              {listing.admin_notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5">
                    Admin-Notiz
                  </p>
                  <p className="text-[12px] text-ink whitespace-pre-wrap">{listing.admin_notes}</p>
                </div>
              )}
            </section>
          )}
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
      <dt className="text-[10px] uppercase tracking-wide font-medium text-quiet mb-0.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" strokeWidth={1.5} />}
        {label}
      </dt>
      <dd className={cn('text-[13px]', mono ? 'font-mono text-ink' : 'text-ink')}>{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-quiet">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </li>
  );
}

function UrlRow({
  icon: Icon,
  label,
  url,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  url: string;
}) {
  return (
    <li className="flex items-center gap-2 text-[12px]">
      <Icon className="w-3 h-3 text-quiet flex-shrink-0" strokeWidth={1.5} />
      <span className="text-quiet w-20 flex-shrink-0">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener"
        className="font-mono text-ink hover:text-bronze-ink truncate inline-flex items-center gap-1"
      >
        {url.replace(/^https?:\/\//, '')}
        <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
      </a>
    </li>
  );
}

/* Sidebar-Detail-Zeile: Icon + Label links, Wert rechts. Eine Zeile pro Datum. */
function SidebarRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3 h-3 text-quiet mt-0.5 flex-shrink-0" strokeWidth={1.5} />
      <span className="text-quiet w-20 flex-shrink-0 text-[11px]">{label}</span>
      <span className="flex-1 min-w-0 inline-flex">{children}</span>
    </div>
  );
}

/* Verifikations-Pille — grün bei verified, sonst grau-outline. */
function VerifyBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-soft text-[10px] font-medium',
        ok ? 'bg-success/15 text-success border border-success/30' : 'bg-stone/30 text-quiet border border-stone',
      )}
      title={ok ? `${label} verifiziert` : `${label} noch nicht verifiziert`}
    >
      <span className="text-[10px]">{ok ? '✓' : '○'}</span>
      {label}
    </span>
  );
}
