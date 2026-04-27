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

export async function setAnfrageStatusAction(
  id: string,
  status: 'offen' | 'in_bearbeitung' | 'akzeptiert' | 'abgelehnt',
  notes?: string,
) {
  await assertAdmin();
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (notes) patch.admin_notes = notes;
  const { error } = await admin.from('anfragen').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logAuditEvent({
    type: 'anfrage_status_change',
    beschreibung: `Anfrage ${id.slice(0, 8)} → ${status}`,
    metadata: { anfrage_id: id, status, notes: notes ?? null },
  });
  revalidatePath('/admin/anfragen');
  revalidatePath(`/admin/anfragen/${id}`);
  return { ok: true };
}
