-- =============================================================================
-- 024_player_videos_is_featured.sql
-- Adds is_featured column to player_videos so players can pin one video
-- to the top of their profile. Only one video per player can be featured
-- at a time — enforced by a partial unique index.
-- =============================================================================

ALTER TABLE public.player_videos
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- ── Partial unique index — only one featured video per player ──────────────────
-- A partial index on (player_user_id) WHERE is_featured = true ensures
-- no two rows for the same player can both have is_featured = true.
DROP INDEX IF EXISTS player_videos_one_featured_per_player;
CREATE UNIQUE INDEX player_videos_one_featured_per_player
  ON public.player_videos (player_user_id)
  WHERE (is_featured = true);
