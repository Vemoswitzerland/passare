'use client';

import { useState } from 'react';
import { LayoutGrid, Columns3, BarChart3, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ListingCardMini } from '@/components/kaeufer/listing-card-mini';
import type { MockListing } from '@/lib/listings-mock';
import type { Suchprofil } from '@/lib/match-score';
import { cn } from '@/lib/utils';

type FavoritEntry = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[];
  listing: MockListing;
};

type Props = {
  favoriten: FavoritEntry[];
  suchprofil?: Suchprofil;
};

const STAGES: { key: string; label: string }[] = [
  { key: 'neu', label: 'Neu' },
  { key: 'kontaktiert', label: 'Kontaktiert' },
  { key: 'nda', label: 'NDA' },
  { key: 'dd', label: 'Due Diligence' },
  { key: 'loi', label: 'LOI' },
  { key: 'won', label: 'Gewonnen' },
  { key: 'lost', label: 'Verloren' },
];

export function FavoritenView({ favoriten, suchprofil }: Props) {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const compareEntries = favoriten.filter((f) => selected.includes(f.inserat_id));

  if (favoriten.length === 0) {
    return (
      <div className="bg-paper border border-dashed border-stone rounded-card p-12 text-center">
        <p className="overline text-bronze-ink mb-3">Noch keine Favoriten</p>
        <h3 className="font-serif text-head-md text-navy font-normal mb-3">
          Deine Watchlist ist leer<span className="text-bronze">.</span>
        </h3>
        <p className="text-body-sm text-muted mb-6 max-w-md mx-auto">
          Speichere im Marktplatz alle Inserate, die dich interessieren — hier kannst du sie verwalten, mit Notizen versehen und im Vergleich nebeneinander stellen.
        </p>
        <Link
          href="/kaufen"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
        >
          Zum Marktplatz <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone flex-wrap gap-3">
        <div className="inline-flex bg-paper border border-stone rounded-soft p-0.5">
          <button
            onClick={() => setView('list')}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-soft text-caption font-medium transition-colors',
              view === 'list' ? 'bg-navy text-cream' : 'text-muted hover:text-navy',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
            Liste
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-soft text-caption font-medium transition-colors',
              view === 'kanban' ? 'bg-navy text-cream' : 'text-muted hover:text-navy',
            )}
          >
            <Columns3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Pipeline (Kanban)
          </button>
        </div>

        {selected.length >= 2 && (
          <button
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bronze text-cream rounded-soft text-caption font-medium hover:bg-bronze-ink transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {selected.length} vergleichen
          </button>
        )}

        <p className="font-mono text-caption text-quiet">
          {favoriten.length} Favorit{favoriten.length !== 1 && 'en'}
        </p>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriten.map((f) => (
            <ListingCardMini
              key={f.inserat_id}
              listing={f.listing}
              suchprofil={suchprofil}
              stage={f.stage}
              note={f.note}
              selected={selected.includes(f.inserat_id)}
              onSelect={() => toggleSelect(f.inserat_id)}
            />
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-flow-col auto-cols-[280px] gap-3 min-w-min">
            {STAGES.map((s) => {
              const stageFavs = favoriten.filter((f) => f.stage === s.key);
              return (
                <div key={s.key} className="bg-paper border border-stone rounded-card p-3">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone">
                    <p className="text-caption text-navy font-medium">{s.label}</p>
                    <span className="font-mono text-caption text-quiet">{stageFavs.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {stageFavs.length === 0 && (
                      <p className="text-caption text-quiet italic py-4 text-center">
                        Keine Einträge
                      </p>
                    )}
                    {stageFavs.map((f) => (
                      <KanbanCard key={f.inserat_id} entry={f} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vergleich-Modal */}
      {compareOpen && compareEntries.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="bg-cream max-w-6xl w-full max-h-[90vh] rounded-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone bg-paper">
              <h3 className="font-serif text-head-md text-navy font-normal">
                Vergleich · {compareEntries.length} Inserate
              </h3>
              <button
                onClick={() => setCompareOpen(false)}
                className="p-2 hover:bg-stone/40 rounded-soft transition-colors"
              >
                <X className="w-5 h-5 text-navy" strokeWidth={1.5} />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-6">
              <div className={cn(
                'grid gap-4',
                compareEntries.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3',
              )}>
                {compareEntries.map((e) => (
                  <CompareCard key={e.inserat_id} entry={e} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KanbanCard({ entry }: { entry: FavoritEntry }) {
  return (
    <Link
      href={`/kaufen/${entry.inserat_id}`}
      className="block bg-cream border border-stone rounded-soft p-3 hover:border-bronze transition-colors"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-1">
        {entry.listing.id}
      </p>
      <p className="text-caption text-navy font-medium leading-snug mb-2 line-clamp-2">
        {entry.listing.titel}
      </p>
      <div className="flex items-center justify-between text-caption">
        <span className="text-quiet">{entry.listing.kanton}</span>
        <span className="font-mono text-navy">{entry.listing.umsatz}</span>
      </div>
      {entry.note && (
        <p className="text-caption text-muted italic mt-2 pt-2 border-t border-stone leading-snug line-clamp-2">
          {entry.note}
        </p>
      )}
    </Link>
  );
}

function CompareCard({ entry }: { entry: FavoritEntry }) {
  const l = entry.listing;
  return (
    <div className="bg-paper border border-stone rounded-card overflow-hidden">
      <div className="bg-navy text-cream p-4">
        <p className="font-mono text-caption text-bronze">{l.id} · {l.kanton}</p>
        <p className="font-serif text-body-sm text-cream mt-1 leading-tight">{l.titel}</p>
      </div>
      <dl className="divide-y divide-stone text-body-sm">
        <CompareRow label="Branche" value={l.branche} />
        <CompareRow label="Kanton" value={l.kanton} />
        <CompareRow label="Gegründet" value={String(l.jahr)} />
        <CompareRow label="Mitarbeitende" value={String(l.mitarbeitende)} />
        <CompareRow label="Umsatz" value={l.umsatz} mono />
        <CompareRow label="EBITDA" value={l.ebitda} mono />
        <CompareRow label="Kaufpreis" value={l.kaufpreis} mono />
        <CompareRow label="Übergabegrund" value={l.grund} />
        <CompareRow label="Pipeline-Stage" value={entry.stage} />
      </dl>
    </div>
  );
}

function CompareRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="overline text-quiet">{label}</dt>
      <dd className={cn('text-navy', mono && 'font-mono font-medium')}>{value}</dd>
    </div>
  );
}
