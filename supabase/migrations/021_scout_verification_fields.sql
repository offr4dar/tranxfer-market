-- =============================================================================
-- Migration 021: Scout identity & DBS verification fields
-- Adds structured verification tracking to scout_profiles.
-- Existing columns: clearance_check (BOOLEAN), clearance_number (TEXT)
-- These are retained. New columns add granularity for the verification system.
-- =============================================================================

-- Identity verification status (Yoti / ComplyCube / Veriff check result)
ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS id_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_verified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verification_ref   TEXT;

COMMENT ON COLUMN public.scout_profiles.id_verification_ref
  IS 'PRIVATE — Reference ID from identity verification provider (e.g. Yoti session ID). Never exposed in public queries.';

-- DBS check details (extends existing clearance_check / clearance_number)
ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS dbs_certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS dbs_issue_date         DATE,
  ADD COLUMN IF NOT EXISTS dbs_on_update_service  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dbs_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dbs_verified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dbs_expiry_reminder    DATE;

COMMENT ON COLUMN public.scout_profiles.dbs_certificate_number
  IS 'PRIVATE — 12-digit DBS certificate reference. Never exposed in public queries.';

COMMENT ON COLUMN public.scout_profiles.dbs_expiry_reminder
  IS 'Calculated field: dbs_issue_date + 3 years. Used to prompt renewal.';

-- FA Safeguarding Children course
ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS safeguarding_certified    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS safeguarding_certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS safeguarding_expiry       DATE;

COMMENT ON COLUMN public.scout_profiles.safeguarding_expiry
  IS 'FA Safeguarding Children certificate valid for 2 years from completion.';

-- Composite verification status (all three Layer 1 checks passed)
ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS layer1_verified BOOLEAN
    GENERATED ALWAYS AS (id_verified AND dbs_verified AND safeguarding_certified) STORED;
