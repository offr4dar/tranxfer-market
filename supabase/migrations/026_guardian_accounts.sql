-- =============================================================================
-- 026_guardian_accounts.sql
-- Under-16 Guardian Accounts
--
-- 1. Drops the superseded parental_controls table (from 025)
-- 2. Adds 5 guardian columns to player_profiles
-- 3. Creates guardian_profiles, parental_consents, guardian_contact_approvals
-- 4. Creates indexes
-- =============================================================================

-- ── Drop superseded table from 025 ───────────────────────────────────────────
DROP TABLE IF EXISTS public.parental_controls;

-- ── 1. Add guardian columns to player_profiles ────────────────────────────────
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS guardian_user_id       text,
  ADD COLUMN IF NOT EXISTS is_minor               boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guardian_pin_hash      text,
  ADD COLUMN IF NOT EXISTS contact_permission     text    NOT NULL DEFAULT 'none'
    CHECK (contact_permission IN ('none', 'endorsed_only', 'all_verified')),
  ADD COLUMN IF NOT EXISTS guardian_consent_active boolean NOT NULL DEFAULT false;

-- ── 2. Create guardian_profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guardian_profiles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text        NOT NULL UNIQUE,
  full_name    text        NOT NULL,
  relationship text        NOT NULL CHECK (relationship IN ('parent', 'legal_guardian')),
  email        text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_guardian_profiles_updated_at ON public.guardian_profiles;
CREATE TRIGGER set_guardian_profiles_updated_at
  BEFORE UPDATE ON public.guardian_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_profiles_select" ON public.guardian_profiles FOR SELECT USING (true);
CREATE POLICY "guardian_profiles_insert" ON public.guardian_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "guardian_profiles_update" ON public.guardian_profiles FOR UPDATE USING (true);

-- ── 3. Create parental_consents (immutable audit log — no UPDATE/DELETE) ──────
CREATE TABLE IF NOT EXISTS public.parental_consents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_user_id     text        NOT NULL REFERENCES public.guardian_profiles(user_id),
  player_profile_id    uuid        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  consent_type         text        NOT NULL CHECK (consent_type IN ('granted', 'withdrawn', 'updated')),
  consent_version      text        NOT NULL,
  consent_text_snapshot text       NOT NULL,
  ip_address           inet,
  user_agent           text,
  consented_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parental_consents_select" ON public.parental_consents FOR SELECT USING (true);
CREATE POLICY "parental_consents_insert" ON public.parental_consents FOR INSERT WITH CHECK (true);
-- No UPDATE or DELETE — this table is an immutable audit log

-- ── 4. Create guardian_contact_approvals ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guardian_contact_approvals (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_user_id  text        NOT NULL,
  player_profile_id uuid        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  scout_user_id     text        NOT NULL,
  status            text        NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'blocked')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_profile_id, scout_user_id)
);

ALTER TABLE public.guardian_contact_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_contact_approvals_select" ON public.guardian_contact_approvals FOR SELECT USING (true);
CREATE POLICY "guardian_contact_approvals_insert" ON public.guardian_contact_approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "guardian_contact_approvals_update" ON public.guardian_contact_approvals FOR UPDATE USING (true);

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_player_profiles_guardian
  ON public.player_profiles (guardian_user_id) WHERE guardian_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parental_consents_guardian
  ON public.parental_consents (guardian_user_id);

CREATE INDEX IF NOT EXISTS idx_guardian_contact_approvals_player
  ON public.guardian_contact_approvals (player_profile_id);
