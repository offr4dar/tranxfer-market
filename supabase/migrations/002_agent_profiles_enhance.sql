-- =============================================================================
-- Migration 002: Enhance agent_profiles
-- Adds agent/scout type distinction, professional credentials, and onboarding
-- fields (age, postcode) that are collected during the wizard.
-- =============================================================================

-- ─── New columns on agent_profiles ───────────────────────────────────────────

ALTER TABLE public.agent_profiles
  -- Distinguishes independent agent from club scout / scouting network
  ADD COLUMN IF NOT EXISTS agent_type        TEXT
    DEFAULT 'independent_agent'
    CHECK (agent_type IN ('independent_agent', 'club_scout', 'scouting_network')),

  -- Onboarding data (collected in wizard step 1 "About You")
  ADD COLUMN IF NOT EXISTS age               SMALLINT CHECK (age >= 16 AND age <= 80),
  ADD COLUMN IF NOT EXISTS postcode          TEXT,

  -- Credentials
  ADD COLUMN IF NOT EXISTS licence_number    TEXT,       -- FA / FIFA Agent Licence
  ADD COLUMN IF NOT EXISTS years_experience  SMALLINT,

  -- Club affiliation (for club_scout type)
  ADD COLUMN IF NOT EXISTS affiliated_club   TEXT,       -- Free text club name

  -- Additional coverage / specialisms
  ADD COLUMN IF NOT EXISTS regions_covered   TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialisms       TEXT[]  DEFAULT '{}',  -- e.g. ['ST', 'CAM']
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT;

-- ─── Rename organisation_type → agent_org_type for clarity ───────────────────
-- (Only run if the column hasn't already been renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_profiles' AND column_name = 'organisation_type'
  ) THEN
    ALTER TABLE public.agent_profiles
      RENAME COLUMN organisation_type TO agent_org_type;
  END IF;
END$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agent_type
  ON public.agent_profiles (agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_verified
  ON public.agent_profiles (is_verified);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_searchable
  ON public.agent_profiles (is_searchable)
  WHERE is_searchable = true;

-- ─── RLS policy: allow authenticated users to insert their own record ─────────
-- (migration 001 only set up public read — agents need to write their own row)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_profiles' AND policyname = 'agent_profiles: insert own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "agent_profiles: insert own"
        ON public.agent_profiles FOR INSERT
        WITH CHECK (true);
    $policy$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_profiles' AND policyname = 'agent_profiles: update own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "agent_profiles: update own"
        ON public.agent_profiles FOR UPDATE
        USING (user_id = requesting_user_id());
    $policy$;
  END IF;
END$$;

-- ─── player_profiles: ensure age + postcode columns exist ────────────────────
-- migration 001 has age already, just add postcode for consistency
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS postcode TEXT;
