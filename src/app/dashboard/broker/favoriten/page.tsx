import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { getFavoritenListings, type InseratPublic } from '@/lib/listings';
import type { Suchprofil } from '@/lib/match-score';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';
import { FavoritenView } from '../../kaeufer/favoriten/FavoritenView';

export const metadata = { title: 'Favoriten — passare Broker', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type FavoritEntry = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[];
  listing: InseratPublic;
};

export default async function BrokerFavoritenPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

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
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto space-y-6">
        <div>
          <p className="overline text-bronze-ink mb-2">Suchen · Watchlist</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Favoriten
          </h1>
          <p className="text-body-sm text-muted mt-2 max-w-2xl">
            Inserate, die du für deine Käufer-Mandate gespeichert hast — mit Notizen, Pipeline-Stages und Vergleich.
          </p>
        </div>

        {favoriten.length === 0 ? (
          <MarketplaceEmpty variant="kaeufer-favoriten" />
        ) : (
          <FavoritenView favoriten={favoriten} suchprofil={suchprofil ?? undefined} />
        )}
      </div>
    </div>
  );
}
