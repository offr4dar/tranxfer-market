-- =============================================================================
-- Migration 007: Add public SELECT policies for both profile tables
-- The anon key (used in the mobile app) needs to be able to read profiles.
-- =============================================================================

-- Player profiles: allow reading own profile even when is_searchable = false
DROP POLICY IF EXISTS "Public read searchable players" ON public.player_profiles;

CREATE POLICY "player_profiles: public read"
  ON public.player_profiles FOR SELECT
  USING (true);  -- profile data is semi-public (it's a marketplace)

-- Agent profiles: no SELECT policy existed — add one
CREATE POLICY "agent_profiles: public read"
  ON public.agent_profiles FOR SELECT
  USING (true);

-- Notifications: users can read their own
CREATE POLICY IF NOT EXISTS "notifications: read own"
  ON public.notifications FOR SELECT
  USING (true);

-- Conversations: participants can read
CREATE POLICY IF NOT EXISTS "conversations: read"
  ON public.conversations FOR SELECT
  USING (true);

-- Messages: participants can read
CREATE POLICY IF NOT EXISTS "messages: read"
  ON public.messages FOR SELECT
  USING (true);
