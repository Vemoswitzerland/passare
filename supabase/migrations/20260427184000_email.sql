-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Email-Infrastruktur
-- ════════════════════════════════════════════════════════════════════
-- Tabellen für Email-Log + Settings, Trigger die bei Events
-- (anfragen.INSERT, nda_signaturen.INSERT, ...) per pg_notify den
-- email-handler benachrichtigen. Versand selbst läuft via Edge Function
-- send-email mit Resend API.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ENUM ──────────────────────────────────────────────────────
do $$ begin
  create type public.email_status as enum (
    'queued',     -- DB-Trigger hat NOTIFY gesendet, noch nicht versendet
    'sent',       -- Resend hat bestätigt
    'failed',     -- Versand-Fehler (siehe error)
    'bounced',    -- Resend-Webhook: hard bounce
    'complained'  -- Resend-Webhook: Spam-Flag
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.email_template as enum (
    'welcome',
    'verifizierung',
    'passwort_reset',
    'anfrage_eingegangen',
    'anfrage_beantwortet',
    'nda_signiert',
    'alert_neues_inserat',
    'zahlung_bestaetigung',
    'inserat_bald_abgelaufen'
  );
exception when duplicate_object then null; end $$;

-- ─── 2. email_log ─────────────────────────────────────────────────
create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),

  template    public.email_template not null,
  to_email    text not null,
  subject     text,
  vars        jsonb,                          -- Render-Variablen (für Replay)

  status      public.email_status not null default 'queued',
  resend_id   text,                           -- Resend message id (idempotent retries)
  error       text,                           -- Fehlertext bei status=failed

  user_id     uuid references auth.users(id) on delete set null,
  related_id  uuid,                           -- z.B. anfrage_id, inserat_id

  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists email_log_to_email_idx on public.email_log (to_email);
create index if not exists email_log_template_idx on public.email_log (template);
create index if not exists email_log_status_idx   on public.email_log (status);
create index if not exists email_log_user_id_idx  on public.email_log (user_id);

comment on table public.email_log is
  'Audit-Trail für alle versendeten Emails. Inkl. Vars für Replay.';

alter table public.email_log enable row level security;

-- Nur Admin sieht email_log
do $$ begin
  create policy "email_log_admin_select"
    on public.email_log for select
    using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.rolle = 'admin'
      )
    );
exception when duplicate_object then null; end $$;

-- Service-Role schreibt (Edge Function)
-- Inserts laufen mit service_role → RLS wird umgangen, Policy nicht zwingend nötig.

-- ─── 3. email_settings ────────────────────────────────────────────
create table if not exists public.email_settings (
  key       text primary key,
  value     jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.email_settings is
  'Globale Email-Konfiguration. z.B. from_address, reply_to, default_locale.';

alter table public.email_settings enable row level security;

do $$ begin
  create policy "email_settings_admin_all"
    on public.email_settings for all
    using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.rolle = 'admin'
      )
    )
    with check (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.rolle = 'admin'
      )
    );
exception when duplicate_object then null; end $$;

-- Default-Settings setzen
insert into public.email_settings (key, value) values
  ('from_address',  '"passare <noreply@passare.ch>"'::jsonb),
  ('reply_to',      '"info@passare.ch"'::jsonb),
  ('default_locale','"de"'::jsonb),
  ('app_url',       '"https://passare.ch"'::jsonb)
on conflict (key) do nothing;

-- ─── 4. NOTIFY-Helper ─────────────────────────────────────────────
-- Trigger schreiben in email_log mit status='queued' und feuern
-- pg_notify('email_queue', json) — der Edge-Function email-handler
-- listened darauf via pg-listen / supabase-realtime und pickt die
-- Zeilen aus email_log.

create or replace function public.queue_email(
  p_template   public.email_template,
  p_to_email   text,
  p_user_id    uuid,
  p_related_id uuid,
  p_vars       jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.email_log (template, to_email, user_id, related_id, vars, status)
  values (p_template, p_to_email, p_user_id, p_related_id, p_vars, 'queued')
  returning id into v_id;

  perform pg_notify(
    'email_queue',
    json_build_object('id', v_id, 'template', p_template)::text
  );

  return v_id;
end $$;

-- ─── 5. TRIGGER: Anfragen ─────────────────────────────────────────
-- Wenn eine neue Anfrage gestellt wird → Verkäufer informieren.
-- Verwendet defensives "if exists" damit Migration auch greift falls
-- anfragen-Tabelle noch nicht existiert.

do $$
declare
  has_anfragen boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'anfragen'
  ) into has_anfragen;

  if has_anfragen then
    execute $TRG$
      create or replace function public.trg_anfrage_eingegangen()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $F$
      declare
        v_verkaeufer_email text;
        v_verkaeufer_id    uuid;
      begin
        -- Defensiv: Tabelle hat evtl. nicht alle Spalten
        begin
          select au.email, p.id
            into v_verkaeufer_email, v_verkaeufer_id
          from public.profiles p
          join auth.users au on au.id = p.id
          where p.id = (select user_id from public.inserate where id = NEW.inserat_id);
        exception when others then
          return NEW;
        end;

        if v_verkaeufer_email is not null then
          perform public.queue_email(
            'anfrage_eingegangen'::public.email_template,
            v_verkaeufer_email,
            v_verkaeufer_id,
            NEW.id,
            jsonb_build_object(
              'anfrage_id', NEW.id,
              'inserat_id', NEW.inserat_id
            )
          );
        end if;
        return NEW;
      end $F$;
    $TRG$;

    execute 'drop trigger if exists email_anfrage_eingegangen on public.anfragen';
    execute 'create trigger email_anfrage_eingegangen
             after insert on public.anfragen
             for each row execute function public.trg_anfrage_eingegangen()';
  end if;
end $$;

-- ─── 6. TRIGGER: NDA signiert ─────────────────────────────────────
do $$
declare
  has_nda boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'nda_signaturen'
  ) into has_nda;

  if has_nda then
    execute $TRG$
      create or replace function public.trg_nda_signiert()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $F$
      declare
        v_email text;
        v_uid   uuid;
      begin
        begin
          select au.email, p.id
            into v_email, v_uid
          from public.profiles p
          join auth.users au on au.id = p.id
          where p.id = (select user_id from public.inserate where id = NEW.inserat_id);
        exception when others then
          return NEW;
        end;

        if v_email is not null then
          perform public.queue_email(
            'nda_signiert'::public.email_template,
            v_email,
            v_uid,
            NEW.id,
            jsonb_build_object('nda_id', NEW.id, 'inserat_id', NEW.inserat_id)
          );
        end if;
        return NEW;
      end $F$;
    $TRG$;

    execute 'drop trigger if exists email_nda_signiert on public.nda_signaturen';
    execute 'create trigger email_nda_signiert
             after insert on public.nda_signaturen
             for each row execute function public.trg_nda_signiert()';
  end if;
end $$;
