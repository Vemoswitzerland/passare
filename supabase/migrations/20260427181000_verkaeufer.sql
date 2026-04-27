-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Verkäufer-Bereich (Block D — Etappen 46–55)
-- ════════════════════════════════════════════════════════════════════
-- Eigentum dieser Migration: inserate, anfragen, nda_signaturen,
-- datenraum_files, datenraum_access_log, inserat_views, zefix_cache,
-- branchen + Storage-Buckets inserate-cover, datenraum-files, nda-pdfs.
--
-- Käufer-Migration (20260427182000_kaeufer.sql) läuft DANACH und
-- liest aus diesen Tabellen via FK + RLS-Policies.

-- ─── 1. ENUMS ─────────────────────────────────────────────────────
do $$ begin
  create type public.inserat_status as enum
    ('entwurf','zur_pruefung','live','pausiert','verkauft','abgelaufen','abgelehnt');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inserat_paket as enum ('light','pro','premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.anfrage_status as enum
    ('neu','in_pruefung','akzeptiert','abgelehnt','nda_pending','nda_signed','released','geschlossen');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nda_status as enum ('pending','signed','rejected','expired','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.uebergabe_grund as enum
    ('altersnachfolge','strategischer_exit','pensionierung','gesundheit','familienwechsel','andere');
exception when duplicate_object then null; end $$;

-- ─── 2. REFERENCE: branchen ───────────────────────────────────────
create table if not exists public.branchen (
  id text primary key,
  label_de text not null,
  label_fr text,
  label_it text,
  label_en text,
  ebitda_multiple_median numeric(4,2) not null,
  umsatz_multiple_median numeric(4,2) not null,
  noga_keywords text[] not null default '{}',
  sort_order int not null default 0
);

-- Seed: 18 Schweizer KMU-Branchen mit Multiples (Q1/2026)
insert into public.branchen (id, label_de, ebitda_multiple_median, umsatz_multiple_median, noga_keywords, sort_order) values
  ('software_saas',     'Software & SaaS',         7.0, 1.4, '{software,saas,it-entwicklung,programmierung,app}', 1),
  ('it_services',       'IT-Services',             6.0, 1.0, '{it-service,managed-service,hosting,cloud,support}', 2),
  ('healthcare',        'Gesundheit & Medtech',    6.5, 1.2, '{gesundheit,medizin,praxis,medtech,pflege}',          3),
  ('maschinenbau',      'Maschinen- & Anlagenbau', 6.5, 0.9, '{maschinen,anlagen,fertigung,produktion,praezision}', 4),
  ('bau_handwerk',      'Bau & Handwerk',          5.5, 0.6, '{bau,handwerk,maler,schreiner,sanitaer,elektriker}',  5),
  ('beratung_treuhand', 'Beratung & Treuhand',     5.5, 0.9, '{beratung,treuhand,consulting,wirtschaftspruefer,steuer}', 6),
  ('industrie_chemie',  'Industrie & Chemie',      5.5, 0.8, '{industrie,chemie,kunststoff,verarbeitung}',          7),
  ('elektrotechnik',    'Elektrotechnik',          5.5, 0.7, '{elektro,elektronik,sensorik,messtechnik}',           8),
  ('lebensmittel',      'Lebensmittel & Getränke', 5.5, 0.7, '{lebensmittel,baeckerei,metzgerei,getraenke,brauerei}', 9),
  ('telco_utilities',   'Telco & Energie',         5.5, 1.0, '{telekom,energie,wasser,strom,utilities}',           10),
  ('automotive',        'Automotive',              5.0, 0.5, '{auto,garage,carrosserie,fahrzeug}',                  11),
  ('handel_ecommerce',  'Handel & E-Commerce',     4.5, 0.5, '{handel,detailhandel,grosshandel,e-commerce,onlineshop}', 12),
  ('medien_verlage',    'Medien & Verlage',        4.5, 0.7, '{medien,verlag,druckerei,grafik,werbung}',           13),
  ('logistik_transport','Logistik & Transport',    4.5, 0.5, '{logistik,transport,spedition,kurier,lager}',         14),
  ('textil',            'Textil & Bekleidung',     4.5, 0.5, '{textil,bekleidung,mode,naeherei}',                   15),
  ('gastro_hotel',      'Gastro & Hotellerie',     3.5, 0.4, '{gastro,restaurant,hotel,gasthaus,bar,cafe}',         16),
  ('immobilien',        'Immobilien',              5.5, 1.0, '{immobilien,liegenschaft,verwaltung,makler}',         17),
  ('andere',            'Andere Dienstleistungen', 5.0, 0.7, '{}',                                                  18)
on conflict (id) do nothing;

grant select on public.branchen to anon, authenticated;

-- ─── 3. INSERATE ──────────────────────────────────────────────────
create table if not exists public.inserate (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,

  -- Pre-Reg-Erbe
  zefix_uid text,
  firma_name text,
  firma_rechtsform text,
  firma_sitz_gemeinde text,

  -- Step 2: Basisdaten
  titel text,
  teaser text check (teaser is null or length(teaser) <= 280),
  beschreibung text check (beschreibung is null or length(beschreibung) <= 2000),
  branche_id text references public.branchen(id),
  kanton text check (kanton is null or length(kanton) = 2),
  region text,
  jahr int check (jahr is null or (jahr between 1800 and extract(year from now())::int)),
  rechtsform text,
  mitarbeitende int check (mitarbeitende is null or mitarbeitende >= 0),
  mitarbeitende_bucket text,
  umsatz_chf numeric(14,2) check (umsatz_chf is null or umsatz_chf >= 0),
  umsatz_bucket text,
  ebitda_chf numeric(14,2),
  ebitda_marge_pct numeric(5,2),
  kaufpreis_chf numeric(14,2),
  kaufpreis_bucket text,
  kaufpreis_vhb boolean not null default false,
  uebergabe_grund public.uebergabe_grund,
  uebergabe_zeitpunkt text,

  -- Step 3: Cover
  cover_url text,
  cover_source text check (cover_source is null or cover_source in ('upload','stockfoto')),

  -- Step 4: Sales-Strengths
  sales_points text[] not null default '{}',
  constraint sales_points_max_5 check (array_length(sales_points,1) is null or array_length(sales_points,1) <= 5),

  -- Step 5: Paket
  paket public.inserat_paket,
  expires_at timestamptz,
  paid_at timestamptz,
  stripe_session_id text,

  -- Status & Lifecycle
  status public.inserat_status not null default 'entwurf',
  status_reason text,
  admin_notes text,
  views int not null default 0,
  featured_until timestamptz,
  published_at timestamptz,

  -- Pre-Reg-Schätzung (Trust-Anchor)
  estimated_value_low numeric(14,2),
  estimated_value_mid numeric(14,2),
  estimated_value_high numeric(14,2),
  estimated_value_basis jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inserate_owner_idx on public.inserate(owner_id);
create index if not exists inserate_status_idx on public.inserate(status);
create index if not exists inserate_branche_kanton_idx on public.inserate(branche_id, kanton);
create index if not exists inserate_published_idx on public.inserate(published_at desc) where status='live';

drop trigger if exists inserate_updated on public.inserate;
create trigger inserate_updated before update on public.inserate
  for each row execute function public.set_updated_at();

-- ─── 4. ANFRAGEN ──────────────────────────────────────────────────
create table if not exists public.anfragen (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  kaeufer_id uuid not null references auth.users(id) on delete cascade,
  message text check (message is null or length(message) <= 2000),
  status public.anfrage_status not null default 'neu',
  decline_reason text,
  score int check (score is null or (score between 0 and 100)),
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inserat_id, kaeufer_id)
);
create index if not exists anfragen_inserat_idx on public.anfragen(inserat_id);
create index if not exists anfragen_kaeufer_idx on public.anfragen(kaeufer_id);
create index if not exists anfragen_status_idx on public.anfragen(status);

drop trigger if exists anfragen_updated on public.anfragen;
create trigger anfragen_updated before update on public.anfragen
  for each row execute function public.set_updated_at();

-- ─── 5. NDA_SIGNATUREN ────────────────────────────────────────────
create table if not exists public.nda_signaturen (
  id uuid primary key default gen_random_uuid(),
  anfrage_id uuid not null references public.anfragen(id) on delete cascade,
  template_version text not null default '2026-04',
  status public.nda_status not null default 'pending',
  signed_at timestamptz,
  signed_name text,
  ip inet,
  user_agent text,
  expires_at timestamptz,
  pdf_storage_path text,
  created_at timestamptz not null default now()
);
create index if not exists nda_anfrage_idx on public.nda_signaturen(anfrage_id);

-- ─── 6. DATENRAUM_FILES ───────────────────────────────────────────
create table if not exists public.datenraum_files (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  parent_file_id uuid references public.datenraum_files(id),
  ordner text not null default 'sonstiges',
  storage_path text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  version int not null default 1,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now()
);
create index if not exists datenraum_inserat_idx on public.datenraum_files(inserat_id);
create index if not exists datenraum_ordner_idx on public.datenraum_files(inserat_id, ordner);

-- ─── 7. DATENRAUM_ACCESS_LOG ──────────────────────────────────────
create table if not exists public.datenraum_access_log (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.datenraum_files(id) on delete cascade,
  kaeufer_id uuid not null references auth.users(id),
  action text not null check (action in ('view','download')),
  ip inet,
  user_agent text,
  accessed_at timestamptz not null default now()
);
create index if not exists datenraum_log_file_idx on public.datenraum_access_log(file_id);
create index if not exists datenraum_log_kaeufer_idx on public.datenraum_access_log(kaeufer_id);

-- ─── 8. INSERAT_VIEWS ─────────────────────────────────────────────
create table if not exists public.inserat_views (
  id uuid primary key default gen_random_uuid(),
  inserat_id uuid not null references public.inserate(id) on delete cascade,
  viewer_id uuid references auth.users(id),
  viewed_at timestamptz not null default now(),
  is_unique_session boolean default true
);
create index if not exists inserat_views_inserat_date_idx on public.inserat_views(inserat_id, viewed_at);

-- ─── 9. ZEFIX_CACHE (24h TTL via fetched_at) ──────────────────────
create table if not exists public.zefix_cache (
  uid text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
create index if not exists zefix_cache_fetched_idx on public.zefix_cache(fetched_at);

-- Optional Volltextsuche (via name-Index in payload)
create index if not exists zefix_cache_name_idx on public.zefix_cache using gin ((payload->>'name') gin_trgm_ops);

-- ─── 10. RLS aktivieren ──────────────────────────────────────────
alter table public.inserate           enable row level security;
alter table public.anfragen           enable row level security;
alter table public.nda_signaturen     enable row level security;
alter table public.datenraum_files    enable row level security;
alter table public.datenraum_access_log enable row level security;
alter table public.inserat_views      enable row level security;
alter table public.zefix_cache        enable row level security;

-- ─── 11. POLICIES inserate ───────────────────────────────────────
drop policy if exists ins_owner_select on public.inserate;
create policy ins_owner_select on public.inserate for select
  using ((select auth.uid()) = owner_id);

drop policy if exists ins_owner_insert on public.inserate;
create policy ins_owner_insert on public.inserate for insert
  with check ((select auth.uid()) = owner_id);

drop policy if exists ins_owner_update on public.inserate;
create policy ins_owner_update on public.inserate for update
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists ins_owner_delete on public.inserate;
create policy ins_owner_delete on public.inserate for delete
  using ((select auth.uid()) = owner_id and status = 'entwurf');

drop policy if exists ins_admin_all on public.inserate;
create policy ins_admin_all on public.inserate for all
  using ((select rolle from public.profiles where id = (select auth.uid())) = 'admin')
  with check ((select rolle from public.profiles where id = (select auth.uid())) = 'admin');

-- Public-Read auf live (für Marktplatz, anon erlaubt)
drop policy if exists ins_public_read_live on public.inserate;
create policy ins_public_read_live on public.inserate for select
  using (status = 'live');

-- ─── 12. PUBLIC TEASER VIEW (Marktplatz, anon-erlaubt) ───────────
create or replace view public.inserate_public as
  select id, slug, titel, teaser, branche_id, kanton, region, jahr,
         mitarbeitende_bucket, umsatz_bucket, ebitda_marge_pct,
         kaufpreis_bucket, kaufpreis_vhb, uebergabe_grund,
         cover_url, sales_points, paket, featured_until, published_at, views
  from public.inserate
  where status = 'live';

grant select on public.inserate_public to anon, authenticated;

-- ─── 13. POLICIES anfragen ───────────────────────────────────────
drop policy if exists anf_visible on public.anfragen;
create policy anf_visible on public.anfragen for select
  using (
    (select auth.uid()) = kaeufer_id
    or (select auth.uid()) in (select owner_id from public.inserate where id = anfragen.inserat_id)
  );

drop policy if exists anf_kaeufer_insert on public.anfragen;
create policy anf_kaeufer_insert on public.anfragen for insert
  with check ((select auth.uid()) = kaeufer_id);

drop policy if exists anf_owner_update on public.anfragen;
create policy anf_owner_update on public.anfragen for update
  using ((select auth.uid()) in (select owner_id from public.inserate where id = anfragen.inserat_id))
  with check ((select auth.uid()) in (select owner_id from public.inserate where id = anfragen.inserat_id));

-- ─── 14. POLICIES nda_signaturen ─────────────────────────────────
drop policy if exists nda_visible on public.nda_signaturen;
create policy nda_visible on public.nda_signaturen for select
  using (
    (select auth.uid()) in (
      select a.kaeufer_id from public.anfragen a where a.id = nda_signaturen.anfrage_id
      union
      select i.owner_id from public.anfragen a
        join public.inserate i on i.id = a.inserat_id
        where a.id = nda_signaturen.anfrage_id
    )
  );

drop policy if exists nda_kaeufer_sign on public.nda_signaturen;
create policy nda_kaeufer_sign on public.nda_signaturen for insert
  with check (
    (select auth.uid()) in (select kaeufer_id from public.anfragen where id = nda_signaturen.anfrage_id)
  );

-- ─── 15. POLICIES datenraum_files ────────────────────────────────
drop policy if exists dat_owner_all on public.datenraum_files;
create policy dat_owner_all on public.datenraum_files for all
  using ((select auth.uid()) in (select owner_id from public.inserate where id = datenraum_files.inserat_id))
  with check ((select auth.uid()) in (select owner_id from public.inserate where id = datenraum_files.inserat_id));

drop policy if exists dat_kaeufer_read on public.datenraum_files;
create policy dat_kaeufer_read on public.datenraum_files for select
  using (
    exists (
      select 1 from public.anfragen a
      join public.nda_signaturen n on n.anfrage_id = a.id
      where a.inserat_id = datenraum_files.inserat_id
        and a.kaeufer_id = (select auth.uid())
        and a.status = 'released'
        and n.status = 'signed'
    )
  );

-- ─── 16. POLICIES datenraum_access_log ───────────────────────────
drop policy if exists dat_log_owner_read on public.datenraum_access_log;
create policy dat_log_owner_read on public.datenraum_access_log for select
  using (
    (select auth.uid()) in (
      select i.owner_id from public.datenraum_files f
        join public.inserate i on i.id = f.inserat_id
        where f.id = datenraum_access_log.file_id
    )
  );

drop policy if exists dat_log_kaeufer_insert on public.datenraum_access_log;
create policy dat_log_kaeufer_insert on public.datenraum_access_log for insert
  with check ((select auth.uid()) = kaeufer_id);

-- ─── 17. POLICIES inserat_views ──────────────────────────────────
drop policy if exists views_owner_read on public.inserat_views;
create policy views_owner_read on public.inserat_views for select
  using ((select auth.uid()) in (select owner_id from public.inserate where id = inserat_views.inserat_id));

-- ─── 18. POLICIES zefix_cache (Server-Only) ──────────────────────
-- Kein authenticated Direct-Access, nur via SECURITY DEFINER RPCs
revoke all on public.zefix_cache from anon, authenticated;

-- ─── 19. GRANTS ──────────────────────────────────────────────────
grant select, insert, update, delete on public.inserate           to authenticated;
grant select, insert, update          on public.anfragen           to authenticated;
grant select, insert                  on public.nda_signaturen     to authenticated;
grant select, insert, update, delete  on public.datenraum_files    to authenticated;
grant select, insert                  on public.datenraum_access_log to authenticated;
grant select                          on public.inserat_views      to authenticated;

-- ─── 20. RPC: create_inserat_from_pre_reg ────────────────────────
create or replace function public.create_inserat_from_pre_reg(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user_id uuid := auth.uid();
  v_umsatz numeric;
  v_ebitda numeric;
begin
  if v_user_id is null then raise exception 'auth required'; end if;

  v_umsatz := nullif(p->>'umsatz','')::numeric;
  v_ebitda := nullif(p->>'ebitda','')::numeric;

  insert into public.inserate(
    owner_id, zefix_uid, firma_name, firma_rechtsform, firma_sitz_gemeinde,
    branche_id, kanton, jahr, mitarbeitende, umsatz_chf, ebitda_chf, ebitda_marge_pct,
    estimated_value_low, estimated_value_mid, estimated_value_high, estimated_value_basis,
    status
  ) values (
    v_user_id,
    nullif(p->>'zefix_uid',''),
    nullif(p->>'firma_name',''),
    nullif(p->>'firma_rechtsform',''),
    nullif(p->>'firma_sitz_gemeinde',''),
    nullif(p->>'branche_id',''),
    upper(nullif(p->>'kanton','')),
    nullif(p->>'jahr','')::int,
    nullif(p->>'mitarbeitende','')::int,
    v_umsatz,
    v_ebitda,
    case when v_umsatz is not null and v_umsatz > 0 and v_ebitda is not null
         then ((v_ebitda / v_umsatz) * 100)::numeric(5,2)
         else null end,
    nullif(p->'valuation'->>'low','')::numeric,
    nullif(p->'valuation'->>'mid','')::numeric,
    nullif(p->'valuation'->>'high','')::numeric,
    p->'valuation'->'basis',
    'entwurf'
  ) returning id into v_id;

  return v_id;
end $$;

grant execute on function public.create_inserat_from_pre_reg(jsonb) to authenticated;

-- ─── 21. RPC: submit_inserat_step ────────────────────────────────
-- Atomares Step-Save (Auto-Save). Nur Owner darf updaten, Status muss 'entwurf' sein.
create or replace function public.submit_inserat_step(
  p_id uuid,
  p_step int,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  r record;
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  select * into r from public.inserate where id = p_id;
  if r.owner_id <> v_user_id then raise exception 'not owner'; end if;
  if r.status not in ('entwurf','zur_pruefung') then
    raise exception 'inserat ist nicht editierbar (status=%)', r.status;
  end if;

  -- Step 2: Basisdaten
  if p_step = 2 then
    update public.inserate set
      titel = coalesce(p_data->>'titel', titel),
      teaser = coalesce(p_data->>'teaser', teaser),
      beschreibung = coalesce(p_data->>'beschreibung', beschreibung),
      branche_id = coalesce(p_data->>'branche_id', branche_id),
      kanton = coalesce(upper(p_data->>'kanton'), kanton),
      jahr = coalesce(nullif(p_data->>'jahr','')::int, jahr),
      mitarbeitende = coalesce(nullif(p_data->>'mitarbeitende','')::int, mitarbeitende),
      mitarbeitende_bucket = coalesce(p_data->>'mitarbeitende_bucket', mitarbeitende_bucket),
      umsatz_chf = coalesce(nullif(p_data->>'umsatz_chf','')::numeric, umsatz_chf),
      umsatz_bucket = coalesce(p_data->>'umsatz_bucket', umsatz_bucket),
      ebitda_chf = coalesce(nullif(p_data->>'ebitda_chf','')::numeric, ebitda_chf),
      kaufpreis_chf = coalesce(nullif(p_data->>'kaufpreis_chf','')::numeric, kaufpreis_chf),
      kaufpreis_bucket = coalesce(p_data->>'kaufpreis_bucket', kaufpreis_bucket),
      kaufpreis_vhb = coalesce(nullif(p_data->>'kaufpreis_vhb','')::boolean, kaufpreis_vhb),
      uebergabe_grund = coalesce((p_data->>'uebergabe_grund')::public.uebergabe_grund, uebergabe_grund),
      uebergabe_zeitpunkt = coalesce(p_data->>'uebergabe_zeitpunkt', uebergabe_zeitpunkt),
      updated_at = now()
    where id = p_id;
  -- Step 3: Cover
  elsif p_step = 3 then
    update public.inserate set
      cover_url = p_data->>'cover_url',
      cover_source = p_data->>'cover_source',
      updated_at = now()
    where id = p_id;
  -- Step 4: Strengths
  elsif p_step = 4 then
    update public.inserate set
      sales_points = coalesce(
        array(select jsonb_array_elements_text(p_data->'sales_points')),
        sales_points
      ),
      updated_at = now()
    where id = p_id;
  -- Step 5: Paket (nur via Webhook gesetzt — hier Stub)
  elsif p_step = 5 then
    update public.inserate set
      paket = coalesce((p_data->>'paket')::public.inserat_paket, paket),
      stripe_session_id = coalesce(p_data->>'stripe_session_id', stripe_session_id),
      updated_at = now()
    where id = p_id;
  end if;
end $$;

grant execute on function public.submit_inserat_step(uuid, int, jsonb) to authenticated;

-- ─── 22. RPC: publish_inserat ────────────────────────────────────
create or replace function public.publish_inserat(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  select * into r from public.inserate where id = p_id and owner_id = v_user_id;
  if r is null then raise exception 'not found or not owner'; end if;

  if r.titel is null or r.branche_id is null or r.umsatz_chf is null
     or r.ebitda_chf is null or r.cover_url is null or r.paid_at is null then
    raise exception 'unvollstaendig: Pflichtfelder fehlen';
  end if;

  update public.inserate
    set status = 'zur_pruefung',
        updated_at = now()
    where id = p_id;
end $$;

grant execute on function public.publish_inserat(uuid) to authenticated;

-- ─── 23. RPC: update_anfrage_status (Owner-only) ─────────────────
create or replace function public.update_anfrage_status(
  p_id uuid,
  p_status public.anfrage_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserat_id uuid;
  v_owner uuid;
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  select inserat_id into v_inserat_id from public.anfragen where id = p_id;
  if v_inserat_id is null then raise exception 'anfrage nicht gefunden'; end if;
  select owner_id into v_owner from public.inserate where id = v_inserat_id;
  if v_owner <> v_user_id then raise exception 'not owner'; end if;

  update public.anfragen
    set status = p_status,
        decline_reason = case when p_status = 'abgelehnt' then p_reason else decline_reason end,
        updated_at = now()
    where id = p_id;
end $$;

grant execute on function public.update_anfrage_status(uuid, public.anfrage_status, text) to authenticated;

-- ─── 24. RPC: sign_nda (Käufer signt) ────────────────────────────
create or replace function public.sign_nda(
  p_anfrage_id uuid,
  p_signed_name text,
  p_ip inet default null,
  p_ua text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_nda_id uuid;
  v_anfrage_status public.anfrage_status;
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  if length(coalesce(p_signed_name,'')) < 3 then
    raise exception 'name zu kurz';
  end if;
  select status into v_anfrage_status from public.anfragen
    where id = p_anfrage_id and kaeufer_id = v_user_id;
  if v_anfrage_status is null then raise exception 'not allowed'; end if;
  if v_anfrage_status not in ('akzeptiert','nda_pending') then
    raise exception 'anfrage status erlaubt kein nda (%)', v_anfrage_status;
  end if;

  insert into public.nda_signaturen(
    anfrage_id, status, signed_at, signed_name, ip, user_agent, expires_at
  ) values (
    p_anfrage_id, 'signed', now(), p_signed_name, p_ip, p_ua, now() + interval '12 months'
  ) returning id into v_nda_id;

  update public.anfragen set status='nda_signed', updated_at=now() where id = p_anfrage_id;
  return v_nda_id;
end $$;

grant execute on function public.sign_nda(uuid, text, inet, text) to authenticated;

-- ─── 25. RPC: record_inserat_view (auch anon) ────────────────────
create or replace function public.record_inserat_view(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inserat_views(inserat_id, viewer_id) values (p_id, auth.uid());
  update public.inserate set views = views + 1 where id = p_id;
end $$;

grant execute on function public.record_inserat_view(uuid) to anon, authenticated;

-- ─── 26. RPC: record_datenraum_access ────────────────────────────
create or replace function public.record_datenraum_access(
  p_file_id uuid,
  p_action text,
  p_ip inet default null,
  p_ua text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  if p_action not in ('view','download') then raise exception 'invalid action'; end if;

  insert into public.datenraum_access_log(file_id, kaeufer_id, action, ip, user_agent)
  values (p_file_id, v_user_id, p_action, p_ip, p_ua);
end $$;

grant execute on function public.record_datenraum_access(uuid, text, inet, text) to authenticated;

-- ─── 27. STORAGE-BUCKETS ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('inserate-cover', 'inserate-cover', true),
  ('datenraum-files', 'datenraum-files', false),
  ('nda-pdfs', 'nda-pdfs', false)
on conflict (id) do nothing;

-- Storage RLS-Policies
drop policy if exists cover_owner_upload on storage.objects;
create policy cover_owner_upload on storage.objects for insert
  with check (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists cover_owner_update on storage.objects;
create policy cover_owner_update on storage.objects for update
  using (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists cover_owner_delete on storage.objects;
create policy cover_owner_delete on storage.objects for delete
  using (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists cover_public_read on storage.objects;
create policy cover_public_read on storage.objects for select
  using (bucket_id = 'inserate-cover');

drop policy if exists dat_owner_upload on storage.objects;
create policy dat_owner_upload on storage.objects for insert
  with check (
    bucket_id = 'datenraum-files'
    and (storage.foldername(name))[1] in (
      select id::text from public.inserate where owner_id = (select auth.uid())
    )
  );

drop policy if exists dat_owner_read on storage.objects;
create policy dat_owner_read on storage.objects for select
  using (
    bucket_id = 'datenraum-files'
    and (storage.foldername(name))[1] in (
      select id::text from public.inserate where owner_id = (select auth.uid())
    )
  );

drop policy if exists dat_owner_delete on storage.objects;
create policy dat_owner_delete on storage.objects for delete
  using (
    bucket_id = 'datenraum-files'
    and (storage.foldername(name))[1] in (
      select id::text from public.inserate where owner_id = (select auth.uid())
    )
  );

-- ────────────────────────────────────────────────────────────────────
-- ENDE Verkäufer-Migration
-- ────────────────────────────────────────────────────────────────────
