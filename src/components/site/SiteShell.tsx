/**
 * passare.ch — Globale Shell-Komponenten (Header + Footer)
 *
 * Zentrale Stelle für die Hauptnavigation. Wird von ALLEN öffentlichen
 * Seiten verwendet (`/`, `/marktplatz`, `/verkaufen`, `/preise`, `/kontakt`,
 * `/impressum`, `/datenschutz`, `/agb`, `/broker`, `/plus`, `/kaufen`).
 *
 * Auf `/verkaufen` und `/preise` wird «Firma inserieren» nur als aktiv
 * hervorgehoben (`activeSell=true`). Dashboard-Knopf erscheint, wenn der
 * User eingeloggt ist.
 */

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Divider } from '@/components/ui/divider';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/site/MobileNav';
import { createClient } from '@/lib/supabase/server';

export async function SiteHeader({ activeSell = false }: { activeSell?: boolean } = {}) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  let dashboardHref: string | null = null;
  if (u.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rolle')
      .eq('id', u.user.id)
      .maybeSingle();
    dashboardHref =
      profile?.rolle === 'verkaeufer' ? '/dashboard/verkaeufer'
      : profile?.rolle === 'broker' ? '/dashboard/broker'
      : profile?.rolle === 'admin' ? '/admin'
      : '/dashboard/kaeufer';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-cream/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="group flex items-center gap-3">
            <span className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </span>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest text-quiet border border-stone rounded-full px-2 py-0.5">
              beta
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-9">
            <Link
              href="/marktplatz"
              className="text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors"
            >
              Marktplatz
            </Link>
            <Link
              href="/verkaufen"
              className={`text-[0.8125rem] font-medium transition-colors ${
                activeSell ? 'text-navy' : 'text-muted hover:text-ink'
              }`}
            >
              Firma inserieren
            </Link>
            <Link href="/broker" className="text-[0.8125rem] font-medium text-muted hover:text-ink">
              Broker
            </Link>
            <Link
              href="/plus"
              className="text-[0.8125rem] font-medium text-muted hover:text-ink inline-flex items-baseline"
            >
              Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {dashboardHref ? (
              <Button href={dashboardHref} size="sm" className="hidden md:inline-flex">
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.5} />
                Mein Bereich
              </Button>
            ) : (
              <>
                <Button href="/auth/login" size="sm" variant="ghost" className="hidden md:inline-flex">
                  Anmelden
                </Button>
                <Button
                  href={activeSell ? '/verkaufen/start' : '/onboarding/kaeufer/tunnel'}
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  {activeSell ? 'Inserieren' : 'Registrieren'}
                </Button>
              </>
            )}
            <MobileNav
              dashboardHref={dashboardHref}
              registerHref={activeSell ? '/verkaufen/start' : '/onboarding/kaeufer/tunnel'}
              registerLabel={activeSell ? 'Inserieren' : 'Registrieren'}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-stone pt-16 pb-10 bg-cream">
      <Container>
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <p className="font-serif text-3xl text-navy mb-4">
              passare<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted max-w-xs leading-relaxed">
              Die Schweizer Self-Service-Plattform für die Nachfolge von KMU.
              Direkt zwischen Verkäufer und Käufer.
            </p>
          </div>
          <div>
            <p className="overline mb-4">Plattform</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/marktplatz">Marktplatz</Link></li>
              <li><Link className="hover:text-navy" href="/verkaufen">Firma inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/broker">Broker</Link></li>
              <li>
                <Link className="hover:text-navy inline-flex items-baseline" href="/plus">
                  Käufer<span className="font-serif text-bronze leading-none ml-px">+</span>
                </Link>
              </li>
              <li><Link className="hover:text-navy" href="/bewerten">Firma bewerten</Link></li>
              <li><Link className="hover:text-navy" href="/atlas">CH-Firmen-Atlas</Link></li>
              <li><Link className="hover:text-navy" href="/ratgeber">Ratgeber</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Konto</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/auth/login">Anmelden</Link></li>
              <li><Link className="hover:text-navy" href="/onboarding/kaeufer/tunnel">Registrieren</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Alle Preise</Link></li>
              <li><Link className="hover:text-navy" href="/kontakt">Kontakt</Link></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/impressum" className="hover:text-navy">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-navy">Datenschutz</Link>
            <Link href="/agb" className="hover:text-navy">AGB</Link>
            <Link href="/kontakt" className="hover:text-navy">Kontakt</Link>
            <a href="mailto:info@passare.ch" className="hover:text-navy">info@passare.ch</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
