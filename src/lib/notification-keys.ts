/**
 * passare.ch — Katalog aller Benachrichtigungs-Keys
 *
 * Wird von den Settings-Pages genutzt um die Toggle-Liste zu rendern.
 * Mail-Send-Code prueft via `is_notif_enabled(user_id, key)` (RPC) ob
 * ein Mail rausgehen darf.
 *
 * Default ist «true» (alles aktiv) — wer nichts aendert, bekommt alles.
 */

export type NotificationGroup = 'verkaeufer' | 'kaeufer' | 'plattform';

export type NotificationDef = {
  key: string;
  group: NotificationGroup;
  label: string;
  description: string;
};

export const NOTIFICATION_KEYS: NotificationDef[] = [
  // ── Verkäufer-spezifisch ─────────────────────────────────────────
  {
    key: 'verk_neue_anfrage',
    group: 'verkaeufer',
    label: 'Neue Käufer-Anfrage',
    description: 'Sobald ein Käufer dein Inserat anfragt — empfohlen.',
  },
  {
    key: 'verk_chat_nachricht',
    group: 'verkaeufer',
    label: 'Chat-Nachricht',
    description: 'Wenn ein Käufer dir im Chat schreibt.',
  },
  {
    key: 'verk_inserat_status',
    group: 'verkaeufer',
    label: 'Inserat-Status (Live, Rückfrage, Abgelehnt)',
    description: 'Sobald das passare-Team einen Status-Wechsel vornimmt.',
  },
  {
    key: 'verk_inserat_bald_abgelaufen',
    group: 'verkaeufer',
    label: 'Inserat läuft bald ab',
    description: '14 Tage vor Ablauf der Laufzeit.',
  },
  {
    key: 'verk_woechentliche_statistik',
    group: 'verkaeufer',
    label: 'Wöchentliche Statistik',
    description: 'Aufrufe, Anfragen und Favoriten der letzten 7 Tage — Montag morgen.',
  },
  {
    key: 'verk_passender_kaeufer',
    group: 'verkaeufer',
    label: 'Passender Käufer entdeckt',
    description: 'Wenn ein neuer Käufer mit passendem Suchprofil sich registriert.',
  },

  // ── Käufer-spezifisch ────────────────────────────────────────────
  {
    key: 'kae_daily_digest',
    group: 'kaeufer',
    label: 'E-Mail-Alerts mit Treffern',
    description: 'Treffer aus deinen Suchprofilen — Käufer+ in Echtzeit, Basic wöchentlich.',
  },
  {
    key: 'kae_neues_inserat',
    group: 'kaeufer',
    label: 'Neues Inserat passt zum Suchprofil',
    description: 'Sofort, sobald ein neues Inserat zu deinen Filter-Kriterien passt.',
  },
  {
    key: 'kae_anfrage_antwort',
    group: 'kaeufer',
    label: 'Antwort vom Verkäufer',
    description: 'Wenn ein Verkäufer auf deine Anfrage reagiert.',
  },
  {
    key: 'kae_chat_nachricht',
    group: 'kaeufer',
    label: 'Chat-Nachricht',
    description: 'Wenn ein Verkäufer dir im Chat schreibt.',
  },
  {
    key: 'kae_favorit_status',
    group: 'kaeufer',
    label: 'Favorit-Status-Änderung',
    description: 'Wenn ein Inserat das du gemerkt hast pausiert oder verkauft wird.',
  },

  // ── Plattform (für alle) ─────────────────────────────────────────
  {
    key: 'platt_login_neu',
    group: 'plattform',
    label: 'Login von neuem Gerät',
    description: 'Sicherheits-Hinweis — empfohlen.',
  },
  {
    key: 'platt_rechnung',
    group: 'plattform',
    label: 'Rechnungen & Zahlungs-Bestätigungen',
    description: 'Quittung nach Bezahlung, Mahnungen falls nötig.',
  },
  {
    key: 'platt_news',
    group: 'plattform',
    label: 'News, Tipps & Plattform-Updates',
    description: 'Gelegentliche E-Mail mit neuen Funktionen oder hilfreichen Tipps.',
  },
];

export const GROUP_LABELS: Record<NotificationGroup, string> = {
  verkaeufer: 'Als Verkäufer',
  kaeufer: 'Als Käufer',
  plattform: 'Plattform & Konto',
};

export const GROUP_DESCRIPTIONS: Record<NotificationGroup, string> = {
  verkaeufer: 'Wann wir dich als Inserate-Inhaber per Mail informieren.',
  kaeufer: 'Wann wir dich über passende Inserate, Anfragen-Antworten und Chat informieren.',
  plattform: 'Sicherheit, Rechnungen und gelegentliche Plattform-News.',
};
