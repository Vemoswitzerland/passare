'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };
  const { data: p } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', u.user.id)
    .maybeSingle();
  if ((p?.rolle as string | undefined) !== 'admin') {
    return { ok: false, error: 'Nicht autorisiert.' };
  }
  return { ok: true, userId: u.user.id };
}

/**
 * Admin: Experte anlegen.
 *
 * Cyrill 01.05.2026: «Admin kann nur das Honorar einstellen welches
 * diese Berater haben — und Profile pflegen mit Profilbild, alles
 * drum und dran.»
 */
export async function upsertExperteAction(input: {
  id?: string;
  name: string;
  funktion?: string;
  bio?: string;
  email?: string;
  foto_url?: string;
  expertise: string[];
  honorar_chf_pro_stunde: number;
  slot_dauer_min: number;
  available_weekdays: number[];
  available_hours_start: string;
  available_hours_end: string;
  slot_intervall_min: number;
  is_active: boolean;
  sort_order: number;
}): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { ok: false, error: guard.error ?? 'Nicht autorisiert.' };

  const trimmed = (s: string | undefined) => (s && s.trim().length > 0 ? s.trim() : null);

  const payload = {
    name: input.name.trim(),
    funktion: trimmed(input.funktion),
    bio: trimmed(input.bio),
    email: trimmed(input.email),
    foto_url: trimmed(input.foto_url),
    expertise: input.expertise.filter((t) => t.trim().length > 0),
    honorar_chf_pro_stunde: input.honorar_chf_pro_stunde,
    slot_dauer_min: input.slot_dauer_min,
    available_weekdays: input.available_weekdays,
    available_hours_start: input.available_hours_start,
    available_hours_end: input.available_hours_end,
    slot_intervall_min: input.slot_intervall_min,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };

  if (!payload.name) return { ok: false, error: 'Name ist erforderlich.' };
  if (payload.honorar_chf_pro_stunde <= 0) {
    return { ok: false, error: 'Honorar muss positiv sein.' };
  }

  const supabase = await createClient();
  if (input.id) {
    const { error } = await supabase
      .from('experten')
      .update(payload)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/experten');
    revalidatePath('/dashboard/verkaeufer/experten');
    return { ok: true, id: input.id };
  } else {
    const { data, error } = await supabase
      .from('experten')
      .insert(payload)
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/experten');
    revalidatePath('/dashboard/verkaeufer/experten');
    return { ok: true, id: (data?.id as string) ?? undefined };
  }
}

export async function deleteExperteAction(id: string): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { ok: false, error: guard.error ?? 'Nicht autorisiert.' };

  const supabase = await createClient();
  // Soft-Delete: deactivate statt permanent löschen (Termine-Historie bleibt)
  const { error } = await supabase
    .from('experten')
    .update({ is_active: false })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/experten');
  revalidatePath('/dashboard/verkaeufer/experten');
  return { ok: true };
}
