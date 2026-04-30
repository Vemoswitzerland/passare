'use client';

import { useState } from 'react';
import { VerkaeuferSidebar } from './Sidebar';
import { VerkaeuferTopbar } from './Topbar';
import { SidebarAccountFooter } from '@/components/ui/SidebarAccountFooter';

type Props = {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  inseratId: string | null;
  inseratStatus: string | null;
  paket: string | null;
  counts: { anfragenNeu: number; ndaPending: number; datenraumFiles: number };
  children: React.ReactNode;
};

export function VerkaeuferShell({
  email, fullName, isAdmin, inseratId, inseratStatus, paket, counts, children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cyrill: «Profil bei jedem Dashboard nicht oben — sondern unten».
  const accountFooter = (
    <SidebarAccountFooter
      email={email}
      fullName={fullName}
      profileHref="/dashboard/verkaeufer/settings"
      profileLabel="Mein Profil"
    />
  );

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop Sidebar mit Account-Footer unten */}
      <div className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="flex-1 overflow-y-auto">
          <VerkaeuferSidebar
            inseratId={inseratId}
            inseratStatus={inseratStatus}
            paket={paket}
            counts={counts}
          />
        </div>
        {accountFooter}
      </div>

      {/* Mobile Sidebar (Overlay) */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed left-0 top-0 bottom-0 z-50 animate-fade-in flex flex-col bg-cream">
            <div className="flex-1 overflow-y-auto">
              <VerkaeuferSidebar
                inseratId={inseratId}
                inseratStatus={inseratStatus}
                paket={paket}
                counts={counts}
                onClose={() => setMobileOpen(false)}
              />
            </div>
            {accountFooter}
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <VerkaeuferTopbar
          email={email}
          fullName={fullName}
          isAdmin={isAdmin}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
