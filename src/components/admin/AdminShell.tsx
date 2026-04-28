'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { ImpersonationBanner } from './ImpersonationBanner';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  badges?: Partial<Record<string, string | number>>;
  children: React.ReactNode;
};

export function AdminShell({ email, fullName, badges, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="admin-scope min-h-screen flex flex-col bg-cream">
      <AdminHeader
        email={email}
        fullName={fullName}
        onMenuToggle={() => setDrawerOpen(true)}
      />

      <ImpersonationBanner />

      <div className="flex-1 grid md:grid-cols-[260px_1fr]">
        <aside className="hidden md:block border-r border-stone bg-paper sticky top-16 self-start h-[calc(100vh-4rem)]">
          <AdminSidebar badges={badges} />
        </aside>

        <main className="min-w-0 p-4 md:p-6">{children}</main>
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
            'absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-paper border-r border-stone transition-transform',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="h-16 border-b border-stone flex items-center justify-between px-4">
            <span className="font-serif text-xl text-navy">
              passare<span className="text-bronze">.</span>
              <span className="ml-2 text-caption font-sans uppercase tracking-wider text-quiet font-normal">
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
          <AdminSidebar badges={badges} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      <footer className="border-t border-stone py-4 mt-auto">
        <p className="text-center text-caption text-quiet">
          passare Admin · «Made in Switzerland»
        </p>
      </footer>
    </div>
  );
}
