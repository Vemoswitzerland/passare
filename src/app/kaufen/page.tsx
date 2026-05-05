import { redirect } from 'next/navigation';

/**
 * /kaufen → /boerse (die Börse ist jetzt die dedizierte Marktplatz-Seite).
 * Bleibt als Redirect für SEO-Backlinks und alte Bookmarks.
 */
export default function KaufenRedirect() {
  redirect('/boerse');
}
