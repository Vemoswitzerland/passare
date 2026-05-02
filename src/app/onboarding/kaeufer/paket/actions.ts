'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function continueWithBasicAction() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  // Tier ist sowieso default 'basic' — wir setzen sicher.
  // Welcome-Email wurde schon im Tunnel verschickt — kein zweiter Send.
  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({ subscription_tier: 'basic' })
    .eq('id', u.user.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard/kaeufer?welcome=skipped');
}
