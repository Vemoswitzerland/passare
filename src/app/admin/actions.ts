'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Nicht angemeldet.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.rolle !== 'admin') throw new Error('Keine Admin-Berechtigung.');
}

const ScoreSchema = z.object({
  user_id: z.string().uuid(),
  score: z.number().int().min(0).max(100).nullable(),
});

export async function setQualitaetsScoreAction(input: { user_id: string; score: number | null }) {
  await assertAdmin();
  const parsed = ScoreSchema.parse(input);
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ qualitaets_score: parsed.score })
    .eq('id', parsed.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${parsed.user_id}`);
  return { ok: true };
}

const NoteSchema = z.object({
  user_id: z.string().uuid(),
  notes: z.string().max(4000),
});

export async function setAdminNotesAction(input: { user_id: string; notes: string }) {
  await assertAdmin();
  const parsed = NoteSchema.parse(input);
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ admin_notes: parsed.notes || null })
    .eq('id', parsed.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/users/${parsed.user_id}`);
  return { ok: true };
}

const VerifySchema = z.object({
  user_id: z.string().uuid(),
  field: z.enum(['verified_phone', 'verified_kyc']),
  value: z.boolean(),
});

export async function setVerificationAction(input: {
  user_id: string;
  field: 'verified_phone' | 'verified_kyc';
  value: boolean;
}) {
  await assertAdmin();
  const parsed = VerifySchema.parse(input);
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ [parsed.field]: parsed.value })
    .eq('id', parsed.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${parsed.user_id}`);
  return { ok: true };
}

const TagsSchema = z.object({
  user_id: z.string().uuid(),
  tags: z.array(z.string().max(40)).max(20),
});

export async function setTagsAction(input: { user_id: string; tags: string[] }) {
  await assertAdmin();
  const parsed = TagsSchema.parse(input);
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ tags: parsed.tags.length > 0 ? parsed.tags : null })
    .eq('id', parsed.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/users/${parsed.user_id}`);
  return { ok: true };
}
