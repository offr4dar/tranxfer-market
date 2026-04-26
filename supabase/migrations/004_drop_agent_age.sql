-- =============================================================================
-- Migration 004: Remove age from agent_profiles
-- Age is only relevant for players. Agents and scouts do not need to declare
-- their age during onboarding or profile completion.
-- =============================================================================

ALTER TABLE public.agent_profiles
  DROP COLUMN IF EXISTS age;
