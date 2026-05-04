'use client';

import Link from 'next/link';
import { Menu, Store, ExternalLink } from 'lucide-react';

type Props = {
  onMenuToggle: () => void;
  /** Slug des eigenen Broker-Profils — wenn vorhanden zeigen wir den Public-Link. */
  publicProfileSlug?: string | null;
};

export function BrokerTopbar({ onMenuToggle, publicProfileSlug }: Props) {
  return (
    <header className="h-16 border-b border-stone bg-paper/85 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 md:px-6 gap-3 md:gap-6">
      <button
        type="button"
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-2 rounded-soft hover:bg-stone/40 transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5 text-navy" strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {publicProfileSlug && (
          <Link
            href={`/broker/${publicProfileSlug}`}
            target="_blank"
            rel="noopener"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft text-caption font-medium text-muted hover:text-navy hover:bg-stone/40 transition-colors"
            title="Eigenes Public-Profil im neuen Tab öffnen"
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            Public-Profil ansehen
          </Link>
        )}
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft text-caption font-medium text-muted hover:text-navy hover:bg-stone/40 transition-colors"
          title="Marktplatz im neuen Tab öffnen"
        >
          <Store className="w-4 h-4" strokeWidth={1.5} />
          Marktplatz
        </Link>
      </div>
    </header>
  );
}
