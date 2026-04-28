'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, FileLock2, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MockListing } from '@/lib/listings-mock';

/**
 * Like + Teilen + Anfrage-Buttons im Kontakt-Panel der Detail-Seite.
 *
 * Like ist optimistisch lokal (kein Backend in V1) — bleibt im Local-Storage,
 * damit Refresh erhalten bleibt. Teilen nutzt navigator.share wenn verfügbar,
 * sonst Clipboard-Copy.
 */

export function ListingActions({ listing }: { listing: MockListing }) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

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

    // Fallback: Clipboard
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

  const anfrageHref = `/auth/register?role=kaeufer&next=${encodeURIComponent(`/onboarding/kaeufer/tunnel?listing=${listing.id}`)}`;

  return (
    <div className="space-y-3 pt-1">
      <Button
        href={anfrageHref}
        size="md"
        className="w-full justify-center"
      >
        <FileLock2 className="w-4 h-4" strokeWidth={1.5} />
        Anfrage stellen
      </Button>

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
  );
}
