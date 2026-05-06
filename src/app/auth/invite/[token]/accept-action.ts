'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit';

const TokenSchema = z.string().min(8).max(128);

/**
 * Akzeptiert eine Einladung für den eingeloggten User.
 * Ruft die SECURITY DEFINER RPC `accept_invitation` auf, die atomar
 * die Rolle setzt und die Einladung als eingelöst markiert.
 */
export async function acceptInvitationAction(input: {
  token: string;
}): Promise<{ ok: true; rolle: string } | { ok: false; error: string }> {
  const token = TokenSchema.parse(input.token);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, error: 'nicht_eingeloggt' };
  }

  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as { ok: boolean; error?: string; rolle?: string } | null;
  if (!result || !result.ok) {
    return { ok: false, error: result?.error ?? 'unbekannt' };
  }

  await logAuditEvent({
    type: 'admin_action',
    user_id: userData.user.id,
    user_email: userData.user.email ?? null,
    beschreibung: `Einladung angenommen → Rolle: ${result.rolle}`,
    metadata: { action: 'accept_invitation', rolle: result.rolle },
  });

  return { ok: true, rolle: result.rolle ?? 'unknown' };
}
