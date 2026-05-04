/**
 * Safe-Redirect-Helper für `next`-Parameter.
 *
 * Verhindert Open-Redirect-Angriffe: ein Angreifer kann
 * `?next=//evil.com` oder `?next=/\evil.com` einsetzen, was Browser
 * als Cross-Site-URL parsen — der User landet dann auf der fremden
 * Domain während der Pfad legitim aussieht.
 *
 * Whitelist-Regeln:
 *  - muss mit `/` starten
 *  - darf NICHT mit `//` beginnen (protocol-relative URL)
 *  - darf NICHT mit `/\` beginnen (Backslash-Bypass)
 *  - keine Whitespace-Zeichen am Anfang
 */
export function isSafeNextPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length === 0) return false;
  // Trimmen: Whitespace am Anfang ist immer suspekt
  const v = value.trim();
  if (v !== value) return false;
  if (!v.startsWith('/')) return false;
  if (v.startsWith('//')) return false;
  if (v.startsWith('/\\')) return false;
  // Keine Auth-Schemes als String drin
  if (/^\/+(?:javascript|data|vbscript|file):/i.test(v)) return false;
  return true;
}

/**
 * Liefert `next` zurück wenn safe, sonst den Fallback.
 */
export function safeNextPath(value: unknown, fallback = '/dashboard'): string {
  return isSafeNextPath(value) ? value : fallback;
}
