-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Hotfix: submit_inserat_step Spalten-Mapping
-- ════════════════════════════════════════════════════════════════════
-- Cyrill: «als ich im Inserat was anpassen wollte: record 'r' has no
-- field 'owner_id'»
--
-- Ursache: das RPC referenzierte mehrere veraltete Spaltennamen:
--   owner_id              → verkaeufer_id
--   branche_id            → branche
--   jahr                  → gruendungsjahr
--   uebergabe_grund       → grund (text, kein enum-Cast)
--   mitarbeitende_bucket  → existiert nicht mehr (raus)
--   umsatz_bucket         → existiert nicht mehr (raus)
--   kaufpreis_bucket      → existiert nicht mehr (raus)
-- ════════════════════════════════════════════════════════════════════

create or replace function public.submit_inserat_step(p_id uuid, p_step integer, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  r record;
begin
  if v_user_id is null then raise exception 'auth required'; end if;
  select * into r from public.inserate where id = p_id;
  if r is null then raise exception 'inserat nicht gefunden'; end if;
  if r.verkaeufer_id <> v_user_id then raise exception 'not owner'; end if;
  if r.status not in ('entwurf','zur_pruefung','rueckfrage') then
    raise exception 'inserat ist nicht editierbar (status=%)', r.status;
  end if;

  if p_step = 2 then
    update public.inserate set
      titel = coalesce(p_data->>'titel', titel),
      teaser = coalesce(p_data->>'teaser', teaser),
      beschreibung = coalesce(p_data->>'beschreibung', beschreibung),
      branche = coalesce(p_data->>'branche_id', branche),
      kanton = coalesce(upper(p_data->>'kanton'), kanton),
      gruendungsjahr = coalesce(nullif(p_data->>'jahr','')::int, gruendungsjahr),
      mitarbeitende = coalesce(nullif(p_data->>'mitarbeitende','')::int, mitarbeitende),
      umsatz_chf = coalesce(nullif(p_data->>'umsatz_chf','')::numeric, umsatz_chf),
      ebitda_chf = coalesce(nullif(p_data->>'ebitda_chf','')::numeric, ebitda_chf),
      kaufpreis_chf = coalesce(nullif(p_data->>'kaufpreis_chf','')::numeric, kaufpreis_chf),
      kaufpreis_vhb = coalesce(nullif(p_data->>'kaufpreis_vhb','')::boolean, kaufpreis_vhb),
      grund = coalesce(p_data->>'uebergabe_grund', grund),
      uebergabe_zeitpunkt = coalesce(p_data->>'uebergabe_zeitpunkt', uebergabe_zeitpunkt),
      updated_at = now()
    where id = p_id;
  elsif p_step = 3 then
    update public.inserate set
      cover_url = p_data->>'cover_url',
      cover_source = p_data->>'cover_source',
      updated_at = now()
    where id = p_id;
  elsif p_step = 4 then
    update public.inserate set
      sales_points = coalesce(
        case when p_data ? 'sales_points'
          then array(select jsonb_array_elements_text(p_data->'sales_points'))
          else sales_points
        end,
        sales_points
      ),
      anonymitaet_level = case when p_data ? 'anonymitaet_level' then nullif(p_data->>'anonymitaet_level','') else anonymitaet_level end,
      whatsapp_enabled = case when p_data ? 'whatsapp_enabled' then coalesce(nullif(p_data->>'whatsapp_enabled','')::boolean, false) else whatsapp_enabled end,
      kontakt_vorname = case when p_data ? 'kontakt_vorname' then nullif(p_data->>'kontakt_vorname','') else kontakt_vorname end,
      kontakt_nachname = case when p_data ? 'kontakt_nachname' then nullif(p_data->>'kontakt_nachname','') else kontakt_nachname end,
      kontakt_funktion = case when p_data ? 'kontakt_funktion' then nullif(p_data->>'kontakt_funktion','') else kontakt_funktion end,
      kontakt_foto_url = case when p_data ? 'kontakt_foto_url' then nullif(p_data->>'kontakt_foto_url','') else kontakt_foto_url end,
      kontakt_email_public = case when p_data ? 'kontakt_email_public' then nullif(p_data->>'kontakt_email_public','') else kontakt_email_public end,
      kontakt_whatsapp_nr = case when p_data ? 'kontakt_whatsapp_nr' then nullif(p_data->>'kontakt_whatsapp_nr','') else kontakt_whatsapp_nr end,
      linkedin_url = case when p_data ? 'linkedin_url' then nullif(p_data->>'linkedin_url','') else linkedin_url end,
      updated_at = now()
    where id = p_id;
  elsif p_step = 5 then
    update public.inserate set
      paket = coalesce((p_data->>'paket')::public.inserat_paket, paket),
      stripe_session_id = coalesce(p_data->>'stripe_session_id', stripe_session_id),
      updated_at = now()
    where id = p_id;
  end if;
end $$;
