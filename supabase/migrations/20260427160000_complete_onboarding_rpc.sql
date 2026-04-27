-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Reparatur: complete_onboarding RPC
-- ════════════════════════════════════════════════════════════════════
-- Aktuell ruft completeOnboardingAction ein RPC auf, das nicht existiert.
-- Diese Migration legt es atomar an. SECURITY DEFINER läuft mit
-- DB-Privilegien — RPC validiert aber selbst dass auth.uid() gesetzt ist.

create or replace function public.complete_onboarding(
  p_rolle public.user_role,
  p_full_name text,
  p_kanton text,
  p_sprache text,
  p_agb_version text,
  p_datenschutz_version text,
  p_ip inet,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'auth required';
  end if;

  if p_rolle is null then
    raise exception 'rolle ist pflicht';
  end if;
  if length(coalesce(p_full_name, '')) < 2 then
    raise exception 'full_name zu kurz';
  end if;
  if length(coalesce(p_kanton, '')) <> 2 then
    raise exception 'kanton muss 2-stellig sein';
  end if;
  if p_sprache not in ('de','fr','it','en') then
    raise exception 'ungueltige sprache';
  end if;

  update public.profiles
     set rolle = p_rolle,
         full_name = p_full_name,
         kanton = upper(p_kanton),
         sprache = p_sprache,
         onboarding_completed_at = now()
   where id = v_user_id;

  insert into public.terms_acceptances(user_id, document, version, ip, user_agent)
  values (v_user_id, 'agb', p_agb_version, p_ip, p_user_agent),
         (v_user_id, 'datenschutz', p_datenschutz_version, p_ip, p_user_agent)
  on conflict (user_id, document, version) do nothing;
end $$;

grant execute on function public.complete_onboarding(
  public.user_role, text, text, text, text, text, inet, text
) to authenticated;
