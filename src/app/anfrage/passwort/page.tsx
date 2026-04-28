import { Suspense } from 'react';
import { SiteHeader, SiteFooter } from '../../page';
import { PasswortClient } from './PasswortClient';

/**
 * /anfrage/passwort — landet hier nach Klick auf Verifizierungs-Link aus der Mail.
 *
 * Header/Footer werden hier (Server Component) gerendert. PasswortClient liefert
 * den interaktiven Mittelteil — sonst würde der Import von SiteHeader die ganze
 * Homepage-Datei in den Client-Bundle ziehen und ihren `metadata`-Export brechen.
 *
 * URL-Params (im PasswortClient via useSearchParams gelesen):
 *   listing   — Inserat-ID, für Redirect zurück
 *   email     — verifizierte E-Mail
 *   name      — Name aus dem Anfrage-Form
 *   msg       — Nachricht aus dem Anfrage-Form (max 200 Zeichen)
 *
 * Cyrills Flow (2026-04-28):
 *   User setzt Passwort → Käufer-Basic-Konto wird aktiviert → Redirect auf /inserat/[id]
 *   mit `?anfrage=ok` für Bestätigungs-Banner.
 */

export const metadata = {
  title: 'Konto aktivieren — passare',
  description: 'Letzter Schritt: Passwort setzen und Anfrage abschicken.',
  robots: { index: false, follow: false },
};

export default function AnfragePasswortPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Suspense fallback={null}>
        <PasswortClient />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
