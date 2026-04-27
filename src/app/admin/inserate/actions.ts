'use server';

import { revalidatePath } from 'next/cache';
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

export async function setInseratStatusAction(
  id: string,
  status: 'entwurf' | 'pending' | 'live' | 'pausiert' | 'abgelaufen',
  reason?: string,
) {
  await assertAdmin();
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (status === 'live') patch.published_at = new Date().toISOString();
  if (status === 'pausiert') patch.paused_at = new Date().toISOString();
  if (reason) patch.rejection_reason = reason;

  const { error } = await admin.from('inserate').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  const eventType =
    status === 'live'
      ? 'inserat_publish'
      : status === 'pausiert'
        ? 'inserat_pause'
        : 'inserat_edit';
  await logAuditEvent({
    type: eventType,
    beschreibung: `Inserat ${id.slice(0, 8)} → ${status}`,
    metadata: { inserat_id: id, status, reason: reason ?? null },
  });

  revalidatePath('/admin/inserate');
  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/');
  return { ok: true };
}

export async function deleteInseratAction(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('inserate').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAuditEvent({
    type: 'inserat_delete',
    beschreibung: `Inserat ${id.slice(0, 8)} gelöscht`,
    metadata: { inserat_id: id },
  });
  revalidatePath('/admin/inserate');
  return { ok: true };
}
