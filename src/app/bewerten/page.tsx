import { redirect } from 'next/navigation';

/**
 * /bewerten ist KEIN eigener Funnel mehr — er war früher ein eigenständiger
 * 8-Step-Wizard, der parallel zum /verkaufen/start-Funnel existierte.
 * Beide sind jetzt zu EINEM Funnel zusammengeführt: Handelsregister-First
 * → Branche → Finanzen → Bewertung. Am Ende der Bewertung wählt der User
 * zwischen "Bewertung mailen" oder "Direkt inserieren weiter".
 *
 * Die Verkäufer-Landing /verkaufen verlinkt mit zwei CTAs auf den
 * gleichen Funnel — der Eingang /bewerten leitet hier nur weiter.
 */
export const metadata = {
  title: 'Was ist meine Firma wert? — passare',
  description: 'Kostenloses Bewertungstool für Schweizer KMU. Handelsregister + Eckdaten = Marktwert in 60 Sekunden.',
  robots: { index: false, follow: false },
};

export default function BewertenPage() {
  redirect('/verkaufen/start?mode=bewerten');
}
