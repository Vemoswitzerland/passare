'use client';

import Link from 'next/link';
import {
  Menu, Search, Bell, Crown, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  isMax: boolean;
  isAdmin: boolean;
  onMenuToggle: () => void;
};

/**
 * Käufer-Topbar — Profil + Logout sind NICHT mehr hier oben rechts,
 * sondern unten in der Sidebar (siehe SidebarAccountFooter in shell.tsx).
 * Cyrill: «Profil bei jedem Dashboard nicht oben — sondern unten».
 *
 * Topbar enthält jetzt nur noch: Mobile-Menü-Toggle, Logo, Käufer-Badge,
 * Such-Link zum Marktplatz, Marktplatz-Knopf, Notifications-Bell.
 */
export function KaeuferTopbar({ email: _email, fullName: _fullName, isMax, isAdmin: _isAdmin, onMenuToggle }: Props) {
  return (
    <header className="h-16 border-b border-stone bg-cream/85 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 md:px-6 gap-3 md:gap-6">
      <button
        type="button"
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-2 rounded-soft hover:bg-stone/40 transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5 text-navy" strokeWidth={1.5} />
      </button>

      <Link href="/dashboard/kaeufer" className="font-serif text-2xl text-navy tracking-tight flex-shrink-0">
        passare<span className="text-bronze">.</span>
      </Link>

      <span className={cn(
        'hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-soft text-[10px] uppercase tracking-widest font-mono font-medium leading-none',
        isMax
          ? 'bg-bronze-soft text-bronze-ink border border-bronze/30'
          : 'border border-stone text-quiet',
      )}>
        {isMax && <Crown className="w-2.5 h-2.5" strokeWidth={2} />}
        {isMax ? 'Käufer MAX' : 'Käufer'}
      </span>

      <div className="hidden lg:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet" strokeWidth={1.5} />
          <Link
            href="/kaufen"
            className="block w-full pl-10 pr-3 py-2 bg-paper border border-stone rounded-soft text-body-sm text-quiet hover:border-bronze transition-colors"
          >
            Inserate suchen …
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Schneller Sprung zur öffentlichen Börse — Pattern wie LinkedIn /
            Stripe («Visit profile» / «View public site»). */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft text-caption font-medium text-muted hover:text-navy hover:bg-stone/40 transition-colors"
          title="Zum öffentlichen Marktplatz"
        >
          <Store className="w-4 h-4" strokeWidth={1.5} />
          Marktplatz
        </Link>

        {/* Notifications-Bell (Stub — kommt mit Push-Notifications) */}
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
