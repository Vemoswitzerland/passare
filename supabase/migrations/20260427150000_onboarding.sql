-- ═══════════════════════════════════════════════════════════════
-- passare.ch — Etappe 03: Rollen-Onboarding
-- ───────────────────────────────────────────────────────────────
-- Onboarding-Wizard: User wählt Rolle (verkaeufer/kaeufer), füllt
-- Basis-Profil (Name, Kanton, Sprache), akzeptiert AGB+Datenschutz.
-- ═══════════════════════════════════════════════════════════════

-- Onboarding-Completion-Flag direkt auf profiles
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

revoke update (onboarding_completed_at) on public.profiles from authenticated;

-- terms_acceptances — eine Row pro Dokument-Version
create table if not exists public.terms_acceptances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  document    text not null check (document in ('agb', 'datenschutz', 'nda_general')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now(),
  unique (user_id, document, version)
);

create index if not exists terms_acceptances_user_idx
  on public.terms_acceptances (user_id, document);

alter table public.terms_acceptances enable row level security;

drop policy if exists "terms_self_select" on public.terms_acceptances;
create policy "terms_self_select"
  on public.terms_acceptances
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "terms_self_insert" on public.terms_acceptances;
create policy "terms_self_insert"
  on public.terms_acceptances
  for insert
  with check ((select auth.uid()) = user_id);

revoke all on public.terms_acceptances from anon, authenticated;
grant select, insert on public.terms_acceptances to authenticated;

-- rolle ist user-update-bar, aber nur einmalig (Trigger schützt)
grant update (rolle) on public.profiles to authenticated;

create or replace function public.profiles_protect_rolle()
returns trigger
language plpgsql
as $$
begin
  if old.rolle is not null and new.rolle is distinct from old.rolle then
    raise exception 'profiles.rolle ist nach dem ersten Setzen unveränderlich (für User). Admin-Wechsel via service_role.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_rolle_trigger on public.profiles;
create trigger profiles_protect_rolle_trigger
  before update of rolle on public.profiles
  for each row
  execute function public.profiles_protect_rolle();
