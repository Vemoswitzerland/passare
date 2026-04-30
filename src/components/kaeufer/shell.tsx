'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { KaeuferTopbar } from './topbar';
import { SidebarNav, type SidebarCounts } from './sidebar-nav';
import { SidebarAccountFooter } from '@/components/ui/SidebarAccountFooter';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  isMax: boolean;
  isAdmin: boolean;
  counts?: SidebarCounts;
  children: React.ReactNode;
};

export function KaeuferShell({ email, fullName, isMax, isAdmin, counts, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cyrill: «Profil bei jedem Dashboard nicht oben — Ausloggen + Profil
  // bearbeiten unten». Pattern wie Admin/Slack/Linear.
  const accountFooter = (
    <SidebarAccountFooter
      email={email}
      fullName={fullName}
      profileHref="/dashboard/kaeufer/profil"
      profileLabel="Käufer-Profil"
      secondary={{
        href: '/dashboard/kaeufer/abo',
        label: isMax ? 'MAX verwalten' : 'Auf MAX upgraden',
        icon: 'crown',
      }}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <KaeuferTopbar
        email={email}
        fullName={fullName}
        isMax={isMax}
        isAdmin={isAdmin}
        onMenuToggle={() => setDrawerOpen(true)}
      />

      <div className="flex-1 grid md:grid-cols-[280px_1fr]">
        <aside className="hidden md:flex flex-col border-r border-stone bg-paper sticky top-16 self-start h-[calc(100vh-4rem)]">
          <div className="flex-1 overflow-y-auto">
            <SidebarNav counts={counts} />
          </div>
          {accountFooter}
        </aside>

        <main className="min-w-0 px-4 py-6 md:px-10 md:py-10">{children}</main>
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
          <div className="h-16 border-b border-stone flex items-center justify-between px-4">
            <span className="font-serif text-xl text-navy">
              passare<span className="text-bronze">.</span>
              <span className="ml-2 text-caption font-sans uppercase tracking-wider text-quiet font-normal">
                Käufer
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
          <div className="flex-1 overflow-y-auto">
            <SidebarNav counts={counts} onNavigate={() => setDrawerOpen(false)} />
          </div>
          {accountFooter}
        </div>
      </div>

      <footer className="border-t border-stone py-4 mt-auto">
        <p className="text-center text-caption text-quiet">
          passare Käufer · «Made in Switzerland»
        </p>
      </footer>
    </div>
  );
}
