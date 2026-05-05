SET search_path TO public;

-- Tracks when scouts (or anyone) view a player's profile
CREATE TABLE IF NOT EXISTS public.profile_views (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id  TEXT        NOT NULL,   -- Clerk user_id of the player being viewed
  viewer_id  TEXT,                   -- Clerk user_id of the viewer (nullable = anonymous)
  viewed_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_player
  ON public.profile_views (player_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "views_insert" ON public.profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views_select" ON public.profile_views FOR SELECT USING (true);
