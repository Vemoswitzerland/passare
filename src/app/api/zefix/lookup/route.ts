/**
 * GET /api/zefix/lookup?uid=CHE-123.456.789
 *
 * Proxy zur Zefix-Public-API mit 24h-Cache und stale-while-revalidate.
 * Rate-Limit: 60 req/min pro IP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isValidUid, lookupByUid } from '@/lib/zefix';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

  try {
    const company = await lookupByUid(uid);
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[zefix/lookup]', message);
    return NextResponse.json(
      { error: 'Zefix-Service derzeit nicht erreichbar.', detail: message },
      { status: 502 },
    );
  }
}
