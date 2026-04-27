/**
 * passare Blog — Themen-Katalog für Auto-Generator
 *
 * Spezifisch auf passare-Use-Cases zugeschnitten:
 * KMU-Verkauf, Nachfolge, M&A, Bewertung, Recht, Steuern.
 */

export const BLOG_KATEGORIEN = [
  { value: 'nachfolge', label: 'Nachfolge' },
  { value: 'verkauf', label: 'Verkauf' },
  { value: 'kauf', label: 'Kauf' },
  { value: 'bewertung', label: 'Bewertung' },
  { value: 'recht', label: 'Recht' },
  { value: 'finanzierung', label: 'Finanzierung' },
  { value: 'steuern', label: 'Steuern' },
  { value: 'erfahrung', label: 'Erfahrungsberichte' },
  { value: 'allgemein', label: 'Allgemein' },
] as const;

export type BlogKategorie = (typeof BLOG_KATEGORIEN)[number]['value'];

export const KATEGORIE_LABEL: Record<BlogKategorie, string> = Object.fromEntries(
  BLOG_KATEGORIEN.map((k) => [k.value, k.label]),
) as Record<BlogKategorie, string>;

/**
 * Vorschläge für den Auto-Generator. Wenn kein Thema explizit angegeben wird,
 * würfelt das System eines aus dem Katalog.
 */
export const BLOG_TOPIC_SUGGESTIONS: { topic: string; kategorie: BlogKategorie }[] = [
  // Nachfolge
  { topic: 'Wann ist der richtige Zeitpunkt für die Firmen-Nachfolge?', kategorie: 'nachfolge' },
  { topic: 'Familieninterne vs. externe Nachfolge — Vor- und Nachteile', kategorie: 'nachfolge' },
  { topic: 'Wie bereite ich mein KMU 3 Jahre vor dem Verkauf richtig vor?', kategorie: 'nachfolge' },
  { topic: 'Emotionale Aspekte der Firmen-Übergabe — was unterschätzt wird', kategorie: 'nachfolge' },
  { topic: 'Management-Buy-Out (MBO): Wenn das eigene Team übernimmt', kategorie: 'nachfolge' },

  // Verkauf
  { topic: 'Asset Deal vs. Share Deal — was ist besser für den Verkäufer?', kategorie: 'verkauf' },
  { topic: 'Wie schreibe ich ein anonymes Inserat, das wirklich Käufer anzieht', kategorie: 'verkauf' },
  { topic: 'NDA — wie sich Verkäufer vor Indiskretion schützen', kategorie: 'verkauf' },
  { topic: 'Vom Erstkontakt bis zum Closing — die 7 Phasen eines KMU-Verkaufs', kategorie: 'verkauf' },
  { topic: 'Earn-Out-Klauseln — Chance oder Falle?', kategorie: 'verkauf' },
  { topic: 'Warum 70% aller KMU-Verkäufe scheitern und wie man dem entgeht', kategorie: 'verkauf' },

  // Kauf
  { topic: 'Wie erkenne ich ein wirklich gutes Übernahmeobjekt?', kategorie: 'kauf' },
  { topic: 'Due Diligence für KMU-Käufer — was wirklich zählt', kategorie: 'kauf' },
  { topic: 'Letter of Intent (LOI) — was unbedingt drinstehen muss', kategorie: 'kauf' },
  { topic: 'KMU kaufen ohne Eigenkapital — geht das wirklich?', kategorie: 'kauf' },
  { topic: 'Search Fund — der unterschätzte Weg zum eigenen KMU', kategorie: 'kauf' },

  // Bewertung
  { topic: 'EBITDA-Multiples in der Schweiz — Branchen-Übersicht 2026', kategorie: 'bewertung' },
  { topic: 'DCF, Multiples oder Substanzwert — welche Methode für welches KMU?', kategorie: 'bewertung' },
  { topic: 'Goodwill bei KMU — wie berechne ich ihn richtig?', kategorie: 'bewertung' },
  { topic: 'Warum Verkäufer-Erwartungen oft 30% über dem Markt liegen', kategorie: 'bewertung' },
  { topic: 'Working-Capital-Adjustment beim Closing — die unterschätzte Position', kategorie: 'bewertung' },

  // Recht
  { topic: 'Konkurrenzverbot nach dem Verkauf — was Schweizer Recht erlaubt', kategorie: 'recht' },
  { topic: 'Gewährleistungen im Kaufvertrag — die 5 wichtigsten Klauseln', kategorie: 'recht' },
  { topic: 'Datenschutz beim Datenraum — DSG und DSGVO bei M&A', kategorie: 'recht' },
  { topic: 'Verkauf einer GmbH vs. AG — die rechtlichen Unterschiede', kategorie: 'recht' },

  // Finanzierung
  { topic: 'Bankfinanzierung für KMU-Übernahmen — was Banken sehen wollen', kategorie: 'finanzierung' },
  { topic: 'Verkäuferdarlehen — wann es sich lohnt', kategorie: 'finanzierung' },
  { topic: 'Mezzanine-Kapital für KMU-Käufer — Funktionsweise und Kosten', kategorie: 'finanzierung' },
  { topic: 'Vendor-Note vs. Earn-Out — der praktische Vergleich', kategorie: 'finanzierung' },

  // Steuern
  { topic: 'Steuerfreier Kapitalgewinn beim Privat-Verkauf — die 5 Stolperfallen', kategorie: 'steuern' },
  { topic: 'Indirekte Teilliquidation — der Klassiker, den jeder Verkäufer kennen muss', kategorie: 'steuern' },
  { topic: 'Transponierung — wenn der Verkauf an die eigene Holding ins Auge geht', kategorie: 'steuern' },
  { topic: 'Mehrwertsteuer bei Asset Deals — Steuerfalle umgehen', kategorie: 'steuern' },

  // Erfahrung
  { topic: 'Wie ein Schweizer Maschinenbauer in 9 Monaten verkauft hat — Erfahrungsbericht', kategorie: 'erfahrung' },
  { topic: 'Familienunternehmen in der dritten Generation — was wir vom Verkauf gelernt haben', kategorie: 'erfahrung' },
  { topic: 'Mein erster KMU-Kauf — 7 Dinge, die ich anders machen würde', kategorie: 'erfahrung' },

  // Allgemein
  { topic: 'Der KMU-Markt Schweiz 2026 — Zahlen, Trends, Ausblick', kategorie: 'allgemein' },
  { topic: 'Generationenwechsel in der Schweizer Wirtschaft — die nächsten 10 Jahre', kategorie: 'allgemein' },
  { topic: 'Warum Plattformen wie passare die KMU-Nachfolge revolutionieren', kategorie: 'allgemein' },
];

export function pickRandomTopic(): { topic: string; kategorie: BlogKategorie } {
  return BLOG_TOPIC_SUGGESTIONS[Math.floor(Math.random() * BLOG_TOPIC_SUGGESTIONS.length)];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220)); // 220 WPM für deutsche Texte
}
