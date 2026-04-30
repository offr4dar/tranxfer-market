SET search_path TO public;

-- ─── Watchlist (shortlist) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id    TEXT NOT NULL,
  player_id   UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT watchlist_items_unique UNIQUE (scout_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_scout
  ON public.watchlist_items (scout_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_player
  ON public.watchlist_items (player_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlist: select" ON public.watchlist_items FOR SELECT USING (true);
CREATE POLICY "watchlist: insert" ON public.watchlist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "watchlist: delete" ON public.watchlist_items FOR DELETE USING (true);
