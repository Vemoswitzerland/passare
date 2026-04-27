import { redirect } from 'next/navigation';

/**
 * /kaufen → / (Marktplatz ist die Homepage).
 * Bleibt als Redirect für SEO-Backlinks und alte Bookmarks.
 */
export default function KaufenRedirect() {
  redirect('/');
}
