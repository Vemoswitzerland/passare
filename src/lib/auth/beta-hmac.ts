// Edge-kompatibler HMAC-Helper für das Beta-Cookie.
// Wird sowohl von der Middleware (Edge-Runtime) als auch von /api/beta (Node-Runtime) verwendet.
// Web-Crypto-API funktioniert in beiden Runtimes (Node 18+ exposed sie über globalThis.crypto).

export async function betaCookieValue(code: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(code),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('passare_beta_v1'));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
