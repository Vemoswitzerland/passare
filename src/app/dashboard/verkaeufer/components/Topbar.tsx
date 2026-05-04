'use client';

import Link from 'next/link';
import { Menu, Store } from 'lucide-react';

type Props = {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  onMenuToggle: () => void;
  syncStatus?: 'ok' | 'syncing';
};

/**
 * Verkäufer-Topbar — schlank.
 *
 * Topbar enthält: Mobile-Menü-Toggle, Marktplatz-Knopf.
 * Notifications-Bell wurde entfernt — funktional nicht aktiv.
 */
export function VerkaeuferTopbar({
  email: _email, fullName: _fullName, isAdmin: _isAdmin, onMenuToggle,
  syncStatus: _syncStatus,
}: Props) {
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
        {/* Marktplatz-Knopf — Sprung zur öffentlichen Börse. */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft text-caption font-medium text-muted hover:text-navy hover:bg-stone/40 transition-colors"
          title="Zum öffentlichen Marktplatz"
        >
          <Store className="w-4 h-4" strokeWidth={1.5} />
          Marktplatz
        </Link>
      </div>
    </header>
  );
}
