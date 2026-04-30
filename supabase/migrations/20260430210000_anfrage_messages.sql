-- ════════════════════════════════════════════════════════════════════
-- passare.ch — anfrage_messages: Echter Chat zwischen Käufer und
-- Verkäufer pro Anfrage.
-- ────────────────────────────────────────────────────────────────────
-- Cyrill 30.04.2026: «Die Anfrage soll direkt vom passare-Team in
-- Anfragen / Nachrichten beantwortet werden — alle Konversationen an
-- einem Ort, mit Inserat-Tag im Chat-Header zum Zurückspringen.»
--
-- Bisher: anfragen.message = einzelne initiale Käufer-Nachricht.
-- Neu:    anfrage_messages = Volle Chat-Historie pro Anfrage.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.anfrage_messages (
  id uuid primary key default gen_random_uuid(),
  anfrage_id uuid not null references public.anfragen(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  from_role text not null check (from_role in ('kaeufer', 'verkaeufer', 'admin')),
  message text not null check (length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists anfrage_messages_anfrage_idx
  on public.anfrage_messages(anfrage_id, created_at);
create index if not exists anfrage_messages_user_idx
  on public.anfrage_messages(from_user);

comment on table public.anfrage_messages is
  'Chat-Verlauf zwischen Käufer und Verkäufer (und ggf. passare-Admin) je Anfrage. Erweitert die ursprüngliche anfragen.message zu echtem Threading.';

-- ─── RLS ──────────────────────────────────────────────────────────
alter table public.anfrage_messages enable row level security;

-- Lesen: Käufer + Verkäufer der jeweiligen Anfrage + Admin
drop policy if exists "anfrage_messages_select" on public.anfrage_messages;
create policy "anfrage_messages_select"
  on public.anfrage_messages
  for select
  using (
    exists (
      select 1
      from public.anfragen a
      join public.inserate i on i.id = a.inserat_id
      where a.id = anfrage_messages.anfrage_id
        and (
          a.kaeufer_id = auth.uid()
          or i.verkaeufer_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.rolle = 'admin'
          )
        )
    )
  );

-- Schreiben: Käufer + Verkäufer + Admin der Anfrage
drop policy if exists "anfrage_messages_insert" on public.anfrage_messages;
create policy "anfrage_messages_insert"
  on public.anfrage_messages
  for insert
  with check (
    from_user = auth.uid()
    and exists (
      select 1
      from public.anfragen a
      join public.inserate i on i.id = a.inserat_id
      where a.id = anfrage_messages.anfrage_id
        and (
          (a.kaeufer_id = auth.uid() and from_role = 'kaeufer')
          or (i.verkaeufer_id = auth.uid() and from_role = 'verkaeufer')
          or (
            from_rolle = 'admin'
            and exists (
              select 1 from public.profiles p
              where p.id = auth.uid() and p.rolle = 'admin'
            )
          )
        )
    )
  );

-- ─── BACKFILL: Initiale Käufer-Nachrichten in den neuen Chat ──────
-- Wenn anfragen.message gesetzt ist, wird sie als erste Chat-Nachricht
-- in anfrage_messages eingefügt — damit Bestands-Anfragen sofort einen
-- Verlauf zeigen.
insert into public.anfrage_messages (anfrage_id, from_user, from_role, message, created_at)
select a.id, a.kaeufer_id, 'kaeufer', a.nachricht, a.created_at
from public.anfragen a
where a.nachricht is not null
  and length(trim(a.nachricht)) > 0
  and not exists (
    select 1 from public.anfrage_messages m
    where m.anfrage_id = a.id and m.from_role = 'kaeufer'
  );

-- ─── HELPER: zuletzt-aktiv-Timestamp pro Anfrage ──────────────────
-- Update anfragen.updated_at auf neueste Message für Sortierung in Inbox
create or replace function public.touch_anfrage_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.anfragen
  set updated_at = now()
  where id = new.anfrage_id;
  return new;
end;
$$;

drop trigger if exists anfrage_messages_touch on public.anfrage_messages;
create trigger anfrage_messages_touch
  after insert on public.anfrage_messages
  for each row execute function public.touch_anfrage_on_message();
