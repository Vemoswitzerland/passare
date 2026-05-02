import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Calendar, CheckCircle2,
  MapPin, MessageSquare, Shield, TrendingUp, Users,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import {
  getListingById,
  formatUmsatz,
  formatEbitda,
  formatKaufpreis,
  formatMitarbeitende,
  type InseratDetail,
} from '@/lib/listings';
import { getBrancheById } from '@/lib/branchen';
import { uebergabeGrundLabel } from '@/lib/constants';
import { SiteHeader, SiteFooter } from '../../page';
import { createClient } from '@/lib/supabase/server';
import { InlineAnfrageForm } from './InlineAnfrageForm';
import { LikeShareActions } from './LikeShareActions';
import { VerkaeuferKontaktBox } from './VerkaeuferKontaktBox';

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anfrage?: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const l = await getListingById(id);
  if (!l) return { title: 'Inserat nicht gefunden — passare' };
  const branche = await getBrancheById(l.branche_id);
  const brancheLabel = branche?.label_de ?? l.branche_id ?? '—';
  const umsatzStr = formatUmsatz({ umsatz_chf: l.umsatz_chf, umsatz_bucket: l.umsatz_bucket });
  const maStr = formatMitarbeitende({ mitarbeitende: l.mitarbeitende, mitarbeitende_bucket: l.mitarbeitende_bucket });
  return {
    title: `${l.titel} — passare`,
    description: `${brancheLabel} · Kanton ${l.kanton ?? '—'} · ${umsatzStr} Umsatz · ${maStr}. Schweizer KMU-Inserat auf passare.`,
    robots: { index: false, follow: false },
  };
}

export default async function InseratDetailPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { anfrage } = await searchParams;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const branche = await getBrancheById(listing.branche_id);
  const brancheLabel = branche?.label_de ?? listing.branche_id ?? '—';

  // Eingeloggte Käufer-Daten für Pre-Fill der Anfrage-Form
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  let prefill: { name: string; email: string; isLoggedIn: boolean } = {
    name: '', email: '', isLoggedIn: false,
  };
  if (u.user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', u.user.id)
      .maybeSingle();
    prefill = {
      name: prof?.full_name ?? '',
      email: u.user.email ?? '',
      isLoggedIn: true,
    };
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      {anfrage === 'ok' && <AnfrageErfolgBanner />}
      <DetailHero listing={listing} brancheLabel={brancheLabel} />
      <DetailBody listing={listing} brancheLabel={brancheLabel} prefill={prefill} />
      <SiteFooter />
    </main>
  );
}

function AnfrageErfolgBanner() {
  return (
    <div className="bg-success/10 border-b border-success/30">
      <Container>
        <div className="py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" strokeWidth={1.5} />
          <p className="text-body-sm text-navy">
            <span className="font-medium">Anfrage gesendet.</span>{' '}
            Der Verkäufer wurde informiert — Ihr Käufer-Basic-Konto ist aktiv.
          </p>
        </div>
      </Container>
    </div>
  );
}

/* ════════════════════════ Hero (Bild oben) ════════════════════════ */
function DetailHero({ listing, brancheLabel }: { listing: InseratDetail; brancheLabel: string }) {
  const cover = branchenStockfoto(listing.branche_id ?? brancheLabel, listing.id);
  const now = Date.now();
  const isFeatured = listing.featured_until && new Date(listing.featured_until).getTime() > now;
  const ageDays = (now - new Date(listing.published_at).getTime()) / (24 * 60 * 60 * 1000);
  const isNew = !isFeatured && ageDays < 14;

  const statusColor =
    isFeatured ? 'bg-bronze/90 text-cream'
    : isNew ? 'bg-success/90 text-cream'
    : 'bg-paper/90 text-navy';

  const statusLabel = isFeatured ? 'Featured' : isNew ? 'Neu' : 'Live';

  // Kurz-ID fürs Header-Badge (slug bevorzugt, sonst erste 8 Zeichen der UUID)
  const shortId = listing.slug ?? listing.id.slice(0, 8);

  return (
    <section className="relative">
      <div className="relative h-72 md:h-[420px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px) brightness(0.5) saturate(1.1)',
            transform: 'scale(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-transparent" />

        <Container>
          <div className="relative h-72 md:h-[420px] flex flex-col justify-between py-8 md:py-12">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cream/85 hover:text-cream transition-colors backdrop-blur-sm bg-navy/30 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                zurück zum Marktplatz
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-cream/85 backdrop-blur-sm bg-navy/40 px-2.5 py-1 rounded-full">
                  {shortId}
                </span>
                <span className={`font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.16em] text-bronze font-semibold mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                {brancheLabel} · Kanton {listing.kanton ?? '—'}
              </p>
              <h1 className="font-serif-display text-[clamp(1.75rem,4vw,3rem)] text-cream font-light leading-[1.1] tracking-[-0.02em] max-w-3xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                {listing.titel}<span className="text-bronze">.</span>
              </h1>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

/* ════════════════════════ Body (Text + Kontakt-Sidebar) ════════════════════════ */
function DetailBody({
  listing,
  brancheLabel,
  prefill,
}: {
  listing: InseratDetail;
  brancheLabel: string;
  prefill: { name: string; email: string; isLoggedIn: boolean };
}) {
  const grundLabel = uebergabeGrundLabel(listing.uebergabe_grund);
  const umsatzStr = formatUmsatz({ umsatz_chf: listing.umsatz_chf, umsatz_bucket: listing.umsatz_bucket });
  const maStr = formatMitarbeitende({
    mitarbeitende: listing.mitarbeitende,
    mitarbeitende_bucket: listing.mitarbeitende_bucket,
  });

  // Sales-Points: text[] aus DB, Fallback Beschreibung als Beschreibungs-Block
  const fallbackBeschreibung =
    `Inhabergeführtes Unternehmen aus der Branche ${brancheLabel}, Kanton ${listing.kanton ?? '—'}.`
    + ` Gegründet ${listing.jahr ?? '—'}, ${maStr}, Jahresumsatz ${umsatzStr}.`
    + ` Übergabegrund: ${grundLabel}.`;

  return (
    <Section className="pt-10 md:pt-14 pb-24">
      <Container>
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* ─── Linke Spalte: Beschreibung + Key-Facts ─── */}
          <div>
            <Reveal>
              <KeyFacts listing={listing} />
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10">
                <h2 className="overline mb-4 text-bronze-ink">Über das Unternehmen</h2>
                <div className="font-serif text-body-lg text-ink leading-relaxed whitespace-pre-line">
                  {listing.beschreibung ?? listing.teaser ?? fallbackBeschreibung}
                </div>
              </div>
            </Reveal>

            {listing.sales_points && listing.sales_points.length > 0 && (
              <Reveal delay={0.12}>
                <div className="mt-8">
                  <h2 className="overline mb-4 text-bronze-ink">Highlights</h2>
                  <ul className="space-y-2">
                    {listing.sales_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-body text-ink">
                        <CheckCircle2 className="w-4 h-4 text-bronze flex-shrink-0 mt-1" strokeWidth={1.5} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            <Reveal delay={0.15}>
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <InfoTile
                  icon={Calendar}
                  label="Gegründet"
                  value={listing.jahr ? String(listing.jahr) : '—'}
                />
                <InfoTile icon={Users} label="Mitarbeitende" value={maStr} />
                <InfoTile
                  icon={MapPin}
                  label="Standort"
                  value={listing.kanton ? `Kanton ${listing.kanton}` : '—'}
                />
                <InfoTile icon={TrendingUp} label="Übergabegrund" value={grundLabel} />
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-10 bg-bronze/5 border border-bronze/20 rounded-card p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-serif text-head-md text-navy font-normal mb-2 leading-tight">
                      Vollständiges Dossier &amp; Datenraum
                    </h3>
                    <p className="text-body-sm text-muted leading-relaxed">
                      Bilanzen, GuV, Mitarbeiter-Aufstellung, Standort-Pläne und vertiefte Marktanalyse
                      stehen nach Freigabe durch den Verkäufer im verschlüsselten Datenraum. Anfrage über das Kontakt-Panel
                      rechts.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ─── Rechte Spalte: Kontakt-Sidebar ─── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delay={0.1}>
              <ContactPanel listing={listing} brancheLabel={brancheLabel} prefill={prefill} />
            </Reveal>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ KeyFacts Box (Umsatz / EBITDA / Preis) ════════════════════════ */
function KeyFacts({ listing }: { listing: InseratDetail }) {
  const umsatzStr = formatUmsatz({ umsatz_chf: listing.umsatz_chf, umsatz_bucket: listing.umsatz_bucket });
  let margePct = listing.ebitda_marge_pct;
  if (margePct == null && listing.ebitda_chf && listing.umsatz_chf && listing.umsatz_chf > 0) {
    margePct = (Number(listing.ebitda_chf) / Number(listing.umsatz_chf)) * 100;
  }
  const ebitdaStr = formatEbitda(margePct);
  const kaufpreisStr = formatKaufpreis({
    kaufpreis_chf: listing.kaufpreis_chf,
    kaufpreis_min_chf: listing.kaufpreis_min_chf,
    kaufpreis_max_chf: listing.kaufpreis_max_chf,
    kaufpreis_bucket: listing.kaufpreis_bucket,
    kaufpreis_vhb: listing.kaufpreis_vhb,
  });

  return (
    <div className="grid grid-cols-3 bg-paper border border-stone rounded-card overflow-hidden">
      <div className="p-5 md:p-6 border-r border-stone">
        <p className="overline mb-2">Umsatz</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium whitespace-nowrap">{umsatzStr}</p>
      </div>
      <div className="p-5 md:p-6 border-r border-stone">
        <p className="overline mb-2">EBITDA</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium whitespace-nowrap">{ebitdaStr}</p>
      </div>
      <div className="p-5 md:p-6">
        <p className="overline mb-2">Kaufpreis</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium whitespace-nowrap">{kaufpreisStr}</p>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string }) {
  return (
    <div className="bg-paper border border-stone rounded-card p-5 flex items-start gap-3">
      <Icon className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <div>
        <p className="overline mb-1">{label}</p>
        <p className="font-mono text-body-sm text-navy font-medium">{value}</p>
      </div>
    </div>
  );
}

/* ════════════════════════ ContactPanel (Anfrage-Form als Hauptaktion) ════════════════════════ */
function ContactPanel({
  listing,
  brancheLabel,
  prefill,
}: {
  listing: InseratDetail;
  brancheLabel: string;
  prefill: { name: string; email: string; isLoggedIn: boolean };
}) {
  const umsatzStr = formatUmsatz({ umsatz_chf: listing.umsatz_chf, umsatz_bucket: listing.umsatz_bucket });
  const level = listing.anonymitaet_level;
  const hatDirektKontakt =
    level === 'voll_offen' &&
    Boolean(
      listing.kontakt_email_public?.trim() ||
        (listing.whatsapp_enabled && listing.kontakt_whatsapp_nr?.trim()) ||
        listing.linkedin_url?.trim(),
    );

  return (
    <div className="bg-paper border border-stone rounded-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">
          Anfrage stellen
        </h2>
      </div>

      <VerkaeuferKontaktBox listing={listing} />

      {hatDirektKontakt && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-quiet text-center -mt-1">
          Oder Nachricht direkt schreiben
        </p>
      )}

      <InlineAnfrageForm listing={listing} prefill={prefill} />

      <LikeShareActions
        listingId={listing.id}
        titel={listing.titel}
        branche={brancheLabel}
        kanton={listing.kanton ?? '—'}
        umsatz={umsatzStr}
      />
    </div>
  );
}
