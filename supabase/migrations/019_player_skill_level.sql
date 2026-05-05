-- Add skill_level column to player_profiles
-- Maps to "Performance level" in the app UI

ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS skill_level TEXT;
