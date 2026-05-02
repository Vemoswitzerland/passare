'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Setzt die Rolle für einen frisch eingeloggten User der weder
 * `intended_role` noch ein Pre-Reg-Cookie hat (klassischer Google-OAuth-
 * Login). Markiert das Onboarding als abgeschlossen und leitet ins
 * jeweilige Dashboard weiter.
 */
export async function setRolleAction(rolle: 'verkaeufer' | 'kaeufer' | 'broker') {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  const fullName = u.user.user_metadata?.full_name ?? '';
  const sprache = u.user.user_metadata?.sprache ?? 'de';

  if (rolle === 'broker') {
    redirect('/onboarding/broker/tunnel');
  }

  await supabase.from('profiles').upsert({
    id: u.user.id,
    rolle,
    full_name: fullName,
    sprache,
    onboarding_completed_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  revalidatePath('/');
  if (rolle === 'kaeufer') {
    redirect('/onboarding/kaeufer/tunnel');
  }
  redirect('/dashboard/verkaeufer');
}
