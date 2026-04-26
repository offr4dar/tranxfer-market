-- =============================================================================
-- Migration 003: Scout-specific fields merged into agent_profiles
-- No separate scout_profiles table — agent_type = 'club_scout' | 'scouting_network'
-- distinguishes scouts from independent agents within the same table.
-- =============================================================================

-- ─── Scout-specific columns ───────────────────────────────────────────────────
--
-- Most scout fields are already covered by existing agent_profiles columns:
--   affiliated_club     → the club the scout works for
--   regions_covered     → geographic coverage
--   specialisms         → player positions they focus on
--   years_experience    → scouting experience
--   league_level        → leagues they operate in
--   age_range_min/max   → player age range they scout
--   organisation_name   → scouting network name (if agent_org_type = 'scouting_network')
--
-- The following are scout-specific additions not yet present:

ALTER TABLE public.agent_profiles
  -- DBS / background clearance (mandatory for working with youth players in UK)
  ADD COLUMN IF NOT EXISTS clearance_check   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS clearance_number  TEXT,   -- PRIVATE — DBS certificate ref

  -- For freelance scouts not attached to a club but part of a network
  ADD COLUMN IF NOT EXISTS scouting_network  TEXT;

-- ─── Column usage reference (documentation) ───────────────────────────────────
--
-- agent_type = 'independent_agent'
--   licence_number      FA / FIFA Agent Licence number
--   organisation_name   Agency name (if working for one)
--   website             Agency website
--   years_experience    Years as a licensed agent
--   specialisms         Player positions / profiles they represent
--   regions_covered     Regions they operate in
--   linkedin_url        Professional profile
--
-- agent_type = 'club_scout'
--   affiliated_club     Club name they scout for
--   clearance_check     DBS check completed (true/false)
--   clearance_number    DBS certificate reference (PRIVATE)
--   specialisms         Player positions / profiles they scout
--   regions_covered     Regions they cover
--   age_range_min/max   Age bracket they recruit for
--   league_level        Level they scout at
--
-- agent_type = 'scouting_network'
--   scouting_network    Name of the network / association
--   organisation_name   Network organisation name (overlaps intentionally)
--   clearance_check     DBS check completed
--   specialisms         Player positions / profiles
--   regions_covered     Regions covered by the network
--   league_level        Level they scout at

COMMENT ON COLUMN public.agent_profiles.clearance_number
  IS 'PRIVATE — DBS certificate reference. Never exposed in public queries.';
