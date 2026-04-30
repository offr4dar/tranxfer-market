SET search_path TO public;

-- =============================================================================
-- Migration 010: Tighten RLS policies
--
-- Context: The mobile app uses the Supabase anon key with Clerk user IDs stored
-- as TEXT. auth.uid() cannot be used for row-scoped enforcement because Supabase
-- auth is not in use — the app passes clerk userId as a query param. Full user-id
-- scoping will be added when a Clerk→Supabase JWT bridge is implemented.
--
-- Until then: SELECT/INSERT/UPDATE are open (marketplace model), DELETE is
-- blocked everywhere from the client. Notifications are insert-blocked (server only).
-- =============================================================================

-- ─── Drop all existing policies (all tables, all old names) ──────────────────

-- player_profiles (from migrations 001, 007, 008)
DROP POLICY IF EXISTS "Public read searchable players"  ON public.player_profiles;
DROP POLICY IF EXISTS "player_profiles: public read"    ON public.player_profiles;
DROP POLICY IF EXISTS "player_profiles: read all"       ON public.player_profiles;
DROP POLICY IF EXISTS "player_profiles: insert own"     ON public.player_profiles;
DROP POLICY IF EXISTS "player_profiles: update own"     ON public.player_profiles;

-- scout_profiles (from migration 009)
DROP POLICY IF EXISTS "scout_profiles: read all"        ON public.scout_profiles;
DROP POLICY IF EXISTS "scout_profiles: insert own"      ON public.scout_profiles;
DROP POLICY IF EXISTS "scout_profiles: update own"      ON public.scout_profiles;

-- messages (from migrations 005, 007, 008)
DROP POLICY IF EXISTS "messages_all"                    ON public.messages;
DROP POLICY IF EXISTS "messages: read"                  ON public.messages;
DROP POLICY IF EXISTS "messages: insert"                ON public.messages;

-- conversations (from migrations 005, 007, 008)
DROP POLICY IF EXISTS "conversations_all"               ON public.conversations;
DROP POLICY IF EXISTS "conversations: read"             ON public.conversations;
DROP POLICY IF EXISTS "conversations: insert"           ON public.conversations;

-- notifications (from migrations 006, 007, 008)
DROP POLICY IF EXISTS "notifications_all"               ON public.notifications;
DROP POLICY IF EXISTS "notifications: read own"         ON public.notifications;
DROP POLICY IF EXISTS "notifications: read"             ON public.notifications;

-- ─── player_profiles ─────────────────────────────────────────────────────────
-- Profiles are semi-public (it's a marketplace). Auth scoping deferred until
-- Clerk JWT bridge is in place.

CREATE POLICY "player_profiles: select"
  ON public.player_profiles FOR SELECT
  USING (true);

CREATE POLICY "player_profiles: insert"
  ON public.player_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "player_profiles: update"
  ON public.player_profiles FOR UPDATE
  USING (true);

-- No DELETE policy — players cannot delete their own profile from the client.

-- ─── scout_profiles ───────────────────────────────────────────────────────────

CREATE POLICY "scout_profiles: select"
  ON public.scout_profiles FOR SELECT
  USING (true);

CREATE POLICY "scout_profiles: insert"
  ON public.scout_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "scout_profiles: update"
  ON public.scout_profiles FOR UPDATE
  USING (true);

-- No DELETE policy.

-- ─── messages ────────────────────────────────────────────────────────────────
-- UPDATE is required: conversation/[id].tsx marks messages as read on open.

CREATE POLICY "messages: select"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "messages: insert"
  ON public.messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "messages: update"
  ON public.messages FOR UPDATE
  USING (true);

-- No DELETE policy.

-- ─── conversations ────────────────────────────────────────────────────────────
-- UPDATE is required: sending a message updates conversations.last_message_at.

CREATE POLICY "conversations: select"
  ON public.conversations FOR SELECT
  USING (true);

CREATE POLICY "conversations: insert"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "conversations: update"
  ON public.conversations FOR UPDATE
  USING (true);

-- No DELETE policy.

-- ─── notifications ────────────────────────────────────────────────────────────
-- INSERT is intentionally absent: notifications are created server-side only
-- (edge functions / triggers). Clients must never write notification rows directly.
-- UPDATE is required: clients mark notifications as read.

CREATE POLICY "notifications: select"
  ON public.notifications FOR SELECT
  USING (true);

CREATE POLICY "notifications: update"
  ON public.notifications FOR UPDATE
  USING (true);

-- No INSERT policy (server-only creation).
-- No DELETE policy.
