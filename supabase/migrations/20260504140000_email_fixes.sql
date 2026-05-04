-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Email-System Fixes
-- ────────────────────────────────────────────────────────────────────
-- 1. claim_welcome_send() — atomic RPC um Race-Condition bei Welcome-
--    Mail zu eliminieren. Statt SELECT-then-UPDATE einen einzigen
--    UPDATE mit RETURNING — nur der ERSTE Caller bekommt eine Row
--    zurück und darf senden.
-- 2. anfrage_eingegangen DB-Trigger DROPPEN — der TS-Code in
--    /api/anfrage/route.ts sendet die Mail bereits mit korrektem
--    Context (subject_override, vars). DB-Trigger sendete dieselbe
--    Mail nochmal → Duplikat.
-- 3. anfrage_beantwortet DB-Trigger HINZUFÜGEN — bei Reply vom
--    Verkäufer/Broker auf eine Käufer-Anfrage.
-- 4. alert_neues_inserat DB-Trigger HINZUFÜGEN — wenn ein Inserat
--    auf 'live' geschaltet wird, an alle matching Plus/MAX-Käufer.
-- 5. last_expiry_notice_at Spalte für inserat_bald_abgelaufen Cron.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Welcome-Email Idempotenz (atomic RPC) ────────────────────
create or replace function public.claim_welcome_send(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.profiles
     set welcome_email_sent_at = now()
   where id = p_user_id
     and welcome_email_sent_at is null
  returning id into v_id;

  return v_id is not null;
end $$;

comment on function public.claim_welcome_send(uuid) is
  'Atomic Claim: setzt welcome_email_sent_at NUR wenn noch null. Returns true wenn der Caller senden darf, false wenn schon gesendet.';

grant execute on function public.claim_welcome_send(uuid) to authenticated, anon, service_role;

-- ─── 2. anfrage_eingegangen DB-Trigger ENTFERNEN ─────────────────
-- Der TS-Code in /api/anfrage/route.ts (Anfrage von eingeloggten User)
-- und /api/anfrage/aktivieren/route.ts (Anfrage von neuem User) sendet
-- die Mail mit reichhaltigem Context (subject_override, kaeuferTyp,
-- nachrichtSnippet, ...). Der DB-Trigger sendet dieselbe Mail noch
-- einmal mit nur anfrage_id+inserat_id als Vars → Duplikat.
do $$ begin
  execute 'drop trigger if exists email_anfrage_eingegangen on public.anfragen';
  execute 'drop function if exists public.trg_anfrage_eingegangen()';
exception when others then null; end $$;

-- ─── 3. anfrage_beantwortet DB-Trigger ──────────────────────────
-- Feuert bei jedem INSERT in anfrage_messages mit from_role='verkaeufer'
-- oder 'broker' — der Käufer wird informiert. from_role='kaeufer' oder
-- 'admin' wird ignoriert (eigenes Insert, kein Trigger nötig).
do $$
declare
  has_table boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'anfrage_messages'
  ) into has_table;

  if has_table then
    execute $TRG$
      create or replace function public.trg_anfrage_beantwortet()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $F$
      declare
        v_kaeufer_id    uuid;
        v_kaeufer_email text;
        v_inserat_id    uuid;
        v_inserat_titel text;
        v_kuerzel       text;
      begin
        -- Nur Antworten vom Verkäufer/Broker triggern eine Käufer-Mail
        if NEW.from_role is null or NEW.from_role not in ('verkaeufer', 'broker') then
          return NEW;
        end if;

        begin
          select a.kaeufer_id, a.inserat_id
            into v_kaeufer_id, v_inserat_id
          from public.anfragen a
          where a.id = NEW.anfrage_id;

          select au.email into v_kaeufer_email
          from auth.users au
          where au.id = v_kaeufer_id;

          select i.titel into v_inserat_titel
          from public.inserate i
          where i.id = v_inserat_id;

          -- Käufer-Kürzel (Initialen aus profiles.full_name) für Anonymität
          select coalesce(
            nullif(regexp_replace(p.full_name, '[^A-ZÄÖÜ]', '', 'g'), ''),
            'V'
          ) into v_kuerzel
          from public.profiles p
          where p.id = NEW.from_user;
        exception when others then
          -- Defensive: bei Fehlern (Spalte fehlt etc.) silent fail
          return NEW;
        end;

        if v_kaeufer_email is not null then
          perform public.queue_email(
            'anfrage_beantwortet'::public.email_template,
            v_kaeufer_email,
            v_kaeufer_id,
            NEW.anfrage_id,
            jsonb_build_object(
              'kaeuferName',         '',
              'inseratTitel',        coalesce(v_inserat_titel, 'dein Inserat'),
              'verkaeuferKuerzel',   coalesce(v_kuerzel, ''),
              'antwortSnippet',      left(coalesce(NEW.message, ''), 200),
              'anfrageId',           NEW.anfrage_id::text,
              'appUrl',              'https://passare.ch'
            )
          );
        end if;

        return NEW;
      end $F$;
    $TRG$;

    execute 'drop trigger if exists email_anfrage_beantwortet on public.anfrage_messages';
    execute 'create trigger email_anfrage_beantwortet
             after insert on public.anfrage_messages
             for each row execute function public.trg_anfrage_beantwortet()';
  end if;
end $$;

-- ─── 4. alert_neues_inserat DB-Trigger ───────────────────────────
-- Feuert wenn ein Inserat auf status='live' wechselt. Findet alle
-- Käufer mit:
--   - subscription_tier in ('plus', 'max') (nur zahlende sehen Alerts)
--   - aktivem suchprofil mit email_alert=true und ist_pausiert=false
--   - matching branche und/oder kanton (defensiv: leer = matched alles)
--
-- Schickt EINE Mail pro matchender Käufer-Profil-Kombination.
do $$
declare
  has_inserate boolean;
  has_suchprofile boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'inserate'
  ) into has_inserate;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'suchprofile'
  ) into has_suchprofile;

  if has_inserate and has_suchprofile then
    execute $TRG$
      create or replace function public.trg_alert_neues_inserat()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $F$
      declare
        v_kaeufer record;
        v_branche_text text;
      begin
        -- Nur bei Wechsel auf 'live' triggern (nicht bei jedem UPDATE)
        if NEW.status is distinct from 'live' then return NEW; end if;
        if TG_OP = 'UPDATE' and OLD.status = 'live' then return NEW; end if;

        -- branche_id ist single text (FK zu branchen.id)
        v_branche_text := coalesce(NEW.branche_id, '');

        for v_kaeufer in
          select distinct
            sp.kaeufer_id,
            au.email,
            sp.name as profil_name,
            p.full_name
          from public.suchprofile sp
          join public.profiles p on p.id = sp.kaeufer_id
          join auth.users au on au.id = sp.kaeufer_id
          where sp.email_alert = true
            and sp.ist_pausiert = false
            and p.subscription_tier in ('plus', 'max')
            and (
              array_length(sp.branche, 1) is null
              or v_branche_text = ''
              or v_branche_text = any(sp.branche)
            )
            and (
              array_length(sp.kantone, 1) is null
              or NEW.kanton is null
              or NEW.kanton = any(sp.kantone)
            )
            and au.email is not null
        loop
          perform public.queue_email(
            'alert_neues_inserat'::public.email_template,
            v_kaeufer.email,
            v_kaeufer.kaeufer_id,
            NEW.id,
            jsonb_build_object(
              'kaeuferName',     coalesce(v_kaeufer.full_name, ''),
              'inseratTitel',    coalesce(NEW.titel, 'Neues Inserat'),
              'inseratId',       NEW.id::text,
              'branche',         v_branche_text,
              'kanton',          coalesce(NEW.kanton, ''),
              'preisBand',       coalesce(NEW.kaufpreis_bucket, ''),
              'suchprofilName',  coalesce(v_kaeufer.profil_name, ''),
              'appUrl',          'https://passare.ch'
            )
          );
        end loop;

        return NEW;
      end $F$;
    $TRG$;

    execute 'drop trigger if exists email_alert_neues_inserat on public.inserate';
    execute 'create trigger email_alert_neues_inserat
             after insert or update of status on public.inserate
             for each row execute function public.trg_alert_neues_inserat()';
  end if;
end $$;

-- ─── 5. last_expiry_notice_at für Cron-basierte Ablauf-Mails ─────
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'inserate'
  ) then
    alter table public.inserate
      add column if not exists last_expiry_notice_at timestamptz;
  end if;
end $$;

-- Index für effiziente Cron-Query
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inserate' and column_name='expires_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inserate' and column_name='last_expiry_notice_at'
  ) then
    execute 'create index if not exists inserate_expiry_cron_idx
             on public.inserate(expires_at)
             where status=''live''';
  end if;
end $$;
