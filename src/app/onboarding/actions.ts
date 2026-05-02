'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AGB_VERSION, DATENSCHUTZ_VERSION } from '@/app/auth/constants';

/**
 * Setzt die Rolle für einen frisch eingeloggten User der weder
 * `intended_role` noch ein Pre-Reg-Cookie hat (klassischer Google-OAuth-
 * Login).
 *
 * WICHTIG: RLS auf profiles erlaubt User KEINEN direkten UPDATE auf rolle
 * oder onboarding_completed_at. Wir müssen complete_onboarding-RPC
 * (security definer) nutzen — sonst bleibt die Rolle null und
 * /dashboard/verkaeufer redirected zurück zu /onboarding (Endlos-Loop,
 * den Cyrill als «klickt, lädt, kommt wieder» sieht).
 */
export async function setRolleAction(rolle: 'verkaeufer' | 'kaeufer' | 'broker') {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  // Broker hat eigenen Tunnel — dort wird die Rolle gesetzt.
  if (rolle === 'broker') {
    redirect('/onboarding/broker/tunnel');
  }

  // Käufer wird erst im Tunnel onboarded (siehe ensureKaeuferRolle).
  if (rolle === 'kaeufer') {
    redirect('/onboarding/kaeufer/tunnel');
  }

  // Verkäufer: Rolle + Onboarding via security-definer-RPC setzen.
  const fullName = u.user.user_metadata?.full_name
    ?? u.user.email?.split('@')[0]
    ?? 'User';
  const sprache = u.user.user_metadata?.sprache ?? 'de';
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = h.get('user-agent') ?? null;

  const { error } = await supabase.rpc('complete_onboarding', {
    p_rolle: 'verkaeufer',
    p_full_name: fullName,
    p_kanton: 'ZH',
    p_sprache: sprache,
    p_agb_version: AGB_VERSION,
    p_datenschutz_version: DATENSCHUTZ_VERSION,
    p_ip: ip,
    p_user_agent: ua,
  });

  if (error && !/rolle.*bereits|already set|protect_rolle/i.test(error.message)) {
    console.warn('[setRolleAction] complete_onboarding fehlgeschlagen:', error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard/verkaeufer');
}
