-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Käufer-Bereich (Etappe 56+)
-- ════════════════════════════════════════════════════════════════════
-- Tabellen für: Käufer-Profil (Reverse-Listing), Suchprofile + Alerts,
-- Favoriten mit Pipeline-Stage, Berater-Datenraum-Shares,
-- Subscription-Tier (Basic / MAX) auf profiles.

-- ─── 1. ENUM-TYPEN ────────────────────────────────────────────────
do $$ begin
  create type public.investor_typ as enum (
    'privatperson',
    'family_office',
    'holding_strategisch',
    'mbi_management',
    'berater_broker'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timing_horizont as enum (
    'sofort', '3_monate', '6_monate', '12_monate', 'nur_browsing'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kaeufer_erfahrung as enum (
    'erstkaeufer', '1_3_deals', '4_plus_deals'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_tier as enum ('basic', 'max');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_channel as enum ('email', 'whatsapp', 'push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.favorit_stage as enum (
    'neu', 'kontaktiert', 'nda', 'dd', 'loi', 'won', 'lost'
  );
exception when duplicate_object then null; end $$;

-- ─── 2. PROFILES erweitern ────────────────────────────────────────
alter table public.profiles
  add column if not exists subscription_tier public.subscription_tier
    not null default 'basic',
  add column if not exists subscription_renewed_at timestamptz,
  add column if not exists subscription_cancel_at timestamptz,
  add column if not exists stripe_subscription_id text;

-- User darf den Tier nicht selber editieren (nur via Stripe-Webhook + Service-Role)
revoke update (subscription_tier, subscription_renewed_at,
               subscription_cancel_at, stripe_subscription_id)
  on public.profiles from authenticated;

-- ─── 3. KAEUFER_PROFIL ────────────────────────────────────────────
create table if not exists public.kaeufer_profil (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  investor_typ   public.investor_typ,
  budget_min     bigint check (budget_min is null or budget_min >= 0),
  budget_max     bigint check (budget_max is null or budget_max <= 100000000),
  budget_undisclosed boolean not null default false,
  regionen       text[]    not null default '{}',  -- Kanton-Codes oder 'CH'
  branche_praeferenzen text[] not null default '{}',
  timing         public.timing_horizont,
  erfahrung      public.kaeufer_erfahrung,
  beschreibung   text check (beschreibung is null or length(beschreibung) <= 2000),
  ist_oeffentlich boolean not null default true,    -- Anonym-Toggle
  finanzierungsnachweis_url      text,
  finanzierungsnachweis_verified boolean not null default false,
  linkedin_url   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists kaeufer_profil_updated on public.kaeufer_profil;
create trigger kaeufer_profil_updated before update on public.kaeufer_profil
  for each row execute function public.set_updated_at();

-- ─── 4. SUCHPROFILE ───────────────────────────────────────────────
create table if not exists public.suchprofile (
  id             uuid primary key default gen_random_uuid(),
  kaeufer_id     uuid not null references public.profiles(id) on delete cascade,
  name           text not null check (length(name) between 1 and 80),
  branche        text[] not null default '{}',
  kantone        text[] not null default '{}',
  umsatz_min     bigint,
  umsatz_max     bigint,
  ebitda_min     numeric(5,2),                  -- Marge in %
  ma_min         int,
  ma_max         int,
  gruende        text[] not null default '{}',  -- uebergabe_gruende
  whatsapp_alert boolean not null default false,
  email_alert    boolean not null default true,
  push_alert     boolean not null default false,
  ist_pausiert   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Max 3 Suchprofile pro Käufer
create or replace function public.suchprofile_max_3() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from public.suchprofile where kaeufer_id = new.kaeufer_id) >= 3 then
    raise exception 'Maximal 3 Suchprofile pro Käufer erlaubt.';
  end if;
  return new;
end $$;

drop trigger if exists suchprofile_limit on public.suchprofile;
create trigger suchprofile_limit before insert on public.suchprofile
  for each row execute function public.suchprofile_max_3();

-- ─── 5. FAVORITEN (mit Stage + Note + Tags) ───────────────────────
create table if not exists public.favoriten (
  kaeufer_id uuid not null references public.profiles(id) on delete cascade,
  inserat_id text not null,                   -- text statt FK (Chat 2 ownt inserate)
  note       text check (note is null or length(note) <= 500),
  tags       text[] not null default '{}',
  stage      public.favorit_stage not null default 'neu',
  created_at timestamptz not null default now(),
  primary key (kaeufer_id, inserat_id)
);

-- ─── 6. ALERTS_SENT (Audit für Email/WhatsApp/Push-Versand) ───────
create table if not exists public.alerts_sent (
  id            uuid primary key default gen_random_uuid(),
  suchprofil_id uuid not null references public.suchprofile(id) on delete cascade,
  inserat_id    text not null,
  channel       public.alert_channel not null,
  sent_at       timestamptz not null default now()
);

create index if not exists alerts_sent_suchprofil_idx
  on public.alerts_sent (suchprofil_id, sent_at desc);

-- ─── 7. NDA_BERATER_SHARES (Zeitlich begrenzter Datenraum-Zugang) ─
create table if not exists public.nda_berater_shares (
  id            uuid primary key default gen_random_uuid(),
  kaeufer_id    uuid not null references public.profiles(id) on delete cascade,
  nda_id        uuid,                          -- weak ref (Chat 2 ownt nda_signaturen)
  inserat_id    text,                          -- weak ref auf Inserat
  berater_email text not null,
  berater_name  text,
  magic_token   text not null unique,
  expires_at    timestamptz not null check (expires_at <= now() + interval '14 days'),
  revoked_at    timestamptz,
  views_count   int not null default 0,
  created_at    timestamptz not null default now()
);

-- ─── 8. RLS ───────────────────────────────────────────────────────
alter table public.kaeufer_profil      enable row level security;
alter table public.suchprofile         enable row level security;
alter table public.favoriten           enable row level security;
alter table public.alerts_sent         enable row level security;
alter table public.nda_berater_shares  enable row level security;

-- Käufer sieht und bearbeitet NUR seine eigenen Daten
drop policy if exists kaeufer_profil_self_all on public.kaeufer_profil;
create policy kaeufer_profil_self_all on public.kaeufer_profil
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Verkäufer + andere Käufer sehen öffentliche Käufer-Profile (Reverse-Listing)
drop policy if exists kaeufer_profil_public_read on public.kaeufer_profil;
create policy kaeufer_profil_public_read on public.kaeufer_profil
  for select to authenticated
  using (ist_oeffentlich = true);

drop policy if exists suchprofile_self_all on public.suchprofile;
create policy suchprofile_self_all on public.suchprofile
  for all to authenticated
  using ((select auth.uid()) = kaeufer_id)
  with check ((select auth.uid()) = kaeufer_id);

drop policy if exists favoriten_self_all on public.favoriten;
create policy favoriten_self_all on public.favoriten
  for all to authenticated
  using ((select auth.uid()) = kaeufer_id)
  with check ((select auth.uid()) = kaeufer_id);

drop policy if exists alerts_sent_self_select on public.alerts_sent;
create policy alerts_sent_self_select on public.alerts_sent
  for select to authenticated
  using (
    suchprofil_id in (
      select id from public.suchprofile where kaeufer_id = (select auth.uid())
    )
  );

drop policy if exists nda_shares_self_all on public.nda_berater_shares;
create policy nda_shares_self_all on public.nda_berater_shares
  for all to authenticated
  using ((select auth.uid()) = kaeufer_id)
  with check ((select auth.uid()) = kaeufer_id);

-- Column-Level Privileges
revoke all on public.kaeufer_profil      from anon, authenticated;
revoke all on public.suchprofile         from anon, authenticated;
revoke all on public.favoriten           from anon, authenticated;
revoke all on public.alerts_sent         from anon, authenticated;
revoke all on public.nda_berater_shares  from anon, authenticated;

grant select, insert, update, delete on public.kaeufer_profil      to authenticated;
grant select, insert, update, delete on public.suchprofile         to authenticated;
grant select, insert, update, delete on public.favoriten           to authenticated;
grant select                          on public.alerts_sent         to authenticated;
grant select, insert, update, delete on public.nda_berater_shares  to authenticated;

-- finanzierungsnachweis_verified darf User nicht selber setzen
revoke update (finanzierungsnachweis_verified) on public.kaeufer_profil from authenticated;

-- ─── 9. INDIZES ───────────────────────────────────────────────────
create index if not exists favoriten_stage_idx
  on public.favoriten (kaeufer_id, stage);

create index if not exists suchprofile_kaeufer_idx
  on public.suchprofile (kaeufer_id) where ist_pausiert = false;

create index if not exists kaeufer_profil_oeffentlich_idx
  on public.kaeufer_profil (ist_oeffentlich) where ist_oeffentlich = true;

create index if not exists profiles_subscription_tier_idx
  on public.profiles (subscription_tier);
