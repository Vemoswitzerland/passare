-- ═══════════════════════════════════════════════════════════════
-- passare.ch — OAuth full_name Fix
-- ───────────────────────────────────────────────────────────────
-- Bei Google-OAuth liefert Supabase `name` (oder `given_name`) in
-- `raw_user_meta_data`, nicht `full_name`. Der ursprüngliche Trigger
-- liest aber nur `full_name` — daher landeten OAuth-User mit leerem
-- `profiles.full_name`. Wir ersetzen den Trigger durch die robuste
-- Variante mit `coalesce(full_name, name, given_name)`.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
  return new;
end;
$$;

-- Trigger neu binden — `create or replace function` reicht eigentlich,
-- aber wir setzen den Trigger nochmal sicherheitshalber, falls er
-- aus irgendeinem Grund weg ist.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
