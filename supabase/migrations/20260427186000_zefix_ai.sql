-- ═══════════════════════════════════════════════════════════════
-- passare.ch — Etappe: Zefix-Integration + AI-Teaser-Generator
-- ───────────────────────────────────────────────────────────────
-- Persistenz für:
--  · Zefix-Cache (24h-TTL für Public-API-Antworten)
--  · AI-Generations (Cost-Tracking, Audit, Re-Use)
--  · Rate-Limit-Log (60 req/min pro IP)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. zefix_cache ────────────────────────────────────────────
-- Cached Zefix-Public-API-Antworten pro UID.
-- TTL = 24h; Lookup checkt fetched_at und entscheidet stale-while-revalidate.
create table if not exists public.zefix_cache (
  uid         text primary key,
  payload     jsonb not null,
  endpoint    text not null default 'lookup'
              check (endpoint in ('lookup', 'search')),
  query       text,
  fetched_at  timestamptz not null default now()
);

create index if not exists zefix_cache_fetched_idx
  on public.zefix_cache (fetched_at desc);

create index if not exists zefix_cache_query_idx
  on public.zefix_cache (query)
  where endpoint = 'search';

comment on table public.zefix_cache is
  'Cache für Zefix-Public-API. TTL 24h, danach stale-while-revalidate.';

-- RLS: nur service_role darf lesen/schreiben (API-Layer-internal)
alter table public.zefix_cache enable row level security;

revoke all on public.zefix_cache from anon, authenticated;

-- ─── 2. ai_generations ─────────────────────────────────────────
-- Cost-Tracking + Audit für jeden AI-Call.
-- type: was wurde generiert? (teaser, branche_suggest, ...)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ai_generation_type') then
    create type public.ai_generation_type as enum (
      'teaser',
      'branche_suggest',
      'beschreibung_polish',
      'key_facts'
    );
  end if;
end$$;

create table if not exists public.ai_generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  type         public.ai_generation_type not null,
  input        jsonb not null,
  output       jsonb,
  model        text not null,
  tokens_in    integer,
  tokens_out   integer,
  tokens_used  integer,                    -- Total für schnelle Aggregation
  cost_chf     numeric(10, 4),             -- 4 Nachkommastellen für sub-Rappen
  duration_ms  integer,
  status       text not null default 'success'
               check (status in ('success', 'error', 'rate_limited')),
  error        text,
  ip           inet,
  created_at   timestamptz not null default now()
);

create index if not exists ai_generations_user_idx
  on public.ai_generations (user_id, created_at desc);

create index if not exists ai_generations_type_idx
  on public.ai_generations (type, created_at desc);

create index if not exists ai_generations_cost_idx
  on public.ai_generations (created_at desc)
  where status = 'success';

comment on table public.ai_generations is
  'Audit + Cost-Tracking für jeden AI-Call (Anthropic Claude).';

alter table public.ai_generations enable row level security;

drop policy if exists "ai_gen_self_select" on public.ai_generations;
create policy "ai_gen_self_select"
  on public.ai_generations
  for select
  using ((select auth.uid()) = user_id);

revoke all on public.ai_generations from anon, authenticated;
grant select on public.ai_generations to authenticated;

-- ─── 3. rate_limit_log ─────────────────────────────────────────
-- Sliding-Window Rate-Limit pro IP+Endpoint.
-- 60 req/min = window_start (Minuten-bucket) + count.
create table if not exists public.rate_limit_log (
  id            uuid primary key default gen_random_uuid(),
  ip            inet not null,
  endpoint      text not null,
  count         integer not null default 1,
  window_start  timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (ip, endpoint, window_start)
);

create index if not exists rate_limit_window_idx
  on public.rate_limit_log (window_start desc);

create index if not exists rate_limit_ip_idx
  on public.rate_limit_log (ip, endpoint, window_start desc);

comment on table public.rate_limit_log is
  'Per-IP+Endpoint Rate-Limit. Minuten-Bucket via window_start.';

alter table public.rate_limit_log enable row level security;
revoke all on public.rate_limit_log from anon, authenticated;

-- ─── 4. Cleanup-Funktion (alte Buckets) ─────────────────────────
-- Lösche Rate-Limit-Logs > 1h und Zefix-Cache > 7d.
create or replace function public.cleanup_zefix_ai_storage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rate_limit_log
   where window_start < now() - interval '1 hour';

  delete from public.zefix_cache
   where fetched_at < now() - interval '7 days';
end;
$$;

comment on function public.cleanup_zefix_ai_storage is
  'Aufräumen alter Rate-Limit-Buckets (>1h) und Zefix-Cache-Einträge (>7d).';
