-- ════════════════════════════════════════════════════════════════════
-- passare.ch — Broker-System (Phase 2)
-- ════════════════════════════════════════════════════════════════════
-- Erweitert das Datenmodell um Broker-Funktionalität:
--   • user_role Enum um 'broker' erweitert
--   • broker_profiles (1:1 zu profiles)
--   • broker_team_members
--   • inserate.broker_id FK
--   • subscriptions tracking für broker_starter / broker_pro
--   • RLS-Policies
--   • complete_onboarding RPC erweitert
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ENUM erweitern ────────────────────────────────────────────
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'broker';

-- ─── 2. broker_profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  agentur_name       text NOT NULL,
  slug               text UNIQUE NOT NULL,
  logo_url           text,
  bio                text CHECK (bio IS NULL OR length(bio) <= 1000),
  website            text,
  telefon            text,
  handelsregister_uid text,

  tier               text NOT NULL DEFAULT 'starter'
                     CHECK (tier IN ('starter', 'pro')),
  mandate_limit      int NOT NULL DEFAULT 5,
  team_seats_limit   int NOT NULL DEFAULT 0,

  stripe_subscription_id text,
  subscription_status    text DEFAULT 'inactive'
                         CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
  subscription_interval  text CHECK (subscription_interval IS NULL OR subscription_interval IN ('monthly', 'yearly')),
  subscription_renewed_at timestamptz,
  subscription_cancel_at  timestamptz,

  verified_at        timestamptz,
  suspended_at       timestamptz,
  suspended_reason   text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broker_profiles_slug_idx ON public.broker_profiles(slug);
CREATE INDEX IF NOT EXISTS broker_profiles_tier_idx ON public.broker_profiles(tier);
CREATE INDEX IF NOT EXISTS broker_profiles_stripe_sub_idx
  ON public.broker_profiles(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS broker_profiles_updated ON public.broker_profiles;
CREATE TRIGGER broker_profiles_updated
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. broker_team_members ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle     text NOT NULL DEFAULT 'member'
            CHECK (rolle IN ('admin', 'senior', 'junior', 'member')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at  timestamptz,
  UNIQUE (broker_id, user_id)
);

CREATE INDEX IF NOT EXISTS broker_team_broker_idx ON public.broker_team_members(broker_id);
CREATE INDEX IF NOT EXISTS broker_team_user_idx ON public.broker_team_members(user_id);

-- ─── 4. inserate.broker_id ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inserate' AND column_name = 'broker_id'
  ) THEN
    ALTER TABLE public.inserate ADD COLUMN broker_id uuid REFERENCES public.broker_profiles(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS inserate_broker_idx ON public.inserate(broker_id)
  WHERE broker_id IS NOT NULL;

-- ─── 5. RLS ──────────────────────────────────────────────────────
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_team_members ENABLE ROW LEVEL SECURITY;

-- broker_profiles: owner sieht eigenes
DROP POLICY IF EXISTS bp_owner_select ON public.broker_profiles;
CREATE POLICY bp_owner_select ON public.broker_profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS bp_owner_update ON public.broker_profiles;
CREATE POLICY bp_owner_update ON public.broker_profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- broker_profiles: public read (für /broker/[slug] Profilseite)
DROP POLICY IF EXISTS bp_public_read ON public.broker_profiles;
CREATE POLICY bp_public_read ON public.broker_profiles FOR SELECT
  USING (subscription_status = 'active' AND suspended_at IS NULL);

-- broker_profiles: admin all
DROP POLICY IF EXISTS bp_admin_all ON public.broker_profiles;
CREATE POLICY bp_admin_all ON public.broker_profiles FOR ALL
  USING ((SELECT rolle FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin')
  WITH CHECK ((SELECT rolle FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin');

-- broker_team_members: broker-owner sieht eigenes Team
DROP POLICY IF EXISTS btm_broker_select ON public.broker_team_members;
CREATE POLICY btm_broker_select ON public.broker_team_members FOR SELECT
  USING ((SELECT auth.uid()) = broker_id);

DROP POLICY IF EXISTS btm_broker_manage ON public.broker_team_members;
CREATE POLICY btm_broker_manage ON public.broker_team_members FOR ALL
  USING ((SELECT auth.uid()) = broker_id)
  WITH CHECK ((SELECT auth.uid()) = broker_id);

-- Team-Mitglied sieht sich selbst
DROP POLICY IF EXISTS btm_member_self ON public.broker_team_members;
CREATE POLICY btm_member_self ON public.broker_team_members FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- inserate: Broker sieht eigene Mandate
DROP POLICY IF EXISTS ins_broker_select ON public.inserate;
CREATE POLICY ins_broker_select ON public.inserate FOR SELECT
  USING ((SELECT auth.uid()) = broker_id);

DROP POLICY IF EXISTS ins_broker_update ON public.inserate;
CREATE POLICY ins_broker_update ON public.inserate FOR UPDATE
  USING ((SELECT auth.uid()) = broker_id)
  WITH CHECK ((SELECT auth.uid()) = broker_id);

DROP POLICY IF EXISTS ins_broker_insert ON public.inserate;
CREATE POLICY ins_broker_insert ON public.inserate FOR INSERT
  WITH CHECK (
    broker_id IS NOT NULL
    AND (SELECT auth.uid()) = broker_id
  );

DROP POLICY IF EXISTS ins_broker_delete ON public.inserate;
CREATE POLICY ins_broker_delete ON public.inserate FOR DELETE
  USING ((SELECT auth.uid()) = broker_id AND status = 'entwurf');

-- ─── 6. GRANTS ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.broker_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_team_members TO authenticated;

-- ─── 7. Storage Bucket für Broker-Logos ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('broker-logos', 'broker-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS broker_logo_owner_upload ON storage.objects;
CREATE POLICY broker_logo_owner_upload ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'broker-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS broker_logo_owner_update ON storage.objects;
CREATE POLICY broker_logo_owner_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'broker-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS broker_logo_public_read ON storage.objects;
CREATE POLICY broker_logo_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'broker-logos');

-- ─── 8. RPC: create_broker_profile ───────────────────────────────
CREATE OR REPLACE FUNCTION public.create_broker_profile(
  p_agentur_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_telefon text DEFAULT NULL,
  p_handelsregister_uid text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF length(coalesce(p_agentur_name, '')) < 2 THEN
    RAISE EXCEPTION 'agentur_name zu kurz';
  END IF;
  IF length(coalesce(p_slug, '')) < 3 THEN
    RAISE EXCEPTION 'slug zu kurz';
  END IF;
  IF p_slug ~ '[^a-z0-9-]' THEN
    RAISE EXCEPTION 'slug darf nur lowercase alphanumerisch + bindestrich enthalten';
  END IF;

  INSERT INTO public.broker_profiles (id, agentur_name, slug, logo_url, bio, website, telefon, handelsregister_uid)
  VALUES (v_user_id, p_agentur_name, p_slug, p_logo_url, p_bio, p_website, p_telefon, p_handelsregister_uid)
  ON CONFLICT (id) DO UPDATE SET
    agentur_name = EXCLUDED.agentur_name,
    slug = EXCLUDED.slug,
    logo_url = COALESCE(EXCLUDED.logo_url, broker_profiles.logo_url),
    bio = COALESCE(EXCLUDED.bio, broker_profiles.bio),
    website = COALESCE(EXCLUDED.website, broker_profiles.website),
    telefon = COALESCE(EXCLUDED.telefon, broker_profiles.telefon),
    handelsregister_uid = COALESCE(EXCLUDED.handelsregister_uid, broker_profiles.handelsregister_uid),
    updated_at = now();
END $$;

GRANT EXECUTE ON FUNCTION public.create_broker_profile(text, text, text, text, text, text, text) TO authenticated;

-- ─── 9. RPC: create_broker_mandat ────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_broker_mandat(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_broker broker_profiles%ROWTYPE;
  v_count int;
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;

  SELECT * INTO v_broker FROM public.broker_profiles WHERE id = v_user_id;
  IF v_broker IS NULL THEN RAISE EXCEPTION 'kein broker-profil gefunden'; END IF;
  IF v_broker.subscription_status <> 'active' THEN
    RAISE EXCEPTION 'broker-abo nicht aktiv';
  END IF;

  SELECT count(*) INTO v_count FROM public.inserate
    WHERE broker_id = v_user_id AND status NOT IN ('verkauft', 'abgelaufen');
  IF v_count >= v_broker.mandate_limit THEN
    RAISE EXCEPTION 'mandate-limit erreicht (%)', v_broker.mandate_limit;
  END IF;

  INSERT INTO public.inserate (
    owner_id, broker_id,
    firma_name, branche_id, kanton, status
  ) VALUES (
    v_user_id, v_user_id,
    nullif(p_data->>'firma_name', ''),
    nullif(p_data->>'branche_id', ''),
    upper(nullif(p_data->>'kanton', '')),
    'entwurf'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.create_broker_mandat(jsonb) TO authenticated;

-- ─── 10. Update complete_onboarding to handle broker ─────────────
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_rolle public.user_role,
  p_full_name text,
  p_kanton text,
  p_sprache text,
  p_agb_version text,
  p_datenschutz_version text,
  p_ip inet,
  p_user_agent text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  IF p_rolle IS NULL THEN
    RAISE EXCEPTION 'rolle ist pflicht';
  END IF;
  IF length(coalesce(p_full_name, '')) < 2 THEN
    RAISE EXCEPTION 'full_name zu kurz';
  END IF;
  IF length(coalesce(p_kanton, '')) <> 2 THEN
    RAISE EXCEPTION 'kanton muss 2-stellig sein';
  END IF;
  IF p_sprache NOT IN ('de','fr','it','en') THEN
    RAISE EXCEPTION 'ungueltige sprache';
  END IF;

  UPDATE public.profiles
     SET rolle = p_rolle,
         full_name = p_full_name,
         kanton = upper(p_kanton),
         sprache = p_sprache,
         is_broker = (p_rolle = 'broker'),
         onboarding_completed_at = now()
   WHERE id = v_user_id;

  INSERT INTO public.terms_acceptances(user_id, document, version, ip, user_agent)
  VALUES (v_user_id, 'agb', p_agb_version, p_ip, p_user_agent),
         (v_user_id, 'datenschutz', p_datenschutz_version, p_ip, p_user_agent)
  ON CONFLICT (user_id, document, version) DO NOTHING;
END $$;

-- ─── 11. profiles: add subscription fields for broker ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed_at timestamptz;
  END IF;
END $$;

-- ─── 12. View: broker profiles public (für Verzeichnis) ──────────
CREATE OR REPLACE VIEW public.broker_profiles_public AS
  SELECT
    bp.id,
    bp.agentur_name,
    bp.slug,
    bp.logo_url,
    bp.bio,
    bp.website,
    bp.tier,
    bp.created_at,
    p.kanton,
    (SELECT count(*) FROM public.inserate i WHERE i.broker_id = bp.id AND i.status = 'live') AS active_mandate_count
  FROM public.broker_profiles bp
  JOIN public.profiles p ON p.id = bp.id
  WHERE bp.subscription_status = 'active'
    AND bp.suspended_at IS NULL;

GRANT SELECT ON public.broker_profiles_public TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ENDE Broker-Migration
-- ════════════════════════════════════════════════════════════════════
