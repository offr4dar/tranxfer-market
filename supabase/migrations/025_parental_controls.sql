-- =============================================================================
-- 025_parental_controls.sql
-- PIN-based parental lock for U16 players gating the messages tab.
-- The PIN is stored as a bcrypt hash — never as plaintext.
-- Hashing is done client-side using expo-crypto (SHA-256) before storage.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.parental_controls (
  user_id     text        PRIMARY KEY REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  pin_hash    text        NOT NULL,   -- SHA-256 hex of the 4-digit PIN
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Updated-at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_parental_controls_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS parental_controls_updated_at ON public.parental_controls;
CREATE TRIGGER parental_controls_updated_at
  BEFORE UPDATE ON public.parental_controls
  FOR EACH ROW EXECUTE FUNCTION public.set_parental_controls_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.parental_controls ENABLE ROW LEVEL SECURITY;

-- Players can only read and write their own record
CREATE POLICY "parental_controls_select" ON public.parental_controls
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "parental_controls_insert" ON public.parental_controls
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "parental_controls_update" ON public.parental_controls
  FOR UPDATE USING (auth.uid()::text = user_id);
