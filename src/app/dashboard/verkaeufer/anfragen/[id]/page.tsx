import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Mail, MapPin, Briefcase, Wallet, CheckCircle2, Crown,
  ShieldCheck, Linkedin, Sparkles, FileText, Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { AnfrageProActions } from './AnfrageProActions';

export const metadata = { title: 'Anfrage — passare Verkäufer', robots: { index: false, follow: false } };

const INVESTOR_LABELS: Record<string, string> = {
  privatperson: 'Privatperson · MBI',
  family_office: 'Family Office',
  holding_strategisch: 'Strategischer Käufer',
  mbi_management: 'MBI-Manager',
  berater_broker: 'Berater / Broker',
};

const TIMING_LABELS: Record<string, string> = {
  sofort: 'Möchte sofort übernehmen',
  '3_6_monate': 'In 3-6 Monaten',
  '6_12_monate': 'In 6-12 Monaten',
  flexibel: 'Zeitlich flexibel',
};

const ERFAHRUNG_LABELS: Record<string, string> = {
  erste_uebernahme: 'Erste Übernahme',
  einige_deals: 'Schon einige Deals',
  serial_acquirer: 'Serial Acquirer',
};

type Props = { params: Promise<{ id: string }> };

export default async function AnfrageDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: u } = await supabase.auth.getUser();
  if (!u.user) notFound();

  // Anfrage laden mit Owner-Check
  // (DB-Schema: nachricht statt message, kein score/decline_reason mehr)
  const { data: anfrage } = await supabase
    .from('anfragen')
    .select(`
      id, kaeufer_id, nachricht, status, created_at, admin_notes,
      dossier_requested_at, dossier_request_message, datenraum_granted_at,
      inserate!inner(id, titel, verkaeufer_id, paket)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!anfrage) notFound();
  // Supabase typed das embedded `inserate!inner` als Array — wir nehmen das
  // erste Element (kann auch ein Objekt sein, deshalb defensive Casts).
  const inseratRaw = anfrage.inserate as unknown;
  const inserat = (Array.isArray(inseratRaw) ? inseratRaw[0] : inseratRaw) as
    { id: string; titel: string; verkaeufer_id: string; paket: string | null } | null;
  if (!inserat || inserat.verkaeufer_id !== u.user.id) notFound();

  const isPro = ['pro', 'premium'].includes(inserat.paket ?? '');

  // Käufer-Profile + Kaeufer-Profil parallel laden
  const [profileRes, kaeuferProfilRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, kanton, sprache, verified_phone, verified_kyc, subscription_tier, created_at')
      .eq('id', anfrage.kaeufer_id)
      .maybeSingle(),
    (await hasTable('kaeufer_profil'))
      ? supabase
          .from('kaeufer_profil')
          .select('investor_typ, budget_min, budget_max, budget_undisclosed, regionen, branche_praeferenzen, timing, erfahrung, beschreibung, ist_oeffentlich, finanzierungsnachweis_verified, linkedin_url, logo_url, dossier_url, dossier_uploaded_at')
          .eq('user_id', anfrage.kaeufer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileRes.data;
  const kaeuferProfil = kaeuferProfilRes?.data;

  const initials = (profile?.full_name ?? 'K')
    .split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // Käufer-Profile sind immer offen — Anonym-Modus wurde entfernt.
  const kaeuferName = profile?.full_name ?? 'Käufer';

  const budgetText = kaeuferProfil?.budget_undisclosed
    ? 'nicht angegeben'
    : kaeuferProfil?.budget_min && kaeuferProfil?.budget_max
      ? `CHF ${(Number(kaeuferProfil.budget_min) / 1_000_000).toFixed(1)} – ${(Number(kaeuferProfil.budget_max) / 1_000_000).toFixed(0)} Mio`
      : '—';

  const isMax = profile?.subscription_tier === 'plus' || profile?.subscription_tier === 'max';

  return (
    <div className="px-6 md:px-10 py-8 md:py-10">
      <div className="max-w-content mx-auto">
        <Link
          href="/dashboard/verkaeufer/anfragen"
          className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück zu allen Anfragen
        </Link>

        {/* ── HEADER: Käufer-Karte ───────────────────────────────── */}
        <div className="rounded-card bg-paper border border-stone p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              {kaeuferProfil?.logo_url ? (
                <img
                  src={kaeuferProfil.logo_url}
                  alt={profile?.full_name ? `Logo ${profile.full_name}` : 'Käufer-Logo'}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-full bg-navy text-cream flex items-center justify-center text-lg font-mono font-medium flex-shrink-0">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-head-md text-navy font-light truncate">
                    {kaeuferName}
                  </h1>
                  {isMax && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-bronze-soft text-bronze-ink text-caption font-medium">
                      <Crown className="w-3 h-3" strokeWidth={2} />
                      Käufer+
                    </span>
                  )}
                </div>
                <p className="text-caption text-quiet mt-1">
                  {kaeuferProfil?.investor_typ ? INVESTOR_LABELS[kaeuferProfil.investor_typ] ?? kaeuferProfil.investor_typ : 'Investor-Typ unbekannt'}
                  {profile?.kanton && <> · Kanton {profile.kanton}</>}
                </p>
                <p className="text-caption text-quiet mt-1 inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" strokeWidth={1.5} />
                    Anfrage vom {formatDate(anfrage.created_at)}
                  </span>
                  <StatusPill status={anfrage.status} />
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {profile?.verified_phone && (
                <span className="inline-flex items-center gap-1 text-caption text-success font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Telefon verifiziert
                </span>
              )}
              {kaeuferProfil?.finanzierungsnachweis_verified && (
                <span className="inline-flex items-center gap-1 text-caption text-success font-medium">
                  <Wallet className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Finanzierung bestätigt
                </span>
              )}
              {profile?.verified_kyc && (
                <span className="inline-flex items-center gap-1 text-caption text-success font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                  KYC verifiziert
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 2-SPALTEN: Profil LINKS · Aktionen RECHTS ──────────── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {/* Anfrage-Nachricht */}
            <section className="bg-paper border border-stone rounded-card p-5">
              <p className="overline text-bronze-ink mb-3">Anfrage-Nachricht</p>
              <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">
                {anfrage.nachricht ?? <span className="text-quiet italic">Keine Nachricht.</span>}
              </p>
            </section>

            {/* Käufer-Profil im Detail */}
            <section className="bg-paper border border-stone rounded-card p-5">
              <p className="overline text-bronze-ink mb-4">Käufer-Profil</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <Detail icon={Briefcase} label="Investor-Typ" value={
                  kaeuferProfil?.investor_typ ? INVESTOR_LABELS[kaeuferProfil.investor_typ] ?? kaeuferProfil.investor_typ : '—'
                } />
                <Detail icon={Wallet} label="Budget" value={budgetText} mono />
                <Detail icon={Clock} label="Timing" value={
                  kaeuferProfil?.timing ? TIMING_LABELS[kaeuferProfil.timing] ?? kaeuferProfil.timing : '—'
                } />
                <Detail icon={Sparkles} label="Erfahrung" value={
                  kaeuferProfil?.erfahrung ? ERFAHRUNG_LABELS[kaeuferProfil.erfahrung] ?? kaeuferProfil.erfahrung : '—'
                } />
              </div>

              {/* Regionen */}
              {Array.isArray(kaeuferProfil?.regionen) && kaeuferProfil.regionen.length > 0 && (
                <div className="mb-4">
                  <p className="text-caption text-quiet mb-1.5 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                    Wunsch-Regionen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(kaeuferProfil.regionen as string[]).map((r) => (
                      <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-pill bg-stone/50 text-caption text-navy font-mono">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Branchen */}
              {Array.isArray(kaeuferProfil?.branche_praeferenzen) && kaeuferProfil.branche_praeferenzen.length > 0 && (
                <div className="mb-4">
                  <p className="text-caption text-quiet mb-1.5">Bevorzugte Branchen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(kaeuferProfil.branche_praeferenzen as string[]).map((b) => (
                      <span key={b} className="inline-flex items-center px-2.5 py-0.5 rounded-pill bg-bronze/10 text-caption text-bronze-ink">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Beschreibung */}
              {kaeuferProfil?.beschreibung && (
                <div className="mb-4 pt-3 border-t border-stone/40">
                  <p className="text-caption text-quiet mb-1.5">Persönliche Beschreibung</p>
                  <p className="text-body-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {kaeuferProfil.beschreibung}
                  </p>
                </div>
              )}

              {/* LinkedIn */}
              {kaeuferProfil?.linkedin_url && (
                <a
                  href={kaeuferProfil.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-bronze transition-colors"
                >
                  <Linkedin className="w-4 h-4" strokeWidth={1.5} />
                  LinkedIn-Profil ansehen
                </a>
              )}

              {!kaeuferProfil && (
                <p className="text-caption text-quiet italic">
                  Käufer hat noch kein Profil ausgefüllt.
                </p>
              )}
            </section>

            {/* Käuferdossier (falls vorhanden + angefordert) */}
            {anfrage.dossier_requested_at && (
              <section className="bg-paper border border-stone rounded-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="overline text-bronze-ink">Käuferdossier</p>
                  <span className="text-caption text-quiet font-mono">
                    Angefordert {formatDate(anfrage.dossier_requested_at)}
                  </span>
                </div>
                {kaeuferProfil?.dossier_url ? (
                  <DossierLink url={kaeuferProfil.dossier_url} uploadedAt={kaeuferProfil.dossier_uploaded_at ?? null} />
                ) : (
                  <p className="text-body-sm text-muted leading-relaxed">
                    <Clock className="inline-block w-3.5 h-3.5 mr-1 -mt-0.5 text-quiet" strokeWidth={1.5} />
                    Wartet auf Upload des Käufers — er hat eine Mail bekommen.
                    {anfrage.dossier_request_message && (
                      <span className="block mt-2 pl-3 border-l-2 border-bronze/30 italic text-quiet">
                        Deine Nachricht: «{anfrage.dossier_request_message}»
                      </span>
                    )}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* ── PRO-AKTIONEN (Sidebar rechts) ───────────────────── */}
          <aside className="space-y-4">
            <AnfrageProActions
              anfrageId={anfrage.id}
              isPro={isPro}
              dossierRequestedAt={anfrage.dossier_requested_at}
              datenraumGrantedAt={anfrage.datenraum_granted_at}
              hasUploadedDossier={Boolean(kaeuferProfil?.dossier_url)}
            />

            {/* Inserat-Link */}
            <div className="bg-paper border border-stone rounded-soft p-4">
              <p className="overline text-quiet text-caption mb-1.5">Zum Inserat</p>
              <p className="text-body-sm text-navy font-medium leading-snug mb-2">
                {inserat.titel ?? 'Mein Inserat'}
              </p>
              <Link
                href="/dashboard/verkaeufer/inserat"
                className="text-caption text-bronze-ink hover:text-bronze inline-flex items-center gap-1"
              >
                Inserat öffnen →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon, label, value, mono,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-caption text-quiet mb-0.5 inline-flex items-center gap-1">
        <Icon className="w-3 h-3" strokeWidth={1.5} />
        {label}
      </p>
      <p className={mono ? 'text-body-sm text-navy font-mono' : 'text-body-sm text-navy'}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    neu: { label: 'Neu', cls: 'bg-bronze/15 text-bronze-ink' },
    in_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    akzeptiert: { label: 'Akzeptiert', cls: 'bg-success/15 text-success' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-stone text-quiet' },
    nda_pending: { label: 'NDA wartet', cls: 'bg-warn/15 text-warn' },
    nda_signed: { label: 'NDA signiert', cls: 'bg-success/15 text-success' },
    geschlossen: { label: 'Geschlossen', cls: 'bg-stone text-quiet' },
  };
  const m = map[status] ?? { label: status, cls: 'bg-stone text-quiet' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function DossierLink({ url, uploadedAt }: { url: string; uploadedAt: string | null }) {
  return (
    <div className="rounded-soft bg-success/5 border border-success/30 p-3">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-success flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-navy font-medium">Käuferdossier hochgeladen</p>
          {uploadedAt && (
            <p className="text-caption text-quiet">am {formatDate(uploadedAt)}</p>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          Öffnen
        </a>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
}
