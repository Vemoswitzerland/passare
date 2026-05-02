'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/app/auth/constants';

const profilSchema = z.object({
  investor_typ: z.enum(['privatperson', 'family_office', 'holding_strategisch', 'mbi_management', 'berater_broker']),
  budget_min: z.coerce.number().int().min(0).optional(),
  budget_max: z.coerce.number().int().min(0).optional(),
  budget_undisclosed: z.union([z.literal('on'), z.literal(''), z.literal('false')]).optional()
    .transform((v) => v === 'on'),
  regionen: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(27)),
  branche_praeferenzen: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(20)),
  timing: z.enum(['sofort', '3_monate', '6_monate', '12_monate', 'nur_browsing']).optional(),
  erfahrung: z.enum(['erstkaeufer', '1_3_deals', '4_plus_deals']).optional(),
  beschreibung: z.string().trim().max(2000).optional(),
  ist_oeffentlich: z.union([z.literal('on'), z.literal(''), z.literal('false')]).optional()
    .transform((v) => v === 'on'),
  linkedin_url: z.string().trim().max(200).optional().or(z.literal('')),
});

export async function updateKaeuferProfilAction(formData: FormData): Promise<ActionResult> {
  const parsed = profilSchema.safeParse({
    investor_typ: formData.get('investor_typ'),
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    budget_undisclosed: formData.get('budget_undisclosed'),
    regionen: formData.get('regionen') ?? '',
    branche_praeferenzen: formData.get('branche_praeferenzen') ?? '',
    timing: formData.get('timing') || undefined,
    erfahrung: formData.get('erfahrung') || undefined,
    beschreibung: formData.get('beschreibung') || undefined,
    ist_oeffentlich: formData.get('ist_oeffentlich'),
    linkedin_url: formData.get('linkedin_url') || '',
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben ungültig' };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const undisclosed = parsed.data.budget_undisclosed ?? false;

  const { error } = await supabase
    .from('kaeufer_profil')
    .upsert(
      {
        user_id: u.user.id,
        investor_typ: parsed.data.investor_typ,
        budget_min: undisclosed ? null : (parsed.data.budget_min ?? null),
        budget_max: undisclosed ? null : (parsed.data.budget_max ?? null),
        budget_undisclosed: undisclosed,
        regionen: parsed.data.regionen,
        branche_praeferenzen: parsed.data.branche_praeferenzen,
        timing: parsed.data.timing ?? null,
        erfahrung: parsed.data.erfahrung ?? null,
        beschreibung: parsed.data.beschreibung || null,
        ist_oeffentlich: parsed.data.ist_oeffentlich ?? true,
        linkedin_url: parsed.data.linkedin_url || null,
      },
      { onConflict: 'user_id' },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/kaeufer/profil');
  return { ok: true };
}

export async function toggleProfilSichtbarkeitAction(formData: FormData): Promise<void> {
  const visible = String(formData.get('visible') ?? '') === 'true';
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;

  // upsert statt update — User ohne kaeufer_profil-Row (Skip-Tunnel)
  // hatte sonst silent failure und der Toggle sprang zurück.
  const { error } = await supabase
    .from('kaeufer_profil')
    .upsert(
      { user_id: u.user.id, ist_oeffentlich: visible },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.warn('[toggleProfilSichtbarkeit] upsert failed:', error.message);
  }

  revalidatePath('/dashboard/kaeufer/profil');
}
