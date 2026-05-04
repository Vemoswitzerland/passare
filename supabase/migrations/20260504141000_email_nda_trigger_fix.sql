-- ════════════════════════════════════════════════════════════════════
-- nda_signiert Trigger NACHZIEHEN
-- ────────────────────────────────────────────────────────────────────
-- Der ursprüngliche Trigger in Migration 20260427184000 wurde übersprungen,
-- weil zur Migration-Zeit die nda_signaturen-Tabelle noch nicht existierte.
-- Plus: nda_signaturen.anfrage_id (NICHT inserat_id wie der alte Code-
-- Versuch annahm) — wir müssen über anfragen → inserate joinen.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.trg_nda_signiert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserat_id      uuid;
  v_inserat_titel   text;
  v_verkaeufer_id   uuid;
  v_verkaeufer_email text;
  v_kaeufer_id      uuid;
  v_kuerzel         text;
begin
  -- Nur bei status='signed' Mail senden (nicht bei pending/expired)
  begin
    if NEW.status::text not in ('signed', 'unterzeichnet', 'gultig', 'gueltig') then
      return NEW;
    end if;
  exception when others then
    null;
  end;

  begin
    select a.inserat_id, a.kaeufer_id
      into v_inserat_id, v_kaeufer_id
    from public.anfragen a
    where a.id = NEW.anfrage_id;

    select i.titel into v_inserat_titel
    from public.inserate i
    where i.id = v_inserat_id;

    -- Defensiv: verkaeufer_id ODER owner_id (Schema-Drift-Toleranz)
    begin
      execute format(
        'select coalesce(verkaeufer_id, owner_id) from public.inserate where id = %L',
        v_inserat_id
      ) into v_verkaeufer_id;
    exception when undefined_column then
      begin
        execute format('select verkaeufer_id from public.inserate where id = %L', v_inserat_id)
          into v_verkaeufer_id;
      exception when undefined_column then
        execute format('select owner_id from public.inserate where id = %L', v_inserat_id)
          into v_verkaeufer_id;
      end;
    end;

    if v_verkaeufer_id is not null then
      select au.email into v_verkaeufer_email
      from auth.users au
      where au.id = v_verkaeufer_id;
    end if;

    select coalesce(
      nullif(regexp_replace(p.full_name, '[^A-ZÄÖÜ]', '', 'g'), ''),
      'K'
    ) into v_kuerzel
    from public.profiles p
    where p.id = v_kaeufer_id;
  exception when others then
    return NEW;
  end;

  if v_verkaeufer_email is not null then
    perform public.queue_email(
      'nda_signiert'::public.email_template,
      v_verkaeufer_email,
      v_verkaeufer_id,
      NEW.id,
      jsonb_build_object(
        'verkaeuferName',  '',
        'inseratTitel',    coalesce(v_inserat_titel, 'dein Inserat'),
        'kaeuferKuerzel',  coalesce(v_kuerzel, ''),
        'signiertAm',      coalesce(to_char(NEW.signed_at, 'DD.MM.YYYY'), to_char(now(), 'DD.MM.YYYY')),
        'inseratId',       coalesce(v_inserat_id::text, ''),
        'appUrl',          'https://passare.ch'
      )
    );
  end if;

  return NEW;
end $$;

drop trigger if exists email_nda_signiert on public.nda_signaturen;
create trigger email_nda_signiert
  after insert or update of status on public.nda_signaturen
  for each row execute function public.trg_nda_signiert();
