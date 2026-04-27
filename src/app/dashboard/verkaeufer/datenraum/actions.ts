'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function deleteDatenraumFile(fileId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: file } = await supabase
    .from('datenraum_files')
    .select('storage_path, inserat_id, inserate!inner(owner_id)')
    .eq('id', fileId)
    .maybeSingle();
  if (!file) return { ok: false, error: 'not found' };

  // Storage löschen
  if (file.storage_path) {
    await supabase.storage.from('datenraum-files').remove([file.storage_path]);
  }
  const { error } = await supabase.from('datenraum_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer/datenraum');
  return { ok: true };
}
