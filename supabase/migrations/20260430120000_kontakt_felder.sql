-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Kontakt-Felder für Inhaber pro Inserat
-- ────────────────────────────────────────────────────────────────────
-- Cyrills neuer Anonymitäts-Flow:
--   • Voll anonym  → KEINE Kontakt-Felder
--   • Vorname + Funktion → kontakt_vorname + kontakt_funktion
--   • Voll offen → alles optional ausfüllbar (Vorname, Nachname, Funktion,
--                  Foto, E-Mail, WhatsApp-Nr — LinkedIn-URL existiert bereits
--                  als linkedin_url aus Migration v2)
-- ────────────────────────────────────────────────────────────────────
-- Live-Chat ist immer aktiv (live_chat_enabled bleibt in DB für Rückwärts-
-- Kompatibilität, im UI aber nicht mehr toggle-bar).
-- WhatsApp-Quick-Contact wird automatisch aktiv wenn anonymitaet_level =
-- 'voll_offen' UND kontakt_whatsapp_nr ausgefüllt.
-- ════════════════════════════════════════════════════════════════════

alter table public.inserate
  add column if not exists kontakt_vorname        text,
  add column if not exists kontakt_nachname       text,
  add column if not exists kontakt_funktion       text,
  add column if not exists kontakt_foto_url       text,
  add column if not exists kontakt_email_public   text,
  add column if not exists kontakt_whatsapp_nr    text;

comment on column public.inserate.kontakt_vorname is
  'Inhaber-Vorname — sichtbar bei anonymitaet_level=vorname_funktion oder voll_offen';
comment on column public.inserate.kontakt_nachname is
  'Inhaber-Nachname — nur bei voll_offen sichtbar';
comment on column public.inserate.kontakt_funktion is
  'Funktion (z.B. Inhaber, CEO, CFO) — sichtbar bei vorname_funktion + voll_offen';
comment on column public.inserate.kontakt_foto_url is
  'URL zu Profilbild — nur bei voll_offen';
comment on column public.inserate.kontakt_email_public is
  'Öffentlich anzeigbare E-Mail — nur bei voll_offen';
comment on column public.inserate.kontakt_whatsapp_nr is
  'WhatsApp-Nummer im internationalen Format — nur bei voll_offen, aktiviert WhatsApp-Quick-Contact';
