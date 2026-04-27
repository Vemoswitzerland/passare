// ════════════════════════════════════════════════════════════════════
// passare.ch — Auth-Guards & View-Switch (Admin Impersonation)
// ════════════════════════════════════════════════════════════════════
// Helper für Server-Components / Server-Actions:
// - Cookie-Konvention abgestimmt mit Käufer-Bereich (admin_impersonation)
// - requireRole(): zentrale Auth-Guard mit Redirect-Logik

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type Rolle = 'verkaeufer' | 'kaeufer' | 'admin';

export type Profile = {
  id: string;
  rolle: Rolle | null;
  full_name: string | null;
  kanton: string | null;
  sprache: string;
  onboarding_completed_at: string | null;
};

// Gemeinsame Cookie-Konvention zwischen Käufer- und Verkäufer-Agent
export const ADMIN_IMPERSONATION_COOKIE = 'admin_impersonation';
export type ImpersonationMode = 'verkaeufer' | 'kaeufer' | 'admin' | null;

/** Liest aktuelle Impersonation-Mode (nur für Admins gültig). */
export async function getImpersonationMode(): Promise<ImpersonationMode> {
  const cookieStore = await cookies();
  const v = cookieStore.get(ADMIN_IMPERSONATION_COOKIE)?.value as ImpersonationMode;
  if (v === 'verkaeufer' || v === 'kaeufer' || v === 'admin') return v;
  return null;
}

/**
 * Auth-Guard: redirected wenn nicht eingeloggt, nicht onboarded oder
 * falsche Rolle. Returns das geladene Profile.
 *
 * Admin darf immer rein. Wenn Admin mit `admin_impersonation`-Cookie
 * 'verkaeufer' setzt, behandeln wir ihn UI-seitig als Verkäufer.
 */
export async function requireRole(
  allowed: Rolle | Rolle[],
  options: {
    fallbackPath?: string;
    skipOnboardingCheck?: boolean;
  } = {},
): Promise<Profile> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, rolle, full_name, kanton, sprache, onboarding_completed_at')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/auth/login');
  }

  if (!options.skipOnboardingCheck && !profile.onboarding_completed_at) {
    redirect('/onboarding');
  }

  const allowedList = Array.isArray(allowed) ? allowed : [allowed];

  // Admin darf grundsätzlich rein
  if (profile.rolle === 'admin') {
    return profile as Profile;
  }
  if (!profile.rolle || !allowedList.includes(profile.rolle as Rolle)) {
    redirect(options.fallbackPath ?? '/dashboard');
  }

  return profile as Profile;
}

/**
 * Liefert vollen Verkäufer-Kontext: Profile + Mode + isAdmin-Flag.
 * Wird vom /dashboard/verkaeufer Layout genutzt.
 */
export async function getVerkaeuferContext(): Promise<{
  profile: Profile;
  isAdmin: boolean;
  impersonationMode: ImpersonationMode;
}> {
  const profile = await requireRole(['verkaeufer', 'admin']);
  const isAdmin = profile.rolle === 'admin';
  const impersonationMode = isAdmin ? await getImpersonationMode() : null;
  return { profile, isAdmin, impersonationMode };
}
