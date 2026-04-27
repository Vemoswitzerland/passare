/**
 * Admin-Demo-Daten — V1
 *
 * Die DB-Tabellen für Inserate, Anfragen und Audit-Logs kommen erst in
 * späteren Etappen (Etappe 47+, 50+). Für den Admin-Bereich V1 werden
 * deshalb realistische Mock-Daten verwendet, klar als Demo gekennzeichnet.
 */

export type AdminListingStatus =
  | 'entwurf'
  | 'pending'
  | 'live'
  | 'pausiert'
  | 'abgelaufen';

export type AdminListingPaket = 'light' | 'pro' | 'premium';

export type AdminDemoListing = {
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
  admin_status: AdminListingStatus;
  paket: AdminListingPaket;
  verkaeufer_email: string;
  created_at: string; // ISO
  expires_at: string; // ISO
  pending_anfragen: number;
};

export const ADMIN_DEMO_LISTINGS: AdminDemoListing[] = [
  {
    id: 'dossier-247',
    titel: 'Spezialmaschinen für die Präzisionsindustrie',
    branche: 'Maschinenbau',
    kanton: 'ZH',
    jahr: 1987,
    mitarbeitende: 34,
    umsatz: 'CHF 8.4M',
    ebitda: '18.2%',
    kaufpreis: 'CHF 6–8M',
    grund: 'Altersnachfolge',
    admin_status: 'live',
    paket: 'premium',
    verkaeufer_email: 'm.huber@maschinenbau-zh.ch',
    created_at: '2026-02-12T09:14:00Z',
    expires_at: '2027-02-12T09:14:00Z',
    pending_anfragen: 3,
  },
  {
    id: 'dossier-248',
    titel: 'Regionale Bäckerei mit Filialen',
    branche: 'Lebensmittel',
    kanton: 'BE',
    jahr: 1962,
    mitarbeitende: 18,
    umsatz: 'CHF 3.1M',
    ebitda: '12.5%',
    kaufpreis: 'VHB',
    grund: 'Altersnachfolge',
    admin_status: 'pending',
    paket: 'pro',
    verkaeufer_email: 'baeckerei.koller@gmail.com',
    created_at: '2026-04-22T16:02:00Z',
    expires_at: '2026-10-22T16:02:00Z',
    pending_anfragen: 0,
  },
  {
    id: 'dossier-249',
    titel: 'IT-Dienstleister Cloud & Security',
    branche: 'IT & Technologie',
    kanton: 'ZG',
    jahr: 2009,
    mitarbeitende: 42,
    umsatz: 'CHF 12.1M',
    ebitda: '22.0%',
    kaufpreis: 'CHF 14–18M',
    grund: 'Strategischer Exit',
    admin_status: 'live',
    paket: 'premium',
    verkaeufer_email: 'a.frey@cloudsec.ch',
    created_at: '2026-01-30T11:45:00Z',
    expires_at: '2027-01-30T11:45:00Z',
    pending_anfragen: 7,
  },
  {
    id: 'dossier-250',
    titel: 'Treuhandkanzlei mit Immobilien-Spezialisierung',
    branche: 'Finanz / Versicherung',
    kanton: 'VD',
    jahr: 1998,
    mitarbeitende: 11,
    umsatz: 'CHF 2.4M',
    ebitda: '35.0%',
    kaufpreis: 'CHF 3–4M',
    grund: 'Pensionierung',
    admin_status: 'live',
    paket: 'pro',
    verkaeufer_email: 'p.dubois@treuhand-vd.ch',
    created_at: '2026-03-04T08:30:00Z',
    expires_at: '2026-09-04T08:30:00Z',
    pending_anfragen: 2,
  },
  {
    id: 'dossier-251',
    titel: 'Elektrotechnik & Automation Industrie',
    branche: 'Handel / Industrie',
    kanton: 'SG',
    jahr: 1975,
    mitarbeitende: 58,
    umsatz: 'CHF 16.8M',
    ebitda: '14.1%',
    kaufpreis: 'CHF 18–22M',
    grund: 'Nachfolge unklar',
    admin_status: 'live',
    paket: 'premium',
    verkaeufer_email: 'r.knoepfel@elektro-sg.ch',
    created_at: '2026-02-18T13:20:00Z',
    expires_at: '2027-02-18T13:20:00Z',
    pending_anfragen: 4,
  },
  {
    id: 'dossier-252',
    titel: 'Boutique-Hotel mit 30 Zimmern',
    branche: 'Gastgewerbe',
    kanton: 'GR',
    jahr: 1923,
    mitarbeitende: 22,
    umsatz: 'CHF 4.2M',
    ebitda: '16.5%',
    kaufpreis: 'CHF 8–10M',
    grund: 'Generationenwechsel',
    admin_status: 'live',
    paket: 'pro',
    verkaeufer_email: 'familie.steiner@hotel-gr.ch',
    created_at: '2026-03-11T15:00:00Z',
    expires_at: '2026-09-11T15:00:00Z',
    pending_anfragen: 1,
  },
  {
    id: 'dossier-253',
    titel: 'Logistik-Unternehmen mit eigener Flotte',
    branche: 'Logistik',
    kanton: 'AG',
    jahr: 2001,
    mitarbeitende: 67,
    umsatz: 'CHF 22.5M',
    ebitda: '9.8%',
    kaufpreis: 'CHF 11–14M',
    grund: 'Strategisch',
    admin_status: 'live',
    paket: 'premium',
    verkaeufer_email: 'gf@logistik-aargau.ch',
    created_at: '2026-01-15T10:00:00Z',
    expires_at: '2027-01-15T10:00:00Z',
    pending_anfragen: 5,
  },
  {
    id: 'dossier-254',
    titel: 'Online-Shop für Premium-Haushaltswaren',
    branche: 'Kleinhandel',
    kanton: 'LU',
    jahr: 2015,
    mitarbeitende: 8,
    umsatz: 'CHF 1.8M',
    ebitda: '24.0%',
    kaufpreis: 'CHF 2–3M',
    grund: 'Gründer-Exit',
    admin_status: 'pending',
    paket: 'light',
    verkaeufer_email: 's.meier@premiumhome.ch',
    created_at: '2026-04-25T17:30:00Z',
    expires_at: '2026-07-25T17:30:00Z',
    pending_anfragen: 0,
  },
  {
    id: 'dossier-255',
    titel: 'Medizintechnik mit eigener Entwicklung',
    branche: 'Gesundheit',
    kanton: 'BS',
    jahr: 1989,
    mitarbeitende: 29,
    umsatz: 'CHF 9.7M',
    ebitda: '19.8%',
    kaufpreis: 'VHB',
    grund: 'Private-Equity-Exit',
    admin_status: 'live',
    paket: 'premium',
    verkaeufer_email: 'ceo@medtech-bs.ch',
    created_at: '2026-02-02T09:00:00Z',
    expires_at: '2027-02-02T09:00:00Z',
    pending_anfragen: 6,
  },
  {
    id: 'dossier-256',
    titel: 'Kleines Architekturbüro mit Stammkundschaft',
    branche: 'Beratung',
    kanton: 'TG',
    jahr: 2004,
    mitarbeitende: 6,
    umsatz: 'CHF 1.2M',
    ebitda: '15.0%',
    kaufpreis: 'CHF 0.6–0.9M',
    grund: 'Pensionierung',
    admin_status: 'entwurf',
    paket: 'light',
    verkaeufer_email: 'arch.weber@gmail.com',
    created_at: '2026-04-26T20:15:00Z',
    expires_at: '2026-07-26T20:15:00Z',
    pending_anfragen: 0,
  },
  {
    id: 'dossier-244',
    titel: 'Hofladen & Direktvermarktung',
    branche: 'Landwirtschaft',
    kanton: 'TG',
    jahr: 1995,
    mitarbeitende: 5,
    umsatz: 'CHF 0.9M',
    ebitda: '8.0%',
    kaufpreis: 'CHF 0.4–0.7M',
    grund: 'Altersnachfolge',
    admin_status: 'pausiert',
    paket: 'light',
    verkaeufer_email: 'rohner.hof@bluewin.ch',
    created_at: '2025-11-08T07:50:00Z',
    expires_at: '2026-05-08T07:50:00Z',
    pending_anfragen: 0,
  },
  {
    id: 'dossier-241',
    titel: 'Druckerei mit Digital- und Offsetbereich',
    branche: 'Andere Dienstleistungen',
    kanton: 'AG',
    jahr: 1968,
    mitarbeitende: 14,
    umsatz: 'CHF 2.7M',
    ebitda: '6.2%',
    kaufpreis: 'CHF 1–1.5M',
    grund: 'Altersnachfolge',
    admin_status: 'abgelaufen',
    paket: 'pro',
    verkaeufer_email: 'info@druckerei-baden.ch',
    created_at: '2025-08-14T10:00:00Z',
    expires_at: '2026-02-14T10:00:00Z',
    pending_anfragen: 0,
  },
];

/* ──────────────────────────────────────────────────────────────────── */

export type AdminAnfrageStatus = 'offen' | 'in_bearbeitung' | 'akzeptiert' | 'abgelehnt';

export type AdminDemoAnfrage = {
  id: string;
  inserat_id: string;
  inserat_titel: string;
  kaeufer_email: string;
  kaeufer_name: string;
  nda_unterschrieben: boolean;
  status: AdminAnfrageStatus;
  created_at: string;
  nachricht: string;
};

export const ADMIN_DEMO_ANFRAGEN: AdminDemoAnfrage[] = [
  {
    id: 'ANF-2026-001',
    inserat_id: 'dossier-249',
    inserat_titel: 'IT-Dienstleister Cloud & Security',
    kaeufer_email: 'invest@helvetia-capital.ch',
    kaeufer_name: 'Helvetia Capital AG',
    nda_unterschrieben: true,
    status: 'in_bearbeitung',
    created_at: '2026-04-25T14:32:00Z',
    nachricht:
      'Sehr interessantes Profil. Wir suchen aktuell ein IT-Sicherheitsunternehmen für unser Portfolio.',
  },
  {
    id: 'ANF-2026-002',
    inserat_id: 'dossier-247',
    inserat_titel: 'Spezialmaschinen für die Präzisionsindustrie',
    kaeufer_email: 't.meier@strategy-partners.ch',
    kaeufer_name: 'Tobias Meier',
    nda_unterschrieben: true,
    status: 'akzeptiert',
    created_at: '2026-04-21T09:18:00Z',
    nachricht: 'Familienunternehmen sucht strategische Erweiterung im Maschinenbau.',
  },
  {
    id: 'ANF-2026-003',
    inserat_id: 'dossier-253',
    inserat_titel: 'Logistik-Unternehmen mit eigener Flotte',
    kaeufer_email: 'r.berger@logistik-holding.ch',
    kaeufer_name: 'Berger Logistik Holding',
    nda_unterschrieben: false,
    status: 'offen',
    created_at: '2026-04-26T16:45:00Z',
    nachricht: 'Bitte Kontakt für weitere Informationen.',
  },
  {
    id: 'ANF-2026-004',
    inserat_id: 'dossier-255',
    inserat_titel: 'Medizintechnik mit eigener Entwicklung',
    kaeufer_email: 'm.gerber@biolabs.ch',
    kaeufer_name: 'BioLabs SA',
    nda_unterschrieben: true,
    status: 'in_bearbeitung',
    created_at: '2026-04-23T11:00:00Z',
    nachricht: 'Unser Mutterkonzern prüft Akquisitionsmöglichkeiten in der Medtech-Branche.',
  },
  {
    id: 'ANF-2026-005',
    inserat_id: 'dossier-251',
    inserat_titel: 'Elektrotechnik & Automation Industrie',
    kaeufer_email: 'family.bachmann@gmx.ch',
    kaeufer_name: 'Familie Bachmann',
    nda_unterschrieben: false,
    status: 'offen',
    created_at: '2026-04-26T19:22:00Z',
    nachricht: 'Sind Sie offen für eine erste Besprechung?',
  },
  {
    id: 'ANF-2026-006',
    inserat_id: 'dossier-249',
    inserat_titel: 'IT-Dienstleister Cloud & Security',
    kaeufer_email: 'mna@swisstech-invest.com',
    kaeufer_name: 'SwissTech Invest',
    nda_unterschrieben: true,
    status: 'abgelehnt',
    created_at: '2026-04-19T10:10:00Z',
    nachricht: 'Größenordnung passt aktuell nicht in unser Mandat.',
  },
  {
    id: 'ANF-2026-007',
    inserat_id: 'dossier-252',
    inserat_titel: 'Boutique-Hotel mit 30 Zimmern',
    kaeufer_email: 'h.bianchi@gastrogroup.ch',
    kaeufer_name: 'Gastro Group SA',
    nda_unterschrieben: true,
    status: 'in_bearbeitung',
    created_at: '2026-04-24T08:55:00Z',
    nachricht: 'Wir betreiben aktuell 7 Boutique-Hotels in der Schweiz.',
  },
  {
    id: 'ANF-2026-008',
    inserat_id: 'dossier-247',
    inserat_titel: 'Spezialmaschinen für die Präzisionsindustrie',
    kaeufer_email: 'invest@maschinen-allianz.de',
    kaeufer_name: 'Maschinen-Allianz GmbH',
    nda_unterschrieben: true,
    status: 'in_bearbeitung',
    created_at: '2026-04-22T13:00:00Z',
    nachricht: 'DE-Industrieholding mit Fokus auf Präzisionsmaschinen.',
  },
  {
    id: 'ANF-2026-009',
    inserat_id: 'dossier-250',
    inserat_titel: 'Treuhandkanzlei mit Immobilien-Spezialisierung',
    kaeufer_email: 'c.rossi@treuhand-romandie.ch',
    kaeufer_name: 'Treuhand Romandie SA',
    nda_unterschrieben: false,
    status: 'offen',
    created_at: '2026-04-26T17:00:00Z',
    nachricht: 'Welche Klientenstruktur hat die Kanzlei?',
  },
  {
    id: 'ANF-2026-010',
    inserat_id: 'dossier-253',
    inserat_titel: 'Logistik-Unternehmen mit eigener Flotte',
    kaeufer_email: 'p.studer@swiss-freight.ch',
    kaeufer_name: 'Swiss Freight Holding',
    nda_unterschrieben: true,
    status: 'akzeptiert',
    created_at: '2026-04-20T15:30:00Z',
    nachricht: 'Strategische Erweiterung Ostschweiz — sehr gut passend.',
  },
];

/* ──────────────────────────────────────────────────────────────────── */

export type AdminLogType =
  | 'login'
  | 'inserat_edit'
  | 'inserat_freigabe'
  | 'nda_signed'
  | 'anfrage'
  | 'register'
  | 'profile_update';

export type AdminDemoLog = {
  id: string;
  type: AdminLogType;
  user_email: string;
  beschreibung: string;
  created_at: string;
  ip?: string;
};

export const ADMIN_DEMO_LOGS: AdminDemoLog[] = [
  {
    id: 'LOG-001',
    type: 'login',
    user_email: 'a.frey@cloudsec.ch',
    beschreibung: 'Login von Browser (Chrome / macOS)',
    created_at: '2026-04-27T08:42:11Z',
    ip: '85.195.214.34',
  },
  {
    id: 'LOG-002',
    type: 'anfrage',
    user_email: 'r.berger@logistik-holding.ch',
    beschreibung: 'Anfrage an «Logistik-Unternehmen mit eigener Flotte» gestellt',
    created_at: '2026-04-26T16:45:00Z',
  },
  {
    id: 'LOG-003',
    type: 'inserat_edit',
    user_email: 'm.huber@maschinenbau-zh.ch',
    beschreibung: 'Inserat dossier-247 aktualisiert (Kaufpreis-Range)',
    created_at: '2026-04-26T14:20:00Z',
  },
  {
    id: 'LOG-004',
    type: 'nda_signed',
    user_email: 'invest@helvetia-capital.ch',
    beschreibung: 'NDA für dossier-249 unterzeichnet',
    created_at: '2026-04-25T14:35:08Z',
  },
  {
    id: 'LOG-005',
    type: 'register',
    user_email: 'c.rossi@treuhand-romandie.ch',
    beschreibung: 'Neue Käufer-Registrierung',
    created_at: '2026-04-26T17:00:00Z',
  },
  {
    id: 'LOG-006',
    type: 'profile_update',
    user_email: 'p.dubois@treuhand-vd.ch',
    beschreibung: 'Telefon verifiziert',
    created_at: '2026-04-25T10:15:00Z',
  },
  {
    id: 'LOG-007',
    type: 'inserat_freigabe',
    user_email: 'admin@vemo.ch',
    beschreibung: 'Inserat dossier-248 freigegeben (von Pending → Live)',
    created_at: '2026-04-24T09:00:00Z',
  },
  {
    id: 'LOG-008',
    type: 'login',
    user_email: 'admin@vemo.ch',
    beschreibung: 'Admin-Login',
    created_at: '2026-04-27T07:55:00Z',
    ip: '172.16.0.42',
  },
  {
    id: 'LOG-009',
    type: 'anfrage',
    user_email: 'family.bachmann@gmx.ch',
    beschreibung: 'Anfrage an «Elektrotechnik & Automation Industrie» gestellt',
    created_at: '2026-04-26T19:22:00Z',
  },
  {
    id: 'LOG-010',
    type: 'inserat_edit',
    user_email: 'arch.weber@gmail.com',
    beschreibung: 'Inserat dossier-256 als Entwurf gespeichert',
    created_at: '2026-04-26T20:15:00Z',
  },
  {
    id: 'LOG-011',
    type: 'login',
    user_email: 'mna@swisstech-invest.com',
    beschreibung: 'Login mit MFA',
    created_at: '2026-04-25T11:30:00Z',
  },
  {
    id: 'LOG-012',
    type: 'register',
    user_email: 's.meier@premiumhome.ch',
    beschreibung: 'Neue Verkäufer-Registrierung',
    created_at: '2026-04-25T17:25:00Z',
  },
  {
    id: 'LOG-013',
    type: 'nda_signed',
    user_email: 'h.bianchi@gastrogroup.ch',
    beschreibung: 'NDA für dossier-252 unterzeichnet',
    created_at: '2026-04-24T09:00:00Z',
  },
  {
    id: 'LOG-014',
    type: 'profile_update',
    user_email: 'gf@logistik-aargau.ch',
    beschreibung: 'KYC-Verifizierung abgeschlossen',
    created_at: '2026-04-23T14:00:00Z',
  },
  {
    id: 'LOG-015',
    type: 'inserat_freigabe',
    user_email: 'admin@vemo.ch',
    beschreibung: 'Inserat dossier-244 pausiert (auf Wunsch des Verkäufers)',
    created_at: '2026-04-22T10:30:00Z',
  },
];

/* ──────────────────────────────────────────────────────────────────── */

export const ADMIN_DEMO_STATS = {
  aktive_inserate: ADMIN_DEMO_LISTINGS.filter((l) => l.admin_status === 'live').length,
  pending_inserate: ADMIN_DEMO_LISTINGS.filter((l) => l.admin_status === 'pending').length,
  offene_anfragen: ADMIN_DEMO_ANFRAGEN.filter((a) => a.status === 'offen').length,
  max_abos: 7,
  trend_inserate: '+2 vs. letzte Woche',
  trend_anfragen: '+5 % vs. letzter Monat',
  trend_abos: '+1 neuer MAX-Kunde',
};

export const STATUS_LABELS: Record<AdminListingStatus, string> = {
  entwurf: 'Entwurf',
  pending: 'Pending',
  live: 'Live',
  pausiert: 'Pausiert',
  abgelaufen: 'Abgelaufen',
};

export const PAKET_LABELS: Record<AdminListingPaket, string> = {
  light: 'Light',
  pro: 'Pro',
  premium: 'Premium',
};

export const ANFRAGE_STATUS_LABELS: Record<AdminAnfrageStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  akzeptiert: 'Akzeptiert',
  abgelehnt: 'Abgelehnt',
};

export const LOG_TYPE_LABELS: Record<AdminLogType, string> = {
  login: 'Login',
  inserat_edit: 'Inserat-Edit',
  inserat_freigabe: 'Inserat-Status',
  nda_signed: 'NDA',
  anfrage: 'Anfrage',
  register: 'Registrierung',
  profile_update: 'Profil-Update',
};
