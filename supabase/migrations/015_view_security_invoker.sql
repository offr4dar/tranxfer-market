-- =============================================================================
-- Migration 015: Fix security_definer_view warning on user_display_names
--
-- PostgreSQL 15+ supports security_invoker on views. Setting it means the view
-- executes with the querying user's permissions rather than the view owner's.
-- Safe here: both underlying tables have SELECT USING (true), so anon can
-- already read them directly.
-- =============================================================================

CREATE OR REPLACE VIEW public.user_display_names
  WITH (security_invoker = true)
AS
  SELECT user_id, first_name, last_name, 'player'::text AS role,
         profile_photo_url AS avatar_url
  FROM public.player_profiles
  UNION ALL
  SELECT user_id, first_name, last_name, 'scout'::text AS role,
         logo_url AS avatar_url
  FROM public.scout_profiles;
