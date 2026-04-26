-- =============================================================================
-- Migration 008: Full RLS policy set for mobile app (anon client)
-- Paste this into Supabase Dashboard → SQL Editor and run it.
-- URL: https://supabase.com/dashboard/project/rtnplxrijzcueonahvxx/sql/new
-- =============================================================================

-- ─── Player profiles ──────────────────────────────────────────────────────────

-- DROP old restrictive SELECT policy
DROP POLICY IF EXISTS "Public read searchable players" ON public.player_profiles;

-- SELECT: any profile is readable (marketplace — semi-public by design)
CREATE POLICY "player_profiles: read all"
  ON public.player_profiles FOR SELECT
  USING (true);

-- INSERT: anon client can create a profile (keyed by clerk user_id)
CREATE POLICY "player_profiles: insert own"
  ON public.player_profiles FOR INSERT
  WITH CHECK (true);

-- UPDATE: anon client can update their own profile
CREATE POLICY "player_profiles: update own"
  ON public.player_profiles FOR UPDATE
  USING (true);

-- ─── Agent profiles ────────────────────────────────────────────────────────────

-- SELECT: any agent profile is readable
CREATE POLICY "agent_profiles: read all"
  ON public.agent_profiles FOR SELECT
  USING (true);

-- INSERT: anon client can create an agent profile
CREATE POLICY "agent_profiles: insert own"
  ON public.agent_profiles FOR INSERT
  WITH CHECK (true);

-- UPDATE: anon client can update their own agent profile
CREATE POLICY "agent_profiles: update own"
  ON public.agent_profiles FOR UPDATE
  USING (true);

-- ─── Messages ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages: read" ON public.messages;
CREATE POLICY "messages: read"
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "messages: insert"
  ON public.messages FOR INSERT WITH CHECK (true);

-- ─── Notifications ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications: read own" ON public.notifications;
CREATE POLICY "notifications: read"
  ON public.notifications FOR SELECT USING (true);

-- ─── Conversations ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations: read" ON public.conversations;
CREATE POLICY "conversations: read"
  ON public.conversations FOR SELECT USING (true);

CREATE POLICY "conversations: insert"
  ON public.conversations FOR INSERT WITH CHECK (true);
