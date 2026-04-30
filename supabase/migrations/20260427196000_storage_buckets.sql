-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Storage-Buckets für Inserat-Bilder + Datenraum
-- ════════════════════════════════════════════════════════════════════
-- Cyrill: «bug bei Profilbild-Upload: Bucket not found!»
--
-- Die Upload-Routes (api/inserate/upload-cover, upload-kontakt-foto,
-- upload-datenraum) nutzten Buckets `inserate-cover` und `datenraum-files`,
-- die in der DB nie erstellt wurden — alle Image-Uploads warfen 500.
--
-- Diese Migration legt beide Buckets idempotent an + RLS-Policies:
--   inserate-cover  → public-read, owner-write (Path: <user-id>/<file>)
--   datenraum-files → privat, nur Owner read+write
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('inserate-cover', 'inserate-cover', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('datenraum-files', 'datenraum-files', false, 52428800, null)
on conflict (id) do nothing;

-- ── inserate-cover ──────────────────────────────────────────────
drop policy if exists "inserate-cover read" on storage.objects;
create policy "inserate-cover read"
  on storage.objects for select
  using (bucket_id = 'inserate-cover');

drop policy if exists "inserate-cover insert own" on storage.objects;
create policy "inserate-cover insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "inserate-cover update own" on storage.objects;
create policy "inserate-cover update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "inserate-cover delete own" on storage.objects;
create policy "inserate-cover delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'inserate-cover'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── datenraum-files ─────────────────────────────────────────────
drop policy if exists "datenraum-files own" on storage.objects;
create policy "datenraum-files own"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'datenraum-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'datenraum-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
