-- ════════════════════════════════════════════════════════════════════
-- accept_invitation: setzt zusätzlich onboarding_completed_at
-- ────────────────────────────────────────────────────────────────────
-- Cyrill 07.05.2026: Eingeladene wurden nach Annahme in den Onboarding-
-- Tunnel geschoben statt direkt im Admin-Panel zu landen. Fix: RPC
-- setzt onboarding_completed_at (idempotent via coalesce).
-- ════════════════════════════════════════════════════════════════════

create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.admin_invitations%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'nicht_eingeloggt');
  end if;

  select * into v_invitation
  from public.admin_invitations
  where token = p_token
  for update
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'token_unbekannt');
  end if;
  if v_invitation.accepted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'bereits_eingeloest');
  end if;
  if v_invitation.revoked_at is not null then
    return jsonb_build_object('ok', false, 'error', 'widerrufen');
  end if;
  if v_invitation.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'abgelaufen');
  end if;

  update public.profiles
  set rolle = v_invitation.rolle,
      onboarding_completed_at = coalesce(onboarding_completed_at, now()),
      updated_at = now()
  where id = v_user_id;

  update public.admin_invitations
  set accepted_at = now(),
      accepted_user_id = v_user_id
  where id = v_invitation.id;

  return jsonb_build_object('ok', true, 'rolle', v_invitation.rolle);
end;
$$;
