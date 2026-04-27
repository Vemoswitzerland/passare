/**
 * passare.ch — Live-Entwicklungs-Updates
 *
 * Bei JEDEM Deploy wird hier oben eine neue Entry hinzugefügt.
 * `current` = was gerade als Nächstes ansteht.
 *
 * Datum: ISO-Format (YYYY-MM-DD).
 * Sprache: Deutsch, kurz, ohne Tech-Slang. Verständlich für Cyrill.
 */

export type UpdateType = 'milestone' | 'feature' | 'design' | 'fix' | 'content' | 'infrastruktur';

export type Update = {
  date: string;          // YYYY-MM-DD
  type: UpdateType;
  titel: string;         // kurz, max 60 Zeichen
  beschreibung: string;  // 1-2 Sätze, klar verständlich
};

/**
 * Was als Nächstes ansteht (oben auf der Status-Seite).
 */
export const CURRENT_STEP = {
  etappe: 'Etappe 2',
  titel: 'Datenbank + Login',
  beschreibung:
    'Wir richten die Datenbank ein (Supabase) — damit User sich registrieren, einloggen und ihre Inserate später wirklich speichern können. Aktuell ist alles nur als Demo sichtbar.',
  geplant: '~ April 2026',
};

/**
 * Alle bisherigen Updates — neueste zuerst.
 */
export const UPDATES: Update[] = [
  {
    date: '2026-04-24',
    type: 'design',
    titel: 'Status-Seite: Verlauf statt Karten',
    beschreibung:
      'Die Live-Status-Seite zeigt jetzt einen kompakten Build-Log-Verlauf statt grosser Karten — technischer, übersichtlicher.',
  },
  {
    date: '2026-04-24',
    type: 'feature',
    titel: 'Live-Entwicklungsseite eingerichtet',
    beschreibung:
      'Diese Seite hier zeigt dir nach jedem Deploy was gemacht wurde und was als Nächstes ansteht. Mit eigenem Passwort geschützt.',
  },
  {
    date: '2026-04-24',
    type: 'fix',
    titel: 'Hero-Animation: Inhalte sind jetzt sichtbar',
    beschreibung:
      'Die Animation auf der Startseite hat den Text manchmal nicht eingeblendet. Ist jetzt zuverlässig.',
  },
  {
    date: '2026-04-24',
    type: 'design',
    titel: 'Hero-Spruch: «Der Firmen-Marktplatz der Schweiz.»',
    beschreibung:
      'Der Titel auf der Startseite wurde mehrmals iteriert und ist jetzt klar, kurz und positiv: passare positioniert sich als der Schweizer Firmen-Marktplatz.',
  },
  {
    date: '2026-04-24',
    type: 'feature',
    titel: 'Dashboard-Mockup im Hero',
    beschreibung:
      'Auf der Startseite ist rechts neben dem Slogan ein realistisches Dashboard-Mockup zu sehen — mit Browser-Frame, Sidebar, KPIs und Mandate-Liste.',
  },
  {
    date: '2026-04-24',
    type: 'content',
    titel: 'Käufer-Tiers reduziert: Basic + MAX',
    beschreibung:
      'Die mittlere Käufer-Stufe (Pro CHF 49) ist wieder raus. Klarer Aufbau: gratis (Basic) oder MAX (CHF 199/Monat).',
  },
  {
    date: '2026-04-24',
    type: 'feature',
    titel: 'Preise-Seite mit Vergleichstabellen',
    beschreibung:
      'Komplette Übersicht aller Pakete unter /preise — Verkäufer (Light / Pro / Premium) und Käufer (Basic / MAX). FAQ-Sektion zu allen Preisfragen.',
  },
  {
    date: '2026-04-24',
    type: 'feature',
    titel: 'Käufer-Seite als Marktplatz statt Landingpage',
    beschreibung:
      'Wer auf «Firmen entdecken» klickt, landet direkt im Marktplatz — mit Filter-Sidebar, 9 Demo-Inseraten und MAX-Upsell. Anonyme Teaser sichtbar, für Anfragen ist Registrierung nötig.',
  },
  {
    date: '2026-04-24',
    type: 'feature',
    titel: 'Verkäufer-Landingpage komplett',
    beschreibung:
      'Eigene Seite /verkaufen mit Hero, Vorteilen, allen 3 Paketen, Prozess (4 Schritte), FAQ und Call-to-Action.',
  },
  {
    date: '2026-04-24',
    type: 'milestone',
    titel: 'Self-Service-Modell positioniert',
    beschreibung:
      'passare ist klar als Self-Service-Plattform positioniert (kein Broker, 0% Erfolgsprovision). Pricing: Light CHF 290 / Pro CHF 890 / Premium CHF 1\'890 für Verkäufer.',
  },
  {
    date: '2026-04-24',
    type: 'content',
    titel: 'Konkurrenz analysiert: companymarket.ch',
    beschreibung:
      'Komplette Feature-Analyse vom CH-Marktführer. 18 Branchen + 26 Kantone als Standard-Taxonomie übernommen. Pricing unterbietet companymarket um ~50%.',
  },
  {
    date: '2026-04-24',
    type: 'design',
    titel: 'Tech-affine Sektionen: Live-Ticker + Prozess-Etappen',
    beschreibung:
      'Mock-Live-Ticker zeigt Plattform-Aktivität (neue Mandate, NDAs). Prozess-Sektion mit 4 Etappen I–IV inklusive Tech-Badges.',
  },
  {
    date: '2026-04-24',
    type: 'design',
    titel: 'Design-System v1.0 fertig',
    beschreibung:
      'Edle Premium-Optik mit Fraunces (Serif) + Geist (Sans). Farbpalette Navy / Bronze / Cream. Living Style Guide unter /design.',
  },
  {
    date: '2026-04-24',
    type: 'milestone',
    titel: 'Beta-Site online geschaltet',
    beschreibung:
      'passare.ch läuft live unter passare-ch.vercel.app — geschützt mit Beta-Code. Alle Hauptseiten sind verlinkt.',
  },
  {
    date: '2026-04-24',
    type: 'infrastruktur',
    titel: 'Master-Plan erstellt: 175 Etappen',
    beschreibung:
      'Kompletter Bauplan in 16 Themenblöcken. Jeder neue Chat baut eine Etappe — von Datenbank über Auth, Dashboards, Zahlungen, Admin bis zur Mehrsprachigkeit.',
  },
  {
    date: '2026-04-24',
    type: 'infrastruktur',
    titel: 'Repository auf GitHub + Auto-Deploy auf Vercel',
    beschreibung:
      'Alles liegt unter github.com/Vemoswitzerland/passare. Jeder Push deployed automatisch — passare-ch.vercel.app ist immer auf dem neuesten Stand.',
  },
];

export const TYPE_LABELS: Record<UpdateType, string> = {
  milestone: 'Meilenstein',
  feature: 'Feature',
  design: 'Design',
  fix: 'Fix',
  content: 'Inhalt',
  infrastruktur: 'Infrastruktur',
};

export const TYPE_COLORS: Record<UpdateType, string> = {
  milestone: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  feature: 'bg-success/10 text-success border-success/20',
  design: 'bg-navy-soft text-navy border-navy/15',
  fix: 'bg-warn/10 text-warn border-warn/20',
  content: 'bg-stone/60 text-ink border-stone',
  infrastruktur: 'bg-navy-soft text-navy border-navy/15',
};
