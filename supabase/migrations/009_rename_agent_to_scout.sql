-- =============================================================================
-- Migration 009: Rename agent_profiles → scout_profiles
-- Removes the 'independent_agent' sub-type. Two scout types only:
-- 'club_scout' (employed by a club) and 'freelance_scout' (independent).
-- =============================================================================

-- ─── Step 1: Drop old CHECK constraint so we can update data freely ──────────
ALTER TABLE public.agent_profiles DROP CONSTRAINT IF EXISTS agent_profiles_agent_type_check;

-- ─── Step 2: Migrate existing data ────────────────────────────────────────────
-- independent_agent → club_scout (closest match; agents are out of scope)
-- scouting_network  → freelance_scout
UPDATE public.agent_profiles SET agent_type = 'club_scout'      WHERE agent_type = 'independent_agent';
UPDATE public.agent_profiles SET agent_type = 'freelance_scout' WHERE agent_type = 'scouting_network';

-- ─── Step 3: Rename the table ────────────────────────────────────────────────
ALTER TABLE public.agent_profiles RENAME TO scout_profiles;

-- ─── Step 4: Rename the column ───────────────────────────────────────────────
ALTER TABLE public.scout_profiles RENAME COLUMN agent_type TO scout_type;

-- ─── Step 5: Update DEFAULT and add new CHECK constraint ─────────────────────
ALTER TABLE public.scout_profiles ALTER COLUMN scout_type SET DEFAULT 'club_scout';
ALTER TABLE public.scout_profiles
  ADD CONSTRAINT scout_profiles_scout_type_check
    CHECK (scout_type IN ('club_scout', 'freelance_scout'));

-- ─── Step 6: Rename indexes ───────────────────────────────────────────────────
ALTER INDEX IF EXISTS idx_agent_profiles_agent_type  RENAME TO idx_scout_profiles_scout_type;
ALTER INDEX IF EXISTS idx_agent_profiles_verified    RENAME TO idx_scout_profiles_verified;
ALTER INDEX IF EXISTS idx_agent_profiles_searchable  RENAME TO idx_scout_profiles_searchable;

-- ─── Step 7: Rename the updated_at trigger ────────────────────────────────────
DROP TRIGGER IF EXISTS agent_profiles_updated_at ON public.scout_profiles;
CREATE TRIGGER scout_profiles_updated_at
  BEFORE UPDATE ON public.scout_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Step 8: Drop old RLS policies (from migrations 007 and 008) ─────────────
DROP POLICY IF EXISTS "agent_profiles: public read" ON public.scout_profiles;
DROP POLICY IF EXISTS "agent_profiles: read all"    ON public.scout_profiles;
DROP POLICY IF EXISTS "agent_profiles: insert own"  ON public.scout_profiles;
DROP POLICY IF EXISTS "agent_profiles: update own"  ON public.scout_profiles;

-- ─── Step 9: Create new RLS policies for scout_profiles ──────────────────────
CREATE POLICY "scout_profiles: read all"
  ON public.scout_profiles FOR SELECT USING (true);

CREATE POLICY "scout_profiles: insert own"
  ON public.scout_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "scout_profiles: update own"
  ON public.scout_profiles FOR UPDATE USING (true);

-- ─── Step 10: Recreate user_display_names view ────────────────────────────────
-- Drops the old view (which referenced agent_profiles and emitted role='agent')
-- and recreates it referencing scout_profiles with role='scout'.
-- The get_user_conversations RPC reads this view — no change to the function needed.
DROP VIEW IF EXISTS public.user_display_names;
CREATE OR REPLACE VIEW public.user_display_names AS
  SELECT user_id, first_name, last_name, 'player'::text AS role,
         profile_photo_url AS avatar_url
  FROM public.player_profiles
  UNION ALL
  SELECT user_id, first_name, last_name, 'scout'::text AS role,
         logo_url AS avatar_url
  FROM public.scout_profiles;
