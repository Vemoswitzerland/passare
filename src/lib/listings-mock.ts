/**
 * Geteilte Mock-Inserate für Käufer-Bereich + Homepage.
 *
 * Solange Chat 2 die `inserate`-Tabelle nicht gebaut hat, dienen diese
 * Daten als Demo-Stand. Identisch zu LISTINGS in src/app/page.tsx —
 * dort lokal definiert, hier zentralisiert für Wiederverwendung.
 */

export type Inserent = {
  /** Wenn true: keine Kontaktdaten anzeigen, nur über passare-Anfrage erreichbar. */
  anonym: boolean;
  /** Vorname Nachname — nur sichtbar wenn anonym = false. */
  name?: string;
  rolle?: string;        // z.B. "Inhaber", "Geschäftsführer", "Verwaltungsrat"
  firma?: string;        // optionaler Firmenname (kann anders sein als Inserat-Titel)
  email?: string;        // direkt sichtbar wenn öffentlich
  telefon?: string;      // direkt sichtbar wenn öffentlich
  /** URL zu Profilbild. Wenn anonym = true wird ein Platzhalter-Icon verwendet. */
  foto?: string;
};

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
  /** Längere Beschreibung für die Detail-Seite. Optional — Fallback wird generiert. */
  beschreibung?: string;
  /** Verkäufer-Profil. Optional — Default ist anonym. */
  inserent?: Inserent;
};

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: 'dossier-247', titel: 'Spezialmaschinen für die Präzisionsindustrie', branche: 'Maschinenbau', kanton: 'ZH', jahr: 1987, mitarbeitende: 34, umsatz: 'CHF 8.4M', ebitda: '18.2%', kaufpreis: 'CHF 6–8M', grund: 'Altersnachfolge', status: 'featured',
    beschreibung: 'Etabliertes Maschinenbau-Unternehmen mit eigener Entwicklungsabteilung. Spezialisiert auf hochpräzise Werkzeugmaschinen für die Uhren- und Medizintechnikindustrie. Über 40 Jahre Erfahrung, eingespieltes Team, langjährige Kundenbeziehungen mit Schweizer und süddeutschen Industriekunden. Eigene CNC-Fertigung in Zürich-Nord, Reinraum-Klasse 8, ISO 9001 zertifiziert. Auftragsbestand für 14 Monate gesichert.',
    inserent: { anonym: true },
  },
  {
    id: 'dossier-248', titel: 'Regionale Bäckerei mit Filialen', branche: 'Lebensmittel', kanton: 'BE', jahr: 1962, mitarbeitende: 18, umsatz: 'CHF 3.1M', ebitda: '12.5%', kaufpreis: 'VHB', grund: 'Altersnachfolge', status: 'neu',
    beschreibung: 'Familiengeführte Traditionsbäckerei in dritter Generation mit drei Filialen im Berner Mittelland. Eigene Backstube, Holzofen, regionale Bio-Zutaten. Bekannt für Spezialitäten-Brote und Patisserie. Treuer Kundenstamm, stabile Umsätze, gut eingearbeitetes Personal. Ideal für Übernahme durch Bäckermeister oder Gastronomie-Gruppe.',
    inserent: {
      anonym: false,
      name: 'Hans Burkhalter',
      rolle: 'Inhaber',
      firma: 'Burkhalter Bäckerei AG',
      email: 'h.burkhalter@example.ch',
      telefon: '+41 31 123 45 67',
    },
  },
  {
    id: 'dossier-249', titel: 'IT-Dienstleister Cloud & Security', branche: 'IT & Technologie', kanton: 'ZG', jahr: 2009, mitarbeitende: 42, umsatz: 'CHF 12.1M', ebitda: '22.0%', kaufpreis: 'CHF 14–18M', grund: 'Strategischer Exit', status: 'live',
    beschreibung: 'Schweizer IT-Service-Provider mit Fokus auf Cloud-Migration, Cybersecurity-Audits und Managed Services für KMU und Mittelstand. Microsoft Gold Partner, ISO 27001 zertifiziert. Wiederkehrende Subscription-Umsätze (>70%), MRR ca. CHF 700k. Eigenes Security Operations Center in Zug, Co-Location in Zürich.',
    inserent: { anonym: true },
  },
  {
    id: 'dossier-250', titel: 'Treuhandkanzlei mit Immobilien-Spezialisierung', branche: 'Finanz / Versicherung', kanton: 'VD', jahr: 1998, mitarbeitende: 11, umsatz: 'CHF 2.4M', ebitda: '35.0%', kaufpreis: 'CHF 3–4M', grund: 'Pensionierung', status: 'nda',
    beschreibung: 'Etablierte Treuhandkanzlei mit klarer Spezialisierung auf Immobilien-Verwaltung, Buchhaltung für Liegenschaftsbesitzer und Steuerberatung. Über 200 langjährige Mandate, davon 60 wiederkehrend. Voll digitalisiert (Abacus, AbaImmo). Inhaber begleitet Übergabe 6–12 Monate.',
    inserent: { anonym: true },
  },
  {
    id: 'dossier-251', titel: 'Elektrotechnik & Automation Industrie', branche: 'Handel / Industrie', kanton: 'SG', jahr: 1975, mitarbeitende: 58, umsatz: 'CHF 16.8M', ebitda: '14.1%', kaufpreis: 'CHF 18–22M', grund: 'Nachfolge unklar', status: 'live',
    beschreibung: 'Inhabergeführter Schaltschrankbauer und Automations-Spezialist für Industrie-Kunden in der Ostschweiz. Eigene Konstruktion, Fertigung und Inbetriebnahme. SPS-Programmierung, Robotik-Integration. Kunden u.a. aus Lebensmittelindustrie und Pharma. Eigene Liegenschaft kann mitübernommen werden.',
    inserent: {
      anonym: false,
      name: 'Markus Steiner',
      rolle: 'Geschäftsführer & Mitinhaber',
      firma: 'Steiner Elektrotechnik AG',
      email: 'm.steiner@example.ch',
      telefon: '+41 71 555 12 34',
    },
  },
  {
    id: 'dossier-252', titel: 'Boutique-Hotel mit 30 Zimmern', branche: 'Gastgewerbe', kanton: 'GR', jahr: 1923, mitarbeitende: 22, umsatz: 'CHF 4.2M', ebitda: '16.5%', kaufpreis: 'CHF 8–10M', grund: 'Generationenwechsel', status: 'live',
    beschreibung: 'Charmantes 4-Sterne-Boutique-Hotel in Top-Lage Engadin. 30 individuell eingerichtete Zimmer, Restaurant mit 14 GaultMillau-Punkten, Spa-Bereich, eigene Tiefgarage. 100-jährige Geschichte, hohe Stammgästequote, ganzjähriger Betrieb. Liegenschaft inklusive.',
    inserent: { anonym: true },
  },
  {
    id: 'dossier-253', titel: 'Logistik-Unternehmen mit eigener Flotte', branche: 'Logistik', kanton: 'AG', jahr: 2001, mitarbeitende: 67, umsatz: 'CHF 22.5M', ebitda: '9.8%', kaufpreis: 'CHF 11–14M', grund: 'Strategisch', status: 'featured',
    beschreibung: 'Kontraktlogistik-Spezialist mit eigener Flotte (38 Fahrzeuge), zentralem Warehouse (12\'000 m², Aargau) und WMS-Integration. Langjährige Verträge mit zwei Schweizer Retail-Konzernen, durchschnittliche Vertragslaufzeit 5+ Jahre. Eurolizenz, ADR-zertifiziert.',
    inserent: { anonym: true },
  },
  {
    id: 'dossier-254', titel: 'Online-Shop für Premium-Haushaltswaren', branche: 'Kleinhandel', kanton: 'LU', jahr: 2015, mitarbeitende: 8, umsatz: 'CHF 1.8M', ebitda: '24.0%', kaufpreis: 'CHF 2–3M', grund: 'Gründer-Exit', status: 'neu',
    beschreibung: 'Direct-to-Consumer Online-Shop mit eigenem Brand für Premium-Küchenutensilien und Haushaltsdesign. Shopify Plus, eingespielte Performance-Marketing-Pipeline (Meta, Google, Pinterest). E-Mail-Liste 45\'000 Adressen, hoher Repeat-Purchase-Rate (38%). Lager und Fulfillment ausgelagert.',
    inserent: {
      anonym: false,
      name: 'Lara Meier',
      rolle: 'Gründerin & CEO',
      firma: 'KuchenKult GmbH',
      email: 'lara@example.ch',
      telefon: '+41 79 234 56 78',
    },
  },
  {
    id: 'dossier-255', titel: 'Medizintechnik mit eigener Entwicklung', branche: 'Gesundheit', kanton: 'BS', jahr: 1989, mitarbeitende: 29, umsatz: 'CHF 9.7M', ebitda: '19.8%', kaufpreis: 'VHB', grund: 'Private-Equity-Exit', status: 'live',
    beschreibung: 'Mittelständischer Hersteller von minimal-invasiven OP-Instrumenten. Eigene F&E, ISO 13485, MDR-zertifiziert (Klasse IIa). Vertrieb über Spezialhändler in DACH, BeNeLux und UK. Patentportfolio mit 14 erteilten Patenten. Reinraum-Produktion in Basel.',
    inserent: { anonym: true },
  },
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
