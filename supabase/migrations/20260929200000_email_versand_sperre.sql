-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Versand-Sperre für email_log (Umzug Resend -> Lettermint)
-- ════════════════════════════════════════════════════════════════════
-- Warum: dieselbe email_log-Zeile wird heute von ZWEI Aufrufen gleichzeitig
-- verschickt. send-email legt eine Zeile (status queued) an und sendet; der
-- Auslöser email_log_dispatch ruft dabei sofort email-handler, und der ruft
-- send-email mit derselben log_id. Beide sehen "queued" und senden.
-- Lettermint schützt nicht davor: zwei gleichzeitige Anfragen mit demselben
-- Idempotency-Key ergaben in der Probe T2 3 von 3 Mal zwei Mails
-- (lettermint-umzug/ZETTEL-L0b.md). Die Sperre ist darum bei uns.
--
-- Ein UPDATE mit Bedingung ist atomar: zwei gleichzeitige Aufrufe warten
-- aufeinander (Zeilen-Sperre), der zweite prüft die Bedingung danach neu
-- und bekommt keine Zeile. Uhr = Datenbank-Uhr.
--
-- Nur hinzufügen, nichts umbenennen: Spalte resend_id heisst bis Stufe 2
-- (nach der Resend-Kündigung) so weiter und hält ab jetzt die Lettermint-
-- Kennung (Plan C5).
-- Rückweg: die alte send-email liest die neue Spalte nicht; sie und die
-- Funktion stören nichts und dürfen stehen bleiben.
-- ════════════════════════════════════════════════════════════════════

alter table public.email_log
  add column if not exists versand_beansprucht_am timestamptz;

comment on column public.email_log.versand_beansprucht_am is
  'Versand-Sperre: wann ein send-email-Aufruf diese Zeile zum Senden beansprucht hat. '
  'Frei = null oder älter als 10 Minuten (abgebrochener Aufruf).';

create or replace function public.email_log_versand_beanspruchen(p_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.email_log
     set versand_beansprucht_am = now()
   where id = p_id
     and status <> 'sent'
     and (versand_beansprucht_am is null
          or versand_beansprucht_am < now() - interval '10 minutes')
  returning true
$$;

comment on function public.email_log_versand_beanspruchen(uuid) is
  'true = dieser Aufruf darf die Zeile senden; null = ein anderer sendet gerade, sie ist schon sent oder existiert nicht.';

revoke all on function public.email_log_versand_beanspruchen(uuid) from public;
revoke all on function public.email_log_versand_beanspruchen(uuid) from anon, authenticated;
grant execute on function public.email_log_versand_beanspruchen(uuid) to service_role;
