'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [searchValue, setSearchValue] = useState('');
  const userRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('admin-search-input')?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  const initials =
    fullName
      ?.split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  return (
    <header className="h-12 border-b border-stone bg-cream/85 backdrop-blur-md sticky top-0 z-40 flex items-center px-3 md:px-4 gap-3 md:gap-5">
      <button
        type="button"
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-2 rounded-soft hover:bg-stone/40 transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5 text-navy" strokeWidth={1.5} />
      </button>

      <Link href="/admin" className="text-base text-navy font-semibold tracking-tight flex-shrink-0">
        passare<span className="text-bronze">.</span>
        <span className="ml-1.5 text-[11px] uppercase tracking-wider text-quiet font-medium">
          Admin
        </span>
      </Link>

      <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
          <input
            id="admin-search-input"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="User, Inserate, Anfragen …  (Cmd+K)"
            className="w-full pl-8 pr-3 py-1 bg-paper border border-stone rounded-soft text-[13px] placeholder:text-quiet focus:outline-none focus:border-bronze"
          />
        </div>
      </form>

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
            <span className="w-7 h-7 rounded-full bg-navy text-cream flex items-center justify-center text-[11px] font-mono font-medium">
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
