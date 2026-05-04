'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

/**
 * Mobile-Burger-Menü für die Site-Header-Navigation.
 * Sichtbar nur unter md:-Breakpoint (md:hidden). Auf grösseren Screens
 * läuft die normale Desktop-Nav.
 *
 * Nimmt einen optionalen `dashboardHref` entgegen — wenn gesetzt,
 * zeigen wir «Mein Bereich», sonst Anmelden + Registrieren.
 */
type Props = {
  dashboardHref: string | null;
  registerHref: string;
  registerLabel: string;
};

export function MobileNav({ dashboardHref, registerHref, registerLabel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Menü öffnen"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-soft text-navy hover:bg-stone/40 transition-colors"
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Hauptmenü"
        >
          {/* Overlay */}
          <button
            type="button"
            aria-label="Menü schliessen"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-cream shadow-lift overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between h-16 px-5 border-b border-stone">
              <span className="font-serif text-xl text-navy">
                passare<span className="text-bronze">.</span>
              </span>
              <button
                type="button"
                aria-label="Menü schliessen"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-soft text-navy hover:bg-stone/40 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="px-5 py-6 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-soft text-body text-navy font-medium hover:bg-stone/40 transition-colors"
              >
                Firmen entdecken
              </Link>
              <Link
                href="/verkaufen"
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-soft text-body text-navy font-medium hover:bg-stone/40 transition-colors"
              >
                Firma inserieren
              </Link>
              <Link
                href="/broker"
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-soft text-body text-navy font-medium hover:bg-stone/40 transition-colors"
              >
                Broker
              </Link>
              <Link
                href="/plus"
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-soft text-body text-navy font-medium hover:bg-stone/40 transition-colors inline-flex items-baseline"
              >
                Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
              </Link>

              <div className="border-t border-stone mt-4 pt-4 flex flex-col gap-2">
                {dashboardHref ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-soft bg-navy text-cream text-body font-medium text-center hover:bg-ink transition-colors"
                  >
                    Mein Bereich
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-soft border border-stone text-navy text-body font-medium text-center hover:border-navy/40 transition-colors"
                    >
                      Anmelden
                    </Link>
                    <Link
                      href={registerHref}
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-soft bg-navy text-cream text-body font-medium text-center hover:bg-ink transition-colors"
                    >
                      {registerLabel}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
