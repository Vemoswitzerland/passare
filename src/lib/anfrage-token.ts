/**
 * Token-Schema für Anfrage-Verifikations-Mails.
 *
 * Format: base64url(payload).base64url(hmacSha256(payload, secret))
 * Verifiziert Integrität (kein Forge möglich) und enthält Anfrage-Daten +
 * Ablauf-Zeitstempel.
 *
 * Server-only — wird in API-Route + RSC verwendet, niemals im Client-Bundle.
 *
 * Secret-Hierarchie:
 *   1. ANFRAGE_TOKEN_SECRET (dediziert)
 *   2. SUPABASE_SERVICE_ROLE_KEY (Fallback — pro Projekt einzigartig + nicht öffentlich)
 *
 * SECURITY: Der `NEXT_PUBLIC_SUPABASE_ANON_KEY` darf NIE als Token-Secret
 * dienen — er ist im Client-Bundle exposed und damit jedem Angreifer bekannt.
 * Damit liessen sich beliebige Anfrage-Tokens forgen.
 */

import { createHash, createHmac } from 'crypto';

export type AnfragePayload = {
  /** Anfrager-Name */
  n: string;
  /** Anfrager-E-Mail (= Login-E-Mail nach Konto-Aktivierung) */
  e: string;
  /** Inserat-ID */
  l: string;
  /** Nachricht (max 2000 Zeichen) */
  m: string;
  /** Ablauf-Timestamp in ms (Date.now() + 24h) */
  x: number;
};

function resolveSecret(): string {
  const secret = process.env.ANFRAGE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      'ANFRAGE_TOKEN_SECRET fehlt — bitte ANFRAGE_TOKEN_SECRET oder SUPABASE_SERVICE_ROLE_KEY setzen.',
    );
  }
  return secret;
}

// Lazy: erst beim ersten Token-Sign/Verify auflösen — sonst crashed das
// Build/Edge-Pre-Rendering wenn Env nicht gesetzt ist.
let _cachedSecret: string | null = null;
function getSecret(): string {
  if (_cachedSecret) return _cachedSecret;
  _cachedSecret = resolveSecret();
  return _cachedSecret;
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden

function base64UrlEncode(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf;
  return b.toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

function sign(payload: string): string {
  return base64UrlEncode(createHmac('sha256', getSecret()).update(payload).digest());
}

/** Erzeugt einen signierten Token für einen Verifikations-Link. */
export function createAnfrageToken(input: Omit<AnfragePayload, 'x'>): string {
  const payload: AnfragePayload = { ...input, x: Date.now() + TOKEN_TTL_MS };
  const json = JSON.stringify(payload);
  const encoded = base64UrlEncode(json);
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

/**
 * Hash-Funktion für die Replay-Tabelle `anfrage_tokens_used`.
 * Stabil über alle Verifizierungen — zwei mal den selben Token ein-
 * setzen liefert den selben Hash.
 */
export function anfrageTokenHash(token: string): string {
  return base64UrlEncode(createHash('sha256').update(token).digest());
}

/** Validiert einen Token und gibt das Payload zurück, oder null bei Fehler. */
export function verifyAnfrageToken(token: string): AnfragePayload | null {
  if (!token || typeof token !== 'string') return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = sign(encoded);
  // Constant-time-Vergleich (verhindert Timing-Angriffe)
  if (expected.length !== sig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  let payload: AnfragePayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded).toString('utf8')) as AnfragePayload;
  } catch {
    return null;
  }
  if (typeof payload.x !== 'number' || payload.x < Date.now()) return null;
  if (!payload.e || !payload.l || !payload.n) return null;
  return payload;
}
