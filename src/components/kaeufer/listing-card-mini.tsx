import Link from 'next/link';
import { TrendingUp, FileLock2, Heart } from 'lucide-react';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import { renderKeyFacts } from '@/lib/key-facts';
import type { MockListing } from '@/lib/listings-mock';
import { matchScore, matchLabel, type Suchprofil } from '@/lib/match-score';
import { cn } from '@/lib/utils';

type Props = {
  listing: MockListing;
  /** Wenn gesetzt, zeigt Match-Score-Badge oben rechts */
  suchprofil?: Suchprofil;
  /** Wenn gesetzt, zeigt Stage-Pill unter dem Titel */
  stage?: string;
  /** Wenn gesetzt, ersetzt «Dossier anfragen» → Detail-Link */
  detailHref?: string;
  /** Note unter dem Titel (Käufer-Notiz) */
  note?: string | null;
  /** Wenn true, ist die Card im Vergleichs-Mode (Outline) */
  selected?: boolean;
  onSelect?: () => void;
};

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  neu:          { label: 'Neu',           color: 'bg-stone/60 text-ink' },
  kontaktiert:  { label: 'Kontaktiert',   color: 'bg-navy-soft text-navy' },
  nda:          { label: 'NDA',           color: 'bg-bronze-soft text-bronze-ink' },
  dd:           { label: 'Due Diligence', color: 'bg-bronze-soft text-bronze-ink' },
  loi:          { label: 'LOI',           color: 'bg-success/10 text-success' },
  won:          { label: 'Gewonnen',      color: 'bg-success/15 text-success' },
  lost:         { label: 'Verloren',      color: 'bg-stone/40 text-quiet' },
};

export function ListingCardMini({
  listing,
  suchprofil,
  stage,
  detailHref,
  note,
  selected,
  onSelect,
}: Props) {
  const cover = branchenStockfoto(listing.branche, listing.id);
  const facts = renderKeyFacts(listing);
  const score = suchprofil ? matchScore(suchprofil, listing) : null;
  const matchInfo = score !== null ? matchLabel(score) : null;
  const stageInfo = stage ? STAGE_LABELS[stage] : null;

  return (
    <article
      className={cn(
        'group bg-paper border rounded-card overflow-hidden transition-all duration-300 flex flex-col',
        selected
          ? 'border-bronze shadow-lift'
          : 'border-stone hover:-translate-y-0.5 hover:shadow-lift',
      )}
    >
      {/* Cover */}
      <div className="relative h-36 md:h-40 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-110"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.55) saturate(1.1)',
            transform: 'scale(1.15)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

        <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest text-cream/85 backdrop-blur-sm bg-navy/40 px-2 py-1 rounded-full">
          {listing.id}
        </span>
        {score !== null && matchInfo && (
          <span
            className={cn(
              'absolute top-3 right-3 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm',
              score >= 80
                ? 'bg-success/90 text-cream'
                : score >= 60
                ? 'bg-bronze/90 text-cream'
                : 'bg-paper/90 text-navy',
            )}
            title={matchInfo.label}
          >
            {score}% Match
          </span>
        )}

        <div className="absolute bottom-3 left-4 right-4 z-[1]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-bronze font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {listing.branche} · Kanton {listing.kanton}
          </p>
          <p className="font-mono text-[12px] text-cream mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {facts}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-head-sm text-navy leading-tight font-normal">
            {listing.titel}<span className="text-bronze">.</span>
          </h3>
          {onSelect && (
            <input
              type="checkbox"
              checked={selected ?? false}
              onChange={onSelect}
              className="mt-1 h-4 w-4 accent-bronze cursor-pointer flex-shrink-0"
              aria-label="Zum Vergleich auswählen"
            />
          )}
        </div>

        {stageInfo && (
          <span className={cn('inline-flex w-fit text-caption font-medium px-2 py-0.5 rounded-pill mb-3', stageInfo.color)}>
            {stageInfo.label}
          </span>
        )}

        {note && (
          <p className="text-caption text-muted italic leading-snug mb-3 border-l-2 border-stone pl-3">
            {note}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-stone mb-4">
          <div>
            <p className="overline text-[10px] mb-0.5">Umsatz</p>
            <p className="font-mono text-caption text-navy font-medium">{listing.umsatz}</p>
          </div>
          <div>
            <p className="overline text-[10px] mb-0.5">EBITDA</p>
            <p className="font-mono text-caption text-navy font-medium">{listing.ebitda}</p>
          </div>
          <div>
            <p className="overline text-[10px] mb-0.5">Preis</p>
            <p className="font-mono text-caption text-navy font-medium">{listing.kaufpreis}</p>
          </div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-quiet mb-4">
          <TrendingUp className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
          {listing.grund}
        </p>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={detailHref ?? `/kaufen/${listing.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors"
          >
            <FileLock2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Detail ansehen
          </Link>
          <button
            type="button"
            className="px-2.5 py-2 border border-stone rounded-soft text-bronze hover:bg-bronze/5 transition-colors"
            aria-label="Aus Favoriten entfernen"
          >
            <Heart className="w-3.5 h-3.5 fill-bronze" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
