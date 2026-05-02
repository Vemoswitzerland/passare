'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuthUser } from '@/components/marketplace/use-auth-user';
import { LoginRequiredDialog } from '@/components/marketplace/LoginRequiredDialog';
import { addFavoritAction, removeFavoritAction } from '@/app/dashboard/kaeufer/favoriten/actions';

/**
 * Heart-Button für ListingCardMini.
 *
 * Vorher: hardcoded "fill-bronze" + leerer onClick → konnte nicht
 * gedrückt werden, zeigte fälschlich "gemerkt" für jedes Inserat.
 *
 * Jetzt: lädt initial-State aus DB (Favoriten-Tabelle), toggelt echt
 * über Server-Action, zeigt Login-Dialog für nicht eingeloggte User.
 */
export function CardLikeButton({ listingId }: { listingId: string }) {
  const { isLoggedIn, loading } = useAuthUser();
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (loading || !isLoggedIn) return;
    fetch(`/api/favoriten/check?inserat_id=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((d) => setLiked(!!d.liked))
      .catch(() => {});
  }, [loading, isLoggedIn, listingId]);

  async function toggle(e: React.MouseEvent) {
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

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        className={`px-2.5 py-2 border rounded-soft transition-colors disabled:opacity-50 ${
          liked
            ? 'border-bronze bg-bronze/10 text-bronze'
            : 'border-stone text-quiet hover:border-bronze hover:text-bronze'
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 ${liked ? 'fill-bronze' : ''}`}
          strokeWidth={1.5}
        />
      </button>
      <LoginRequiredDialog open={loginOpen} onClose={() => setLoginOpen(false)} intent="merken" />
    </>
  );
}
