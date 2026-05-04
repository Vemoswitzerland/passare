-- ════════════════════════════════════════════════════════════════════
-- stripe_events — Idempotency-Tabelle für Stripe-Webhooks
-- ────────────────────────────────────────────────────────────────────
-- Stripe sendet Webhooks ggf. mehrfach (at-least-once). Diese Tabelle
-- speichert verarbeitete event.id's, sodass Folge-Calls als no-op
-- geantwortet werden können.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz default now()
);

create index if not exists stripe_events_created_at_idx
  on public.stripe_events (created_at desc);

alter table public.stripe_events enable row level security;

-- Nur Service-Role schreibt → keine Policies für anon/authenticated.
