/**
 * Admin-Datentypen — geteilt zwischen Pages und Komponenten.
 */

export type InseratStatus = 'entwurf' | 'pending' | 'live' | 'pausiert' | 'abgelaufen';
export type InseratPaket = 'light' | 'pro' | 'premium';
export type AnfrageStatus = 'offen' | 'in_bearbeitung' | 'akzeptiert' | 'abgelehnt';

export type AdminInserat = {
  id: string;
  public_id: string | null;
  verkaeufer_id: string | null;
  titel: string;
  branche: string | null;
  kanton: string | null;
  gruendungsjahr: number | null;
  mitarbeitende: number | null;
  umsatz_chf: number | null;
  ebitda_pct: number | null;
  kaufpreis_label: string | null;
  grund: string | null;
  paket: InseratPaket;
  status: InseratStatus;
  expires_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAnfrage = {
  id: string;
  public_id: string | null;
  inserat_id: string | null;
  kaeufer_id: string | null;
  nachricht: string | null;
  status: AnfrageStatus;
  nda_signed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAuditLog = {
  id: string;
  type: string;
  user_id: string | null;
  user_email: string | null;
  beschreibung: string;
  metadata: unknown;
  ip: string | null;
  created_at: string;
};

export const STATUS_LABELS: Record<InseratStatus, string> = {
  entwurf: 'Entwurf',
  pending: 'Pending',
  live: 'Live',
  pausiert: 'Pausiert',
  abgelaufen: 'Abgelaufen',
};

export const PAKET_LABELS: Record<InseratPaket, string> = {
  light: 'Light',
  pro: 'Pro',
  premium: 'Premium',
};

export const ANFRAGE_STATUS_LABELS: Record<AnfrageStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  akzeptiert: 'Akzeptiert',
  abgelehnt: 'Abgelehnt',
};

export const PAKET_VARIANTS: Record<InseratPaket, string> = {
  light: 'bg-stone/60 text-muted',
  pro: 'bg-bronze-soft text-bronze-ink',
  premium: 'bg-navy-soft text-navy',
};

export const formatCHF = (n: number | null): string => {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n);
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

export const formatRelative = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  if (d < 30) return `vor ${d} Tagen`;
  const m = Math.round(d / 30);
  return `vor ${m} Mt.`;
};
