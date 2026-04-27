/**
 * GET /api/zefix/lookup?uid=CHE-123.456.789
 *
 * Hybrid-Lookup-Strategie (LINDAS-SPARQL ist 13-15s, Vercel cuts at ~10s):
 *   1. Cache-Hit → sofort zurück
 *   2. Race: max. 7s auf LINDAS warten
 *   3. Bei Timeout → 202 Accepted + Retry-After. Im Hintergrund läuft
 *      der Lookup via `after()` weiter und füllt den Cache, sodass
 *      ein Retry nach ~10s einen Cache-Hit hat.
 *
 * Rate-Limit: 60 req/min pro IP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { isValidUid, lookupByUid, primeLookupCache } from '@/lib/zefix';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const FAST_TIMEOUT_MS = 7000;

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')?.trim() ?? '';

  if (!uid) {
    return NextResponse.json(
      { error: 'Parameter `uid` fehlt.', hint: 'Beispiel: ?uid=CHE-123.456.789' },
      { status: 400 },
    );
  }

  if (!isValidUid(uid)) {
    return NextResponse.json(
      { error: 'Ungültiges UID-Format.', hint: 'Erwartet: CHE-123.456.789' },
      { status: 400 },
    );
  }

  // Rate-Limit defensiv: bei DB-Fehler durchwinken
  const ip = getClientIp(req);
  let limitRemaining = 60;
  try {
    const limit = await checkRateLimit(ip, 'zefix_lookup', 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Rate-Limit erreicht. Versuch es in einer Minute erneut.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(limit.retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }
    limitRemaining = limit.remaining;
  } catch (err) {
    console.warn('[zefix/lookup] rate-limit unavailable, allowing:', err instanceof Error ? err.message : err);
  }

  // Race: schnelle Antwort oder 202 + Background-Fill
  const fastResult = await Promise.race([
    lookupByUid(uid).catch((err) => ({ __error: err })),
    new Promise<'__timeout'>((resolve) => setTimeout(() => resolve('__timeout'), FAST_TIMEOUT_MS)),
  ]);

  if (fastResult === '__timeout') {
    // LINDAS hängt. Im Hintergrund weiter abrufen → Cache füllen.
    after(async () => {
      try {
        await primeLookupCache(uid);
      } catch (err) {
        console.error('[zefix/lookup] background-fill failed:', err);
      }
    });
    return NextResponse.json(
      {
        status: 'pending',
        uid,
        message: 'Handelsregister-Abfrage dauert länger als erwartet. Bitte in 10–15 Sekunden erneut versuchen.',
        retry_after_seconds: 12,
      },
      {
        status: 202,
        headers: {
          'Retry-After': '12',
          'X-RateLimit-Remaining': String(limitRemaining),
        },
      },
    );
  }

  if (fastResult && typeof fastResult === 'object' && '__error' in fastResult) {
    const err = (fastResult as { __error: unknown }).__error;
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[zefix/lookup]', message);
    return NextResponse.json(
      { error: 'Zefix-Service derzeit nicht erreichbar.', detail: message },
      { status: 502 },
    );
  }

  const company = fastResult as Awaited<ReturnType<typeof lookupByUid>>;
  if (!company) {
    return NextResponse.json(
      { error: 'Firma nicht gefunden.', uid },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { company },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': String(limitRemaining),
      },
    },
  );
}
