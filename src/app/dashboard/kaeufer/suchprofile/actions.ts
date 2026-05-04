'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';
import type { ActionResult } from '@/app/auth/constants';

const profilSchema = z.object({
  name: z.string().trim().min(1).max(80),
  branche: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(20)),
  kantone: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(27)),
  umsatz_min: z.coerce.number().int().min(0).optional(),
  umsatz_max: z.coerce.number().int().min(0).optional(),
  ebitda_min: z.coerce.number().min(0).max(100).optional(),
  ma_min: z.coerce.number().int().min(0).optional(),
  ma_max: z.coerce.number().int().min(0).optional(),
  email_alert: z.union([z.literal('on'), z.literal(''), z.literal('false')]).optional()
    .transform((v) => v === 'on'),
});

// Käufer+ Benefit: Basic darf max 1 Suchprofil, Käufer+ unbegrenzt.
const BASIC_SUCHPROFIL_LIMIT = 1;

export async function createSuchprofilAction(formData: FormData): Promise<ActionResult> {
  const parsed = profilSchema.safeParse({
    name: formData.get('name'),
    branche: formData.get('branche') ?? '',
    kantone: formData.get('kantone') ?? '',
    umsatz_min: formData.get('umsatz_min') || undefined,
    umsatz_max: formData.get('umsatz_max') || undefined,
    ebitda_min: formData.get('ebitda_min') || undefined,
    ma_min: formData.get('ma_min') || undefined,
    ma_max: formData.get('ma_max') || undefined,
    email_alert: formData.get('email_alert'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben unvollständig' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  // Limit-Check: Basic darf nur 1 Suchprofil. Mehrere = Käufer+ Benefit.
  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();
  const isPlus = isPlusKaeufer(prof);
  if (!isPlus) {
    const { count } = await supabase
      .from('suchprofile')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    if ((count ?? 0) >= BASIC_SUCHPROFIL_LIMIT) {
      return {
        ok: false,
        error: 'Mit Basic kannst du nur 1 Suchprofil haben. Upgrade auf Käufer+ für unbegrenzte Suchprofile.',
      };
    }
  }

  const { error } = await supabase.from('suchprofile').insert({
    kaeufer_id: u.user.id,
    name: parsed.data.name,
    branche: parsed.data.branche,
    kantone: parsed.data.kantone,
    umsatz_min: parsed.data.umsatz_min ?? null,
    umsatz_max: parsed.data.umsatz_max ?? null,
    ebitda_min: parsed.data.ebitda_min ?? null,
    ma_min: parsed.data.ma_min ?? null,
    ma_max: parsed.data.ma_max ?? null,
    gruende: [],
    email_alert: parsed.data.email_alert ?? true,
    ist_pausiert: false,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer', 'layout');
  revalidatePath('/dashboard/broker', 'layout');
  return { ok: true };
}

export async function updateSuchprofilAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'ID fehlt' };

  const parsed = profilSchema.safeParse({
    name: formData.get('name'),
    branche: formData.get('branche') ?? '',
    kantone: formData.get('kantone') ?? '',
    umsatz_min: formData.get('umsatz_min') || undefined,
    umsatz_max: formData.get('umsatz_max') || undefined,
    ebitda_min: formData.get('ebitda_min') || undefined,
    ma_min: formData.get('ma_min') || undefined,
    ma_max: formData.get('ma_max') || undefined,
    email_alert: formData.get('email_alert'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben unvollständig' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('suchprofile')
    .update({
      name: parsed.data.name,
      branche: parsed.data.branche,
      kantone: parsed.data.kantone,
      umsatz_min: parsed.data.umsatz_min ?? null,
      umsatz_max: parsed.data.umsatz_max ?? null,
      ebitda_min: parsed.data.ebitda_min ?? null,
      ma_min: parsed.data.ma_min ?? null,
      ma_max: parsed.data.ma_max ?? null,
      email_alert: parsed.data.email_alert ?? true,
    })
    .eq('id', id)
    .eq('kaeufer_id', u.user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/kaeufer', 'layout');
  revalidatePath('/dashboard/broker', 'layout');
  return { ok: true };
}

export async function deleteSuchprofilAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;

  await supabase
    .from('suchprofile')
    .delete()
    .eq('id', id)
    .eq('kaeufer_id', u.user.id);

  revalidatePath('/dashboard/kaeufer', 'layout');
  revalidatePath('/dashboard/broker', 'layout');
}

export async function togglePauseSuchprofilAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const pause = String(formData.get('pause') ?? '') === 'true';
  if (!id) return;

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;

  await supabase
    .from('suchprofile')
    .update({ ist_pausiert: pause })
    .eq('id', id)
    .eq('kaeufer_id', u.user.id);

  revalidatePath('/dashboard/kaeufer', 'layout');
  revalidatePath('/dashboard/broker', 'layout');
}
