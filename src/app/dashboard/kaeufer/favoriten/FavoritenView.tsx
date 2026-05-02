'use client';

import { useState } from 'react';
import { LayoutGrid, Columns3, BarChart3, X } from 'lucide-react';
import Link from 'next/link';
import { ListingCardMini } from '@/components/kaeufer/listing-card-mini';
import type { InseratPublic } from '@/lib/listings';
import type { Suchprofil } from '@/lib/match-score';
import { cn } from '@/lib/utils';

type FavoritEntry = {
  inserat_id: string;
  stage: string;
  note: string | null;
  tags: string[];
  listing: InseratPublic;
};

type Props = {
  favoriten: FavoritEntry[];
  suchprofil?: Suchprofil;
};

const STAGES: { key: string; label: string }[] = [
  { key: 'neu', label: 'Neu' },
  { key: 'kontaktiert', label: 'Kontaktiert' },
  { key: 'dd', label: 'Due Diligence' },
  { key: 'loi', label: 'LOI' },
  { key: 'won', label: 'Gewonnen' },
  { key: 'lost', label: 'Verloren' },
];

/** Kaufpreis-Display: VHB > Bucket > "—" (Client-side, ohne Server-Helper). */
function displayKaufpreis(l: InseratPublic): string {
  if (l.kaufpreis_vhb) return 'VHB';
  return l.kaufpreis_bucket ?? '—';
}

/** EBITDA-Display: Marge in % oder "—". */
function displayEbitda(l: InseratPublic): string {
  if (l.ebitda_marge_pct == null) return '—';
  return `${l.ebitda_marge_pct.toFixed(1)} %`;
}

/** Umsatz-Display: Bucket oder "—". */
function displayUmsatz(l: InseratPublic): string {
  return l.umsatz_bucket ?? '—';
}

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
  const l = entry.listing;
  return (
    <Link
      href={`/kaufen/${l.slug ?? l.id}`}
      className="block bg-cream border border-stone rounded-soft p-3 hover:border-bronze transition-colors"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-1">
        {l.id}
      </p>
      <p className="text-caption text-navy font-medium leading-snug mb-2 line-clamp-2">
        {l.titel}
      </p>
      <div className="flex items-center justify-between text-caption">
        <span className="text-quiet">{l.kanton ?? '—'}</span>
        <span className="font-mono text-navy">{displayUmsatz(l)}</span>
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
        <p className="font-mono text-caption text-bronze">{l.id} · {l.kanton ?? '—'}</p>
        <p className="font-serif text-body-sm text-cream mt-1 leading-tight">{l.titel}</p>
      </div>
      <dl className="divide-y divide-stone text-body-sm">
        <CompareRow label="Branche" value={l.branche_id ?? '—'} />
        <CompareRow label="Kanton" value={l.kanton ?? '—'} />
        <CompareRow label="Gegründet" value={l.jahr != null ? String(l.jahr) : '—'} />
        <CompareRow label="Mitarbeitende" value={l.mitarbeitende_bucket ?? '—'} />
        <CompareRow label="Umsatz" value={displayUmsatz(l)} mono />
        <CompareRow label="EBITDA" value={displayEbitda(l)} mono />
        <CompareRow label="Kaufpreis" value={displayKaufpreis(l)} mono />
        <CompareRow label="Übergabegrund" value={l.uebergabe_grund ?? '—'} />
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
