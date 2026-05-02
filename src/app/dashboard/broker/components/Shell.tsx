'use client';

import { useState } from 'react';
import { BrokerSidebar } from './Sidebar';
import { BrokerTopbar } from './Topbar';
import { SidebarAccountFooter } from '@/components/ui/SidebarAccountFooter';

type Props = {
  email: string;
  fullName: string | null;
  tier: string | null;
  counts: { mandateActive: number; anfragenNeu: number; suchprofile: number; teamMembers: number };
  children: React.ReactNode;
};

export function BrokerShell({ email, fullName, tier, counts, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const accountFooter = (
    <SidebarAccountFooter
      email={email}
      fullName={fullName}
      profileHref="/dashboard/broker/einstellungen"
      profileLabel="Broker-Profil"
    />
  );

  return (
    <div className="min-h-screen bg-cream flex">
      <div className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="flex-1 overflow-y-auto">
          <BrokerSidebar tier={tier} counts={counts} />
        </div>
        {accountFooter}
      </div>

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed left-0 top-0 bottom-0 z-50 animate-fade-in flex flex-col bg-cream">
            <div className="flex-1 overflow-y-auto">
              <BrokerSidebar tier={tier} counts={counts} onClose={() => setMobileOpen(false)} />
            </div>
            {accountFooter}
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <BrokerTopbar onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
