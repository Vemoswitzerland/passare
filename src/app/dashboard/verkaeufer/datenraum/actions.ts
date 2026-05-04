'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Löscht ein Datenraum-File — strikt mit Owner-Check.
 *
 * Bug-Fix: vorher fand das Delete (per RLS) statt, ohne dass der Storage
 * gegen einen Auth-Check abgesichert war. Jetzt:
 *   1. User auflesen (getUser → 401 wenn anonym)
 *   2. File + zugehöriges Inserat fetchen, Owner via inserate.verkaeufer_id prüfen
 *   3. Erst dann Storage- und DB-Delete.
 */
export async function deleteDatenraumFile(fileId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'auth' };

  const { data: file } = await supabase
    .from('datenraum_files')
    .select('storage_path, inserat_id, inserate!inner(verkaeufer_id)')
    .eq('id', fileId)
    .maybeSingle();
  if (!file) return { ok: false, error: 'not found' };

  // inserate kann von Supabase als Array oder Object kommen — beide handhaben.
  const inserateRel = (file as { inserate: { verkaeufer_id: string } | { verkaeufer_id: string }[] }).inserate;
  const verkaeuferId = Array.isArray(inserateRel) ? inserateRel[0]?.verkaeufer_id : inserateRel?.verkaeufer_id;
  if (!verkaeuferId || verkaeuferId !== user.id) {
    return { ok: false, error: 'forbidden' };
  }

  // Storage löschen — erst nach Auth-Check.
  if (file.storage_path) {
    await supabase.storage.from('datenraum-files').remove([file.storage_path]);
  }
  const { error } = await supabase.from('datenraum_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer/datenraum');
  return { ok: true };
}

/**
 * Signed-URL für Verkäufer-Download eines Datenraum-Files.
 * Owner-Check über inserate.verkaeufer_id, dann eine 5-minütige
 * signed URL aus dem Supabase-Storage.
 */
export async function getSignedDownloadUrl(fileId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nicht angemeldet.' };

  const { data: file } = await supabase
    .from('datenraum_files')
    .select('storage_path, inserate!inner(verkaeufer_id)')
    .eq('id', fileId)
    .maybeSingle();
  if (!file?.storage_path) return { ok: false, error: 'Datei nicht gefunden.' };

  const inserateRel = (file as { inserate: { verkaeufer_id: string } | { verkaeufer_id: string }[] }).inserate;
  const verkaeuferId = Array.isArray(inserateRel) ? inserateRel[0]?.verkaeufer_id : inserateRel?.verkaeufer_id;
  if (!verkaeuferId || verkaeuferId !== user.id) {
    return { ok: false, error: 'Keine Berechtigung.' };
  }

  const { data: signed, error } = await supabase
    .storage.from('datenraum-files')
    .createSignedUrl(file.storage_path, 300);
  if (error || !signed?.signedUrl) {
    return { ok: false, error: error?.message ?? 'Signed-URL fehlgeschlagen.' };
  }
  return { ok: true, url: signed.signedUrl };
}
