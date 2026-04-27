'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setAnfrageStatus(
  anfrageId: string,
  status: 'akzeptiert' | 'abgelehnt' | 'released' | 'geschlossen' | 'nda_pending',
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_anfrage_status', {
    p_id: anfrageId,
    p_status: status,
    p_reason: reason ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer/anfragen');
  revalidatePath('/dashboard/verkaeufer/nda');
  return { ok: true };
}
