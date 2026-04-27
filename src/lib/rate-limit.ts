/**
 * Sliding-Window Rate-Limit auf Basis der `rate_limit_log` Tabelle.
 *
 * Verwendet Minuten-Buckets: Pro (ip, endpoint, window_start) wird
 * `count` inkrementiert. Limit-Check addiert die letzten 60 Sekunden.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // Sekunden bis Reset
};

const DEFAULT_LIMIT = 60;
const WINDOW_SECONDS = 60;

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number = DEFAULT_LIMIT,
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const now = new Date();
  const bucket = new Date(Math.floor(now.getTime() / (WINDOW_SECONDS * 1000)) * WINDOW_SECONDS * 1000);
  const bucketIso = bucket.toISOString();

  // Versuche existierenden Bucket zu inkrementieren via upsert
  const { data: existing } = await supabase
    .from('rate_limit_log')
    .select('count')
    .eq('ip', ip)
    .eq('endpoint', endpoint)
    .eq('window_start', bucketIso)
    .maybeSingle();

  const newCount = (existing?.count ?? 0) + 1;

  if (newCount > limit) {
    const retryAfter = WINDOW_SECONDS - Math.floor((now.getTime() - bucket.getTime()) / 1000);
    return { allowed: false, remaining: 0, retryAfter: Math.max(retryAfter, 1) };
  }

  await supabase
    .from('rate_limit_log')
    .upsert(
      {
        ip,
        endpoint,
        window_start: bucketIso,
        count: newCount,
        updated_at: now.toISOString(),
      },
      { onConflict: 'ip,endpoint,window_start' },
    );

  return {
    allowed: true,
    remaining: limit - newCount,
    retryAfter: 0,
  };
}
