-- Migration 020: Add gender to scout_profiles
-- Captured during onboarding (name + surname + gender step)

ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

CREATE INDEX IF NOT EXISTS idx_scout_profiles_gender
  ON public.scout_profiles (gender);
