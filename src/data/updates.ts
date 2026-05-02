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
  { label: 'kaeufer · sales_tunnel_5_fragen',      status: 'done' },
  { label: 'kaeufer · paket_basic_oder_max',       status: 'done' },
  { label: 'kaeufer · dashboard_daily_digest',     status: 'done' },
  { label: 'kaeufer · favoriten_pipeline_kanban',  status: 'done' },
  { label: 'kaeufer · suchprofile_max3',           status: 'done' },
  { label: 'kaeufer · ndas_berater_share',         status: 'done' },
  { label: 'kaeufer · max_abo_stripe',             status: 'done' },
  { label: 'kaeufer · profil_reverse_listing',     status: 'done' },
];

export const CURRENT_STEP = {
  etappe: 'Etappe 46-55',
  branch: 'feat/verkaeufer-bereich',
  titel: 'Verkäufer-Bereich: Pre-Reg-Funnel + Dashboard + Wizard',
  beschreibung:
    'Verkäufer starten BEVOR sie sich registrieren mit ihrer Firma im Live-Handelsregister-Suche, bekommen eine Smart-Bewertung mit animiertem Reveal und gehen erst danach zur Konto-Erstellung. Im Dashboard managen sie Inserat (5-Step-Wizard), Anfragen mit Drawer, NDA-Pipeline, Datenraum mit Versionierung und Audit, Statistik (Charts), Paket-Verwaltung und Vorschau.',
  geplant: '~ April 2026',
  tasks: [
    { label: 'verkaeufer · pre_reg_funnel_zefix_smart_pricing', status: 'done' },
    { label: 'verkaeufer · sidebar_topbar_view_switcher',       status: 'done' },
    { label: 'verkaeufer · uebersicht_kpi_checklist',           status: 'done' },
    { label: 'verkaeufer · inserat_wizard_5_steps_autosave',    status: 'done' },
    { label: 'verkaeufer · anfragen_drawer_status_logic',       status: 'done' },
    { label: 'verkaeufer · nda_pipeline_3_spalten',             status: 'done' },
    { label: 'verkaeufer · datenraum_versionen_audit',          status: 'done' },
    { label: 'verkaeufer · statistik_charts',                   status: 'done' },
    { label: 'verkaeufer · paket_verwaltung_stripe_mock',       status: 'done' },
    { label: 'verkaeufer · public_preview_anonym_check',        status: 'done' },
    { label: 'integration · 3_bereiche_verbinden',              status: 'pending' },
  ] as Task[],
};

/**
 * Alle bisherigen Updates — neueste zuerst.
 */
export const UPDATES: Update[] = [
  {
    date: '2026-05-02',
    type: 'feature',
    titel: 'Broker-Landingpage /broker — sauber und minimal',
    beschreibung:
      'Eigene Landingpage für Broker und M&A-Berater mit dem Pitch «Beide Seiten. Ein Abo.» — Mandate inserieren und gleichzeitig im Marktplatz suchen, Käufer+ ist inklusive. Zwei Listen zeigen exakt was drin ist: links die Verkaufs-Funktionen pro Mandat (Inserat, Anfragen, Chat, Statistik, Datenraum, Hervorhebung, Newsletter, Käuferprofil-Einsicht), rechts die Käufer+-Funktionen (alle Inserate inkl. Premium, 7-Tage-Frühzugang, alle 18 Filter, Echtzeit-Alerts, WhatsApp, unbegrenzte Anfragen, Featured-Käuferprofil, KMU-Multiples, Ansprechpartner). Pakete-Vergleich zeigt vier echte Differenzierer Starter ↔ Pro: aktive Mandate (5 vs 25), Hervorhebung pro Mandat (4× vs 12× pro Jahr), Newsletter pro Mandat (— vs 2× pro Jahr), Mitarbeiter onboarden (— vs bis 5). Banner auf der Verkaufen-Seite verlinkt direkt zur Broker-Page.',
  },
  {
    date: '2026-05-01',
    type: 'design',
    titel: 'Header schlanker, Broker als eigener Menüpunkt, Käufer+ statt Käufer MAX',
    beschreibung:
      'Drei Änderungen am Hauptmenü und an der Wording-Welt: (1) Auf der Plattform-Sicht (Marktplatz, Inserat-Detail, Käuferseiten) ist «Inserat-Preise» aus Header und Footer raus — dort gehört es nicht hin, und der Header bleibt schlanker. Wer im Verkäufer-Bereich landet (z.B. «Firma inserieren») sieht «Inserat-Preise» weiterhin im Menü, dort hat es einen klaren Platz. (2) Neuer Menüpunkt «Broker» überall im Header und Footer — eigene Landingpage mit Plädoyer für M&A-Berater, Treuhänder und Broker (sechs Argumente, zwei typische Mandats-Szenarien, Roadmap zum dedizierten Broker-Tier). (3) Das Käufer-Tier «MAX» heisst neu «Käufer+» mit Plus-Symbol — auf der Marketingseite, im Onboarding, im Käufer-Dashboard, im Sidebar-Menü, im Upsell-Banner und in der Topbar. Der bisherige Pfad /max bleibt als Redirect, die neue Hauptadresse ist /plus.',
  },
  {
    date: '2026-05-01',
    type: 'feature',
    titel: 'Bewertungstool: vier neue Detail-Faktoren für eine intensivere Einwertung',
    beschreibung:
      'Das Gratis-Bewertungstool /bewerten geht jetzt deutlich tiefer: Nach den Basis-Inputs (Branche, Mitarbeitende, Umsatz, EBITDA, Standort, Wachstum) folgt ein Verfeinerungs-Schritt mit vier optionalen Faktoren — Anteil wiederkehrender Umsätze (bis +20 % auf Multiple), Kundenkonzentration der Top-3 (bis −20 % bei Klumpenrisiko), Inhaberabhängigkeit (niedrig/mittel/hoch — Käufer mögen delegierte Strukturen) und Alter der Firma (Junggesellen-Abschlag bei < 5 Jahren, Marken-Bonus ab 30 Jahren). Im Ergebnis wird der kombinierte Detail-Faktor angezeigt und es gibt eine Aufschlüsselung welcher Faktor wieviel Prozent gemacht hat. So sieht der Verkäufer sofort, wo seine Firma stark steht und wo Käufer typischerweise einen Earn-out fordern werden.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Chat erweitert: Unterlagen senden + Action-Karten + Inbox in Käufer + Admin',
    beschreibung:
      'Drei grosse Erweiterungen am Chat-System: (1) Verkäufer können jetzt direkt aus dem Chat Unterlagen aus dem Datenraum an Käufer schicken — Knopf links neben dem Eingabefeld öffnet ein Auswahl-Fenster mit allen eigenen Datenraum-Dateien gruppiert nach Ordner, Multi-Select möglich, Datei-Karten erscheinen als Anhänge in der Chat-Bubble (mit Datei-Name, Grösse, Symbol). (2) Status-Aktionen vom passare-Team werden jetzt als visuelle Karten im Chat-Verlauf gerendert statt nur als Text — Inserat freigegeben (grünes Häkchen, grüner Hintergrund), Inserat abgelehnt (rotes X, roter Hintergrund), Inserat pausiert (graue Pause-Karte) — so sieht man die Workflow-Schritte direkt im Verlauf. (3) Die gleiche zentrale Inbox gibt es jetzt auch im Käufer-Dashboard (Liste der Verkäufer-Konversationen) und im Admin-Verwaltungsbereich (alle Plattform-Konversationen — sowohl Käufer↔Verkäufer als auch passare-Team↔Verkäufer). Vollflächiges Layout, Header weg, Liste links nur «Nachrichten» + Counter, Chat füllt die ganze restliche Fläche.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Klare Trennung: Käufer-Vorteile und Verkäufer-Preise auf eigenen Seiten',
    beschreibung:
      'Die Preisseite war eine Mischung aus Inserat-Paketen für Verkäufer und MAX-Vorteilen für Käufer — verwirrend, weil jeder Besucher Inhalte für die andere Seite mit-las. Ab jetzt sind die zwei Welten getrennt: «Preise» heisst neu «Inserat-Preise» und zeigt nur noch die drei Verkäufer-Pakete (Light, Pro, Premium) plus die passende Verkäufer-FAQ. Daneben gibt es eine eigene Seite «Käufer MAX» mit allen Käufer-Argumenten — sechs Vorteilskarten, Vergleich Basic vs MAX, drei typische Käufer-Profile und eine eigene MAX-FAQ. Im Hauptmenü erscheinen beide Links getrennt; auf der Marktplatz-Sidebar führt der MAX-Knopf jetzt direkt zur Käufer-Seite (statt wie früher zuerst auf die Verkäufer-Pakete). Wer auf der einen Seite landet und doch die andere sucht, wird unten via Cross-Link sauber rüber geleitet.',
  },
  {
    date: '2026-04-30',
    type: 'content',
    titel: 'Inserieren startet jetzt sichtbar mit der Bewertung',
    beschreibung:
      'Die «Inserat erstellen»-Knöpfe heissen jetzt überall «Bewerten & inserieren» — der Inserat-Funnel beginnt mit der Smart-Bewertung (Branche, Kanton, Mitarbeitende, Umsatz, EBITDA) und übergibt die Werte direkt ins Inserat. Auf der Verkäufer-Marketing-Seite ist die Bewertungs-Karte jetzt der Haupt-Einstieg statt einem Alternativ-Weg. Die Verkäufer-FAQ wurde komplett überarbeitet: alte Fragen zum Geheimhaltungs-Workflow sind raus, dafür ist jetzt erklärt wie der Bewertung-im-Funnel-Schritt aussieht und was die Pakete im Detail bringen.',
  },
  {
    date: '2026-04-30',
    type: 'content',
    titel: 'Begriff «NDA» aus den öffentlichen und Login-Texten entfernt',
    beschreibung:
      'Wir haben das Wording überall vereinfacht: statt vom «NDA-Gate», «unterzeichneten NDA» oder «NDA-Fast-Track» zu sprechen, schreiben wir jetzt von «Anfrage-Schutz», «Freigabe durch den Verkäufer», «Detail-Dossier nach Freigabe» und «Direkt-Anfrage-Track». Betroffen sind die Startseite, Verkäufer-Marketing-Seite, Käufer-MAX-Seite, Käufer-Onboarding und Käufer-Abo-Page sowie die Inserat-Detail-Hinweise. Die interne Abwicklung bleibt unverändert; nur die Nutzer-sichtbare Sprache ist neu — schweizerischer und ohne Fachjargon.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Inbox: alle Konversationen an einem Ort + Inline-Kontakt-Edit',
    beschreibung:
      'Drei grosse Verbesserungen: (1) Der bisherige Chat auf «Mein Inserat» ist weg — alle Nachrichten (Käufer-Anfragen UND Nachrichten vom passare-Team) wandern jetzt in eine zentrale Inbox unter dem Sidebar-Eintrag «Nachrichten» (vorher «Anfragen»). Layout im Slack-/Linear-Stil: links die Liste aller Konversationen mit Letzte-Nachricht-Preview und Inserat-Tag, rechts der aktive Chat — oben rechts ein subtiler Link zum jeweiligen Inserat zum Zurückspringen. (2) Käufer und Verkäufer können sich jetzt direkt im Anfragen-Chat hin und her schreiben (vorher gab es nur die initiale Käufer-Nachricht und Status-Aktionen) — Verlauf wird gespeichert, Bestands-Anfragen wurden automatisch in den neuen Chat-Verlauf migriert. (3) Beim Anonymitäts-Toggle auf «Mein Inserat» klappt jetzt automatisch ein Eingabe-Panel auf, wenn man von «Anonym» auf «Halb-anonym» oder «Voll-offen» wechselt und die nötigen Kontakt-Daten (Vorname, Funktion, Nachname, E-Mail, WhatsApp) noch nicht ausgefüllt sind — alles direkt in der Übersicht editierbar, Inserat bleibt live, Speichern in einem Klick.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Mein Inserat: kompakter Header + Anonymität direkt umstellen + live-editierbar',
    beschreibung:
      'Drei Verbesserungen auf der «Mein Inserat»-Übersicht: (1) Header kompakter — Titel, Status-Badge und die beiden Knöpfe «Live-Inserat / Vorschau» und «Bearbeiten» sind jetzt alle auf einer Zeile statt gestapelt, ID-Info wandert in den «zuletzt geändert»-Hinweis darunter. (2) Neue Sektion «Anonymität» mit drei Karten zum direkten Umstellen — Anonym (nur Eckdaten), Halb-anonym (plus Vorname und Funktion) und Voll-offen (plus Foto, Mail, Firma) — Verkäufer kann jederzeit selbst entscheiden, ohne den Wizard zu öffnen, das Inserat bleibt live. (3) Live-Inserate sind jetzt komplett editierbar — Verkäufer reicht Änderungen direkt im Wizard ein, der Server prüft was geändert wurde: Cover-Bild, Anonymität, Kontaktdaten, Social-URLs gehen direkt durch (Inserat bleibt live), nur sicherheitsrelevante Änderungen (Titel, Beschreibung, Branche, Zahlen, Eckdaten, Mitarbeitende) lösen automatisch ein erneutes Admin-Review aus mit einer Audit-Nachricht «Verkäufer hat Inserat editiert — relevante Felder: …, bitte prüfen».',
  },
  {
    date: '2026-04-30',
    type: 'infrastruktur',
    titel: 'Auth-Mails kommen jetzt von passare statt Supabase',
    beschreibung:
      'Bestätigungs-Mails (E-Mail-Verifizierung, Passwort-Reset, Magic-Link) wurden bisher mit dem Standard-«Confirm your signup»-Wording vom Hosting-Anbieter verschickt. Die passare-eigene Versand-Funktion mit Branding (Fraunces-Logo, Cream-Hintergrund, Bronze-Akzent) ist jetzt aktiv und versendet alle Auth-Mails über den eigenen Mail-Provider mit dem passare-Absender. (Hinweis: Die Aktivierung im Auth-Hook-Dashboard mit den Secrets ist als manueller Schritt in der Anleitung dokumentiert.)',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: '«Mein Inserat»-Cockpit: jetzt wirklich sichtbar + EBITDA/Preis-Korrektur',
    beschreibung:
      'Bei «Mein Inserat» ist man bisher direkt im Bearbeitungs-Wizard gelandet weil eine Datenbank-Abfrage scheiterte (verbundene Branchen-Tabelle nicht erreichbar). Behoben — die Verwaltungsseite mit Status, Vorschau, Kennzahlen, Sektionen-Liste, Konversations-Thread mit dem passare-Team und Submit-CTA zur Prüfung erscheint jetzt korrekt. Zusätzlich wurde ein Daten-Glitch in einem Inserat korrigiert (jährlicher Gewinn überschritt den Umsatz, Kaufpreis war dadurch unrealistisch hoch — auf 100 % Marge gekappt und Kaufpreis auf VHB gesetzt).',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Admin-Inserat-Review: Verkäufer-Profil ausgeklappt + Handelsregister-Alarm',
    beschreibung:
      'Beim Prüfen eines Inserats stehen rechts jetzt sämtliche Verkäufer-Daten direkt sichtbar — Name, Mitgliedschaft, Telefon- und KYC-Verifikation, E-Mail, Telefon, Kanton, Sprache, Quality-Score, Antwortzeit, alle anderen Inserate dieses Verkäufers (mit ihren Status-Badges), Tags und Admin-Notizen. Der Inserate-Zähler ist intelligenter: bei nur einem Inserat steht «Einziges Inserat», nur bei mehreren steht «3 von 7». Der Handelsregister-Abgleich ist deutlich prominenter: Abweichungen erscheinen in einer aufgeräumten Tabelle (Feld · Inserat · Handelsregister · Stufe) statt nur als Tooltip. Wenn der Verkäufer das Gründungsjahr nicht eingetragen hat, das Handelsregister es aber liefert, gibt es eine deutliche Warnung mit dem Vorschlag, den HR-Wert zu übernehmen — gleiches gilt für Firmenname, Rechtsform und Sitz-Gemeinde. Sidebar-Badge bei «Inserate» zeigt jetzt «pending / total» (z.B. «3 / 12») statt nur die Pending-Zahl, weil mehr Kontext beim einen Blick.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Anfragen-Pro: Käufer-Profil ansehen, Dossier anfordern, Datenraum freigeben',
    beschreibung:
      'Ab dem Pro-Paket öffnet sich beim Klick auf eine Anfrage eine eigene Detail-Seite mit dem kompletten Käufer-Profil — Investor-Typ, Budget, gewünschte Regionen und Branchen, Timing, Erfahrung, persönliche Beschreibung, LinkedIn, MAX-Status und Verifikations-Badges (Telefon, Finanzierung, KYC). Zwei prominente Knöpfe rechts: «Käuferdossier anfordern» (mit optionaler Begleit-Nachricht — der Käufer bekommt eine Mail und lädt sein PDF-Dossier hoch) und «Datenraum freigeben» (gibt diesem Käufer Zugriff auf den geschützten Datenraum). So kann der Verkäufer den Käufer prüfen bevor er den Chat startet — er bleibt anonym solange er will.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Verkäufer-Kontakt sauber sichtbar wenn nicht-anonym',
    beschreibung:
      'Wenn ein Verkäufer im Inserat-Wizard «Voll offen» wählt (Foto, Name, Funktion, E-Mail, WhatsApp, LinkedIn) oder «Vorname + Funktion» (z.B. «Marc, Inhaber»), erscheint diese Info jetzt automatisch oben in der Kontakt-Box auf der Inserat-Detail-Seite. Bei «Voll offen» kann der Käufer mit einem Klick direkt per WhatsApp, E-Mail oder LinkedIn schreiben — oder darunter wie gewohnt das Anfrage-Formular mit Textfeld nutzen. Bei «Halb-Anonym» sieht der Käufer nur Vorname + Funktion und schreibt über das Formular. Bei «Voll Anonym» bleibt alles wie vorher.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Benachrichtigungs-Zentrum: Du wählst, wann du E-Mails bekommst',
    beschreibung:
      'In den Einstellungen (Verkäufer) und im Käufer-Profil gibt es jetzt einen eigenen Bereich mit Schaltern für jede Mail-Art — neue Anfrage, Chat-Nachricht, Status-Wechsel beim Inserat, Wochen-Statistik, tägliches Digest, neue Treffer im Suchprofil, Antwort vom Verkäufer, Login von neuem Gerät, Rechnungen und Plattform-News. Jeder Schalter speichert sofort. Standardmässig ist alles aktiv. Sicherheits-relevante Mails (Login-Bestätigung, Passwort-Reset, Rechnungen) gehen unabhängig von der Auswahl raus — gesetzlich vorgeschrieben.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Profil & Ausloggen jetzt unten im Menü statt oben rechts',
    beschreibung:
      'In allen Dashboards (Käufer, Verkäufer, Admin) ist der Account-Bereich nun einheitlich unten links in der Seitenleiste — Avatar, Name, Mail-Adresse mit Klapp-Menü für Profil-Bearbeiten und Abmelden. Pattern wie Slack, Linear oder Notion. Die obere Leiste ist dadurch sauberer geworden — Logo, Bereichs-Badge, Marktplatz-Knopf und Benachrichtigungsglocke. Beim Käufer ist der MAX-Abo-Eintrag direkt im Account-Menü erreichbar.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: '«Mein Inserat» neu als Verwaltungsseite · NDA-Eintrag entfernt',
    beschreibung:
      'Wer auf «Inserat bearbeiten» klickt, landet jetzt auf einer richtigen Verwaltungsseite — nicht mehr direkt im Bearbeitungs-Funnel. Oben sieht man Status, Vorschau und Bearbeiten-Knopf, darunter vier Kennzahl-Kacheln (Aufrufe, Anfragen, Favoriten, Tage live). Links eine Vorschau wie der Käufer es sieht, rechts eine Liste aller Sektionen (Eckdaten, Texte, Bilder, Stärken, Sichtbarkeit, Paket) mit grünem Häkchen wenn fertig — ein Klick führt direkt in den passenden Wizard-Schritt. Footer mit Pausieren, Detail-Statistik und Inserat löschen (kommt in der nächsten Etappe). Der separate NDA-Eintrag ist aus der Verkäufer- und Käufer-Sidebar verschwunden — wird nicht abgebildet.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Pakete-Vergleichsliste passt auf einen Bildschirm · Marktplatz-Knopf in jedem Bereich',
    beschreibung:
      'Die Pakete-Übersicht im letzten Schritt vor der Bezahlung ist jetzt deutlich kompakter — kleinere Abstände, schmalere Symbole, kürzere Texte. Auf dem Desktop sieht man alle drei Pakete mit allen Vorteilen ohne scrollen. Im Käufer-, Verkäufer- und Admin-Bereich gibt es jetzt einen «Marktplatz»-Knopf oben in der Leiste — zurück zur öffentlichen Börse mit einem Klick, kein Logout mehr nötig.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Drag & Drop für alle Bilder · Stärken bearbeitbar · Google/LinkedIn-Profil wird übernommen',
    beschreibung:
      'Titelbild, Galerie-Bilder und Profilbild kann man jetzt einfach reinziehen statt in einem Datei-Browser herumklicken — Klicken geht weiterhin. Die Stärken-Punkte sind nicht nur per Drag & Drop in der Reihenfolge änderbar, sondern direkt im Feld bearbeitbar. Wer sich mit Google oder LinkedIn registriert hat, sieht in der «Voll offen»-Sichtbarkeitsstufe Vorname, Nachname und Profilfoto bereits vorausgefüllt — alles bleibt editierbar.',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Inserat-Wizard: Gründungsjahr & Co. immer sichtbar, Profilbild-Upload geht wieder',
    beschreibung:
      'Im Inserat-Wizard waren Gründungsjahr, Mitarbeitende, Umsatz und Gewinn versteckt sobald andere Felder gefüllt waren — was beim Pre-Reg-Funnel fehlte konnte man nicht mehr nachtragen. Jetzt sind alle Eckdaten-Felder immer sichtbar, vor-befüllt mit dem was schon da ist und editierbar. Im Pre-Reg-Funnel wurden die Auswahlknöpfe für Mitarbeitende und der Slider für Jahresumsatz entfernt — beides ist jetzt ein klassisches Eingabefeld. Der jährliche Gewinn (EBITDA) wird automatisch auf maximal 100 % Marge begrenzt — vorher konnte man fälschlich mehr Gewinn als Umsatz eingeben. Ausserdem behoben: Profilbild- und Cover-Upload warfen «Bucket not found» weil die Speicher-Container in der Datenbank fehlten — jetzt sauber angelegt mit korrekten Berechtigungen.',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Login mit Google bringt Admin jetzt direkt ins Admin-Panel',
    beschreibung:
      'Der eigentliche Login-Bug war versteckt: Google-Anmeldung läuft nicht über den Standard-Login-Pfad, sondern über eine eigene Custom-Route. Dort war die Weiterleitung hart auf das Verkäufer-Dashboard fixiert. Jetzt prüft auch dieser Pfad die Rolle und leitet Admins direkt ins Admin-Panel, Käufer ins Käufer-Dashboard, Verkäufer ins Verkäufer-Dashboard.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Ladeanimationen überall — passare fühlt sich jetzt flüssig an',
    beschreibung:
      'Bei jedem Klick auf einen Link erscheint sofort ein dünner bronzener Lade-Balken oben am Bildrand — egal wie schnell oder langsam die Seite reagiert. Beim Öffnen einer Inserat-Detailseite, beim Wechsel ins Käufer- oder Verkäufer-Dashboard, beim Anmelden oder Onboarden sieht man jetzt sofort eine Vorschau-Struktur (Skelett) statt einer leeren weißen Seite. Auch beim Marktplatz, Atlas, Bewertungstool und Ratgeber gibt es passende Lade-Layouts. Aufgesetzt als globaler Standard — neue Seiten bekommen das automatisch mit.',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Login leitet Admin nicht mehr fälschlich ins Verkäufer-Dashboard',
    beschreibung:
      'Wer sich nach längerer Zeit wieder eingeloggt hat, landete bisher hart auf dem Verkäufer-Dashboard — auch Admins. Jetzt prüft der Login-Schritt zuerst die Rolle und leitet Admins ins Admin-Panel, Käufer ins Käufer-Dashboard und nur tatsächliche Verkäufer (mit Inseraten oder Verkäufer-Rolle) ins Verkäufer-Dashboard.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Pakete-Vergleich neu, Profilbild-Upload, Pricing-Logik umgekehrt',
    beschreibung:
      'Im Inserat-Wizard sieht man die drei Pakete jetzt als breite Vergleichs-Liste mit allen Features pro Zeile — grüner Haken für «vorhanden» und rotes Kreuz für «nicht vorhanden», Sonderwerte wie «4× / Jahr» als grüne Pille. Sales-tauglicher als die alten Karten. Beim Profilbild (Anonymitäts-Stufe «Voll offen») kann jetzt direkt eine Datei hochgeladen werden statt eine URL einzutippen — JPG/PNG/WebP bis 3 MB. Pricing-Logik wurde umgekehrt: 6 Monate ist die Standard-Laufzeit, bei 12 Monaten gibt es 20 % Rabatt (vorher als «6M = +20 % pro Monat» dargestellt — irreführend). Preise: Light 6M CHF 445 / 12M CHF 710, Pro 6M CHF 555 / 12M CHF 890, Premium 6M CHF 1\'180 / 12M CHF 1\'890. Klein-Inserat-Rabatt 25 % bleibt zusätzlich aktiv. Trust-Footer-Text und Tagline-Hinweise im Pakete-Step entfernt — sauberer Look. CTA-Knopf heisst jetzt einfach «Weiter».',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Gründungsjahr wird nicht mehr versteckt + Pflicht-Feld im Funnel',
    beschreibung:
      'Das Gründungsjahr wurde manchmal nicht aus dem Handelsregister übernommen — und obendrein wurde das Eingabe-Feld im Inserat-Wizard versteckt, weil eine zu schwache «Pre-Onboarding komplett»-Prüfung dachte alles wäre erfasst. Jetzt prüft die Logik auch Gründungsjahr und Mitarbeitende mit — fehlt eines, erscheint das Feld zum Nachtragen. Zusätzlich ist im Pre-Reg-Funnel das Gründungsjahr jetzt Pflichtfeld (vorher als optional markiert).',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Inserat-Wizard runder: Sichtbarkeit, Pakete, Boosts, Welcome-Animation',
    beschreibung:
      'Im Inserat-Wizard wurde die Sichtbarkeits-Sektion neu strukturiert: bei «Voll anonym» bleibt es minimal, bei «Vorname + Funktion» können Vorname und Funktion eingetippt werden, bei «Voll offen» gibts Felder für Profilbild, Vor-/Nachname, Funktion, E-Mail, WhatsApp und LinkedIn — alles optional. Live-Chat ist immer aktiv (kein Toggle mehr), WhatsApp-Quick-Contact wird automatisch aktiv sobald die Nummer ausgefüllt ist. Highlights können jetzt per Drag & Drop in der Reihenfolge geändert werden. Der Pakete-Schritt zeigt einen 12/6-Monate-Toggle, alle drei Pakete nebeneinander mit Vorteils-Liste und Preis pro Monat — der Klein-Inserat-Rabatt von 25 % wird automatisch erkannt. Die drei Boosts (Hervorhebung, Newsletter-Slot, +6 Monate Laufzeit) erscheinen jetzt als grosse Apple-Style-Karten mit Icon und klarem Wert. Der Übergang ins Dashboard nach erfolgreicher Bezahlung ist jetzt eine kurze Premium-Animation mit zentralem Logo, weichem Bronze-Glow und drei Bestätigungs-Schritten — danach landet man im Dashboard. Die «Vorschau» aus dem Seiten-Menü wurde entfernt, weil sie unter «Mein Inserat» bereits prominent zu finden ist. Das Layout der «Mein Inserat»-Seite zeigt jetzt immer die Sidebar (vorher manchmal versteckt im Tunnel-Modus).',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Endlos-Schleife nach Google-Login beim Inserat-Erstellen behoben',
    beschreibung:
      'Nach erfolgreicher Google-Anmeldung blieb der Browser zwischen «Konto einrichten» und «Inserat erstellen» hängen — ewige Weiterleitungs-Schleife. Ursache: das Profil-Update für die Rolle und den abgeschlossenen Onboarding-Status wurde von der Datenbank-Sicherheitsregel blockiert (User dürfen diese Felder nicht direkt ändern, nur über eine geschützte Funktion). Das Profil blieb dadurch im Zwischenstand und beide Seiten haben sich gegenseitig zurückgeworfen. Behoben: alle Stellen die Rolle + Onboarding-Status setzen, nutzen jetzt die geschützte Funktion. Ausserdem läuft beim Google-Login jetzt der gleiche automatische Pre-Reg-Auto-Onboarding-Flow wie beim klassischen Login — wer aus dem Funnel kommt, bekommt sofort sein Inserat angelegt.',
  },
  {
    date: '2026-04-30',
    type: 'fix',
    titel: 'Google-Anmeldung: Endlos-Weiterleitung behoben',
    beschreibung:
      'Beim Versuch sich mit Google zu registrieren ist die Seite in eine Endlos-Schleife geraten («zu oft weitergeleitet»). Grund: der Beta-Schutz hat die Rückkehr von Google nicht durchgelassen, weil der Beta-Cookie bei manchen Browsern beim Wechsel von Google zurück nicht mitgeschickt wird. Behoben: die Anmelde-Routen sind jetzt vom Beta-Schutz ausgenommen.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Verkäufer-Landingpage auf neue Pakete angepasst',
    beschreibung:
      'Die Verkäufer-Seite zeigt jetzt überall die neuen Preise: Hero «Ab CHF 425», die drei Paket-Karten mit Light/Pro/Premium für CHF 710/890/1\'890 (jeweils 12 Monate Laufzeit, alternativ als 6-Monats-Variante). Klein-Inserat-Rabatt 25 % wird im Pakete-Block ausgewiesen. FAQ neu beantwortet zu Verlängerung, Klein-Rabatt, Hervorhebung und Newsletter-Slot.',
  },
  {
    date: '2026-04-30',
    type: 'feature',
    titel: 'Neues Verkäufer-Pricing live: Light · Pro · Premium',
    beschreibung:
      'Drei Pakete mit klarer Logik: Light CHF 710, Pro CHF 890 (am beliebtesten), Premium CHF 1\'890 — alle 12 Monate Laufzeit. Wahlweise 6 Monate Laufzeit mit 20 % Aufschlag pro Monat. Klein-Inserat-Rabatt 25 % für Firmen mit Verkaufspreis unter CHF 500\'000. Drei optionale Boosts: Hervorhebung CHF 49 (7 Tage Top-Position), Newsletter-Slot CHF 86 (eine prominente Erwähnung), +6 Monate Laufzeit CHF 490. Keine Auto-Verlängerung, 0 % Erfolgsprovision auf Deals.',
  },
  {
    date: '2026-04-30',
    type: 'design',
    titel: 'Marktplatz-Filter kompakter — wichtigste 4 sichtbar, Rest klappbar',
    beschreibung:
      'Der Filter auf der Startseite war zu lang — jetzt sieht man auf einen Blick die vier wichtigsten Auswahlfelder (Stichwort, Branche, Kanton, Kaufpreis). Wer mehr einstellen will, klickt auf «Mehr Filter» und bekommt Jahresumsatz, EBITDA-Marge, Mitarbeitende und Übergabegrund eingeblendet. Wenn jemand über einen Link mit erweiterten Filtern kommt, geht der Klapper automatisch auf.',
  },
  {
    date: '2026-04-30',
    type: 'milestone',
    titel: 'Plan komplett überarbeitet — 3 Phasen statt 196 Etappen',
    beschreibung:
      'Bestandsaufnahme über das ganze Projekt: Was ist wirklich live, was steht noch offen, was kommt aus den Sprachmemos neu dazu. Aus dem alten 196-Etappen-Plan wurde ein realitätsbasierter 3-Phasen-Plan. Phase 1 = was vor dem öffentlichen Launch fehlt (Mehrsprachigkeit, Bot-Schutz, Rechnungen, Trust, Tests). Phase 2 = Wachstum nach Launch (Nachfolger-Marktplatz, Talent-Tier für 24 Fr./Jahr, Atlas mit Auto-Wert für jede CH-Firma, Branchenleader-Newsroom). Phase 3 = Vision in 12+ Monaten (Finanzierung + Vertrags-KI + Daten-Dashboard für Banken).',
  },
  {
    date: '2026-04-29',
    type: 'fix',
    titel: 'Käufer-Onboarding repariert + Käufer-Bereich deutlich schneller',
    beschreibung:
      'Beim Speichern des Käufer-Profils ist nichts mehr passiert — das ist behoben. Zusätzlich öffnet sich der Käufer-Bereich jetzt spürbar flotter: alle Daten werden parallel geladen statt nacheinander. Die «Pipeline»-Liste in der Seitenleiste ist verschwunden (wurde nicht gebraucht), und der unnötige Schritt mit dem freien Textfeld am Ende des Anmeldens fliegt raus — den Text gibt man ja sowieso erst beim direkten Anschreiben eines Verkäufers ein.',
  },
  {
    date: '2026-04-29',
    type: 'design',
    titel: 'Wer eingeloggt ist, sieht keinen Anmelden-Knopf mehr',
    beschreibung:
      'Auf dem Marktplatz war oben rechts immer ein «Anmelden»-Knopf zu sehen — auch für Personen, die bereits eingeloggt waren. Jetzt erscheint dort stattdessen ein direkter Knopf «Mein Bereich», der je nach Rolle zum richtigen Dashboard führt. Auch das «Käufer»-Etikett im Dashboard-Header ist jetzt dezent statt dominant.',
  },
  {
    date: '2026-04-29',
    type: 'fix',
    titel: 'Marktplatz zeigt jetzt alle Inserat-Daten',
    beschreibung:
      'Die Inserat-Karten auf dem Marktplatz waren leer (Umsatz/EBITDA/Preis zeigten nur «—»), obwohl die Verkäufer alles eingegeben hatten. Grund: ein falsches Mapping zwischen Eingabe und Anzeige. Jetzt erscheinen Umsatz in CHF, EBITDA-Marge in Prozent, Kaufpreis und Mitarbeitende direkt aus der eingegebenen Verkäufer-Information — auf der Übersicht, in den Karten und auf der Detail-Seite.',
  },
  {
    date: '2026-04-29',
    type: 'feature',
    titel: 'Inserat-Prüfung: Rückfragen statt sofortiger Ablehnung',
    beschreibung:
      'Bevor ein Inserat live geht, prüft das passare-Team es. Falls etwas unklar ist, kann das Team eine Rückfrage an den Verkäufer schicken — der sieht die Nachricht im Dashboard, kann das Inserat anpassen und direkt antworten. Beide Seiten sehen die ganze Konversation chronologisch. Vier Aktionen: Freigeben, Rückfrage stellen, Ablehnen mit Begründung, Pausieren — jeweils mit Audit-Log-Eintrag.',
  },
  {
    date: '2026-04-29',
    type: 'milestone',
    titel: 'Plattform vollumfänglich verbunden — keine Beispiele mehr',
    beschreibung:
      'Marktplatz, Käufer-Dashboard, Detail-Seiten, Karte und alle Forms zeigen ab jetzt nur noch echte Inserate aus der zentralen Datenbank. Wer ein Inserat aufgibt, sieht es selber unmittelbar live — und sobald jemand ein Dossier anfragt, landet die Anfrage direkt beim richtigen Verkäufer im Dashboard mit Mail-Benachrichtigung. Keine Demo-Bäckerei oder Fake-Maschinenbauer mehr — alles ist echt oder klar als leer kommuniziert mit Aufruf «Sei der/die Erste».',
  },
  {
    date: '2026-04-28',
    type: 'feature',
    titel: 'Auto-Login + Google/LinkedIn-Anmeldung beim Anfrage-Flow',
    beschreibung:
      'Nach der Konto-Aktivierung ist der Käufer sofort eingeloggt — der Header zeigt direkt das Konto statt «Anmelden». Auf der Passwort-Seite kann zwischen klassischem Passwort und Google- oder LinkedIn-Anmeldung gewählt werden. Wer auf «Merken» klickt ohne eingeloggt zu sein, sieht ein zentriertes Pop-up mit denselben Optionen — schnell anmelden, Inserat merken, weiter shoppen. Mails kommen jetzt zuverlässig von noreply@passare.ch (vorher landeten sie bei einigen Inboxen unter dem alten Vemo-Absender).',
  },
  {
    date: '2026-04-28',
    type: 'design',
    titel: 'Admin-Bereich: aufgeräumt und kompakt',
    beschreibung:
      'Der Admin-Bereich wurde von Marketing-Optik auf Werkzeug-Look umgebaut: kleinere Kennzahl-Kacheln, dichtere Tabellen und Filter, weniger grosse Schrift, weniger farbige Pillen. Das Tool ist jetzt deutlich übersichtlicher und gibt mehr Information pro Bildschirmansicht — gemacht zum Arbeiten, nicht zum Anschauen.',
  },
  {
    date: '2026-04-28',
    type: 'feature',
    titel: 'Anfrage-Flow läuft echt durch — mit echter Bestätigungs-Mail',
    beschreibung:
      'Das Anfrage-Formular im Inserat verschickt jetzt eine echte Bestätigungs-Mail (kein Demo mehr). Sichtbar bekommt der User ein zentral eingeblendetes Pop-up «Bestätigungs-Mail geschickt» mit der Möglichkeit «erneut senden» falls die Mail nicht ankommt. Nach Klick auf den Link in der Mail landet der User auf einer Passwort-Seite, vergibt sein Passwort, und das Käufer-Basic-Konto wird sofort aktiviert. Gleichzeitig geht eine Mail an info@passare.ch mit allen Anfrage-Details. Sicherheits-Token sind 24 Stunden gültig und HMAC-signiert.',
  },
  {
    date: '2026-04-28',
    type: 'feature',
    titel: 'Direktkontakt bei öffentlichen Inserenten',
    beschreibung:
      'Wenn ein Verkäufer sein Profil öffentlich gestellt hat, wird unter dem Anfrage-Formular zusätzlich eine kleine «Lieber direkt?»-Box mit Profilbild, Name, Rolle, E-Mail und Telefon angezeigt — der Käufer kann wählen, ob er über passare anfragt oder direkt anruft.',
  },
  {
    date: '2026-04-28',
    type: 'feature',
    titel: 'Marktplatz: Detail-Seite, Merken & Teilen pro Inserat',
    beschreibung:
      'Auf der Börse heisst der Hauptknopf jetzt «Details» (vorher «Dossier anfragen»). Ein Klick öffnet die volle Inserat-Seite: grosses Branchen-Bild oben, ausführliche Beschreibung links, Verkäufer-Kontakt rechts. Hat der Verkäufer sein Profil öffentlich gestellt, sieht man Name, Rolle, E-Mail und Telefon direkt — sonst nur «Anonymer Verkäufer» mit Anfrage-Knopf. Auf jeder Inserat-Karte gibt es jetzt zwei kleine Knöpfe: ein Herz zum Merken und ein Teilen-Knopf, der den Link kopiert oder das System-Teilen-Menü öffnet.',
  },
  {
    date: '2026-04-28',
    type: 'fix',
    titel: 'Pre-Onboarding poliert: Trennstriche, EBITDA-Erklärung, Ladestatus',
    beschreibung:
      'Während die Firmendaten geladen werden, sieht man jetzt klar was passiert (Verbindung → UID → Adresse → Branche) und ein Lade-Balken läuft sauber. Beträge wie Umsatz und Gewinn werden in Schweizer Schreibweise angezeigt (1\'000\'000) und ein Info-Knopf erklärt was EBITDA bedeutet. Die automatische Branchen-Erkennung verwechselt nicht mehr «automatisch» mit «Automotive».',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Handelsregister-Lookup + KI-Teaser sind live',
    beschreibung:
      'Sobald ein Verkäufer seine UID-Nummer eingibt, wird Firmenname, Rechtsform, Adresse, Zweck und Sitz automatisch aus dem offiziellen Schweizer Handelsregister geholt. Antwort kommt in unter 2 Sekunden — beim Erstkontakt schickt die Plattform eine «Bitte 12 Sekunden warten»-Antwort und füllt im Hintergrund den Speicher, sodass alle weiteren Anfragen sofort funktionieren. Zusätzlich gibt es zwei KI-Funktionen: Auf Knopfdruck wird ein anonymer Inserate-Text mit Titel, Kurzbeschreibung, Detailbeschreibung, Preisempfehlung und drei Schlüsselargumenten generiert (typisch 6 Sekunden, Kosten unter 1 Rappen pro Inserat). Eine zweite Funktion schlägt automatisch die passende Branche aus dem Plattform-Katalog vor, sobald der Zweck eingegeben ist.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Verkäufer-Bereich live: Pre-Onboarding mit Smart-Bewertung',
    beschreibung:
      'Wer eine Firma verkaufen möchte, startet jetzt mit einem 5-Schritt-Pre-Onboarding noch BEVOR ein Konto angelegt wird: Live-Suche im Handelsregister füllt Firmenname/Sitz/Rechtsform automatisch aus, dann werden Branche, Umsatz, Ertrag und Mitarbeiter eingegeben — und der indikative Marktwert wird mit Animation eingeblendet. Erst dann folgt die Konto-Erstellung, wobei die Daten nahtlos ins erste Inserat übernommen werden.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Verkäufer-Dashboard: Inserat, Anfragen, NDA, Datenraum, Statistik',
    beschreibung:
      'Komplettes Verkäufer-Dashboard mit linker Navigation: Übersicht mit Live-Statistik und Onboarding-Checkliste, 5-Schritt-Inserat-Wizard mit Auto-Save und Anonymitäts-Hinweisen, Anfragen-Inbox mit Detail-Slider, NDA-Pipeline (Ausstehend → Signiert → Datenraum offen), Datenraum mit Drag-&-Drop-Upload, Versionierung und vollem Käufer-Zugriffs-Protokoll, sowie Statistik-Bereich mit Charts.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Firmen-Atlas mit interaktiver Karte',
    beschreibung:
      'Auf einer Schweizer Karte sind alle aktiven Inserate als Punkte sichtbar — gruppiert nach Region, mit Filter nach Branche und Kanton. Ein Klick zeigt Eckdaten und einen Knopf zum Dossier-Anfragen.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Gratis-Firmenbewertung — Marktwert in 60 Sekunden',
    beschreibung:
      'Sechs Fragen — Branche, Mitarbeitende, Umsatz, Ertrag, Standort, Wachstum — und der Marktwert wird auf Basis aktueller Schweizer KMU-Multiples geschätzt. Wer einen ausführlichen Detail-Report möchte, hinterlässt seine Mail.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Ratgeber-Bereich mit ersten Fachartikeln',
    beschreibung:
      'Eigener Redaktions-Bereich mit drei Erst-Artikeln zu den meistgestellten Verkäufer-Fragen: «Wann ist die richtige Zeit zu verkaufen?», «Was ist meine Firma wert?», «NDA — Schutz vor Indiskretion».',
  },
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Käufer-Bereich live: Sales-Tunnel + Dashboard',
    beschreibung:
      'Käufer können sich jetzt komplett selbst einrichten und nutzen ein eigenes Dashboard. Der neue Ablauf: Auf der Marktplatz-Seite klickt der Käufer auf «Dossier anfragen» → Konto erstellen mit Email + Passwort → fünf kurze Fragen zu Investor-Typ, gesuchten Branchen + Kantonen, Budget, Timing und Erfahrung → Paket wählen (Gratis-Basic oder MAX-Abo CHF 199/Monat oder CHF 1\'990/Jahr) → fertig im Dashboard. Im Dashboard sieht der Käufer eine Tages-Auswahl von 3 passenden Inseraten, kann Favoriten in 7 Pipeline-Stufen sortieren (Neu / Kontaktiert / NDA / Due Diligence / LOI / Gewonnen / Verloren), bis zu 3 Suchprofile mit Email- bzw. WhatsApp-Alerts (MAX) anlegen, eigene Geheimhaltungs-Verträge übersehen, einen zeitlich begrenzten Datenraum-Zugang an seinen Steuerberater oder Anwalt geben (max 14 Tage), das Abonnement verwalten und sein öffentliches Käufer-Profil pflegen — Verkäufer sehen das Profil mit Investor-Typ, Region, Budget-Range und Beschreibung wenn er eine Anfrage stellt.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Konversations-Tunnel statt Wizard — 90 Sekunden bis fertig',
    beschreibung:
      'Statt eines klassischen Schritt-für-Schritt-Wizards führt der neue Käufer-Tunnel den Nutzer in 5 schnellen Fragen durch. Jede Frage ist ein Klick (ausser optionale Beschreibung). Aus den Antworten wird automatisch das erste Suchprofil generiert — der Käufer muss nichts zweimal eintippen.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Personalisierte Paket-Empfehlung',
    beschreibung:
      'Wenn der Käufer im Tunnel «Family Office» oder «Strategischer Käufer» wählt oder ein Budget über CHF 5 Mio. angibt, zeigt die Paket-Seite ein persönliches Banner: «Bei deinem Profil empfehlen wir MAX». Auf der Paket-Seite steht direkt im Header: «Wir haben N passende Inserate für dich» — N kommt aus dem soeben angelegten Suchprofil.',
  },
  {
    date: '2026-04-27',
    type: 'design',
    titel: 'Käufer-Sidebar mit Pipeline-Übersicht und Live-Status',
    beschreibung:
      'Das Käufer-Dashboard hat eine eigene Sidebar mit dem Hauptmenü (Übersicht, Anfragen, Favoriten, NDAs, Suchprofile), einer Mini-Pipeline-Übersicht (alle 7 Stufen mit den jeweiligen Inserate-Anzahlen) und einem Account-Bereich (MAX-Abo, Käufer-Profil). Unten pulsiert ein grüner «Live»-Punkt, der zeigt dass die Tages-Auswahl jeden Morgen um 7:00 Uhr neu generiert wird.',
  },
  {
    date: '2026-04-27',
    type: 'infrastruktur',
    titel: 'Email-System aufgebaut — automatischer Versand bei allen Ereignissen',
    beschreibung:
      'Die Plattform versendet jetzt eigenständig Emails — bei der Registrierung («Willkommen»), bei der Email-Bestätigung, beim Passwort-Reset, wenn eine Anfrage eingeht oder beantwortet wird, wenn ein Geheimhaltungs-Vertrag unterschrieben ist, wenn ein Käufer-Alert auslöst, nach jeder Zahlung sowie 14 Tage bevor ein Inserat ausläuft. Alle Emails sind im passare-Look gestaltet (Schrift, Farben, Logo) und mobil lesbar. Jede Email wird intern mitprotokolliert, damit man später nachvollziehen kann was wann an wen ging. Der Versand läuft über einen separaten Email-Dienst (statt direkt über die Webseite), damit es schnell, zuverlässig und mit hoher Zustellrate funktioniert.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Handelsregister-Anbindung + KI-Teaser-Generator',
    beschreibung:
      'Verkäufer müssen ihre Firmendaten nicht mehr von Hand eintippen — die Plattform zieht Firmenname, Rechtsform, Adresse und Gründungsjahr direkt aus dem offiziellen Schweizer Handelsregister, sobald die UID-Nummer eingegeben wird. Zusätzlich erstellt eine KI auf Knopfdruck einen anonymen Inserate-Text mit Titel, Beschreibung, Preisvorschlag und drei Schlüsselargumenten — einfach Branche, Mitarbeitende und Umsatz angeben, der Rest schreibt sich selbst. Anfragen werden zwischengespeichert (24 Stunden) und sind gegen Missbrauch geschützt.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Admin-Bereich aufgeschaltet',
    beschreibung:
      'Das Vemo-Team kann sich jetzt unter einem geschützten Bereich einloggen und sieht eine Übersicht der Plattform — registrierte Nutzer, Inserate, eingegangene Anfragen und ein Aktivitäts-Protokoll. Es gibt drei Ansichten: «als Admin», «als Verkäufer» und «als Käufer», damit man die Plattform jederzeit aus der Sicht eines Kunden testen kann. Nur Administratoren haben Zugriff — alle anderen werden weitergeleitet.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Anmeldung mit Google + sichere Passwörter',
    beschreibung:
      'Auf der Anmelde- und Registrieren-Seite gibt es jetzt einen Google-Knopf für die Ein-Klick-Anmeldung. Bei der Passwort-Eingabe siehst du live wie stark dein Passwort ist (Schwach / Mittel / Stark / Sehr stark) und welche Anforderungen noch fehlen. Pflicht-Anforderung: 8 Zeichen, ein Klein- und Grossbuchstabe, eine Ziffer, ein Sonderzeichen.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Passwort-Bestätigungsfeld bei Registrierung und Reset',
    beschreibung:
      'Bei jeder Passwort-Vergabe musst du das Passwort zweimal tippen — Tippfehler werden sofort angezeigt. Augen-Symbol zum Anzeigen / Verbergen.',
  },
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Konto-Einrichtung in 3 Schritten live',
    beschreibung:
      'Neue Nutzer wählen direkt nach der Registrierung in einem schlanken Wizard ihre Rolle (verkaufen oder kaufen), erfassen Name + Kanton + Sprache und akzeptieren AGB sowie Datenschutz — alles auf einer Seite. Erst danach landet man im Dashboard.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'AGB- und Datenschutz-Zustimmung wird versioniert gespeichert',
    beschreibung:
      'Jede einzelne Zustimmung (Version, Zeitpunkt, IP, Browser) wird im Hintergrund festgehalten — sauber für die Buchhaltung und falls die Bedingungen je angepasst werden.',
  },
  {
    date: '2026-04-27',
    type: 'milestone',
    titel: 'Eigene Adresse passare.ch live aufgeschaltet',
    beschreibung:
      'Die Plattform ist ab jetzt direkt unter passare.ch erreichbar (statt der Test-Adresse). www-Variante geht ebenfalls. Die alte Test-URL bleibt vorerst parallel gültig.',
  },
  {
    date: '2026-04-27',
    type: 'feature',
    titel: 'Anmelden- und Registrieren-Knöpfe in alle Headers eingebaut',
    beschreibung:
      'Auf Startseite, Verkaufen-, Entdecken- und Preise-Seite gibt es jetzt oben rechts «Anmelden» (dezent) und «Registrieren» (prominent). Alle Paket- und Kauf-Buttons führen direkt in die Anmeldung.',
  },
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
