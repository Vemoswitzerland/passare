'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { SidebarUserFooter } from './SidebarUserFooter';
import { ImpersonationBanner } from './ImpersonationBanner';
import { ViewSwitcher } from './ViewSwitcher';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  badges?: Partial<Record<string, string | number>>;
  children: React.ReactNode;
};

/**
 * Admin-Layout: Sidebar links (mit User-Footer unten links für Logout/Profil),
 * minimaler Top-Bar (nur Logo + Suche + ViewSwitcher).
 *
 * Pattern wie app.vemo.ch / Slack / Linear / Notion: Account-Menü unten links,
 * nicht oben rechts. Klar getrennt von Navigation.
 */
export function AdminShell({ email, fullName, badges, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const userFooter = <SidebarUserFooter email={email} fullName={fullName} />;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="admin-scope min-h-screen flex flex-col bg-cream">
      {/* Minimal Top-Bar: nur Logo + Suche + ViewSwitcher (kein User-Menü oben) */}
      <header className="h-12 border-b border-stone bg-cream/85 backdrop-blur-md sticky top-0 z-40 flex items-center px-3 md:px-4 gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
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
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="User, Inserate, Anfragen …  (Cmd+K)"
              className="w-full pl-8 pr-3 py-1 bg-paper border border-stone rounded-soft text-[13px] placeholder:text-quiet focus:outline-none focus:border-bronze"
            />
          </div>
        </form>

        <div className="ml-auto">
          <ViewSwitcher />
        </div>
      </header>

      <ImpersonationBanner />

      <div className="flex-1 grid md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block border-r border-stone bg-paper sticky top-12 self-start h-[calc(100vh-3rem)]">
          <AdminSidebar badges={badges} userFooter={userFooter} />
        </aside>

        <main className="min-w-0 p-3 md:p-5">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-paper border-r border-stone transition-transform flex flex-col',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="h-12 border-b border-stone flex items-center justify-between px-3 flex-shrink-0">
            <span className="text-base text-navy font-semibold">
              passare<span className="text-bronze">.</span>
              <span className="ml-1.5 text-[11px] uppercase tracking-wider text-quiet font-medium">
                Admin
              </span>
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 -mr-2 rounded-soft hover:bg-stone/40 transition-colors"
              aria-label="Menü schließen"
            >
              <X className="w-5 h-5 text-navy" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AdminSidebar
              badges={badges}
              onNavigate={() => setDrawerOpen(false)}
              userFooter={userFooter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
