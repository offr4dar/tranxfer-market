-- =============================================================================
-- Migration 012: Add gender and preferred_foot to player_profiles
-- These fields are collected during onboarding and used for feed/search filters.
-- =============================================================================

ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS gender         TEXT CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS preferred_foot TEXT CHECK (preferred_foot IN ('left', 'right', 'both'));

-- Indexes for filter query performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_gender
  ON public.player_profiles (gender);

CREATE INDEX IF NOT EXISTS idx_player_profiles_preferred_foot
  ON public.player_profiles (preferred_foot);
