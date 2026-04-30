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
  return data.user.id;
}

/** Generischer Status-Setter (intern verwendet). */
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

// ── Audit-Workflow: Freigabe / Rückfrage / Ablehnen / Pausieren ───────

const IdSchema = z.string().uuid();
const KurzMessageSchema = z.string().min(1).max(4000).optional();
const PflichtMessageSchema = z.string().min(3).max(4000);

async function postAuditMessage(params: {
  inseratId: string;
  fromUser: string;
  fromRole: 'admin' | 'verkaeufer';
  kind: 'rueckfrage' | 'antwort' | 'ablehnung' | 'freigabe' | 'kommentar' | 'pause';
  message: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('inserat_audit_messages').insert({
    inserat_id: params.inseratId,
    from_user: params.fromUser,
    from_role: params.fromRole,
    kind: params.kind,
    message: params.message,
  });
  if (error) throw new Error(`audit-message-insert: ${error.message}`);
}

/** Admin: Inserat freigeben → status='live' + Freigabe-Notiz. */
export async function approveInseratAction(input: { id: string; kommentar?: string }) {
  const adminUserId = await assertAdmin();
  const id = IdSchema.parse(input.id);
  const kommentar = KurzMessageSchema.parse(input.kommentar);

  const admin = createAdminClient();
  const { error } = await admin
    .from('inserate')
    .update({
      status: 'live',
      published_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await postAuditMessage({
    inseratId: id,
    fromUser: adminUserId,
    fromRole: 'admin',
    kind: 'freigabe',
    message: kommentar?.trim() || 'Inserat freigegeben.',
  });

  await logAuditEvent({
    type: 'inserat_freigegeben',
    beschreibung: `Inserat ${id.slice(0, 8)} freigegeben`,
    metadata: { inserat_id: id, kommentar: kommentar ?? null },
  });

  revalidatePath('/admin/inserate');
  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/dashboard/verkaeufer/inserat');
  revalidatePath('/');
  return { ok: true };
}

/** Admin: Rückfrage stellen → status='rueckfrage' + Nachricht an Verkäufer. */
export async function requestRevisionAction(input: { id: string; message: string }) {
  const adminUserId = await assertAdmin();
  const id = IdSchema.parse(input.id);
  const message = PflichtMessageSchema.parse(input.message);

  const admin = createAdminClient();
  const { error } = await admin
    .from('inserate')
    .update({ status: 'rueckfrage' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await postAuditMessage({
    inseratId: id,
    fromUser: adminUserId,
    fromRole: 'admin',
    kind: 'rueckfrage',
    message,
  });

  await logAuditEvent({
    type: 'inserat_rueckfrage',
    beschreibung: `Rückfrage zu Inserat ${id.slice(0, 8)}`,
    metadata: { inserat_id: id, message_preview: message.slice(0, 120) },
  });

  revalidatePath('/admin/inserate');
  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/dashboard/verkaeufer/inserat');
  return { ok: true };
}

/** Admin: Inserat ablehnen → status='abgelehnt' + Begründung. */
export async function rejectInseratAction(input: { id: string; reason: string }) {
  const adminUserId = await assertAdmin();
  const id = IdSchema.parse(input.id);
  const reason = PflichtMessageSchema.parse(input.reason);

  const admin = createAdminClient();
  const { error } = await admin
    .from('inserate')
    .update({ status: 'abgelehnt', rejection_reason: reason })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await postAuditMessage({
    inseratId: id,
    fromUser: adminUserId,
    fromRole: 'admin',
    kind: 'ablehnung',
    message: reason,
  });

  await logAuditEvent({
    type: 'inserat_abgelehnt',
    beschreibung: `Inserat ${id.slice(0, 8)} abgelehnt`,
    metadata: { inserat_id: id, reason_preview: reason.slice(0, 120) },
  });

  revalidatePath('/admin/inserate');
  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/dashboard/verkaeufer/inserat');
  return { ok: true };
}

/**
 * Admin: status-neutrale Nachricht an Verkäufer senden — KEIN Status-Wechsel.
 *
 * Cyrill 30.04.2026: «Wenn ein Inserat live ist, muss man trotzdem bei Admin
 * noch mal über das Inserat mit dem User schreiben können». Damit lebende
 * Inserate nicht zwangsläufig in 'rueckfrage' gerissen werden, sobald der
 * Admin eine Frage hat. Posted nur einen Audit-Thread-Kommentar.
 */
export async function sendInseratMessageAction(input: { id: string; message: string }) {
  const adminUserId = await assertAdmin();
  const id = IdSchema.parse(input.id);
  const message = PflichtMessageSchema.parse(input.message);

  await postAuditMessage({
    inseratId: id,
    fromUser: adminUserId,
    fromRole: 'admin',
    kind: 'kommentar',
    message,
  });

  await logAuditEvent({
    type: 'inserat_kommentar',
    beschreibung: `Kommentar zu Inserat ${id.slice(0, 8)}`,
    metadata: { inserat_id: id, message_preview: message.slice(0, 120) },
  });

  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/dashboard/verkaeufer/inserat');
  revalidatePath('/dashboard/verkaeufer/anfragen');
  return { ok: true };
}

/** Admin: Inserat pausieren → status='pausiert' + optional Begründung. */
export async function pauseInseratAction(input: { id: string; reason?: string }) {
  const adminUserId = await assertAdmin();
  const id = IdSchema.parse(input.id);
  const reason = KurzMessageSchema.parse(input.reason);

  const admin = createAdminClient();
  const { error } = await admin
    .from('inserate')
    .update({
      status: 'pausiert',
      paused_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await postAuditMessage({
    inseratId: id,
    fromUser: adminUserId,
    fromRole: 'admin',
    kind: 'pause',
    message: reason?.trim() || 'Inserat pausiert.',
  });

  await logAuditEvent({
    type: 'inserat_pausiert',
    beschreibung: `Inserat ${id.slice(0, 8)} pausiert`,
    metadata: { inserat_id: id, reason: reason ?? null },
  });

  revalidatePath('/admin/inserate');
  revalidatePath(`/admin/inserate/${id}`);
  revalidatePath('/dashboard/verkaeufer/inserat');
  revalidatePath('/');
  return { ok: true };
}
