import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getFavoritenListings, type InseratPublic } from '@/lib/listings';
import type { Suchprofil } from '@/lib/match-score';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';
import { FavoritenView } from './FavoritenView';

export const metadata = { title: 'Favoriten — Käufer · passare', robots: { index: false, follow: false } };

type FavoritEntry = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[];
  listing: InseratPublic;
};

export default async function FavoritenPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  // Favoriten + zugehörige Inserate aus DB laden (Helper macht den Join)
  let favoriten: FavoritEntry[] = [];
  if (await hasTable('favoriten')) {
    const { favoriten: favRows, listings: listingMap } = await getFavoritenListings(u.user.id);
    favoriten = favRows
      .map((f) => {
        const listing = listingMap.get(f.inserat_id);
        if (!listing) return null;
        return {
          inserat_id: f.inserat_id,
          stage: f.stage,
          note: f.note,
          tags: f.tags ?? [],
          listing,
        };
      })
      .filter((x): x is FavoritEntry => x !== null);
  }

  // Suchprofil für Match-Score laden
  let suchprofil: Suchprofil | null = null;
  if (await hasTable('suchprofile')) {
    const { data } = await supabase
      .from('suchprofile')
      .select('branche, kantone, umsatz_min, umsatz_max, ebitda_min')
      .eq('kaeufer_id', u.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      suchprofil = {
        branche: data.branche ?? [],
        kantone: data.kantone ?? [],
        umsatz_min: data.umsatz_min,
        umsatz_max: data.umsatz_max,
        ebitda_min: data.ebitda_min,
      };
    }
  }

  return (
    <div className="space-y-6 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Watchlist · Pipeline · Vergleich</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Favoriten<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Alle Inserate die du gespeichert hast — mit Notizen, Pipeline-Stages (Neu → Kontaktiert → NDA → DD → LOI → Won) und Vergleichs-Funktion (max. 3 nebeneinander).
        </p>
      </div>

      {favoriten.length === 0 ? (
        <MarketplaceEmpty variant="kaeufer-favoriten" />
      ) : (
        <FavoritenView favoriten={favoriten} suchprofil={suchprofil ?? undefined} />
      )}
    </div>
  );
}
