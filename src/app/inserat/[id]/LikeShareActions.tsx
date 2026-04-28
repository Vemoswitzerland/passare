'use client';

import { useState } from 'react';
import { Check, Heart, Share2 } from 'lucide-react';
import { LoginRequiredDialog } from '@/components/marketplace/LoginRequiredDialog';
import { useAuthUser } from '@/components/marketplace/use-auth-user';

/**
 * Merken (Like) + Teilen (Share) Buttons im ContactPanel der Detail-Seite.
 *
 * Merken erfordert ein Konto — bei Klick als nicht-eingeloggter User öffnet
 * sich der LoginRequiredDialog. Teilen bleibt immer offen.
 */

type Props = {
  listingId: string;
  titel: string;
  branche: string;
  kanton: string;
  umsatz: string;
};

export function LikeShareActions({
  listingId, titel, branche, kanton, umsatz,
}: Props) {
  const { isLoggedIn } = useAuthUser();
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  function toggleLike() {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    setLiked((v) => !v);
  }

  async function share() {
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
        setTimeout(() => setCopied(false), 2200);
      } catch {
        /* nichts */
      }
    }
  }

  return (
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

      <LoginRequiredDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        intent="merken"
      />
    </div>
  );
}
