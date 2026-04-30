-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Benachrichtigungs-Einstellungen pro User
-- ════════════════════════════════════════════════════════════════════
-- Cyrill: «Bei den Einstellungen ein Benachrichtigungszentrum,
-- wann er in welchem Fall ein Mail bekommen möchte».
--
-- Pro User + key ein Eintrag. Default: nicht persistiert → alles
-- enabled (Helper-Funktion is_notif_enabled() entscheidet).
-- User darf nur seine eigenen Prefs lesen/schreiben.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.notification_prefs (
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text not null,
  enabled  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.notification_prefs enable row level security;

drop policy if exists "notif_prefs_self_select" on public.notification_prefs;
create policy "notif_prefs_self_select"
  on public.notification_prefs for select
  using ((select auth.uid()) = user_id);

drop policy if exists "notif_prefs_self_upsert" on public.notification_prefs;
create policy "notif_prefs_self_upsert"
  on public.notification_prefs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "notif_prefs_self_update" on public.notification_prefs;
create policy "notif_prefs_self_update"
  on public.notification_prefs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "notif_prefs_self_delete" on public.notification_prefs;
create policy "notif_prefs_self_delete"
  on public.notification_prefs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.notification_prefs from anon;
grant select, insert, update, delete on public.notification_prefs to authenticated;

-- Helper für Mail-Send-Logik (security definer — kann unabhängig vom
-- aktuellen User Prefs eines Empfängers checken). Default = true wenn
-- keine row da (User hat noch nichts deaktiviert).
create or replace function public.is_notif_enabled(p_user_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select enabled from public.notification_prefs
     where user_id = p_user_id and key = p_key),
    true
  );
$$;

grant execute on function public.is_notif_enabled(uuid, text) to authenticated, service_role;
