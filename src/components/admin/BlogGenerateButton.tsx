'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateBlogPostAction } from '@/app/admin/blog/actions';
import { BLOG_KATEGORIEN } from '@/data/blog-topics';

export function BlogGenerateButton() {
  const [pending, setPending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [topic, setTopic] = useState('');
  const [kategorie, setKategorie] = useState('');

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await generateBlogPostAction(fd);
          // generateBlogPostAction redirected — wir kommen nur hierher bei Fehler
        } catch (e) {
          alert((e as Error).message);
          setPending(false);
        }
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="bronze" size="md" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              KI schreibt …
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              Blog-Artikel generieren
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1 px-3 py-2 text-caption text-quiet hover:text-navy transition-colors"
        >
          {showAdvanced ? 'weniger' : 'Thema vorgeben'}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            strokeWidth={1.5}
          />
        </button>
        <span className="text-caption text-quiet ml-auto">
          ≈ 30 Sekunden · CHF 0.05 pro Artikel
        </span>
      </div>

      {showAdvanced && (
        <div className="grid sm:grid-cols-[1fr_180px] gap-3 pt-2 border-t border-stone/60">
          <div>
            <label className="overline text-quiet block mb-1.5">Eigenes Thema</label>
            <input
              type="text"
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z. B. «Wie funktioniert die indirekte Teilliquidation?»"
              className="w-full px-3 py-2 bg-paper border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze"
              disabled={pending}
            />
          </div>
          <div>
            <label className="overline text-quiet block mb-1.5">Kategorie</label>
            <select
              name="kategorie"
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze"
              disabled={pending}
            >
              <option value="">— auto —</option>
              {BLOG_KATEGORIEN.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <p className="sm:col-span-2 text-caption text-quiet">
            Leer lassen → die KI würfelt aus dem passare-Themen-Katalog (rund
            40 Themen aus Nachfolge, Verkauf, Kauf, Bewertung, Recht, Steuern,
            Erfahrungsberichten).
          </p>
        </div>
      )}
    </form>
  );
}
