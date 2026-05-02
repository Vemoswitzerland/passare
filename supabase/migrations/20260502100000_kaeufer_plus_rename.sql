-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Käufer+ Rename + Logo-Upload + Suchprofile-Cleanup
-- ════════════════════════════════════════════════════════════════════
-- Voraussetzung: 20260502099000_add_plus_enum.sql wurde bereits
-- angewendet (sonst kennt Postgres den Enum-Wert 'plus' nicht).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Bestehende 'max'-Werte auf 'plus' umschreiben ────────────
update public.profiles
  set subscription_tier = 'plus'
  where subscription_tier = 'max';

-- ─── 2. Logo-URL auf kaeufer_profil ───────────────────────────────
alter table public.kaeufer_profil
  add column if not exists logo_url text;

-- ─── 3. Storage-Bucket für Käufer-Logos ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kaeufer-logos',
  'kaeufer-logos',
  true,
  3145728,  -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS: nur Owner mit Käufer+ darf hochladen/aktualisieren/löschen
drop policy if exists kaeufer_logos_owner_insert on storage.objects;
create policy kaeufer_logos_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and (subscription_tier in ('plus', 'max') or is_broker = true)
    )
  );

drop policy if exists kaeufer_logos_owner_update on storage.objects;
create policy kaeufer_logos_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists kaeufer_logos_owner_delete on storage.objects;
create policy kaeufer_logos_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Öffentlicher Lese-Zugriff (Logo wird im Käuferprofil angezeigt)
drop policy if exists kaeufer_logos_public_read on storage.objects;
create policy kaeufer_logos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'kaeufer-logos');

-- ─── 4. Suchprofile: 3-Limit-Trigger + WhatsApp/Push-Spalten raus ─
-- Gespeicherte Suchen sind jetzt für alle Tiers ohne Limit.
drop trigger if exists suchprofile_limit on public.suchprofile;
drop function if exists public.suchprofile_max_3();

-- WhatsApp- und Push-Alerts werden nicht mehr unterstützt.
alter table public.suchprofile drop column if exists whatsapp_alert;
alter table public.suchprofile drop column if exists push_alert;
