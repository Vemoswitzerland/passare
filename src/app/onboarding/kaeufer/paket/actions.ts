'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function continueWithBasicAction() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  // Tier ist sowieso default 'basic' — wir setzen sicher
  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({ subscription_tier: 'basic' })
    .eq('id', u.user.id);

  // Bestätigungs-Email für Basic-Aktivierung
  if (u.user.email) {
    void sendEmail({
      template: 'EmailWelcome',
      to: u.user.email,
      vars: { rolle: 'kaeufer', tier: 'basic' },
      user_id: u.user.id,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard/kaeufer?welcome=1');
}
