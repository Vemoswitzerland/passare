'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, Search, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { ViewSwitcher } from './ViewSwitcher';
import { logoutAction } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  onMenuToggle: () => void;
};

export function AdminHeader({ email, fullName, onMenuToggle }: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const initials =
    fullName
      ?.split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || email.slice(0, 2).toUpperCase();

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

      <Link href="/admin" className="font-serif text-2xl text-navy tracking-tight flex-shrink-0">
        passare<span className="text-bronze">.</span>
        <span className="ml-2 text-caption font-sans uppercase tracking-wider text-quiet font-normal">
          Admin
        </span>
      </Link>

      <div className="hidden lg:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-quiet" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Suche … (Cmd+K)"
            disabled
            className="w-full pl-10 pr-3 py-2 bg-paper border border-stone rounded-soft text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ViewSwitcher />

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
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-body-sm text-ink hover:bg-stone/30 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserIcon className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                  Mein Konto
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
