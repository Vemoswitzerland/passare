'use client';

import { useState, useRef } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  currentUrl: string | null;
};

export function LogoUpload({ currentUrl }: Props) {
  const [url, setUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX = 3 * 1024 * 1024;

  const upload = async (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError('Nur JPG, PNG oder WebP erlaubt.');
      return;
    }
    if (file.size > MAX) {
      setError('Datei zu gross (max 3 MB).');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/kaeufer/upload-logo', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Upload fehlgeschlagen');
      } else {
        // Cache-Bust: Browser sonst unter Umständen mit altem Logo gecached.
        setUrl(`${json.url}?v=${Date.now()}`);
      }
    } catch {
      setError('Verbindung fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch('/api/kaeufer/upload-logo', { method: 'DELETE' });
      if (res.ok) {
        setUrl(null);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Löschen fehlgeschlagen');
      }
    } catch {
      setError('Löschen fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-paper border border-stone rounded-card p-6">
      <div className="flex items-start gap-5">
        <div
          className={cn(
            'w-20 h-20 rounded-soft border flex items-center justify-center flex-shrink-0 overflow-hidden',
            url ? 'border-bronze/30 bg-cream' : 'border-dashed border-stone bg-stone/20',
          )}
        >
          {url ? (
            <img
              src={url}
              alt="Käufer-Logo"
              width={80}
              height={80}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          ) : (
            <ImagePlus className="w-6 h-6 text-quiet" strokeWidth={1.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-navy font-medium mb-1">
            {url ? 'Logo aktiv' : 'Logo hochladen'}
          </p>
          <p className="text-caption text-muted mb-3 leading-relaxed">
            JPG, PNG oder WebP · max 3 MB. Wird neben deinem Namen bei Anfragen und im Käuferprofil angezeigt.
          </p>

          <div className="flex items-center gap-3">
            <input
              ref={ref}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => ref.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              {url ? 'Ersetzen' : 'Hochladen'}
            </button>

            {url && (
              <button
                type="button"
                disabled={uploading}
                onClick={remove}
                className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-danger transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                Entfernen
              </button>
            )}
          </div>

          {error && (
            <p className="text-caption text-danger mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
