-- =============================================================================
-- TRANXFER MARKET — Complete PostgreSQL Schema
-- Two-sided marketplace: Football Players ↔ Clubs/Scouts/Agents
-- Auth: Clerk (webhook sync) | Payments: Stripe | Platform: Supabase
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- fuzzy text search on names
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- GIN indexes for array columns
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- accent-insensitive search

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Football positions (standardised)
CREATE TYPE football_position AS ENUM (
  -- Goalkeepers
  'GK',
  -- Defenders
  'CB', 'RB', 'LB', 'RWB', 'LWB',
  -- Midfielders
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  -- Forwards
  'RW', 'LW', 'SS', 'CF', 'ST'
);

-- League levels (England-centric, expandable)
CREATE TYPE league_level AS ENUM (
  'Premier League',
  'Championship',
  'League 1',
  'League 2',
  'National League',
  'National League North',
  'National League South',
  'Step 3',
  'Step 4',
  'Step 5',
  'Step 6',
  'Amateur',
  'Academy',
  'University',
  'International',
  'Other'
);

-- Contract / availability status
CREATE TYPE contract_status AS ENUM (
  'available_now',
  'available_end_of_season',
  'under_contract',
  'trial_period'
);

-- Preferred foot
CREATE TYPE preferred_foot AS ENUM (
  'left',
  'right',
  'both'
);

-- User account type
CREATE TYPE account_type AS ENUM (
  'player',
  'club',
  'scout',
  'agent'
);

-- Organisation type
CREATE TYPE org_type AS ENUM (
  'club',
  'agency',
  'scouting_network',
  'independent'
);

-- Subscription plan tier
CREATE TYPE subscription_tier AS ENUM (
  'free',
  'starter',
  'pro',
  'elite'
);

-- Subscription status (mirrors Stripe)
CREATE TYPE subscription_status AS ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused',
  'unpaid'
);

-- Contact/connection request status
CREATE TYPE contact_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'withdrawn'
);

-- Message status
CREATE TYPE message_status AS ENUM (
  'sent',
  'delivered',
  'read'
);

-- Media type
CREATE TYPE media_type AS ENUM (
  'profile_photo',
  'highlight_reel',
  'match_clip',
  'training_clip',
  'certificate',
  'document'
);

-- Verification status
CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending_review',
  'verified',
  'rejected'
);

-- =============================================================================
-- UTILITY: updated_at TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper macro: attach updated_at trigger to a table
-- Usage: SELECT attach_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION attach_updated_at_trigger(tbl TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER set_updated_at
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
    tbl
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE: users
-- Synced from Clerk via webhook. Single source of truth for auth identity.
-- =============================================================================
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id       TEXT UNIQUE NOT NULL,         -- Clerk's user ID (e.g. user_2abc...)
  email               TEXT UNIQUE NOT NULL,
  email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  first_name          TEXT,
  last_name           TEXT,
  avatar_url          TEXT,                          -- From Clerk profile image
  account_type        account_type NOT NULL,         -- player | club | scout | agent
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned           BOOLEAN NOT NULL DEFAULT FALSE,
  last_sign_in_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_check CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_users_clerk_id    ON users (clerk_user_id);
CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_account_type ON users (account_type);
CREATE INDEX idx_users_is_active   ON users (is_active) WHERE is_active = TRUE;

SELECT attach_updated_at_trigger('users');

-- =============================================================================
-- TABLE: organisations
-- Clubs, agencies, scouting networks. A user can belong to one organisation.
-- =============================================================================
CREATE TABLE organisations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,          -- URL-friendly name
  org_type            org_type NOT NULL DEFAULT 'club',
  logo_url            TEXT,
  website_url         TEXT,
  country             TEXT,                          -- ISO 3166-1 alpha-2
  city                TEXT,
  league_level        league_level,                  -- Primary league the club competes in
  founded_year        SMALLINT,
  description         TEXT,
  verified_status     verification_status NOT NULL DEFAULT 'unverified',
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_customer_id  TEXT UNIQUE,                   -- Stripe customer ID
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug         ON organisations (slug);
CREATE INDEX idx_orgs_type         ON organisations (org_type);
CREATE INDEX idx_orgs_country      ON organisations (country);
CREATE INDEX idx_orgs_league       ON organisations (league_level);
CREATE INDEX idx_orgs_verified     ON organisations (verified_status);
-- Full-text search on organisation name
CREATE INDEX idx_orgs_name_trgm    ON organisations USING GIN (name gin_trgm_ops);

SELECT attach_updated_at_trigger('organisations');

-- =============================================================================
-- TABLE: organisation_members
-- Links users to organisations (a user belongs to one org, but org has many members).
-- =============================================================================
CREATE TABLE organisation_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member',   -- admin | manager | scout | member
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,   -- primary contact for the org
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_org_member UNIQUE (organisation_id, user_id)
);

CREATE INDEX idx_org_members_org    ON organisation_members (organisation_id);
CREATE INDEX idx_org_members_user   ON organisation_members (user_id);

-- =============================================================================
-- TABLE: player_profiles
-- One per player user. Core football identity and availability data.
-- =============================================================================
CREATE TABLE player_profiles (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Personal
  display_name              TEXT NOT NULL,
  dob                       DATE,
  nationality               TEXT,                   -- ISO 3166-1 alpha-2
  second_nationality        TEXT,
  height_cm                 SMALLINT,               -- e.g. 183
  weight_kg                 SMALLINT,               -- e.g. 76
  preferred_foot            preferred_foot,

  -- Position
  primary_position          football_position NOT NULL,
  secondary_positions       football_position[],     -- Array of additional positions

  -- Career
  current_club              TEXT,                    -- Free text (may not be on platform)
  current_club_org_id       UUID REFERENCES organisations(id) ON DELETE SET NULL,
  league_level              league_level,
  previous_clubs            JSONB DEFAULT '[]',      -- [{name, league, from, to}]

  -- Contract & Availability
  contract_status           contract_status NOT NULL DEFAULT 'available_now',
  available_from_date       DATE,                    -- For end_of_season / future availability
  -- current_weekly_wage is stored but private (not exposed in public queries)
  current_weekly_wage_gbp   INTEGER,                 -- PRIVATE — weekly wage in GBP

  -- Stats (current season)
  stat_season               TEXT,                    -- e.g. "2024/25"
  stat_appearances          SMALLINT DEFAULT 0,
  stat_goals                SMALLINT DEFAULT 0,
  stat_assists              SMALLINT DEFAULT 0,
  stat_clean_sheets         SMALLINT DEFAULT 0,      -- Primarily for GKs
  stat_yellow_cards         SMALLINT DEFAULT 0,
  stat_red_cards            SMALLINT DEFAULT 0,
  stat_minutes_played       INTEGER DEFAULT 0,

  -- Media (primary links — full media in media table)
  profile_photo_url         TEXT,
  highlight_reel_url        TEXT,

  -- Agent information (PRIVATE — only shown to verified clubs/scouts)
  has_agent                 BOOLEAN NOT NULL DEFAULT FALSE,
  agent_name                TEXT,
  agent_contact             TEXT,                    -- PRIVATE

  -- Verification
  verified_status           verification_status NOT NULL DEFAULT 'unverified',
  verified_at               TIMESTAMPTZ,
  verified_by               UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_notes        TEXT,

  -- Visibility & Platform
  is_featured               BOOLEAN NOT NULL DEFAULT FALSE,  -- Paid boost
  featured_until            TIMESTAMPTZ,                     -- When boost expires
  profile_completion_score  SMALLINT NOT NULL DEFAULT 0,     -- 0-100
  is_searchable             BOOLEAN NOT NULL DEFAULT TRUE,   -- Can appear in search
  profile_views_count       INTEGER NOT NULL DEFAULT 0,      -- Denormalised counter
  last_active               TIMESTAMPTZ,

  -- Onboarding
  bio                       TEXT,                    -- Short personal statement
  video_highlights_count    SMALLINT DEFAULT 0,      -- Denormalised

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for search queries
CREATE INDEX idx_players_user_id        ON player_profiles (user_id);
CREATE INDEX idx_players_primary_pos    ON player_profiles (primary_position);
CREATE INDEX idx_players_nationality    ON player_profiles (nationality);
CREATE INDEX idx_players_league         ON player_profiles (league_level);
CREATE INDEX idx_players_contract       ON player_profiles (contract_status);
CREATE INDEX idx_players_available_from ON player_profiles (available_from_date);
CREATE INDEX idx_players_is_featured    ON player_profiles (is_featured, featured_until) WHERE is_featured = TRUE;
CREATE INDEX idx_players_searchable     ON player_profiles (is_searchable) WHERE is_searchable = TRUE;
CREATE INDEX idx_players_verified       ON player_profiles (verified_status);
CREATE INDEX idx_players_last_active    ON player_profiles (last_active DESC);
-- Age-based search (DOB range queries)
CREATE INDEX idx_players_dob            ON player_profiles (dob);
-- Secondary positions array search
CREATE INDEX idx_players_secondary_pos  ON player_profiles USING GIN (secondary_positions);
-- Display name fuzzy search
CREATE INDEX idx_players_name_trgm      ON player_profiles USING GIN (display_name gin_trgm_ops);
-- Composite: most common search combination
CREATE INDEX idx_players_search_composite ON player_profiles (
  primary_position, nationality, contract_status, is_searchable, is_featured DESC
) WHERE is_searchable = TRUE;

SELECT attach_updated_at_trigger('player_profiles');

-- =============================================================================
-- TABLE: player_career_history
-- Structured career history for players (instead of JSONB in profile).
-- =============================================================================
CREATE TABLE player_career_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  club_name       TEXT NOT NULL,
  org_id          UUID REFERENCES organisations(id) ON DELETE SET NULL,
  league_level    league_level,
  position        football_position,
  season_from     TEXT,                -- e.g. "2022/23"
  season_to       TEXT,                -- null if current
  appearances     SMALLINT,
  goals           SMALLINT,
  assists         SMALLINT,
  is_current      BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_career_player_id ON player_career_history (player_id);
CREATE INDEX idx_career_org_id    ON player_career_history (org_id);

-- =============================================================================
-- TABLE: media
-- All media assets: videos, photos, documents
-- =============================================================================
CREATE TABLE media (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Media can belong to player profile or organisation
  player_id       UUID REFERENCES player_profiles(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organisations(id) ON DELETE CASCADE,
  media_type      media_type NOT NULL,
  title           TEXT,
  description     TEXT,
  url             TEXT NOT NULL,       -- CDN URL (Supabase Storage or external)
  thumbnail_url   TEXT,
  duration_secs   INTEGER,             -- For videos
  file_size_bytes BIGINT,
  mime_type       TEXT,
  is_primary      BOOLEAN DEFAULT FALSE,  -- Primary highlight reel / profile photo
  is_public       BOOLEAN DEFAULT TRUE,
  sort_order      SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT media_owner_check CHECK (
    (player_id IS NOT NULL AND org_id IS NULL) OR
    (player_id IS NULL AND org_id IS NOT NULL) OR
    (player_id IS NULL AND org_id IS NULL)      -- standalone / admin upload
  )
);

CREATE INDEX idx_media_player_id  ON media (player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_media_org_id     ON media (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_media_uploader   ON media (uploader_id);
CREATE INDEX idx_media_type       ON media (media_type);

SELECT attach_updated_at_trigger('media');

-- =============================================================================
-- TABLE: subscriptions
-- Stripe subscription records for both players (boosts) and clubs (search access)
-- =============================================================================
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id                  UUID REFERENCES organisations(id) ON DELETE CASCADE,  -- null for individual players

  -- Stripe IDs
  stripe_customer_id      TEXT NOT NULL,
  stripe_subscription_id  TEXT UNIQUE NOT NULL,
  stripe_price_id         TEXT NOT NULL,
  stripe_product_id       TEXT NOT NULL,

  -- Plan details
  tier                    subscription_tier NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',

  -- Billing period
  current_period_start    TIMESTAMPTZ NOT NULL,
  current_period_end      TIMESTAMPTZ NOT NULL,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at             TIMESTAMPTZ,
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,

  -- Metadata
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_user_id       ON subscriptions (user_id);
CREATE INDEX idx_subs_org_id        ON subscriptions (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_subs_stripe_sub_id ON subscriptions (stripe_subscription_id);
CREATE INDEX idx_subs_status        ON subscriptions (status);
CREATE INDEX idx_subs_period_end    ON subscriptions (current_period_end);

SELECT attach_updated_at_trigger('subscriptions');

-- =============================================================================
-- TABLE: player_boosts
-- Tracks individual paid visibility boosts for players (separate from subs)
-- =============================================================================
CREATE TABLE player_boosts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boost_type      TEXT NOT NULL DEFAULT 'featured',  -- featured | top_of_search | highlighted
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_pence    INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boosts_player_id  ON player_boosts (player_id);
CREATE INDEX idx_boosts_ends_at    ON player_boosts (ends_at) WHERE is_active = TRUE;

-- =============================================================================
-- TABLE: contacts
-- When a club/scout initiates contact with a player. Gated by subscription.
-- =============================================================================
CREATE TABLE contacts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initiator_org_id    UUID REFERENCES organisations(id) ON DELETE SET NULL,
  player_id           UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  player_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              contact_status NOT NULL DEFAULT 'pending',
  initial_message     TEXT,                          -- Optional opening message
  initiated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_contact UNIQUE (initiator_user_id, player_id)
);

CREATE INDEX idx_contacts_initiator  ON contacts (initiator_user_id);
CREATE INDEX idx_contacts_player     ON contacts (player_id);
CREATE INDEX idx_contacts_org        ON contacts (initiator_org_id) WHERE initiator_org_id IS NOT NULL;
CREATE INDEX idx_contacts_status     ON contacts (status);

SELECT attach_updated_at_trigger('contacts');

-- =============================================================================
-- TABLE: shortlists
-- Clubs/scouts save players to named shortlists
-- =============================================================================
CREATE TABLE shortlists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_org_id    UUID REFERENCES organisations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'My Shortlist',
  description     TEXT,
  is_private      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shortlists_owner   ON shortlists (owner_user_id);
CREATE INDEX idx_shortlists_org     ON shortlists (owner_org_id) WHERE owner_org_id IS NOT NULL;

SELECT attach_updated_at_trigger('shortlists');

-- =============================================================================
-- TABLE: shortlist_players
-- Players saved to a shortlist
-- =============================================================================
CREATE TABLE shortlist_players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortlist_id    UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  added_by        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes           TEXT,                              -- Private scout notes on this player
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_shortlist_player UNIQUE (shortlist_id, player_id)
);

CREATE INDEX idx_sl_players_list    ON shortlist_players (shortlist_id);
CREATE INDEX idx_sl_players_player  ON shortlist_players (player_id);

-- =============================================================================
-- TABLE: player_endorsements
-- Scouts endorse players with predefined trait badges (e.g. "Clinical Finisher").
-- One row per scout+player+trait combination. Max 3 endorsements per scout per player
-- is enforced at the application layer; the unique constraint prevents duplicates.
-- =============================================================================
CREATE TABLE player_endorsements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id        UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  scout_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endorsement_id   TEXT NOT NULL,              -- Matches EndorsementDef.id in app constants
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_endorsement UNIQUE (player_id, scout_user_id, endorsement_id)
);

CREATE INDEX idx_endorsements_player   ON player_endorsements (player_id);
CREATE INDEX idx_endorsements_scout    ON player_endorsements (scout_user_id);
CREATE INDEX idx_endorsements_trait    ON player_endorsements (endorsement_id);

-- RLS: scouts can manage their own; anyone (authenticated) can read
ALTER TABLE player_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "endorsements: scouts insert own"
  ON player_endorsements FOR INSERT
  WITH CHECK (scout_user_id = auth_user_id());

CREATE POLICY "endorsements: scouts delete own"
  ON player_endorsements FOR DELETE
  USING (scout_user_id = auth_user_id());

CREATE POLICY "endorsements: public read"
  ON player_endorsements FOR SELECT
  USING (TRUE);



-- =============================================================================
-- TABLE: profile_views
-- Analytics: who viewed which player profile, when
-- =============================================================================
CREATE TABLE profile_views (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  viewer_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,    -- null = anonymous
  viewer_org_id   UUID REFERENCES organisations(id) ON DELETE SET NULL,
  viewer_ip       INET,                              -- For anonymous view deduplication
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id      TEXT,                              -- Browser session for dedup

  -- Prevent spam: one view per viewer per player per hour
  CONSTRAINT uq_view_per_hour UNIQUE NULLS NOT DISTINCT (
    player_id, viewer_user_id, date_trunc('hour', viewed_at)
  )
);

CREATE INDEX idx_views_player_id    ON profile_views (player_id);
CREATE INDEX idx_views_viewer_id    ON profile_views (viewer_user_id) WHERE viewer_user_id IS NOT NULL;
CREATE INDEX idx_views_org_id       ON profile_views (viewer_org_id) WHERE viewer_org_id IS NOT NULL;
CREATE INDEX idx_views_viewed_at    ON profile_views (viewed_at DESC);
-- Analytics aggregation queries
CREATE INDEX idx_views_player_date  ON profile_views (player_id, viewed_at DESC);

-- =============================================================================
-- TABLE: conversations
-- Message threads between a player and a club/scout
-- =============================================================================
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_org_id     UUID REFERENCES organisations(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,   -- Linked contact request
  is_archived_player BOOLEAN DEFAULT FALSE,
  is_archived_club   BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_conversation UNIQUE (player_user_id, club_user_id)
);

CREATE INDEX idx_convos_player    ON conversations (player_user_id);
CREATE INDEX idx_convos_club      ON conversations (club_user_id);
CREATE INDEX idx_convos_last_msg  ON conversations (last_message_at DESC NULLS LAST);

SELECT attach_updated_at_trigger('conversations');

-- =============================================================================
-- TABLE: messages
-- Individual messages within a conversation (premium feature)
-- =============================================================================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  status          message_status NOT NULL DEFAULT 'sent',
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

CREATE INDEX idx_messages_convo_id  ON messages (conversation_id, sent_at DESC);
CREATE INDEX idx_messages_sender    ON messages (sender_id);
CREATE INDEX idx_messages_unread    ON messages (conversation_id, status) WHERE status != 'read';

-- =============================================================================
-- TABLE: notifications
-- In-app notifications for users
-- =============================================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                     -- profile_view | new_message | contact_request | etc.
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',                -- Extra payload (e.g. player_id, org_id)
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user_id   ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifs_unread    ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- =============================================================================
-- TABLE: audit_log
-- Admin audit trail for sensitive actions
-- =============================================================================
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                     -- e.g. 'player.verified', 'org.banned'
  target_type     TEXT,                              -- 'player_profile' | 'organisation' | etc.
  target_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor      ON audit_log (actor_id);
CREATE INDEX idx_audit_target     ON audit_log (target_type, target_id);
CREATE INDEX idx_audit_created_at ON audit_log (created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_career_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE media                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_boosts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views          ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- NOTE: Supabase Auth JWT contains the user's UUID as auth.uid().
-- We use a helper to map clerk_user_id → internal user id.

-- Helper function: get internal user id from JWT claim
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user has active paid subscription
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth_user_id()
      AND status = 'active'
      AND tier != 'free'
      AND current_period_end > NOW()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is member of an org
CREATE OR REPLACE FUNCTION user_org_id()
RETURNS UUID AS $$
  SELECT organisation_id FROM organisation_members
  WHERE user_id = auth_user_id()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----
-- USERS: users can read their own record; admins see all
-- ----
CREATE POLICY "users: read own record"
  ON users FOR SELECT
  USING (id = auth_user_id());

CREATE POLICY "users: update own record"
  ON users FOR UPDATE
  USING (id = auth_user_id());

-- ----
-- PLAYER PROFILES: public search (searchable players), full access to own profile
-- ----
CREATE POLICY "player_profiles: public read (searchable)"
  ON player_profiles FOR SELECT
  USING (is_searchable = TRUE);

CREATE POLICY "player_profiles: read own"
  ON player_profiles FOR SELECT
  USING (user_id = auth_user_id());

CREATE POLICY "player_profiles: update own"
  ON player_profiles FOR UPDATE
  USING (user_id = auth_user_id());

CREATE POLICY "player_profiles: insert own"
  ON player_profiles FOR INSERT
  WITH CHECK (user_id = auth_user_id());

-- ----
-- ORGANISATIONS: public read for verified orgs
-- ----
CREATE POLICY "orgs: public read (verified)"
  ON organisations FOR SELECT
  USING (verified_status = 'verified' AND is_active = TRUE);

CREATE POLICY "orgs: members read own org"
  ON organisations FOR SELECT
  USING (id = user_org_id());

CREATE POLICY "orgs: admin members update"
  ON organisations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members
      WHERE organisation_id = organisations.id
        AND user_id = auth_user_id()
        AND role IN ('admin', 'manager')
    )
  );

-- ----
-- SHORTLISTS: private to owner / org members
-- ----
CREATE POLICY "shortlists: owner access"
  ON shortlists FOR ALL
  USING (owner_user_id = auth_user_id());

CREATE POLICY "shortlists: org member access"
  ON shortlists FOR SELECT
  USING (
    owner_org_id IS NOT NULL
    AND owner_org_id = user_org_id()
  );

-- ----
-- CONTACTS: initiator and player can see their own contacts
-- ----
CREATE POLICY "contacts: initiator access"
  ON contacts FOR ALL
  USING (initiator_user_id = auth_user_id());

CREATE POLICY "contacts: player access"
  ON contacts FOR SELECT
  USING (player_user_id = auth_user_id());

CREATE POLICY "contacts: player respond"
  ON contacts FOR UPDATE
  USING (player_user_id = auth_user_id());

-- ----
-- CONVERSATIONS & MESSAGES: only participants
-- ----
CREATE POLICY "conversations: participant access"
  ON conversations FOR ALL
  USING (
    player_user_id = auth_user_id() OR club_user_id = auth_user_id()
  );

CREATE POLICY "messages: participant access"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE player_user_id = auth_user_id() OR club_user_id = auth_user_id()
    )
  );

CREATE POLICY "messages: sender insert"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth_user_id()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE player_user_id = auth_user_id() OR club_user_id = auth_user_id()
    )
  );

-- ----
-- SUBSCRIPTIONS: own record only
-- ----
CREATE POLICY "subscriptions: read own"
  ON subscriptions FOR SELECT
  USING (user_id = auth_user_id());

-- ----
-- PROFILE VIEWS: players see views of their own profile
-- ----
CREATE POLICY "profile_views: player sees own"
  ON profile_views FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM player_profiles WHERE user_id = auth_user_id()
    )
  );

CREATE POLICY "profile_views: logged-in user inserts"
  ON profile_views FOR INSERT
  WITH CHECK (viewer_user_id = auth_user_id() OR viewer_user_id IS NULL);

-- ----
-- NOTIFICATIONS: own only
-- ----
CREATE POLICY "notifications: own"
  ON notifications FOR ALL
  USING (user_id = auth_user_id());

-- ----
-- MEDIA: public for public media, private for documents
-- ----
CREATE POLICY "media: public read"
  ON media FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "media: uploader manages own"
  ON media FOR ALL
  USING (uploader_id = auth_user_id());

-- =============================================================================
-- FUNCTIONS & TRIGGERS: Business Logic
-- =============================================================================

-- Auto-update profile_completion_score when player_profiles is updated
CREATE OR REPLACE FUNCTION calculate_profile_completion(p player_profiles)
RETURNS SMALLINT AS $$
DECLARE
  score INT := 0;
BEGIN
  IF p.display_name IS NOT NULL THEN score := score + 10; END IF;
  IF p.dob IS NOT NULL THEN score := score + 5; END IF;
  IF p.nationality IS NOT NULL THEN score := score + 5; END IF;
  IF p.height_cm IS NOT NULL THEN score := score + 3; END IF;
  IF p.weight_kg IS NOT NULL THEN score := score + 2; END IF;
  IF p.preferred_foot IS NOT NULL THEN score := score + 5; END IF;
  IF p.primary_position IS NOT NULL THEN score := score + 10; END IF;
  IF p.secondary_positions IS NOT NULL AND cardinality(p.secondary_positions) > 0 THEN score := score + 5; END IF;
  IF p.current_club IS NOT NULL THEN score := score + 5; END IF;
  IF p.league_level IS NOT NULL THEN score := score + 5; END IF;
  IF p.contract_status IS NOT NULL THEN score := score + 10; END IF;
  IF p.profile_photo_url IS NOT NULL THEN score := score + 15; END IF;
  IF p.highlight_reel_url IS NOT NULL THEN score := score + 10; END IF;
  IF p.bio IS NOT NULL AND length(p.bio) > 50 THEN score := score + 5; END IF;
  IF p.stat_appearances > 0 THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion_score := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_completion
  BEFORE INSERT OR UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Auto-update featured status based on active boosts
CREATE OR REPLACE FUNCTION sync_featured_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE player_profiles
  SET is_featured = EXISTS (
    SELECT 1 FROM player_boosts
    WHERE player_id = NEW.player_id
      AND is_active = TRUE
      AND ends_at > NOW()
  ),
  featured_until = (
    SELECT MAX(ends_at) FROM player_boosts
    WHERE player_id = NEW.player_id
      AND is_active = TRUE
      AND ends_at > NOW()
  )
  WHERE id = NEW.player_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_featured
  AFTER INSERT OR UPDATE ON player_boosts
  FOR EACH ROW EXECUTE FUNCTION sync_featured_status();

-- Increment profile view counter (denormalised for performance)
CREATE OR REPLACE FUNCTION increment_profile_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE player_profiles
  SET profile_views_count = profile_views_count + 1
  WHERE id = NEW.player_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_view_count
  AFTER INSERT ON profile_views
  FOR EACH ROW EXECUTE FUNCTION increment_profile_view_count();

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.sent_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_convo_last_msg
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =============================================================================
-- SAMPLE QUERIES
-- =============================================================================

/*

-- ─────────────────────────────────────────────
-- 1. SEARCH PLAYERS by position + availability
-- ─────────────────────────────────────────────
SELECT
  pp.id,
  pp.display_name,
  pp.primary_position,
  pp.secondary_positions,
  pp.nationality,
  pp.league_level,
  pp.contract_status,
  pp.available_from_date,
  pp.height_cm,
  pp.dob,
  DATE_PART('year', AGE(pp.dob)) AS age,
  pp.profile_photo_url,
  pp.is_featured,
  pp.is_verified,
  pp.profile_completion_score,
  pp.stat_goals,
  pp.stat_assists,
  pp.stat_appearances
FROM player_profiles pp
WHERE
  pp.is_searchable = TRUE
  -- Position filter (primary or secondary)
  AND (
    pp.primary_position = 'ST'
    OR 'ST' = ANY(pp.secondary_positions)
  )
  -- Availability filter
  AND pp.contract_status IN ('available_now', 'trial_period')
  -- Age range filter (18-25)
  AND pp.dob BETWEEN NOW() - INTERVAL '25 years' AND NOW() - INTERVAL '18 years'
  -- Nationality filter
  AND pp.nationality = 'GB-ENG'
  -- League level filter
  AND pp.league_level IN ('Championship', 'League 1', 'League 2')
ORDER BY
  pp.is_featured DESC,               -- Featured players first
  pp.profile_completion_score DESC,  -- Complete profiles next
  pp.last_active DESC                -- Most recently active
LIMIT 20 OFFSET 0;


-- ─────────────────────────────────────────────
-- 2. GET SHORTLIST with player details
-- ─────────────────────────────────────────────
SELECT
  sl.id AS shortlist_id,
  sl.name AS shortlist_name,
  slp.notes,
  slp.rating,
  slp.added_at,
  pp.id AS player_id,
  pp.display_name,
  pp.primary_position,
  pp.nationality,
  pp.contract_status,
  pp.league_level,
  pp.profile_photo_url,
  pp.is_verified,
  pp.stat_goals,
  pp.stat_assists
FROM shortlists sl
JOIN shortlist_players slp ON slp.shortlist_id = sl.id
JOIN player_profiles pp ON pp.id = slp.player_id
WHERE sl.id = 'your-shortlist-uuid'
  AND sl.owner_user_id = auth_user_id()  -- RLS also enforces this
ORDER BY slp.added_at DESC;


-- ─────────────────────────────────────────────
-- 3. GET SUBSCRIPTION STATUS for a user/org
-- ─────────────────────────────────────────────
SELECT
  s.id,
  s.tier,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end,
  s.stripe_subscription_id,
  CASE
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN TRUE
    ELSE FALSE
  END AS is_active,
  -- Can they contact players?
  CASE
    WHEN s.status = 'active'
      AND s.tier IN ('starter', 'pro', 'elite')
      AND s.current_period_end > NOW()
    THEN TRUE
    ELSE FALSE
  END AS can_contact_players
FROM subscriptions s
WHERE s.user_id = 'target-user-uuid'
  AND s.status NOT IN ('canceled', 'incomplete_expired')
ORDER BY s.created_at DESC
LIMIT 1;


-- ─────────────────────────────────────────────
-- 4. PLAYER ANALYTICS — profile views over time
-- ─────────────────────────────────────────────
SELECT
  DATE_TRUNC('day', pv.viewed_at) AS day,
  COUNT(*) AS views,
  COUNT(DISTINCT pv.viewer_user_id) AS unique_viewers,
  COUNT(DISTINCT pv.viewer_org_id) AS orgs_viewing
FROM profile_views pv
JOIN player_profiles pp ON pp.id = pv.player_id
WHERE pp.user_id = 'player-user-uuid'
  AND pv.viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;


-- ─────────────────────────────────────────────
-- 5. GET PLAYER's FULL PRIVATE PROFILE (own view)
-- Only the player themselves or verified clubs with active sub should see
-- agent_contact, current_weekly_wage_gbp, verification_documents
-- ─────────────────────────────────────────────
SELECT
  pp.*,
  u.email,
  u.last_sign_in_at,
  -- Agent info only for verified orgs with active subscription
  CASE WHEN has_active_subscription() THEN pp.agent_name ELSE NULL END AS agent_name,
  CASE WHEN has_active_subscription() THEN pp.agent_contact ELSE NULL END AS agent_contact,
  CASE WHEN has_active_subscription() THEN pp.current_weekly_wage_gbp ELSE NULL END AS weekly_wage
FROM player_profiles pp
JOIN users u ON u.id = pp.user_id
WHERE pp.id = 'player-profile-uuid';


-- ─────────────────────────────────────────────
-- 6. CHECK if club can contact a specific player
-- ─────────────────────────────────────────────
SELECT
  -- Has active sub?
  has_active_subscription() AS has_subscription,
  -- Already contacted?
  EXISTS (
    SELECT 1 FROM contacts
    WHERE initiator_user_id = auth_user_id()
      AND player_id = 'target-player-uuid'
  ) AS already_contacted,
  -- Player accepting contact?
  pp.is_searchable AS player_searchable
FROM player_profiles pp
WHERE pp.id = 'target-player-uuid';

*/

-- =============================================================================
-- CLERK WEBHOOK HANDLER (TypeScript pseudo-code — for reference)
-- =============================================================================

/*

// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role bypasses RLS
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: WebhookEvent
  try {
    event = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Webhook verification failed', { status: 400 })
  }

  const { type, data } = event

  switch (type) {
    case 'user.created': {
      // Determine account type from Clerk public metadata
      const accountType = data.public_metadata?.account_type ?? 'player'

      await supabase.from('users').insert({
        clerk_user_id: data.id,
        email: data.email_addresses[0].email_address,
        email_verified: data.email_addresses[0].verification?.status === 'verified',
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.image_url,
        account_type: accountType,
        last_sign_in_at: new Date(data.last_sign_in_at).toISOString(),
      })
      break
    }

    case 'user.updated': {
      await supabase
        .from('users')
        .update({
          email: data.email_addresses[0].email_address,
          email_verified: data.email_addresses[0].verification?.status === 'verified',
          first_name: data.first_name,
          last_name: data.last_name,
          avatar_url: data.image_url,
          last_sign_in_at: new Date(data.last_sign_in_at).toISOString(),
        })
        .eq('clerk_user_id', data.id)
      break
    }

    case 'user.deleted': {
      // Soft delete — preserve data for compliance, just deactivate
      await supabase
        .from('users')
        .update({ is_active: false })
        .eq('clerk_user_id', data.id)
      break
    }

    case 'session.created': {
      // Update last_sign_in_at
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('clerk_user_id', data.user_id)
      break
    }
  }

  return new Response('OK', { status: 200 })
}

// ─────────────────────────────────────────────
// STRIPE WEBHOOK HANDLER (pseudo-code)
// app/api/webhooks/stripe/route.ts
// ─────────────────────────────────────────────

async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = mapPriceToTier(sub.items.data[0].price.id)

      await supabase.from('subscriptions').upsert({
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        stripe_price_id: sub.items.data[0].price.id,
        stripe_product_id: sub.items.data[0].price.product as string,
        tier,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        // Link to user via stripe_customer_id on users/orgs
        user_id: await getUserIdByStripeCustomer(sub.customer as string),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }
}

*/
