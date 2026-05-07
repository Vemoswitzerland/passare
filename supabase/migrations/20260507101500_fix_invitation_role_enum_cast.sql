-- ════════════════════════════════════════════════════════════════════
-- ECHTER FIX: explizites ::user_role Cast in allen Funktionen die
-- profiles.rolle aus admin_invitations.rolle (text) setzen.
--
-- Cyrill 07.05.2026: Cyrill registrierte sich 3x mit cyrill.stereo,
-- jedes Mal Tunnel. ROOT CAUSE: profiles.rolle ist ein user_role
-- ENUM, admin_invitations.rolle ist text. UPDATE ohne expliziten Cast
-- failt mit "column rolle is of type user_role but expression is of
-- type text". In SECURITY DEFINER PL/pgSQL-Funktionen wurde diese
-- Exception verschluckt → silent fail → User-Profile blieb mit
-- rolle=null → Tunnel.
--
-- Live-getestet via INSERT in auth.users mit Rollback: Trigger setzt
-- rolle=admin + onboarding_completed_at automatisch. ✅
-- ════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation_rolle text;
begin
  insert into public.profiles (id, sprache, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'sprache', 'de'),
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'given_name', ''), '')
  )
  on conflict (id) do nothing;

  if new.email is not null then
    select ai.rolle into v_invitation_rolle
    from public.admin_invitations ai
    where lower(ai.email) = lower(new.email)
      and ai.accepted_at is not null
      and ai.revoked_at is null
    order by ai.accepted_at desc
    limit 1;

    if v_invitation_rolle is not null then
      update public.profiles
      set rolle = v_invitation_rolle::public.user_role,
          onboarding_completed_at = coalesce(onboarding_completed_at, now())
      where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.apply_invitation_role_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_rolle text;
begin
  if new.rolle is not null then
    return new;
  end if;

  select u.email into v_email from auth.users u where u.id = new.id;
  if v_email is null then return new; end if;

  select ai.rolle into v_rolle
  from public.admin_invitations ai
  where lower(ai.email) = lower(v_email)
    and ai.accepted_at is not null
    and ai.revoked_at is null
  order by ai.accepted_at desc
  limit 1;

  if v_rolle is not null then
    new.rolle := v_rolle::public.user_role;
    new.onboarding_completed_at := coalesce(new.onboarding_completed_at, now());
  end if;

  return new;
end;
$$;

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
  if v_user_id is null then return jsonb_build_object('ok', false, 'error', 'nicht_eingeloggt'); end if;

  select * into v_invitation from public.admin_invitations where token = p_token for update limit 1;

  if not found then return jsonb_build_object('ok', false, 'error', 'token_unbekannt'); end if;
  if v_invitation.accepted_at is not null then return jsonb_build_object('ok', false, 'error', 'bereits_eingeloest'); end if;
  if v_invitation.revoked_at is not null then return jsonb_build_object('ok', false, 'error', 'widerrufen'); end if;
  if v_invitation.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'abgelaufen'); end if;

  update public.profiles
  set rolle = v_invitation.rolle::public.user_role,
      onboarding_completed_at = coalesce(onboarding_completed_at, now()),
      updated_at = now()
  where id = v_user_id;

  update public.admin_invitations
  set accepted_at = now(), accepted_user_id = v_user_id
  where id = v_invitation.id;

  return jsonb_build_object('ok', true, 'rolle', v_invitation.rolle);
end;
$$;
