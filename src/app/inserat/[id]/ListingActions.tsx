'use client';

import { useState } from 'react';
import { Check, FileLock2, Heart, Share2 } from 'lucide-react';
import type { MockListing } from '@/lib/listings-mock';
import { AnfrageDrawer } from './AnfrageDrawer';

/**
 * Like + Teilen + Anfrage-Buttons im Kontakt-Panel der Detail-Seite.
 *
 * Anfrage öffnet einen Slide-In-Drawer von rechts (kein Konto nötig).
 * Like ist V1 nur lokal optisch. Teilen nutzt navigator.share auf Mobile,
 * Clipboard-Copy als Fallback.
 */

export function ListingActions({ listing }: { listing: MockListing }) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function toggleLike() {
    setLiked((v) => !v);
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: listing.titel,
      text: `${listing.titel} · ${listing.branche} · Kanton ${listing.kanton} · ${listing.umsatz} Umsatz`,
      url,
    };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData);
        return;
      } catch {
        /* User hat abgebrochen — nichts tun */
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        /* nichts */
      }
    }
  }

  return (
    <>
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift transition-all duration-300 inline-flex items-center justify-center gap-2"
        >
          <FileLock2 className="w-4 h-4" strokeWidth={1.5} />
          Anfrage stellen
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-soft text-body-sm transition-all ${
              liked
                ? 'border-bronze bg-bronze/10 text-bronze-ink'
                : 'border-stone text-muted hover:border-bronze hover:text-bronze'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`}
              strokeWidth={1.5}
            />
            {liked ? 'Gemerkt' : 'Merken'}
          </button>

          <button
            type="button"
            onClick={share}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-stone rounded-soft text-body-sm text-muted hover:border-bronze hover:text-bronze transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" strokeWidth={1.5} />
                Kopiert
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" strokeWidth={1.5} />
                Teilen
              </>
            )}
          </button>
        </div>
      </div>

      <AnfrageDrawer
        listing={listing}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
