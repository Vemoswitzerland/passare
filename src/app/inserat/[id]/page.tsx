import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Calendar, CheckCircle2, Mail,
  MapPin, MessageSquare, Phone, Shield, TrendingUp, Users,
} from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import { MOCK_LISTINGS, type MockListing } from '@/lib/listings-mock';
import { SiteHeader, SiteFooter } from '../../page';
import { InlineAnfrageForm } from './InlineAnfrageForm';
import { LikeShareActions } from './LikeShareActions';

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anfrage?: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const l = MOCK_LISTINGS.find((x) => x.id === id);
  if (!l) return { title: 'Inserat nicht gefunden — passare' };
  return {
    title: `${l.titel} — passare`,
    description: `${l.branche} · Kanton ${l.kanton} · ${l.umsatz} Umsatz · ${l.mitarbeitende} MA. Schweizer KMU-Inserat auf passare.`,
    robots: { index: false, follow: false },
  };
}

export default async function InseratDetailPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { anfrage } = await searchParams;
  const listing = MOCK_LISTINGS.find((l) => l.id === id);
  if (!listing) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      {anfrage === 'ok' && <AnfrageErfolgBanner />}
      <DetailHero listing={listing} />
      <DetailBody listing={listing} />
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
function DetailHero({ listing }: { listing: MockListing }) {
  const cover = branchenStockfoto(listing.branche, listing.id);
  const statusColor =
    listing.status === 'featured' ? 'bg-bronze/90 text-cream'
    : listing.status === 'neu' ? 'bg-success/90 text-cream'
    : listing.status === 'nda' ? 'bg-navy/90 text-cream'
    : 'bg-paper/90 text-navy';

  const statusLabel =
    listing.status === 'featured' ? 'Featured'
    : listing.status === 'neu' ? 'Neu'
    : listing.status === 'nda' ? 'NDA-Prozess'
    : 'Live';

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
                  {listing.id}
                </span>
                <span className={`font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.16em] text-bronze font-semibold mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                {listing.branche} · Kanton {listing.kanton}
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
function DetailBody({ listing }: { listing: MockListing }) {
  const inserent = listing.inserent ?? { anonym: true };

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
                  {listing.beschreibung ?? `Inhabergeführtes Unternehmen aus der Branche ${listing.branche}, Kanton ${listing.kanton}. Gegründet ${listing.jahr}, ${listing.mitarbeitende} Mitarbeitende, Jahresumsatz ${listing.umsatz}. Übergabegrund: ${listing.grund}.`}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                <InfoTile icon={Calendar} label="Gegründet" value={String(listing.jahr)} />
                <InfoTile icon={Users} label="Mitarbeitende" value={`${listing.mitarbeitende}`} />
                <InfoTile icon={MapPin} label="Standort" value={`Kanton ${listing.kanton}`} />
                <InfoTile icon={TrendingUp} label="Übergabegrund" value={listing.grund} />
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
                      stehen nach NDA-Signatur im verschlüsselten Datenraum. Anfrage über das Kontakt-Panel
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
              <ContactPanel listing={listing} inserent={inserent} />
            </Reveal>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

/* ════════════════════════ KeyFacts Box (Umsatz / EBITDA / Preis) ════════════════════════ */
function KeyFacts({ listing }: { listing: MockListing }) {
  return (
    <div className="grid grid-cols-3 bg-paper border border-stone rounded-card overflow-hidden">
      <div className="p-5 md:p-6 border-r border-stone">
        <p className="overline mb-2">Umsatz</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium">{listing.umsatz}</p>
      </div>
      <div className="p-5 md:p-6 border-r border-stone">
        <p className="overline mb-2">EBITDA</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium">{listing.ebitda}</p>
      </div>
      <div className="p-5 md:p-6">
        <p className="overline mb-2">Kaufpreis</p>
        <p className="font-mono text-head-md text-navy font-tabular font-medium">{listing.kaufpreis}</p>
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
  inserent,
}: {
  listing: MockListing;
  inserent: NonNullable<MockListing['inserent']>;
}) {
  const isOeffentlich = !inserent.anonym;

  return (
    <div className="bg-paper border border-stone rounded-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">
          Anfrage stellen
        </h2>
      </div>

      <p className="text-body-sm text-muted leading-relaxed">
        Schreiben Sie dem Verkäufer direkt — kein Konto nötig, nur E-Mail-Verifikation.
      </p>

      <InlineAnfrageForm listing={listing} />

      <LikeShareActions
        listingId={listing.id}
        titel={listing.titel}
        branche={listing.branche}
        kanton={listing.kanton}
        umsatz={listing.umsatz}
      />

      {isOeffentlich && <DirektkontaktBox inserent={inserent} />}
    </div>
  );
}

function DirektkontaktBox({ inserent }: { inserent: NonNullable<MockListing['inserent']> }) {
  if (!inserent.email && !inserent.telefon) return null;

  return (
    <div className="pt-5 border-t border-stone">
      <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-3">
        Lieber direkt? Verkäufer hat sein Profil öffentlich gestellt
      </p>
      <div className="flex items-center gap-3 mb-3">
        {inserent.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={inserent.foto}
            alt={inserent.name ?? 'Verkäufer'}
            className="w-10 h-10 rounded-full object-cover border border-stone"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center flex-shrink-0 font-serif text-base">
            {(inserent.name ?? '?').slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-serif text-body-sm text-navy truncate leading-tight">{inserent.name}</p>
          <p className="text-caption text-quiet leading-snug truncate">
            {inserent.rolle}
            {inserent.firma ? ` · ${inserent.firma}` : ''}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {inserent.email && (
          <a
            href={`mailto:${inserent.email}`}
            className="flex items-center gap-2.5 text-body-sm text-ink hover:text-bronze transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-bronze flex-shrink-0" strokeWidth={1.5} />
            <span className="truncate font-mono text-[12px]">{inserent.email}</span>
          </a>
        )}
        {inserent.telefon && (
          <a
            href={`tel:${inserent.telefon.replace(/\s/g, '')}`}
            className="flex items-center gap-2.5 text-body-sm text-ink hover:text-bronze transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-bronze flex-shrink-0" strokeWidth={1.5} />
            <span className="font-mono text-[12px]">{inserent.telefon}</span>
          </a>
        )}
      </div>
    </div>
  );
}
