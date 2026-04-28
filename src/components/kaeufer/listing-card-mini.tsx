import Link from 'next/link';
import { TrendingUp, FileLock2, Heart } from 'lucide-react';
import { branchenStockfoto } from '@/data/branchen-stockfotos';
import { renderKeyFacts } from '@/lib/key-facts';
import {
  formatUmsatz,
  formatEbitda,
  formatKaufpreis,
} from '@/lib/format-listing';
import type { InseratPublic } from '@/lib/listings';
import { uebergabeGrundLabel } from '@/lib/constants';
import { matchScore, matchLabel, type Suchprofil, type Inserat } from '@/lib/match-score';
import { cn } from '@/lib/utils';

type Props = {
  listing: InseratPublic;
  /** Display-Label für die Branche (DB liefert nur `branche_id`). */
  branche_label?: string;
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

/**
 * Adapter: `InseratPublic` → `Inserat` (Match-Score-Shape).
 * `match-score.ts` arbeitet noch mit String-Werten — kommt in Block 4
 * komplett auf numerische DB-Felder.
 */
function toMatchInserat(l: InseratPublic, brancheLabel?: string): Inserat {
  let margePct = l.ebitda_marge_pct;
  if (margePct == null && l.ebitda_chf && l.umsatz_chf && l.umsatz_chf > 0) {
    margePct = (Number(l.ebitda_chf) / Number(l.umsatz_chf)) * 100;
  }
  return {
    branche: brancheLabel ?? l.branche_id ?? '',
    kanton: l.kanton ?? '',
    umsatz: formatUmsatz({ umsatz_chf: l.umsatz_chf, umsatz_bucket: l.umsatz_bucket }),
    ebitda: formatEbitda(margePct),
    kaufpreis: formatKaufpreis({
      kaufpreis_chf: l.kaufpreis_chf,
      kaufpreis_min_chf: l.kaufpreis_min_chf,
      kaufpreis_max_chf: l.kaufpreis_max_chf,
      kaufpreis_bucket: l.kaufpreis_bucket,
      kaufpreis_vhb: l.kaufpreis_vhb,
    }),
  };
}

export function ListingCardMini({
  listing,
  branche_label,
  suchprofil,
  stage,
  detailHref,
  note,
  selected,
  onSelect,
}: Props) {
  const idForUI = String(listing.slug ?? listing.id);
  const brancheDisplay = branche_label ?? listing.branche_id ?? '—';
  const kantonDisplay = listing.kanton ?? '—';

  // EBITDA-Marge ableiten falls null aber chf-Werte vorhanden
  let margePct = listing.ebitda_marge_pct;
  if (margePct == null && listing.ebitda_chf && listing.umsatz_chf && listing.umsatz_chf > 0) {
    margePct = (Number(listing.ebitda_chf) / Number(listing.umsatz_chf)) * 100;
  }

  const umsatzDisplay = formatUmsatz({
    umsatz_chf: listing.umsatz_chf,
    umsatz_bucket: listing.umsatz_bucket,
  });
  const ebitdaDisplay = formatEbitda(margePct);
  const kaufpreisDisplay = formatKaufpreis({
    kaufpreis_chf: listing.kaufpreis_chf,
    kaufpreis_min_chf: listing.kaufpreis_min_chf,
    kaufpreis_max_chf: listing.kaufpreis_max_chf,
    kaufpreis_bucket: listing.kaufpreis_bucket,
    kaufpreis_vhb: listing.kaufpreis_vhb,
  });
  const grundDisplay = uebergabeGrundLabel(listing.uebergabe_grund);
  const jahrDisplay = listing.jahr ?? new Date().getFullYear();

  const cover = branchenStockfoto(listing.branche_id ?? brancheDisplay, idForUI);
  const facts = renderKeyFacts({
    jahr: jahrDisplay,
    mitarbeitende: listing.mitarbeitende ?? 0,
    umsatz: umsatzDisplay,
    ebitda: ebitdaDisplay,
  });
  const score = suchprofil
    ? matchScore(suchprofil, toMatchInserat(listing, brancheDisplay))
    : null;
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
          {idForUI}
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
            {brancheDisplay} · Kanton {kantonDisplay}
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
            <p className="font-mono text-caption text-navy font-medium">{umsatzDisplay}</p>
          </div>
          <div>
            <p className="overline text-[10px] mb-0.5">EBITDA</p>
            <p className="font-mono text-caption text-navy font-medium">{ebitdaDisplay}</p>
          </div>
          <div>
            <p className="overline text-[10px] mb-0.5">Preis</p>
            <p className="font-mono text-caption text-navy font-medium">{kaufpreisDisplay}</p>
          </div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-quiet mb-4">
          <TrendingUp className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
          {grundDisplay}
        </p>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={detailHref ?? `/kaufen/${idForUI}`}
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
