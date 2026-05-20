-- =============================================================================
-- 022_player_videos.sql
-- Player highlight reel videos, uploaded via Mux Direct Upload.
-- status: 'processing' set on insert; 'ready' set by mux-webhook edge function.
-- player_user_id links to player_profiles.user_id (Clerk user ID, TEXT).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_videos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_user_id  text        NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  upload_id       text        NOT NULL,          -- Mux upload object ID
  playback_id     text,                          -- Mux playback ID (set when asset.ready)
  thumbnail_url   text,                          -- Mux animated thumbnail or static image
  title           text,
  description     text,
  duration_secs   integer,
  view_count      integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'processing'
                              CHECK (status IN ('processing', 'ready', 'error')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS player_videos_player_user_id_idx ON public.player_videos (player_user_id);
CREATE INDEX IF NOT EXISTS player_videos_upload_id_idx      ON public.player_videos (upload_id);
CREATE INDEX IF NOT EXISTS player_videos_status_idx         ON public.player_videos (status);

-- ── Updated-at trigger ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_player_videos_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS player_videos_updated_at ON public.player_videos;
CREATE TRIGGER player_videos_updated_at
  BEFORE UPDATE ON public.player_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_player_videos_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.player_videos ENABLE ROW LEVEL SECURITY;

-- Players can see their own videos at any status; others only see ready ones.
-- auth.uid()::text matches the Clerk user_id stored in player_user_id.
CREATE POLICY "player_videos_select" ON public.player_videos
  FOR SELECT USING (
    auth.uid()::text = player_user_id
    OR status = 'ready'
  );

-- Only the owning player can insert
CREATE POLICY "player_videos_insert" ON public.player_videos
  FOR INSERT WITH CHECK (auth.uid()::text = player_user_id);

-- Only the owning player can update (title/description edits)
-- The webhook edge function uses the service role so bypasses RLS
CREATE POLICY "player_videos_update" ON public.player_videos
  FOR UPDATE USING (auth.uid()::text = player_user_id);

-- Only the owning player can delete
CREATE POLICY "player_videos_delete" ON public.player_videos
  FOR DELETE USING (auth.uid()::text = player_user_id);
