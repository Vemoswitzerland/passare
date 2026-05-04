-- Inserate / Mandate: Telefonnummer und WhatsApp-Direktlink trennen.
--
-- Bisher haben wir 'kontakt_whatsapp_nr' als kombiniertes Feld benutzt —
-- die Public-Kontakt-Box hat dieselbe Nummer als Telefon-Reveal UND
-- als WhatsApp-Link gerendert. Cyrill 04.05.2026 möchte das Verkäufer
-- explizit zwei Felder pflegen: Telefon (für Anrufe) + WhatsApp (für
-- den Direktlink) — beide unabhängig.
--
-- Backwards-compatibility: Bestehende Inserate mit nur 'kontakt_whatsapp_nr'
-- bleiben funktional. Frontend fällt für Telefon-Anzeige auf die
-- WhatsApp-Nummer zurück, wenn das neue Telefon-Feld leer ist.

ALTER TABLE inserate
  ADD COLUMN IF NOT EXISTS kontakt_telefon_nr text;

COMMENT ON COLUMN inserate.kontakt_telefon_nr IS
  'Telefonnummer für direkten Anruf (tel:-Link). Unabhängig vom WhatsApp-Feld — User kann eine reine Festnetz-Nr für Anrufe und eine andere Mobile für WhatsApp angeben.';

COMMENT ON COLUMN inserate.kontakt_whatsapp_nr IS
  'WhatsApp-Nummer für den Direkt-Chat-Link (wa.me). NUR für WhatsApp — die Telefonnummer für Anrufe steht in kontakt_telefon_nr.';
