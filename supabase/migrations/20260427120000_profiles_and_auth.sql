-- ═══════════════════════════════════════════════════════════════
-- passare.ch — Etappe 02: Profiles + Auth-Layer
-- ───────────────────────────────────────────────────────────────
-- Legt das Persistenz-Fundament: Rollen-Enum, profiles-Tabelle,
-- RLS (owner-only), Trigger der bei jeder Registrierung automatisch
-- einen Profil-Datensatz anlegt.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Rollen-Enum ────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('verkaeufer', 'kaeufer', 'admin');
  end if;
end$$;

-- ─── 2. profiles-Tabelle ───────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  rolle              public.user_role,                 -- nullable bis Onboarding-Wizard (Etappe 4)
  full_name          text,
  phone              text,
  kanton             text,                             -- ISO 3166-2 Kürzel (ZH, BE, ...)
  sprache            text default 'de'
                     check (sprache in ('de', 'fr', 'it', 'en')),

  verified_phone     boolean not null default false,
  verified_kyc       boolean not null default false,

  stripe_customer_id text,

  is_broker          boolean not null default false,   -- reserviert für Phase 2
  mfa_enrolled       boolean not null default false,   -- Pflicht für rolle=admin

  qualitaets_score        integer
                          check (qualitaets_score is null
                                 or (qualitaets_score between 0 and 100)),
  avg_response_time_hours numeric,

  tags         jsonb,                                  -- Admin-seitig
  admin_notes  text,                                   -- Admin-seitig

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'App-Profile 1:1 zu auth.users. Wird per Trigger angelegt.';

-- ─── 3. updated_at automatisch pflegen ─────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ─── 4. Trigger: auth.users → public.profiles ──────────────────
-- Bei jeder Registrierung wird automatisch ein leerer Profil-Datensatz
-- angelegt. Sprache aus raw_user_meta_data falls vorhanden.
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
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── 5. Row-Level-Security ─────────────────────────────────────
alter table public.profiles enable row level security;

-- SELECT: jeder eingeloggte User sieht NUR sein eigenes Profil
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
  on public.profiles
  for select
  using ((select auth.uid()) = id);

-- UPDATE: jeder User darf nur sein eigenes Profil bearbeiten
-- Admin-seitige Felder (rolle, tags, admin_notes, is_broker, verified_*,
-- qualitaets_score, avg_response_time_hours) werden über DB-Privileges
-- (column-level GRANTs) geschützt.
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles
  for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT: KEINE direkte Insert-Policy für authenticated.
-- Insert läuft ausschliesslich via Trigger (security definer).

-- ─── 6. Column-Privileges: User darf nur User-Felder updaten ───
-- Erst alle Privilegien zurücksetzen, dann gezielt vergeben.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

grant update (
  full_name,
  phone,
  kanton,
  sprache,
  mfa_enrolled
) on public.profiles to authenticated;

-- ─── 7. Indexe ─────────────────────────────────────────────────
create index if not exists profiles_rolle_idx on public.profiles (rolle);
create index if not exists profiles_kanton_idx on public.profiles (kanton);
create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
