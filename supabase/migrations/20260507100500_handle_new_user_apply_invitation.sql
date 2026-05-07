-- ════════════════════════════════════════════════════════════════════
-- DB-erzwungener Invitation-Apply — Cyrill 07.05.2026 (3. Versuch)
-- ────────────────────────────────────────────────────────────────────
-- Bug: Re-Registrierung mit eingeladener E-Mail landete trotz Recovery-
-- Code in /onboarding immer wieder im Tunnel — vermutlich weil der
-- Auth-Pfad gar nicht durch /onboarding lief.
--
-- Fix: handle_new_user (AFTER INSERT auf auth.users) prueft jetzt
-- automatisch ob fuer die E-Mail eine accepted invitation existiert
-- und uebernimmt die Rolle direkt. Plus zweiter Trigger BEFORE INSERT
-- auf profiles als Failsafe falls das profile ueber einen anderen
-- Pfad angelegt wird.
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
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        new.raw_user_meta_data ->> 'given_name',
        ''
      ),
      ''
    )
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
      set rolle = v_invitation_rolle,
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

  select u.email into v_email
  from auth.users u
  where u.id = new.id;

  if v_email is null then
    return new;
  end if;

  select ai.rolle into v_rolle
  from public.admin_invitations ai
  where lower(ai.email) = lower(v_email)
    and ai.accepted_at is not null
    and ai.revoked_at is null
  order by ai.accepted_at desc
  limit 1;

  if v_rolle is not null then
    new.rolle := v_rolle;
    new.onboarding_completed_at := coalesce(new.onboarding_completed_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_invitation_role_on_profile_insert on public.profiles;
create trigger trg_apply_invitation_role_on_profile_insert
  before insert on public.profiles
  for each row
  execute function public.apply_invitation_role_on_profile();
