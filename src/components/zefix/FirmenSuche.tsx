'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  // Position berechnen — Portal-Dropdown wird absolut zum Viewport positioniert
  useLayoutEffect(() => {
    if (!open) return;
    function updatePos() {
      if (!inputWrapRef.current) return;
      const rect = inputWrapRef.current.getBoundingClientRect();
      setPos({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8, // 8px gap
        width: rect.width,
      });
    }
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, hits.length, loading, query]);

  // Click-outside close — auch Klicks im Portal-Dropdown gelten als "drinnen"
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
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
      const res = await fetch(`/api/zefix/search?q=${encodeURIComponent(q)}&limit=12`, {
        signal: ctrl.signal,
      });
      // Wenn dieser Request abgebrochen wurde (User hat weitergetippt),
      // KEIN State-Update — sonst überschreibt diese stale Antwort die
      // gerade laufende neue Suche und User sieht "Keine Treffer" obwohl
      // gerade neu gesucht wird.
      if (ctrl.signal.aborted) return;

      if (!res.ok) {
        setHits([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (ctrl.signal.aborted) return;
      setHits(Array.isArray(data?.hits) ? data.hits : []);
      setActive(0);
      setLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Stale request — NICHT loading auf false setzen
        return;
      }
      console.error(err);
      if (!ctrl.signal.aborted) {
        setHits([]);
        setLoading(false);
      }
    }
  }, []);

  // Debounce
  // WICHTIG: Sobald sich Query ändert (≥3 Zeichen), setzen wir SOFORT
  // loading=true und clearen alte Hits — sonst bleiben für ~300ms+ alte
  // Treffer ohne Hinweis sichtbar und der User denkt "es sucht gar nicht".
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setLoading(false);
      return;
    }
    if (trimmed.length < 3) {
      setHits([]);
      setLoading(false);
      return;
    }
    // Sofort: alte Hits weg, Spinner an
    setHits([]);
    setLoading(true);
    setActive(0);

    const t = window.setTimeout(() => search(trimmed), 280);
    return () => window.clearTimeout(t);
  }, [query, search]);

  function handleSelect(hit: FirmaHit) {
    setQuery(hit.name ?? hit.uid ?? '');
    setOpen(false);
    onSelect(hit);
  }

  const showDropdown = open && (hits.length > 0 || loading || (query.trim().length >= 3));

  return (
    <div ref={ref} className="relative w-full">
      <div ref={inputWrapRef} className="relative">
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
      </div>

      {/* Dropdown via Portal — umgeht alle Stacking-Contexts der Parents
          (insb. animate-fade-up via transform, das einen neuen Context schafft) */}
      {mounted && showDropdown && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            left: pos.left,
            top: pos.top,
            width: pos.width,
            zIndex: 9999,
          }}
          className="bg-paper border border-stone rounded-card shadow-lift overflow-hidden animate-fade-in"
        >
          {hits.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-body-sm text-quiet">
              Keine Treffer für «{query}» — Tipp: Name vollständiger eintippen oder UID verwenden.
            </div>
          ) : hits.length === 0 && loading ? (
            <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-bronze animate-spin" strokeWidth={1.5} />
              <p className="text-body-sm text-muted">Wir durchsuchen das Handelsregister …</p>
              <div className="w-full max-w-xs h-1 bg-stone rounded-pill overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-bronze to-transparent animate-progress-slide" />
              </div>
            </div>
          ) : (
            <>
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
              {loading && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-stone/60 bg-cream/60">
                  <Loader2 className="w-3.5 h-3.5 text-bronze animate-spin" strokeWidth={1.5} />
                  <span className="text-caption text-muted">Wir suchen weiter …</span>
                </div>
              )}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
