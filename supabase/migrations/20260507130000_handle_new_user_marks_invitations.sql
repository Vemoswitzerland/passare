-- ════════════════════════════════════════════════════════════════════
-- handle_new_user erweitert: markiert pending invitations als accepted
-- damit das Admin-UI den User-Status korrekt anzeigt.
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

    if v_invitation_rolle is null then
      select ai.rolle into v_invitation_rolle
      from public.admin_invitations ai
      where lower(ai.email) = lower(new.email)
        and ai.accepted_at is null
        and ai.revoked_at is null
        and ai.expires_at > now()
      order by ai.created_at desc
      limit 1;
    end if;

    if v_invitation_rolle is not null then
      update public.profiles
      set rolle = v_invitation_rolle::public.user_role,
          onboarding_completed_at = coalesce(onboarding_completed_at, now())
      where id = new.id;

      update public.admin_invitations
      set accepted_at = now(),
          accepted_user_id = new.id
      where lower(email) = lower(new.email)
        and accepted_at is null
        and revoked_at is null;
    end if;
  end if;

  return new;
end;
$$;
