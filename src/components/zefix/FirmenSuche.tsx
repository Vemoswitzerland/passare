'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FirmaHit = {
  uid: string | null;
  name: string | null;
  rechtsform: string | null;
  ort: string | null;
  kanton: string | null;
};

type Props = {
  onSelect: (hit: FirmaHit) => void;
  placeholder?: string;
};

/**
 * Firmen-Suche-Combobox mit Live-Zefix-Autocomplete.
 * Debounced 300ms, min 3 Zeichen, max 8 Treffer.
 */
export function FirmenSuche({ onSelect, placeholder = 'Firma suchen (Name oder UID) …' }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<FirmaHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Click-outside close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setHits([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const res = await fetch(`/api/zefix/search?q=${encodeURIComponent(q)}&limit=8`, {
        signal: ctrl.signal,
      });
      if (!res.ok) {
        setHits([]);
        return;
      }
      const data = await res.json();
      setHits(Array.isArray(data?.hits) ? data.hits : []);
      setActive(0);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error(err);
        setHits([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => search(query), 300);
    return () => window.clearTimeout(t);
  }, [query, search]);

  function handleSelect(hit: FirmaHit) {
    setQuery(hit.name ?? hit.uid ?? '');
    setOpen(false);
    onSelect(hit);
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim().length >= 3 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && hits[active]) {
              e.preventDefault();
              handleSelect(hits[active]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-4 bg-paper border border-stone rounded-soft text-body text-ink placeholder-quiet focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
        />
        {loading && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex"
            aria-hidden="true"
          >
            <Loader2
              className="w-4 h-4 text-bronze animate-spin"
              strokeWidth={1.5}
            />
          </span>
        )}
      </div>

      {open && (hits.length > 0 || (query.trim().length >= 3 && !loading)) && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-paper border border-stone rounded-card shadow-lift overflow-hidden animate-fade-in">
          {hits.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-body-sm text-quiet">
              Keine Treffer für «{query}» — Tipp: Name vollständiger eintippen oder UID verwenden.
            </div>
          ) : (
            <ul role="listbox" className="divide-y divide-stone/60 max-h-96 overflow-y-auto">
              {hits.map((h, i) => (
                <li key={(h.uid ?? '') + i}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onClick={() => handleSelect(h)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'w-full px-4 py-3 text-left flex items-start gap-3 transition-colors',
                      i === active ? 'bg-bronze/10' : 'hover:bg-stone/30',
                    )}
                  >
                    <Building2 className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-navy font-medium truncate">{h.name}</p>
                      <p className="text-caption text-quiet font-mono truncate flex items-center gap-2 mt-0.5">
                        <span>{h.uid}</span>
                        <span>·</span>
                        <span>{h.rechtsform}</span>
                        {h.ort && (
                          <>
                            <span>·</span>
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            <span>{h.ort}</span>
                            {h.kanton && <span>· {h.kanton}</span>}
                          </>
                        )}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-cream border-t border-stone text-caption text-quiet">
            Daten aus dem Schweizer Handelsregister (Zefix)
          </div>
        </div>
      )}
    </div>
  );
}
