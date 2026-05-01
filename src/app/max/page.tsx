import { redirect } from 'next/navigation';

/**
 * /max — alter Pfad. Wir haben das Käufer-Tier auf «Käufer+» umbenannt
 * und die Seite nach /plus verschoben. Bestehende Bookmarks/Links bleiben
 * funktional über diesen Redirect.
 */
export default function MaxRedirect() {
  redirect('/plus');
}
