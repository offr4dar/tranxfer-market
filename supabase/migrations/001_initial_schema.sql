-- =============================================================================
-- Tranxfer Market — Initial Schema
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================================

-- ─── Player Profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  TEXT UNIQUE NOT NULL,  -- Clerk user ID
  first_name               TEXT NOT NULL,
  last_name                TEXT NOT NULL,
  age                      INTEGER CHECK (age >= 14 AND age <= 50),
  nationality              TEXT,
  preferred_foot           TEXT CHECK (preferred_foot IN ('left', 'right', 'both')),
  primary_position         TEXT,
  secondary_positions      TEXT[]   DEFAULT '{}',
  current_club             TEXT,
  league_level             TEXT,
  contract_status          TEXT CHECK (contract_status IN (
                             'available_now', 'available_eot',
                             'under_contract', 'trial')),
  available_from           DATE,
  height_cm                INTEGER,
  weight_kg                INTEGER,
  appearances              INTEGER  DEFAULT 0,
  goals                    INTEGER  DEFAULT 0,
  assists                  INTEGER  DEFAULT 0,
  clean_sheets             INTEGER  DEFAULT 0,
  bio                      TEXT,
  profile_photo_url        TEXT,
  highlight_reel_url       TEXT,
  is_verified              BOOLEAN  DEFAULT false,
  is_featured              BOOLEAN  DEFAULT false,
  is_searchable            BOOLEAN  DEFAULT true,
  profile_completion_score INTEGER  DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           TEXT UNIQUE NOT NULL,  -- Clerk user ID
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  organisation_name TEXT,
  organisation_type TEXT CHECK (organisation_type IN ('club', 'agency', 'scout_network')),
  country           TEXT,
  website           TEXT,
  phone             TEXT,
  positions_seeking TEXT[]  DEFAULT '{}',
  league_level      TEXT,
  age_range_min     INTEGER,
  age_range_max     INTEGER,
  bio               TEXT,
  logo_url          TEXT,
  is_verified       BOOLEAN DEFAULT false,
  subscription_tier TEXT    DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles  ENABLE ROW LEVEL SECURITY;

-- Searchable player profiles are publicly readable (for agent search)
CREATE POLICY "Public read searchable players"
  ON public.player_profiles FOR SELECT
  USING (is_searchable = true);

-- All writes go through the service role key (server-side API routes only)
-- so no additional user-level write policies are needed.

-- ─── updated_at Trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
