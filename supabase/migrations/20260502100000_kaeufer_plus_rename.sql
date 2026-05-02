-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Käufer+ Tier-Rename (max → plus) + Logo-Upload
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ENUM erweitern: 'plus' hinzufügen ────────────────────────
alter type public.subscription_tier add value if not exists 'plus';

-- ─── 2. Bestehende 'max'-Werte auf 'plus' umschreiben ────────────
-- Service-Role-only: normaler User darf subscription_tier nicht updaten.
update public.profiles
  set subscription_tier = 'plus'
  where subscription_tier = 'max';

-- ─── 3. Logo-URL auf kaeufer_profil ───────────────────────────────
alter table public.kaeufer_profil
  add column if not exists logo_url text;

-- ─── 4. Storage-Bucket für Käufer-Logos ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kaeufer-logos',
  'kaeufer-logos',
  true,
  3145728,  -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS: nur Owner darf hochladen/löschen
create policy kaeufer_logos_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy kaeufer_logos_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy kaeufer_logos_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kaeufer-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Öffentlicher Lese-Zugriff (Logo wird im Käuferprofil angezeigt)
create policy kaeufer_logos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'kaeufer-logos');

-- ─── 5. Suchprofile: 3-Limit-Trigger entfernen ───────────────────
-- Gespeicherte Suchen sind jetzt für alle Tiers ohne Limit.
drop trigger if exists suchprofile_limit on public.suchprofile;
drop function if exists public.suchprofile_max_3();
