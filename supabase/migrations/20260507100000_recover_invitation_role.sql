-- ════════════════════════════════════════════════════════════════════
-- get_my_accepted_invitation_role — Recovery-RPC für Onboarding
-- ────────────────────────────────────────────────────────────────────
-- Wird von /onboarding aufgerufen wenn ein User ohne Rolle reinkommt:
-- prüft ob für seine eigene E-Mail eine bereits akzeptierte Einladung
-- existiert. Nötig für Re-Registration mit gleicher E-Mail.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.get_my_accepted_invitation_role()
returns text
language sql
security definer
set search_path = public
as $$
  select ai.rolle
  from public.admin_invitations ai
  join auth.users u on u.id = auth.uid()
  where lower(ai.email) = lower(u.email)
    and ai.accepted_at is not null
    and ai.revoked_at is null
  order by ai.accepted_at desc
  limit 1;
$$;

grant execute on function public.get_my_accepted_invitation_role() to authenticated;
