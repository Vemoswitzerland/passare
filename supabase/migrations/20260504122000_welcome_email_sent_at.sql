-- ═══════════════════════════════════════════════════════════════
-- passare.ch — welcome_email_sent_at (Doppel-Mail-Schutz)
-- ───────────────────────────────────────────────────────────────
-- Verhindert dass beim Tunnel-Skip + paket/continueWithBasicAction
-- zwei Welcome-Mails gesendet werden.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;
