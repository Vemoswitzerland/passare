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

export type TaskStatus = 'done' | 'in_progress' | 'pending';
export type Task = {
  label: string;
  status: TaskStatus;
};

/**
 * Was als Nächstes ansteht (oben auf der Status-Seite).
 * Tasks werden als Build-Log-artige Liste gerendert.
 * KEINE Software-/Produktnamen in den Texten.
 */
const CURRENT_TASKS: Task[] = [
  { label: 'project · provisioning',        status: 'done' },
  { label: 'env · secrets_wiring',          status: 'done' },
  { label: 'schema · profiles_table',       status: 'done' },
  { label: 'schema · roles_enum',           status: 'done' },
  { label: 'policy · row_level_security',   status: 'done' },
  { label: 'trigger · auth_to_profiles',    status: 'done' },
  { label: 'auth · session_cookies',        status: 'done' },
  { label: 'auth · register_flow',          status: 'done' },
  { label: 'auth · login_flow',             status: 'done' },
  { label: 'auth · email_verification',     status: 'done' },
  { label: 'auth · password_reset',         status: 'done' },
  { label: 'verify · live_environment',     status: 'done' },
];

export const CURRENT_STEP = {
  etappe: 'Etappe 03',
  branch: 'feat/onboarding-wizard',
  titel: 'Rollen-Onboarding und Profil-Wizard',
  beschreibung:
    'Nach der Registrierung führen wir den Nutzer in 3 Schritten durch die Konto-Einrichtung: Rolle wählen (verkaufen oder kaufen), Basis-Profil erfassen, Einstellungen bestätigen.',
  geplant: '~ Mai 2026',
  tasks: [
    { label: 'wizard · step_1_rolle',          status: 'pending' },
    { label: 'wizard · step_2_basis_profil',   status: 'pending' },
    { label: 'wizard · step_3_interessen',     status: 'pending' },
    { label: 'terms · zwingende_zustimmung',   status: 'pending' },
    { label: 'redirect · nach_rolle',          status: 'pending' },
  ] as Task[],
};

/**
 * Alle bisherigen Updates — neueste zuerst.
 */
export const UPDATES: Update[] = [
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Konto-System steht: Registrieren, Anmelden, Passwort-Reset',
    beschreibung:
      'Du kannst jetzt ein Konto anlegen, dich anmelden, deine E-Mail bestätigen und dein Passwort zurücksetzen — alles auf passare. Im Hintergrund wird automatisch ein Profil-Datensatz angelegt.',
  },
  {
    date: '2026-04-27',
    type: 'infrastruktur',
    titel: 'Datenbank für passare aufgesetzt',
    beschreibung:
      'Eigene, von Vemo getrennte Datenbank in der Schweizer Nachbarregion (Frankfurt). Profile-Schema mit Rollen (Verkäufer / Käufer / Admin), strikte Zugriffsregeln pro Datensatz, sichere Session-Cookies.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Anmelde-Strecke gestaltet im passare-Look',
    beschreibung:
      'Die Login- und Registrieren-Seiten passen visuell zum Rest der Seite (gleiche Schrift, gleiche Farben). Klare Fehlermeldungen auf Deutsch.',
  },
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Master-Plan auf 196 Etappen erweitert',
    beschreibung:
      'Drei Personen-Walkthroughs (Käufer, Verkäufer, Admin) durchgespielt. 21 zusätzliche Pflicht-Etappen identifiziert und in den Bauplan integriert. Beispiele: Tages-Auswahl per Mail, Verkäuflich-Check vor Anmeldung, Anonymitäts-Coach beim Tippen, Buchhaltungs-Import, Notfall-Knopf im Datenraum, Status-Seite, mobile Web-App.',
  },
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Plan-Lückenanalyse abgeschlossen',
    beschreibung:
      '15 Lücken im ursprünglichen Plan gefunden und geschlossen — fehlende Mehrwertsteuer-Logik, fortlaufende Rechnungsnummern, Bot-Schutz, Test-Suite, AGB-Versionierung, Datenschutz-Einwilligungen.',
  },
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
    titel: 'Design-System v1.0 finalisiert',
    beschreibung:
      'Premium-Look mit editorialer Serif + neutraler Sans. Farbpalette Navy / Bronze / Cream. Living Style Guide unter /design.',
  },
  {
    date: '2026-04-24',
    type: 'milestone',
    titel: 'Beta-Site online geschaltet',
    beschreibung:
      'passare.ch ist live, geschützt mit Beta-Code. Alle Hauptseiten sind verlinkt und navigierbar.',
  },
  {
    date: '2026-04-24',
    type: 'infrastruktur',
    titel: 'Master-Plan: 175 Etappen in 16 Blöcken',
    beschreibung:
      'Kompletter Bauplan steht. Jeder neue Chat baut eine Etappe — von Datenbank über Auth, Dashboards, Zahlungen, Admin bis zur Mehrsprachigkeit.',
  },
  {
    date: '2026-04-24',
    type: 'infrastruktur',
    titel: 'Auto-Deploy-Pipeline aktiv',
    beschreibung:
      'Jede Änderung am Code geht automatisch live. Die stabile URL zeigt immer die aktuellste Version.',
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
