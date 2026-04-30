/**
 * passare.ch — Token- & Kosten-Tracking pro Agent-Session
 *
 * Jeder Chat (= Agent-Session) trägt am Ende seines Tasks hier eine Entry ein.
 * Wird live auf /status angezeigt → Cyrill sieht in Echtzeit was die Plattform
 * ihn an Claude-Tokens kostet.
 *
 * REGEL (siehe docs/AGENT_PROTOCOL.md):
 * - Nach jedem abgeschlossenen Task: Entry oben in `SESSIONS` einfügen
 * - Bei laufenden Multi-Step-Tasks: Entry am Anfang anlegen, am Ende updaten
 * - NIE bestehende Entries löschen oder rückwirkend bearbeiten
 */

/* ─── Pricing (Claude Opus 4.7, Stand 2026-04-27) ─── */
export const PRICING = {
  inputUsdPerMTok: 15,
  outputUsdPerMTok: 75,
  cacheWriteUsdPerMTok: 18.75,
  cacheReadUsdPerMTok: 1.5,
  // Long-Context (>200k) hätte 2× Pricing — wir mitteln pragmatisch nicht ein
  usdToChf: 0.91,
} as const;

export type AgentBereich =
  | 'setup'
  | 'design'
  | 'pages'
  | 'status'
  | 'sso'
  | 'auth'
  | 'onboarding'
  | 'oauth'
  | 'marketplace'
  | 'inserat-cards'
  | 'admin'
  | 'verkaeufer'
  | 'kaeufer'
  | 'lead-magnete'
  | 'email'
  | 'stripe'
  | 'zefix-ai'
  | 'seo'
  | 'sonstiges';

export type AgentSession = {
  /** ISO-Datum der Session */
  date: string;
  /** Welcher Bereich der Plattform wurde gebaut */
  bereich: AgentBereich;
  /** Kurze Beschreibung was passiert ist */
  titel: string;
  /** Tokens (Schätzung wenn nicht exakt) */
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  /** Wall-Clock-Zeit in Minuten (seriell summiert für Total-Stunden-KPI) */
  dauerMinuten: number;
  /** 'live' = grad am Laufen, 'done' = abgeschlossen */
  status: 'live' | 'done';
};

/**
 * Alle Agent-Sessions seit Projekt-Start.
 * Neueste zuerst (Insert oben).
 */
export const SESSIONS: AgentSession[] = [
  {
    date: '2026-04-30',
    bereich: 'seo',
    titel: 'Inserat-Detail: Verkäufer-Kontakt-Box je nach Anonymitäts-Level',
    inputTokens: 620_000,
    outputTokens: 85_000,
    dauerMinuten: 30,
    status: 'done',
  },
  {
    date: '2026-04-30',
    bereich: 'design',
    titel: 'Globale Ladeanimationen + Loading-Skeletons systemweit',
    inputTokens: 350_000,
    outputTokens: 95_000,
    dauerMinuten: 25,
    status: 'done',
  },
  {
    date: '2026-04-29',
    bereich: 'kaeufer',
    titel: 'Käufer-Onboarding-Hotfix + Marktplatz-Header + Performance-Boost',
    inputTokens: 220_000,
    outputTokens: 60_000,
    dauerMinuten: 30,
    status: 'done',
  },
  {
    date: '2026-04-29',
    bereich: 'marketplace',
    titel: 'Mock-Daten raus, Marktplatz/Käufer/Anfrage/Atlas/Forms via Datenbank',
    inputTokens: 950_000,
    outputTokens: 280_000,
    cacheReadTokens: 120_000,
    dauerMinuten: 90,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'sonstiges',
    titel: 'Token-Tracking + Agent-Protokoll Live auf /status',
    inputTokens: 280_000,
    outputTokens: 85_000,
    dauerMinuten: 35,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'inserat-cards',
    titel: 'Inserat-Cards mit Blur-Cover + Key-Facts-Algorithmus',
    inputTokens: 380_000,
    outputTokens: 120_000,
    dauerMinuten: 105,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'marketplace',
    titel: 'Marketplace-Pivot: Homepage = Marktplatz',
    inputTokens: 450_000,
    outputTokens: 150_000,
    dauerMinuten: 120,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'oauth',
    titel: 'OAuth Setup (Google + LinkedIn) + Page + App',
    inputTokens: 600_000,
    outputTokens: 200_000,
    dauerMinuten: 180,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'onboarding',
    titel: 'Etappe 3 — Onboarding-Wizard mit Atomic RPC',
    inputTokens: 280_000,
    outputTokens: 90_000,
    dauerMinuten: 90,
    status: 'done',
  },
  {
    date: '2026-04-27',
    bereich: 'auth',
    titel: 'Etappe 2 — Persistenz + Auth + Profiles + RLS',
    inputTokens: 350_000,
    outputTokens: 100_000,
    dauerMinuten: 105,
    status: 'done',
  },
  {
    date: '2026-04-26',
    bereich: 'sso',
    titel: 'Etappe 1.9 — Vercel SSO weg + robots.txt Disallow',
    inputTokens: 50_000,
    outputTokens: 15_000,
    dauerMinuten: 15,
    status: 'done',
  },
  {
    date: '2026-04-26',
    bereich: 'status',
    titel: 'Etappe 1.8 — Live-Status-Seite mit Code 2827',
    inputTokens: 90_000,
    outputTokens: 30_000,
    dauerMinuten: 30,
    status: 'done',
  },
  {
    date: '2026-04-26',
    bereich: 'pages',
    titel: 'Etappe 1.7 — Self-Service + /verkaufen /kaufen /preise',
    inputTokens: 200_000,
    outputTokens: 60_000,
    dauerMinuten: 75,
    status: 'done',
  },
  {
    date: '2026-04-25',
    bereich: 'design',
    titel: 'Etappe 1.5 — Design-System v1.0',
    inputTokens: 120_000,
    outputTokens: 40_000,
    dauerMinuten: 45,
    status: 'done',
  },
  {
    date: '2026-04-25',
    bereich: 'setup',
    titel: 'Etappe 1 — Repo + Scaffold + Beta-Gate + Vercel-Deploy',
    inputTokens: 80_000,
    outputTokens: 25_000,
    dauerMinuten: 30,
    status: 'done',
  },
];

/* ─── Helper: Kosten pro Session ─── */
export function sessionKostenUsd(s: AgentSession): number {
  const inUsd = (s.inputTokens / 1_000_000) * PRICING.inputUsdPerMTok;
  const outUsd = (s.outputTokens / 1_000_000) * PRICING.outputUsdPerMTok;
  const cacheRUsd = ((s.cacheReadTokens ?? 0) / 1_000_000) * PRICING.cacheReadUsdPerMTok;
  const cacheWUsd = ((s.cacheWriteTokens ?? 0) / 1_000_000) * PRICING.cacheWriteUsdPerMTok;
  return inUsd + outUsd + cacheRUsd + cacheWUsd;
}

export function sessionKostenChf(s: AgentSession): number {
  return sessionKostenUsd(s) * PRICING.usdToChf;
}

/* ─── Helper: Aggregate ─── */
export function gesamtTokens(): number {
  return SESSIONS.reduce(
    (acc, s) => acc + s.inputTokens + s.outputTokens + (s.cacheReadTokens ?? 0) + (s.cacheWriteTokens ?? 0),
    0,
  );
}

export function gesamtKostenUsd(): number {
  return SESSIONS.reduce((acc, s) => acc + sessionKostenUsd(s), 0);
}

export function gesamtKostenChf(): number {
  return gesamtKostenUsd() * PRICING.usdToChf;
}

/** Total Wall-Clock-Stunden, alle Chats seriell summiert (auch wenn parallel gelaufen) */
export function gesamtMinuten(): number {
  return SESSIONS.reduce((acc, s) => acc + s.dauerMinuten, 0);
}

export function gesamtStunden(): number {
  return gesamtMinuten() / 60;
}

/* ─── Display-Helper ─── */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} Mio`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}'${String(n % 1_000).padStart(3, '0')}`;
  return String(n);
}

export function fmtChf(n: number): string {
  return `CHF ${n.toFixed(2).replace('.', '.')}`;
}

export function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** "1h 45m" oder "45m" */
export function fmtDauer(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "14.5 h" für KPI-Karte */
export function fmtStunden(h: number): string {
  return `${h.toFixed(1)} h`;
}

/* ─── Bereich-Labels für Anzeige ─── */
export const BEREICH_LABELS: Record<AgentBereich, string> = {
  setup: 'Setup & Scaffold',
  design: 'Design-System',
  pages: 'Einzelseiten',
  status: 'Live-Status',
  sso: 'SSO + robots.txt',
  auth: 'Auth + Persistenz',
  onboarding: 'Onboarding',
  oauth: 'OAuth (Google/LinkedIn)',
  marketplace: 'Marktplatz-Pivot',
  'inserat-cards': 'Inserat-Cards',
  admin: 'Admin-Bereich',
  verkaeufer: 'Verkäufer-Bereich',
  kaeufer: 'Käufer-Bereich',
  'lead-magnete': 'Lead-Magnete',
  email: 'Email-System',
  stripe: 'Bezahlung',
  'zefix-ai': 'Zefix + KI-Teaser',
  seo: 'SEO + Inserat-Detail',
  sonstiges: 'Sonstiges',
};
