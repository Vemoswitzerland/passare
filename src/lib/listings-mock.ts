/**
 * Geteilte Mock-Inserate für Käufer-Bereich + Homepage.
 *
 * Solange Chat 2 die `inserate`-Tabelle nicht gebaut hat, dienen diese
 * Daten als Demo-Stand. Identisch zu LISTINGS in src/app/page.tsx —
 * dort lokal definiert, hier zentralisiert für Wiederverwendung.
 */

export type MockListing = {
  id: string;
  titel: string;
  branche: string;
  kanton: string;
  jahr: number;
  mitarbeitende: number;
  umsatz: string;
  ebitda: string;
  kaufpreis: string;
  grund: string;
  status: 'featured' | 'neu' | 'nda' | 'live';
};

export const MOCK_LISTINGS: MockListing[] = [
  { id: 'dossier-247', titel: 'Spezialmaschinen für die Präzisionsindustrie', branche: 'Maschinenbau', kanton: 'ZH', jahr: 1987, mitarbeitende: 34, umsatz: 'CHF 8.4M', ebitda: '18.2%', kaufpreis: 'CHF 6–8M', grund: 'Altersnachfolge', status: 'featured' },
  { id: 'dossier-248', titel: 'Regionale Bäckerei mit Filialen', branche: 'Lebensmittel', kanton: 'BE', jahr: 1962, mitarbeitende: 18, umsatz: 'CHF 3.1M', ebitda: '12.5%', kaufpreis: 'VHB', grund: 'Altersnachfolge', status: 'neu' },
  { id: 'dossier-249', titel: 'IT-Dienstleister Cloud & Security', branche: 'IT & Technologie', kanton: 'ZG', jahr: 2009, mitarbeitende: 42, umsatz: 'CHF 12.1M', ebitda: '22.0%', kaufpreis: 'CHF 14–18M', grund: 'Strategischer Exit', status: 'live' },
  { id: 'dossier-250', titel: 'Treuhandkanzlei mit Immobilien-Spezialisierung', branche: 'Finanz / Versicherung', kanton: 'VD', jahr: 1998, mitarbeitende: 11, umsatz: 'CHF 2.4M', ebitda: '35.0%', kaufpreis: 'CHF 3–4M', grund: 'Pensionierung', status: 'nda' },
  { id: 'dossier-251', titel: 'Elektrotechnik & Automation Industrie', branche: 'Handel / Industrie', kanton: 'SG', jahr: 1975, mitarbeitende: 58, umsatz: 'CHF 16.8M', ebitda: '14.1%', kaufpreis: 'CHF 18–22M', grund: 'Nachfolge unklar', status: 'live' },
  { id: 'dossier-252', titel: 'Boutique-Hotel mit 30 Zimmern', branche: 'Gastgewerbe', kanton: 'GR', jahr: 1923, mitarbeitende: 22, umsatz: 'CHF 4.2M', ebitda: '16.5%', kaufpreis: 'CHF 8–10M', grund: 'Generationenwechsel', status: 'live' },
  { id: 'dossier-253', titel: 'Logistik-Unternehmen mit eigener Flotte', branche: 'Logistik', kanton: 'AG', jahr: 2001, mitarbeitende: 67, umsatz: 'CHF 22.5M', ebitda: '9.8%', kaufpreis: 'CHF 11–14M', grund: 'Strategisch', status: 'featured' },
  { id: 'dossier-254', titel: 'Online-Shop für Premium-Haushaltswaren', branche: 'Kleinhandel', kanton: 'LU', jahr: 2015, mitarbeitende: 8, umsatz: 'CHF 1.8M', ebitda: '24.0%', kaufpreis: 'CHF 2–3M', grund: 'Gründer-Exit', status: 'neu' },
  { id: 'dossier-255', titel: 'Medizintechnik mit eigener Entwicklung', branche: 'Gesundheit', kanton: 'BS', jahr: 1989, mitarbeitende: 29, umsatz: 'CHF 9.7M', ebitda: '19.8%', kaufpreis: 'VHB', grund: 'Private-Equity-Exit', status: 'live' },
];

export const BRANCHEN_LIST = [
  'Autoindustrie', 'Ausbildung', 'Bauwesen', 'Beratung', 'Energie / Umwelt',
  'Finanz / Versicherung', 'Gastgewerbe', 'Gesundheit', 'Grafik / Design', 'Grosshandel',
  'Handel / Industrie', 'IT & Technologie', 'Immobilien', 'Kleinhandel', 'Landwirtschaft',
  'Lebensmittel', 'Logistik', 'Maschinenbau', 'Andere Dienstleistungen',
] as const;

export const KANTON_CODES = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW',
  'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const;

export const UEBERGABE_GRUENDE = [
  'Altersnachfolge', 'Pensionierung', 'Strategisch', 'Private Equity',
  'Generationenwechsel', 'Gründer-Exit', 'Nachfolge unklar', 'Andere',
] as const;
