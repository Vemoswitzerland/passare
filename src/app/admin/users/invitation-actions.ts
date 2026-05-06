'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit';
import { sendEmail } from '@/lib/email';

async function assertAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Nicht angemeldet.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, full_name, email')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.rolle !== 'admin') throw new Error('Keine Admin-Berechtigung.');
  return { user: data.user, profile };
}

const RolleEnum = z.enum(['admin', 'verkaeufer', 'kaeufer', 'broker']);
const EmailSchema = z.string().trim().toLowerCase().email();

/**
 * Admin lädt jemanden ein. Erstellt eine Einladung und sendet eine
 * E-Mail mit Link zur Accept-Page.
 *
 * Idempotenz: Wenn für denselben (lowercase-)E-Mail bereits eine
 * offene (nicht akzeptierte / nicht abgelaufene / nicht widerrufene)
 * Einladung existiert, geben wir die bestehende zurück und schicken die
 * E-Mail nicht nochmal — sonst würde jeder Admin-Submit eine neue
 * Einladung erzeugen.
 */
export async function createInvitationAction(input: { email: string; rolle: string }) {
  const { user: adminUser, profile: adminProfile } = await assertAdmin();

  const email = EmailSchema.parse(input.email);
  const rolle = RolleEnum.parse(input.rolle);

  const admin = createAdminClient();

  // Bestehende offene Einladung?
  const { data: existing } = await admin
    .from('admin_invitations')
    .select('id, token, expires_at, accepted_at, revoked_at')
    .eq('email', email)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let token: string;
  let isNew = false;

  if (existing) {
    token = existing.token as string;
  } else {
    const adminName =
      (adminProfile?.full_name as string | null) ??
      adminUser.user_metadata?.name ??
      adminUser.email ??
      'passare-Admin';
    const adminEmail = (adminProfile?.email as string | null) ?? adminUser.email ?? null;

    const { data: created, error } = await admin
      .from('admin_invitations')
      .insert({
        email,
        rolle,
        invited_by: adminUser.id,
        invited_by_name: adminName,
        invited_by_email: adminEmail,
      })
      .select('token')
      .single();

    if (error || !created) {
      return { ok: false as const, error: error?.message ?? 'Einladung konnte nicht angelegt werden.' };
    }
    token = created.token as string;
    isNew = true;
  }

  // E-Mail senden — fire-and-forget, blockt nicht die Action.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://passare.ch';
  const inviteUrl = `${baseUrl}/auth/invite/${encodeURIComponent(token)}`;

  await sendEmail({
    template: 'admin_invite',
    to: email,
    vars: {
      inviteUrl,
      rolle,
      invitedByName:
        (adminProfile?.full_name as string | null) ??
        adminUser.user_metadata?.name ??
        adminUser.email ??
        'passare-Admin',
    },
  });

  await logAuditEvent({
    type: 'admin_action',
    user_id: adminUser.id,
    user_email: adminUser.email ?? null,
    beschreibung: `Einladung an ${email} (${rolle})${isNew ? '' : ' [bestehende Einladung erneut versendet]'}`,
    metadata: { action: 'invite_user', email, rolle, is_new: isNew },
  });

  revalidatePath('/admin/users');
  return { ok: true as const, email, rolle, isNew };
}

/** Admin widerruft eine offene Einladung. */
export async function revokeInvitationAction(input: { id: string }) {
  const { user: adminUser } = await assertAdmin();
  const id = z.string().uuid().parse(input.id);

  const admin = createAdminClient();
  const { error } = await admin
    .from('admin_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('accepted_at', null);

  if (error) return { ok: false as const, error: error.message };

  await logAuditEvent({
    type: 'admin_action',
    user_id: adminUser.id,
    user_email: adminUser.email ?? null,
    beschreibung: `Einladung widerrufen`,
    metadata: { action: 'revoke_invitation', id },
  });

  revalidatePath('/admin/users');
  return { ok: true as const };
}
