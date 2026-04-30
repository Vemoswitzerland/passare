'use client';

import Link from 'next/link';
import {
  Menu, Bell, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  onMenuToggle: () => void;
  syncStatus?: 'ok' | 'syncing';
};

/**
 * Verkäufer-Topbar — Profil + Logout sind NICHT mehr hier oben rechts,
 * sondern unten in der Sidebar (siehe SidebarAccountFooter in Shell.tsx).
 * Cyrill: «Profil bei jedem Dashboard nicht oben — sondern unten».
 *
 * Topbar enthält jetzt nur: Mobile-Menü-Toggle, Verkäufer-Badge,
 * Sync-Indikator, Marktplatz-Knopf, Notifications-Bell.
 */
export function VerkaeuferTopbar({
  email: _email, fullName: _fullName, isAdmin: _isAdmin, onMenuToggle, syncStatus = 'ok',
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

      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-caption font-medium bg-navy-soft text-navy border border-navy/15">
        Verkäufer
      </span>

      <div className="flex-1 hidden md:flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-caption text-muted">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            syncStatus === 'ok' ? 'bg-success animate-pulse-dot' : 'bg-warn',
          )} />
          {syncStatus === 'ok' ? 'Live' : 'Synchronisiert …'}
        </span>
      </div>

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

        {/* Notifications-Bell (Stub) */}
        <button
          type="button"
          className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-soft hover:bg-stone/40 transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell className="w-4 h-4 text-navy" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
