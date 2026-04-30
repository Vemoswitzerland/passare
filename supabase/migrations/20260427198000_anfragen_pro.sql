-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Anfragen-Pro: Käuferdossier-Anfrage + Datenraum-Freigabe
-- ════════════════════════════════════════════════════════════════════
-- Cyrill: «Verkäufer kann ein Käuferdossier anfragen, der Käufer kann es
-- hochladen. Verkäufer kann den Datenraum für diesen Käufer freigeben.
-- Beides nur im Pro-Abo.»
--
-- Schema-Erweiterung:
--   anfragen.dossier_requested_at   — Verkäufer hat Käuferdossier angefordert
--   anfragen.dossier_request_message — optionale Begleit-Nachricht
--   anfragen.datenraum_granted_at   — Verkäufer hat Datenraum-Zugang gegeben
--   kaeufer_profil.dossier_url      — Käufer-Dossier-PDF (Storage-Pfad)
--   kaeufer_profil.dossier_uploaded_at — wann hochgeladen
-- ════════════════════════════════════════════════════════════════════

alter table public.anfragen
  add column if not exists dossier_requested_at timestamptz,
  add column if not exists dossier_request_message text,
  add column if not exists datenraum_granted_at timestamptz;

alter table public.kaeufer_profil
  add column if not exists dossier_url text,
  add column if not exists dossier_uploaded_at timestamptz;

-- Storage-Bucket für Käufer-Dossiers (privat).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kaeufer-dossiers', 'kaeufer-dossiers', false, 20971520,
    array['application/pdf']::text[])
on conflict (id) do nothing;

-- Käufer schreibt sein eigenes Dossier (Pfad-Prefix = user-id).
drop policy if exists "kaeufer-dossiers own write" on storage.objects;
create policy "kaeufer-dossiers own write"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'kaeufer-dossiers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'kaeufer-dossiers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
