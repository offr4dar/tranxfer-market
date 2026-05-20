import { EndorsementCategory } from '@/constants/endorsements'

export type UserRole = 'player' | 'club' | 'scout' | 'admin'

export type ContractStatus = 'available_now' | 'available_eot' | 'under_contract' | 'trial' | null | undefined

export type Position =
  | 'GK' | 'RB' | 'CB' | 'LB' | 'RWB' | 'LWB'
  | 'CDM' | 'CM' | 'CAM' | 'RM' | 'LM'
  | 'RW' | 'LW' | 'CF' | 'ST'

export type LeagueLevel =
  | 'Premier League' | 'Championship' | 'League 1' | 'League 2'
  | 'National League' | 'Step 3' | 'Step 4' | 'Step 5' | 'Step 6'
  | 'Amateur' | 'Academy' | 'International'

export type PreferredFoot = 'left' | 'right' | 'both'

export type SubscriptionTier = 'free' | 'player_premium' | 'club_starter' | 'club_pro' | 'club_enterprise'

export interface PlayerProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  age?: number | null
  nationality?: string | null
  preferred_foot?: PreferredFoot | null
  primary_position?: string | null
  secondary_positions?: string[] | null
  current_club?: string | null
  league_level?: string | null
  contract_status?: ContractStatus
  available_from?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  appearances?: number
  goals?: number
  assists?: number
  clean_sheets?: number
  gender?: 'male' | 'female' | null
  skill_level?: string | null
  bio?: string | null
  profile_photo_url?: string | null
  highlight_reel_url?: string | null
  postcode?: string | null
  is_verified?: boolean
  is_featured?: boolean
  is_searchable?: boolean
  profile_completion_score?: number
  lat?: number | null
  lng?: number | null
  last_activity_at?: string | null
  created_at?: string
  updated_at?: string
  // ── Guardian / U16 fields ──
  guardian_user_id?:        string | null
  is_minor?:                boolean
  guardian_pin_hash?:       string | null
  contact_permission?:      'none' | 'endorsed_only' | 'all_verified'
  guardian_consent_active?: boolean
}

export interface Organisation {
  id: string
  name: string
  type: 'club' | 'agency' | 'scout_network'
  country?: string
  league_level?: LeagueLevel
  logo_url?: string
  website?: string
  is_verified: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  tier: SubscriptionTier
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_end: string
}

export interface ScoutProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  scout_type: 'club_scout' | 'freelance_scout'
  affiliated_club?: string
  organisation_name?: string
  regions_covered: string[]
  specialisms: string[]
  age?: number
  postcode?: string
  lat?: number | null
  lng?: number | null
  years_experience?: number
  league_level?: string
  bio?: string
  nationality?: string
  logo_url?: string
  is_verified: boolean
  clearance_check?: boolean       // legacy — use dbs_verified instead
  created_at: string
  updated_at: string

  // ── Layer 1: Identity & DBS verification ──
  id_verified: boolean
  id_verified_at?: string | null
  dbs_certificate_number?: string | null   // PRIVATE — never display
  dbs_issue_date?: string | null
  dbs_on_update_service: boolean
  dbs_verified: boolean
  dbs_verified_at?: string | null
  dbs_expiry_reminder?: string | null
  safeguarding_certified: boolean
  safeguarding_certified_at?: string | null
  safeguarding_expiry?: string | null
  layer1_verified: boolean                 // computed: all three checks passed
}

// ─── Endorsements ─────────────────────────────────────────────────────────────

export interface EndorsementDef {
  id: string
  emoji: string
  label: string
  category: EndorsementCategory
  description: string
}

/** A single scout's endorsement of a player for a specific trait */
export interface PlayerEndorsement {
  id?: string
  player_id: string
  scout_user_id: string
  scout_name: string
  endorsement_id: string
  created_at?: string
}

/** Aggregated endorsement count shown on a profile */
export interface EndorsementCount {
  endorsement_id: string
  count: number
  endorsed_by_me: boolean
}

export interface SearchFilters {
  position?: Position
  secondary_position?: Position
  nationality?: string
  min_age?: number
  max_age?: number
  contract_status?: ContractStatus
  league_level?: LeagueLevel
  preferred_foot?: PreferredFoot
  is_verified?: boolean
  featured_first?: boolean
  page?: number
  limit?: number
}

// ─── Guardian / U16 ──────────────────────────────────────────────────────────

export interface GuardianProfile {
  id:           string
  user_id:      string
  full_name:    string
  relationship: 'parent' | 'legal_guardian'
  email:        string
  created_at:   string
  updated_at:   string
}

export interface ParentalConsent {
  id:                    string
  guardian_user_id:      string
  player_profile_id:     string
  consent_type:          'granted' | 'withdrawn' | 'updated'
  consent_version:       string
  consent_text_snapshot: string
  ip_address:            string | null
  user_agent:            string | null
  consented_at:          string
}

export interface GuardianContactApproval {
  id:                string
  guardian_user_id:  string
  player_profile_id: string
  scout_user_id:     string
  status:            'approved' | 'blocked'
  created_at:        string
}
