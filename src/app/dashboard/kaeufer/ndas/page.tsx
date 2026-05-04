import { redirect } from 'next/navigation';

export const metadata = { title: 'NDAs & Datenraum — Käufer · passare', robots: { index: false, follow: false } };

/**
 * NDA-Page wurde aus der Sidebar entfernt — die Funktionalität läuft jetzt
 * im Anfragen-Inbox (jeder Thread mit `nda_pending`/`nda_signed`/`released`
 * status hat alle Details). Wer noch direkt auf /dashboard/kaeufer/ndas
 * landet (alte Bookmarks, Notification-Links), wird transparent dorthin
 * umgeleitet.
 */
export default function NDAsRedirect() {
  redirect('/dashboard/kaeufer/anfragen');
}
