/**
 * Geteilte Routing-Logik für Auth-Callbacks (E-Mail-Bestätigung & OAuth).
 *
 * Beide Callbacks (`/auth/callback` + `/api/auth/google/callback`) müssen:
 *   1. Wiederkehrer von neuen Usern unterscheiden (5-Min-Account-Alter)
 *   2. Bei Wiederkehrern in das rolle-spezifische Dashboard routen
 *   3. Ein eingehendes `next` respektieren WENN es zur Rolle passt
 *
 * Die Funktion liefert nur den Ziel-PFAD (kein Origin) — die jeweilige
 * Route baut die Redirect-Response samt Cookies selbst.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { isSafeNextPath } from './safe-redirect';

export type RouteAfterAuthResult = {
  targetPath: string;
  isWiederkehrer: boolean;
  hasInserat: boolean;
};

export async function routeAfterAuth(
  supabase: SupabaseClient,
  user: User,
  rawNext: string,
): Promise<RouteAfterAuthResult> {
  // SECURITY: `next` strikt whitelisten — sonst Open-Redirect.
  const next = isSafeNextPath(rawNext) ? rawNext : '';

  const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
  const isWiederkehrer = accountAgeMs > 5 * 60 * 1000; // 5 Minuten

  const { data: existingInserate } = await supabase
    .from('inserate')
    .select('id')
    .eq('verkaeufer_id', user.id)
    .limit(1);
  const hasInserat = (existingInserate?.length ?? 0) > 0;

  if (!isWiederkehrer && !hasInserat) {
    return { targetPath: '', isWiederkehrer: false, hasInserat: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .maybeSingle();

  const hasSpecificNext = next && next !== '/dashboard' && next !== '/';
  const nextMatchesRole =
    hasSpecificNext && (
      !profile?.rolle ||
      (profile.rolle === 'admin' && next.startsWith('/admin')) ||
      (profile.rolle === 'broker' && next.startsWith('/dashboard/broker')) ||
      (profile.rolle === 'kaeufer' && (next.startsWith('/dashboard/kaeufer') || next.startsWith('/onboarding/kaeufer'))) ||
      (profile.rolle === 'verkaeufer' && (next.startsWith('/dashboard/verkaeufer') || next.startsWith('/verkaufen')))
    );

  const targetPath = nextMatchesRole
    ? next
    : profile?.rolle === 'admin' ? '/admin'
    : profile?.rolle === 'broker' ? '/dashboard/broker'
    : profile?.rolle === 'kaeufer' ? '/dashboard/kaeufer'
    : profile?.rolle === 'verkaeufer' ? '/dashboard/verkaeufer'
    : hasInserat ? '/dashboard/verkaeufer'
    : '/dashboard';

  return { targetPath, isWiederkehrer, hasInserat };
}
