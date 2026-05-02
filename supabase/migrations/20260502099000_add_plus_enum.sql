-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Käufer-Tier-Enum erweitern um 'plus'
-- ════════════════════════════════════════════════════════════════════
-- WICHTIG: Postgres erlaubt nicht, einen neu hinzugefügten Enum-Wert
-- in derselben Transaktion zu verwenden. Deshalb hier in eigener
-- Migration — der UPDATE auf 'plus' kommt erst in der Folge-Migration.
-- ════════════════════════════════════════════════════════════════════

alter type public.subscription_tier add value if not exists 'plus';
