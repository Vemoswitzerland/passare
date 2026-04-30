'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  Menu, ChevronDown, LogOut, User as UserIcon, Bell, Eye,
  ShieldCheck, Store, Search,
} from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  onMenuToggle: () => void;
  syncStatus?: 'ok' | 'syncing';
};

export function VerkaeuferTopbar({
  email, fullName, isAdmin, onMenuToggle, syncStatus = 'ok',
}: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) setViewMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials =
    fullName
      ?.split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  const switchView = (target: 'admin' | 'verkaeufer' | 'kaeufer') => {
    setViewMenuOpen(false);
    if (target === 'admin') {
      document.cookie = 'admin_impersonation=; Path=/; Max-Age=0; SameSite=Lax';
      window.location.href = '/admin';
    } else if (target === 'verkaeufer') {
      document.cookie = 'admin_impersonation=verkaeufer; Path=/; Max-Age=86400; SameSite=Lax';
      window.location.href = '/dashboard/verkaeufer';
    } else {
      document.cookie = 'admin_impersonation=kaeufer; Path=/; Max-Age=86400; SameSite=Lax';
      window.location.href = '/dashboard/kaeufer';
    }
  };

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
        {/* Schneller Sprung zur öffentlichen Börse — Pattern wie LinkedIn /
            Stripe («View public site»). Cyrill: «aus dem Bereich kein Weg
            zur Börse — gibt mir einen Knopf». */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-soft text-caption font-medium text-muted hover:text-navy hover:bg-stone/40 transition-colors"
          title="Zum öffentlichen Marktplatz"
        >
          <Store className="w-4 h-4" strokeWidth={1.5} />
          Marktplatz
        </Link>

        <button
          type="button"
          className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-soft hover:bg-stone/40 transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell className="w-4 h-4 text-navy" strokeWidth={1.5} />
        </button>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="inline-flex items-center gap-2 px-2 py-1.5 rounded-soft hover:bg-stone/40 transition-colors"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="w-8 h-8 rounded-full bg-navy text-cream flex items-center justify-center text-caption font-mono font-medium">
              {initials}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-quiet transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} strokeWidth={1.5} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-paper border border-stone rounded-card shadow-lift py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-stone">
                {fullName && <p className="text-body-sm text-navy font-medium truncate">{fullName}</p>}
                <p className="text-caption text-quiet font-mono truncate">{email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/verkaeufer/settings"
                  className="flex items-center gap-3 px-4 py-2 text-body-sm text-ink hover:bg-stone/30 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserIcon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                  Einstellungen
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-2 text-body-sm text-ink hover:bg-stone/30 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                    Abmelden
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ViewOption({
  label, desc, icon: Icon, active, onClick,
}: {
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors',
        active ? 'bg-stone/40' : 'hover:bg-stone/30',
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-soft flex items-center justify-center flex-shrink-0 mt-0.5',
        active ? 'bg-bronze/20' : 'bg-stone/50',
      )}>
        <Icon className={cn('w-4 h-4', active ? 'text-bronze-ink' : 'text-navy')} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-body-sm', active ? 'text-navy font-medium' : 'text-ink')}>{label}</p>
        <p className="text-caption text-quiet mt-0.5">{desc}</p>
      </div>
      {active && <Eye className="w-3.5 h-3.5 text-bronze flex-shrink-0 mt-1.5" strokeWidth={1.5} />}
    </button>
  );
}
