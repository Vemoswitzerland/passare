-- ════════════════════════════════════════════════════════════════════
-- passare.ch — submit_inserat_step Step 4: Kontakt-Felder persistieren
-- ────────────────────────────────────────────────────────────────────
-- Bug: Die RPC submit_inserat_step (Step 4 = Stärken & Sichtbarkeit) hat
-- bisher NUR sales_points geschrieben. Die im Wizard eingegebenen
-- Anonymitäts-/Kontakt-Felder (anonymitaet_level, kontakt_vorname,
-- kontakt_nachname, kontakt_funktion, kontakt_foto_url,
-- kontakt_email_public, kontakt_whatsapp_nr, whatsapp_enabled,
-- linkedin_url) wurden vom Auto-Save komplett ignoriert.
--
-- Fix: Step 4 schreibt diese Felder jetzt mit. Spalten existieren bereits
-- aus Migration 20260430120000_kontakt_felder.sql + 20260428200000_pakete_v2.sql
-- (linkedin_url).
-- ════════════════════════════════════════════════════════════════════

create or replace function public.submit_inserat_step(
  p_id uuid,
  p_step int,
  p_data jsonb
)
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
  if r.owner_id <> v_user_id then raise exception 'not owner'; end if;
  if r.status not in ('entwurf','zur_pruefung') then
    raise exception 'inserat ist nicht editierbar (status=%)', r.status;
  end if;

  -- Step 2: Basisdaten
  if p_step = 2 then
    update public.inserate set
      titel = coalesce(p_data->>'titel', titel),
      teaser = coalesce(p_data->>'teaser', teaser),
      beschreibung = coalesce(p_data->>'beschreibung', beschreibung),
      branche_id = coalesce(p_data->>'branche_id', branche_id),
      kanton = coalesce(upper(p_data->>'kanton'), kanton),
      jahr = coalesce(nullif(p_data->>'jahr','')::int, jahr),
      mitarbeitende = coalesce(nullif(p_data->>'mitarbeitende','')::int, mitarbeitende),
      mitarbeitende_bucket = coalesce(p_data->>'mitarbeitende_bucket', mitarbeitende_bucket),
      umsatz_chf = coalesce(nullif(p_data->>'umsatz_chf','')::numeric, umsatz_chf),
      umsatz_bucket = coalesce(p_data->>'umsatz_bucket', umsatz_bucket),
      ebitda_chf = coalesce(nullif(p_data->>'ebitda_chf','')::numeric, ebitda_chf),
      kaufpreis_chf = coalesce(nullif(p_data->>'kaufpreis_chf','')::numeric, kaufpreis_chf),
      kaufpreis_bucket = coalesce(p_data->>'kaufpreis_bucket', kaufpreis_bucket),
      kaufpreis_vhb = coalesce(nullif(p_data->>'kaufpreis_vhb','')::boolean, kaufpreis_vhb),
      uebergabe_grund = coalesce((p_data->>'uebergabe_grund')::public.uebergabe_grund, uebergabe_grund),
      uebergabe_zeitpunkt = coalesce(p_data->>'uebergabe_zeitpunkt', uebergabe_zeitpunkt),
      updated_at = now()
    where id = p_id;
  -- Step 3: Cover
  elsif p_step = 3 then
    update public.inserate set
      cover_url = p_data->>'cover_url',
      cover_source = p_data->>'cover_source',
      updated_at = now()
    where id = p_id;
  -- Step 4: Strengths + Anonymität + Kontakt-Felder
  elsif p_step = 4 then
    update public.inserate set
      sales_points = coalesce(
        case when p_data ? 'sales_points'
          then array(select jsonb_array_elements_text(p_data->'sales_points'))
          else sales_points
        end,
        sales_points
      ),
      anonymitaet_level = case
        when p_data ? 'anonymitaet_level'
          then nullif(p_data->>'anonymitaet_level','')
          else anonymitaet_level
      end,
      whatsapp_enabled = case
        when p_data ? 'whatsapp_enabled'
          then coalesce(nullif(p_data->>'whatsapp_enabled','')::boolean, false)
          else whatsapp_enabled
      end,
      kontakt_vorname = case
        when p_data ? 'kontakt_vorname' then nullif(p_data->>'kontakt_vorname','')
        else kontakt_vorname
      end,
      kontakt_nachname = case
        when p_data ? 'kontakt_nachname' then nullif(p_data->>'kontakt_nachname','')
        else kontakt_nachname
      end,
      kontakt_funktion = case
        when p_data ? 'kontakt_funktion' then nullif(p_data->>'kontakt_funktion','')
        else kontakt_funktion
      end,
      kontakt_foto_url = case
        when p_data ? 'kontakt_foto_url' then nullif(p_data->>'kontakt_foto_url','')
        else kontakt_foto_url
      end,
      kontakt_email_public = case
        when p_data ? 'kontakt_email_public' then nullif(p_data->>'kontakt_email_public','')
        else kontakt_email_public
      end,
      kontakt_whatsapp_nr = case
        when p_data ? 'kontakt_whatsapp_nr' then nullif(p_data->>'kontakt_whatsapp_nr','')
        else kontakt_whatsapp_nr
      end,
      linkedin_url = case
        when p_data ? 'linkedin_url' then nullif(p_data->>'linkedin_url','')
        else linkedin_url
      end,
      updated_at = now()
    where id = p_id;
  -- Step 5: Paket (nur via Webhook gesetzt — hier Stub)
  elsif p_step = 5 then
    update public.inserate set
      paket = coalesce((p_data->>'paket')::public.inserat_paket, paket),
      stripe_session_id = coalesce(p_data->>'stripe_session_id', stripe_session_id),
      updated_at = now()
    where id = p_id;
  end if;
end $$;

grant execute on function public.submit_inserat_step(uuid, int, jsonb) to authenticated;
