'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Inserat verlängern — Quick-Fix-Aktion vom «Verlängern»-Button.
 * Verlängert expires_at um die übergebenen Monate, setzt paid_at neu.
 */
export async function extendInseratAction(
  inseratId: string,
  additionalMonths: number = 6,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const { data: ins } = await supabase
    .from('inserate')
    .select('id, expires_at, verkaeufer_id')
    .eq('id', inseratId)
    .eq('verkaeufer_id', u.user.id)
    .maybeSingle();
  if (!ins) return { ok: false, error: 'Keine Berechtigung oder Inserat nicht gefunden.' };

  const now = new Date();
  const base = ins.expires_at && new Date(ins.expires_at) > now
    ? new Date(ins.expires_at)
    : now;
  base.setMonth(base.getMonth() + additionalMonths);

  const { error } = await supabase
    .from('inserate')
    .update({
      expires_at: base.toISOString(),
      paid_at: new Date().toISOString(),
    })
    .eq('id', inseratId)
    .eq('verkaeufer_id', u.user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/paket');
  revalidatePath('/dashboard/verkaeufer');
  return { ok: true };
}
