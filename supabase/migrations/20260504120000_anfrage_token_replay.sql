-- ═══════════════════════════════════════════════════════════════
-- passare.ch — Anti-Replay-Schutz für Anfrage-Tokens
-- ───────────────────────────────────────────────────────────────
-- Verhindert dass ein einmal benutzter Verifikations-Link erneut
-- verwendet werden kann. Vor dem Abarbeiten in /api/anfrage/aktivieren
-- prüfen wir ob der Token-Hash schon hier liegt; falls ja → 410 Gone.
-- Hash = base64url(sha256(token)) — wir speichern nie den Token selbst.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.anfrage_tokens_used (
  token_hash text primary key,
  used_at    timestamptz not null default now()
);

comment on table public.anfrage_tokens_used is
  'One-shot-Marker: token_hash wird hier abgelegt sobald ein Anfrage-Verifikations-Link benutzt wurde.';

-- Auto-Cleanup nach 60 Tagen (Tokens leben 24h, Spielraum für Audits) —
-- wir löschen einfach beim nächsten INSERT alle alten Einträge mit > 60d
-- TTL via Trigger.
create or replace function public.anfrage_tokens_used_gc()
returns trigger
language plpgsql
as $$
begin
  delete from public.anfrage_tokens_used
  where used_at < now() - interval '60 days';
  return new;
end;
$$;

drop trigger if exists anfrage_tokens_used_gc_trg on public.anfrage_tokens_used;
create trigger anfrage_tokens_used_gc_trg
  after insert on public.anfrage_tokens_used
  for each statement
  execute function public.anfrage_tokens_used_gc();

-- RLS: niemand vom Client darf das lesen oder schreiben — nur Service-Role.
alter table public.anfrage_tokens_used enable row level security;
revoke all on public.anfrage_tokens_used from anon, authenticated;
