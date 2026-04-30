-- =============================================================================
-- Migration 005: Conversations, Messages & user_display_names view
-- =============================================================================

-- ─── Unified name lookup view ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_display_names AS
  SELECT user_id, first_name, last_name, 'player'::text AS role,
         profile_photo_url AS avatar_url
  FROM public.player_profiles
  UNION ALL
  SELECT user_id, first_name, last_name, 'scout'::text AS role,
         logo_url AS avatar_url
  FROM public.scout_profiles;

-- ─── Conversations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids TEXT[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants
  ON public.conversations USING GIN (participant_ids);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL,
  content         TEXT NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (conversation_id, created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (app uses service role on write, anon on read)
CREATE POLICY "conversations_all" ON public.conversations USING (true) WITH CHECK (true);
CREATE POLICY "messages_all"      ON public.messages      USING (true) WITH CHECK (true);

-- ─── RPC: get conversations for a user with other participant names ────────────
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
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
