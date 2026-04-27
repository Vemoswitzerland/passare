/**
 * GET /api/zefix/search?q=acme&limit=20
 *
 * Volltext-Suche im Schweizer Handelsregister.
 * Rate-Limit: 60 req/min pro IP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { searchByName } from '@/lib/zefix';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limitParam = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10);
  const maxResults = Math.min(Math.max(isNaN(limitParam) ? 20 : limitParam, 1), 50);

  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Suchbegriff muss mind. 2 Zeichen lang sein.' },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const rate = await checkRateLimit(ip, 'zefix_search', 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate-Limit erreicht. Versuch es in einer Minute erneut.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  try {
    const hits = await searchByName(q, maxResults);
    return NextResponse.json(
      { query: q, count: hits.length, hits },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'X-RateLimit-Remaining': String(rate.remaining),
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[zefix/search]', message);
    return NextResponse.json(
      { error: 'Zefix-Service derzeit nicht erreichbar.', detail: message },
      { status: 502 },
    );
  }
}
