'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit';

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
  await logAuditEvent({
    type: 'verification_change',
    user_id: parsed.user_id,
    beschreibung: `${parsed.field === 'verified_phone' ? 'Telefon' : 'KYC'} ${parsed.value ? 'verifiziert' : 'zurückgesetzt'}`,
    metadata: { field: parsed.field, value: parsed.value },
  });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${parsed.user_id}`);
  return { ok: true };
}

const RoleSchema = z.object({
  user_id: z.string().uuid(),
  rolle: z.enum(['verkaeufer', 'kaeufer', 'admin']),
});

export async function setUserRoleAction(input: { user_id: string; rolle: 'verkaeufer' | 'kaeufer' | 'admin' }) {
  await assertAdmin();
  const parsed = RoleSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: parsed.user_id,
    p_rolle: parsed.rolle,
  });
  if (error) return { ok: false, error: error.message };
  await logAuditEvent({
    type: 'admin_action',
    user_id: parsed.user_id,
    beschreibung: `Rolle auf «${parsed.rolle}» gesetzt (Admin-Override)`,
    metadata: { rolle: parsed.rolle },
  });
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

const DeleteSchema = z.object({
  user_id: z.string().uuid(),
});

/**
 * Hard-Delete: User wird komplett aus auth.users + allen FK-cascadenden Tabellen gelöscht.
 * Eigenes Konto kann Admin nicht löschen (RPC-Check).
 */
export async function deleteUserAction(input: { user_id: string }) {
  await assertAdmin();
  const parsed = DeleteSchema.parse(input);

  const supabase = await createClient();
  const { data: meData } = await supabase.auth.getUser();
  if (meData.user?.id === parsed.user_id) {
    return { ok: false, error: 'Du kannst dein eigenes Konto nicht löschen.' };
  }

  // RPC ruft cascade-delete im definer-context (bypasst RLS)
  const { error: rpcError } = await supabase.rpc('admin_delete_user', {
    p_user_id: parsed.user_id,
  });

  if (rpcError) {
    // Fallback: direkt via Service-Role
    const admin = createAdminClient();
    try {
      // Manuelle Cascade-Cleanups
      await admin.from('inserate').delete().eq('verkaeufer_id', parsed.user_id);
      await admin.from('anfragen').delete().eq('kaeufer_id', parsed.user_id);
      const { error: authErr } = await admin.auth.admin.deleteUser(parsed.user_id);
      if (authErr) return { ok: false, error: authErr.message };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Unbekannter Fehler' };
    }
  }

  await logAuditEvent({
    type: 'admin_action',
    user_id: parsed.user_id,
    beschreibung: 'User komplett gelöscht (Hard-Delete)',
    metadata: { deleted_user_id: parsed.user_id },
  });

  revalidatePath('/admin/users');
  return { ok: true };
}
