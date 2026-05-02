'use client';

import { useEffect, useState } from 'react';
import { Check, Heart, Share2 } from 'lucide-react';
import { LoginRequiredDialog } from './LoginRequiredDialog';
import { useAuthUser } from './use-auth-user';
import { addFavoritAction, removeFavoritAction } from '@/app/dashboard/kaeufer/favoriten/actions';

/**
 * Like + Teilen Buttons auf einer Marktplatz-Karte.
 *
 * Liken erfordert ein Konto — bei Klick als nicht-eingeloggter User öffnet sich
 * der LoginRequiredDialog (OAuth + Login/Register). Bei eingeloggtem User wird
 * der Like in der `favoriten`-Tabelle persistiert (echtes Merken, nicht nur
 * lokales React-State).
 */

type Props = {
  listingId: string;
  titel: string;
  branche: string;
  kanton: string;
  umsatz: string;
};

export function CardActions({ listingId, titel, branche, kanton, umsatz }: Props) {
  const { isLoggedIn, loading } = useAuthUser();
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Initial-Status aus DB laden (wenn eingeloggt) — damit Heart-State stimmt
  useEffect(() => {
    if (loading || !isLoggedIn) return;
    fetch(`/api/favoriten/check?inserat_id=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((d) => setLiked(!!d.liked))
      .catch(() => {});
  }, [loading, isLoggedIn, listingId]);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    if (pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set('inserat_id', listingId);
    const action = liked ? removeFavoritAction : addFavoritAction;
    const result = await action(fd);
    setPending(false);
    if (result.ok) setLiked((v) => !v);
  }

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/inserat/${listingId}`
        : `https://passare.ch/inserat/${listingId}`;
    const data = {
      title: titel,
      text: `${titel} · ${branche} · Kanton ${kanton} · ${umsatz} Umsatz`,
      url,
    };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(data);
        return;
      } catch {
        /* abgebrochen */
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* nichts */
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? 'Inserat gemerkt' : 'Inserat merken'}
        className={`px-3 py-2 border rounded-soft transition-colors disabled:opacity-50 ${
          liked
            ? 'border-bronze bg-bronze/10 text-bronze-ink'
            : 'border-stone text-muted hover:border-bronze hover:text-bronze'
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`}
          strokeWidth={1.5}
        />
      </button>
      <button
        type="button"
        onClick={share}
        aria-label="Inserat teilen"
        className="px-3 py-2 border border-stone rounded-soft text-muted hover:border-bronze hover:text-bronze transition-colors"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
        ) : (
          <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        )}
      </button>

      <LoginRequiredDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        intent="merken"
      />
    </>
  );
}
