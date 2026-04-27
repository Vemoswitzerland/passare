'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/app/auth/constants';

const stageEnum = z.enum(['neu', 'kontaktiert', 'nda', 'dd', 'loi', 'won', 'lost']);

export async function updateFavoritStageAction(formData: FormData): Promise<ActionResult> {
  const inserat_id = String(formData.get('inserat_id') ?? '');
  const stage = stageEnum.safeParse(formData.get('stage'));
  if (!inserat_id || !stage.success) return { ok: false, error: 'Ungültige Eingabe' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('favoriten')
    .update({ stage: stage.data })
    .eq('kaeufer_id', u.user.id)
    .eq('inserat_id', inserat_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer/favoriten');
  return { ok: true };
}

export async function updateFavoritNoteAction(formData: FormData): Promise<ActionResult> {
  const inserat_id = String(formData.get('inserat_id') ?? '');
  const note = String(formData.get('note') ?? '').slice(0, 500);
  if (!inserat_id) return { ok: false, error: 'Ungültige Eingabe' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('favoriten')
    .update({ note: note || null })
    .eq('kaeufer_id', u.user.id)
    .eq('inserat_id', inserat_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer/favoriten');
  return { ok: true };
}

export async function addFavoritAction(formData: FormData): Promise<ActionResult> {
  const inserat_id = String(formData.get('inserat_id') ?? '');
  if (!inserat_id) return { ok: false, error: 'Ungültige Eingabe' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('favoriten')
    .upsert(
      { kaeufer_id: u.user.id, inserat_id, stage: 'neu' },
      { onConflict: 'kaeufer_id,inserat_id' },
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer/favoriten');
  return { ok: true };
}

export async function removeFavoritAction(formData: FormData): Promise<ActionResult> {
  const inserat_id = String(formData.get('inserat_id') ?? '');
  if (!inserat_id) return { ok: false, error: 'Ungültige Eingabe' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('favoriten')
    .delete()
    .eq('kaeufer_id', u.user.id)
    .eq('inserat_id', inserat_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer/favoriten');
  return { ok: true };
}
