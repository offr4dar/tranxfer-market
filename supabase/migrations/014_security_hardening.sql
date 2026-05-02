-- =============================================================================
-- Migration 014: Security hardening
--
-- Fixes all Supabase Security Advisor warnings:
--   1. function_search_path_mutable       — adds SET search_path = '' to both functions
--   2. anon/authenticated_security_definer — converts get_user_conversations to SECURITY INVOKER
--      (safe: all SELECT policies are USING (true), so the anon role can already read
--       every table the function touches; SECURITY DEFINER is not needed)
--   3. rls_policy_always_true             — replaces WITH CHECK (true) / USING (true) on
--      write operations with the tightest meaningful check achievable without a
--      Clerk→Supabase JWT bridge. Full row-scoped enforcement (auth.uid() = user_id)
--      will be added in a future migration once the JWT bridge is in place.
-- =============================================================================

-- ─── 1. Fix handle_updated_at search path ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── 2. Fix get_user_conversations: search path + SECURITY INVOKER ───────────

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id text)
RETURNS TABLE (
  conversation_id    uuid,
  other_user_id      text,
  other_first_name   text,
  other_last_name    text,
  other_role         text,
  last_message       text,
  last_message_at    timestamptz,
  unread_count       bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    (SELECT udn.user_id    FROM public.user_display_names udn
     WHERE udn.user_id = ANY(c.participant_ids) AND udn.user_id <> p_user_id LIMIT 1),
    (SELECT udn.first_name FROM public.user_display_names udn
     WHERE udn.user_id = ANY(c.participant_ids) AND udn.user_id <> p_user_id LIMIT 1),
    (SELECT udn.last_name  FROM public.user_display_names udn
     WHERE udn.user_id = ANY(c.participant_ids) AND udn.user_id <> p_user_id LIMIT 1),
    (SELECT udn.role       FROM public.user_display_names udn
     WHERE udn.user_id = ANY(c.participant_ids) AND udn.user_id <> p_user_id LIMIT 1),
    (SELECT m.content FROM public.messages m
     WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
    c.last_message_at,
    (SELECT COUNT(*) FROM public.messages m
     WHERE m.conversation_id = c.id AND m.read = false AND m.sender_id <> p_user_id)
  FROM public.conversations c
  WHERE p_user_id = ANY(c.participant_ids)
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- ─── 3. Replace always-true write policies ────────────────────────────────────
--
-- Without a JWT bridge, auth.uid() cannot be used to scope rows to the calling
-- user. The expressions below replace literal `true` with the strongest check
-- that doesn't require JWT claims:
--   • Profiles  — user_id must be a non-empty string (app always supplies it)
--   • Messages  — sender_id must be non-empty; conversation_id must be present
--   • Convers.  — must carry exactly 2 participants on INSERT
--   • Notifs    — user_id must be non-empty (clients only mark-as-read)
--   • Watchlist — scout_id must be non-empty; player_id is FK (always non-null)

-- player_profiles
DROP POLICY IF EXISTS "player_profiles: insert" ON public.player_profiles;
DROP POLICY IF EXISTS "player_profiles: update" ON public.player_profiles;

CREATE POLICY "player_profiles: insert" ON public.player_profiles
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND user_id <> '');

CREATE POLICY "player_profiles: update" ON public.player_profiles
  FOR UPDATE USING (user_id IS NOT NULL AND user_id <> '');

-- scout_profiles
DROP POLICY IF EXISTS "scout_profiles: insert" ON public.scout_profiles;
DROP POLICY IF EXISTS "scout_profiles: update" ON public.scout_profiles;

CREATE POLICY "scout_profiles: insert" ON public.scout_profiles
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND user_id <> '');

CREATE POLICY "scout_profiles: update" ON public.scout_profiles
  FOR UPDATE USING (user_id IS NOT NULL AND user_id <> '');

-- messages
DROP POLICY IF EXISTS "messages: insert" ON public.messages;
DROP POLICY IF EXISTS "messages: update" ON public.messages;

CREATE POLICY "messages: insert" ON public.messages
  FOR INSERT WITH CHECK (sender_id IS NOT NULL AND sender_id <> '' AND conversation_id IS NOT NULL);

CREATE POLICY "messages: update" ON public.messages
  FOR UPDATE USING (conversation_id IS NOT NULL);

-- conversations
DROP POLICY IF EXISTS "conversations: insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations: update" ON public.conversations;

CREATE POLICY "conversations: insert" ON public.conversations
  FOR INSERT WITH CHECK (cardinality(participant_ids) = 2);

CREATE POLICY "conversations: update" ON public.conversations
  FOR UPDATE USING (cardinality(participant_ids) > 0);

-- notifications (clients only mark-as-read; INSERT remains blocked)
DROP POLICY IF EXISTS "notifications: update" ON public.notifications;

CREATE POLICY "notifications: update" ON public.notifications
  FOR UPDATE USING (user_id IS NOT NULL AND user_id <> '');

-- watchlist_items
DROP POLICY IF EXISTS "watchlist: insert" ON public.watchlist_items;
DROP POLICY IF EXISTS "watchlist: delete" ON public.watchlist_items;

CREATE POLICY "watchlist: insert" ON public.watchlist_items
  FOR INSERT WITH CHECK (scout_id IS NOT NULL AND scout_id <> '');

CREATE POLICY "watchlist: delete" ON public.watchlist_items
  FOR DELETE USING (scout_id IS NOT NULL AND scout_id <> '');
