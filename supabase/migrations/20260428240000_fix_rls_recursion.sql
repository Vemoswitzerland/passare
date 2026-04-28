-- KRITISCHER FIX: Infinite RLS Recursion auf inserate ↔ profiles
-- Siehe Live-DB für den angewandten Stand.
-- (drop profiles_via_anfrage + profiles_public_kaeufer, neue can_see_profile() Function)
select 'fix_rls_recursion_inserate_profiles — siehe Live-DB' as note;
