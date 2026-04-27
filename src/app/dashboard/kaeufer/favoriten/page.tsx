import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { MOCK_LISTINGS, type MockListing } from '@/lib/listings-mock';
import type { Suchprofil } from '@/lib/match-score';
import { FavoritenView } from './FavoritenView';

export const metadata = { title: 'Favoriten — Käufer · passare', robots: { index: false, follow: false } };

type FavoritRow = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[] | null;
  created_at: string;
};

type FavoritEntry = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[];
  listing: MockListing;
};

export default async function FavoritenPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  // Favoriten aus DB laden
  let favRows: FavoritRow[] = [];
  if (await hasTable('favoriten')) {
    const { data } = await supabase
      .from('favoriten')
      .select('inserat_id, stage, note, tags, created_at')
      .eq('kaeufer_id', u.user.id)
      .order('created_at', { ascending: false });
    favRows = data ?? [];
  }

  // Mit Mock-Listings joinen (defensive: solange `inserate`-Tabelle aus Chat 2 nicht existiert)
  const listingMap = new Map(MOCK_LISTINGS.map((l) => [l.id, l]));
  const favoriten: FavoritEntry[] = favRows
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

      <FavoritenView favoriten={favoriten} suchprofil={suchprofil ?? undefined} />
    </div>
  );
}
