/**
 * passare.ch — ListingCard
 *
 * Wiederverwendbare Marktplatz-Karte. Wird von der Börse (`/boerse`),
 * der Landingpage (`/`) und potentiell von anderen Pages benutzt
 * (z.B. Daily-Digest, Käufer-Dashboard).
 *
 * Kein client-state — die Card ist eine Server-Component, die optional
 * `<CardActions />` (Favorit-Toggle) als Client-Insel reinhängt.
 */

import Link from 'next/link';
import { Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardActions } from '@/components/marketplace/CardActions';
import { renderKeyFacts } from '@/lib/key-facts';
import {
  formatEbitda,
  formatKaufpreis,
  formatUmsatz,
  type InseratPublic,
} from '@/lib/listings';
import { type Branche } from '@/lib/branchen';
import { uebergabeGrundLabel } from '@/lib/constants';
import { branchenStockfoto } from '@/data/branchen-stockfotos';

export function ListingCard({ listing, branchen }: { listing: InseratPublic; branchen: Branche[] }) {
  const now = Date.now();
  const isFeatured = listing.featured_until && new Date(listing.featured_until).getTime() > now;
  const ageDays = (now - new Date(listing.published_at).getTime()) / (24 * 60 * 60 * 1000);
  const status: 'featured' | 'neu' | 'live' = isFeatured ? 'featured' : ageDays < 14 ? 'neu' : 'live';

  const statusColor =
    status === 'featured' ? 'bg-bronze/90 text-cream'
    : status === 'neu' ? 'bg-success/90 text-cream'
    : 'bg-paper/90 text-navy';

  const statusLabel =
    status === 'featured' ? 'Featured'
    : status === 'neu' ? 'Neu'
    : 'Live';

  const brancheObj = branchen.find((b) => b.id === listing.branche_id);
  const brancheLabel = brancheObj?.label_de ?? listing.branche_id ?? '—';

  const cover = branchenStockfoto(listing.branche_id ?? brancheLabel, listing.id);

  let margePct = listing.ebitda_marge_pct;
  if (margePct == null && listing.ebitda_chf && listing.umsatz_chf && listing.umsatz_chf > 0) {
    margePct = (Number(listing.ebitda_chf) / Number(listing.umsatz_chf)) * 100;
  }

  const umsatzStr = formatUmsatz({
    umsatz_chf: listing.umsatz_chf,
    umsatz_bucket: listing.umsatz_bucket,
  });
  const ebitdaStr = formatEbitda(margePct);
  const kaufpreisStr = formatKaufpreis({
    kaufpreis_chf: listing.kaufpreis_chf,
    kaufpreis_min_chf: listing.kaufpreis_min_chf,
    kaufpreis_max_chf: listing.kaufpreis_max_chf,
    kaufpreis_bucket: listing.kaufpreis_bucket,
    kaufpreis_vhb: listing.kaufpreis_vhb,
  });
  const facts = renderKeyFacts({
    jahr: listing.jahr ?? new Date().getFullYear(),
    mitarbeitende: listing.mitarbeitende ?? 0,
    umsatz: umsatzStr,
    ebitda: ebitdaStr,
  });

  const displayId = listing.slug ?? listing.id.slice(0, 8);
  const detailHref = `/inserat/${listing.slug ?? listing.id}`;

  return (
    <article className="group relative h-full bg-paper border border-stone rounded-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lift hover:border-bronze/40 transition-all duration-300 flex flex-col cursor-pointer">
      <Link
        href={detailHref}
        className="absolute inset-0 z-[1]"
        aria-label={`Inserat ${listing.titel} ansehen`}
      />

      <div className="relative h-44 md:h-48 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-110"
          style={{
            backgroundImage: `url(${listing.cover_url ?? cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.55) saturate(1.1)',
            transform: 'scale(1.15)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

        <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest text-cream/85 backdrop-blur-sm bg-navy/40 px-2 py-1 rounded-full">
          {displayId}
        </span>
        <span className={`absolute top-3 right-3 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${statusColor}`}>
          {statusLabel}
        </span>

        <div className="absolute bottom-4 left-5 right-5 z-[1]">
          <p className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.16em] text-bronze font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {brancheLabel} · Kanton {listing.kanton ?? '—'}
          </p>
          <p className="font-mono text-[13px] md:text-[14px] tracking-wider text-cream mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {facts}
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3
          lang="de"
          className="font-serif text-head-md text-navy leading-tight font-normal mb-5 h-[3.9rem] hyphens-auto break-words line-clamp-2 group-hover:text-bronze-ink transition-colors"
        >
          {listing.titel}<span className="text-bronze">.</span>
        </h3>

        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-stone mb-5">
          <div className="min-w-0">
            <p className="overline mb-1">Umsatz</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{umsatzStr}</p>
          </div>
          <div className="min-w-0">
            <p className="overline mb-1">EBITDA</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{ebitdaStr}</p>
          </div>
          <div className="min-w-0">
            <p className="overline mb-1">Preis</p>
            <p className="font-mono text-body-sm text-navy font-tabular font-medium whitespace-nowrap">{kaufpreisStr}</p>
          </div>
        </div>

        {listing.uebergabe_grund && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-quiet mb-5">
            <TrendingUp className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
            {uebergabeGrundLabel(listing.uebergabe_grund)}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 relative z-10">
          <Button
            href={detailHref}
            size="sm"
            className="flex-1 justify-center"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            Details
          </Button>
          <CardActions
            listingId={listing.id}
            titel={listing.titel}
            branche={brancheLabel}
            kanton={listing.kanton ?? '—'}
            umsatz={umsatzStr}
          />
        </div>
      </div>
    </article>
  );
}
