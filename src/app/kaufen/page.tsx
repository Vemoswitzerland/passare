import { redirect } from 'next/navigation';

/**
 * /kaufen → /marktplatz (die Marktplatz ist jetzt die dedizierte Marktplatz-Seite).
 * Bleibt als Redirect für SEO-Backlinks und alte Bookmarks.
 */
export default function KaufenRedirect() {
  redirect('/marktplatz');
}
