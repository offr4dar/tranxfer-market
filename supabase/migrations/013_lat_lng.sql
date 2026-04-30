-- =============================================================================
-- Migration 013: Add lat/lng to player and scout profiles
-- Populated from a static UK outward-code centroid lookup at onboarding time.
-- Used for free client-side proximity filtering via the Haversine formula.
-- =============================================================================

ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_player_profiles_location ON public.player_profiles (lat, lng);
CREATE INDEX IF NOT EXISTS idx_scout_profiles_location  ON public.scout_profiles  (lat, lng);
