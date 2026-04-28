import { createAdminClient } from '@/lib/supabase/server';

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'register'
  | 'profile_update'
  | 'verification_change'
  | 'inserat_create'
  | 'inserat_edit'
  | 'inserat_publish'
  | 'inserat_pause'
  | 'inserat_delete'
  | 'inserat_freigegeben'
  | 'inserat_rueckfrage'
  | 'inserat_abgelehnt'
  | 'inserat_pausiert'
  | 'inserat_verkaeufer_geantwortet'
  | 'anfrage_create'
  | 'anfrage_status_change'
  | 'nda_signed'
  | 'blog_publish'
  | 'blog_generate'
  | 'admin_action';

export async function logAuditEvent(input: {
  type: AuditEventType;
  user_id?: string | null;
  user_email?: string | null;
  beschreibung: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_log').insert({
      type: input.type,
      user_id: input.user_id ?? null,
      user_email: input.user_email ?? null,
      beschreibung: input.beschreibung,
      metadata: input.metadata ?? null,
      ip: input.ip ?? null,
    });
  } catch {
    /* Audit-Log darf niemals den Caller crashen */
  }
}
