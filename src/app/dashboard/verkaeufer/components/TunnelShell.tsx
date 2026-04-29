// ════════════════════════════════════════════════════════════════════
// TunnelShell — UI für Pre-Pay-Phase
// ────────────────────────────────────────────────────────────────────
// Solange das Inserat noch nicht bezahlt ist, ist der User im
// linearen Tunnel-Flow:  Inserat-Wizard → Paket → Bezahlung.
// KEINE Sidebar, KEINE Navigation zu anderen Bereichen — nur
// Logo, Wizard-Progress, Speicher-Status, Logout.
// ════════════════════════════════════════════════════════════════════
'use client';

import Link from 'next/link';
import { LogOut, ArrowLeft } from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';

type Props = {
  email: string;
  fullName: string | null;
  children: React.ReactNode;
};

export function TunnelShell({ email, fullName, children }: Props) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top-Header — minimalistisch, ohne Sidebar-Navigation */}
      <header className="border-b border-stone bg-paper sticky top-0 z-30">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>

            <div className="flex items-center gap-4 md:gap-6">
              {/* Escape-Link — User kann jederzeit raus */}
              <Link
                href="/dashboard/verkaeufer?tab=overview"
                className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Zum Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
              {fullName && (
                <span className="hidden md:inline text-caption text-muted">
                  {fullName}
                </span>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-stone py-6 mt-auto">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <p className="text-center text-caption text-quiet">
            passare — «Made in Switzerland» · Pauschalpreis
          </p>
        </div>
      </footer>
    </div>
  );
}
