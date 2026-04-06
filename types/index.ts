export type UserRole = 'player' | 'club' | 'scout' | 'agent' | 'admin'

export type ContractStatus = 'available_now' | 'available_eot' | 'under_contract' | 'trial'

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
  full_name: string
  dob: string
  nationality: string
  height_cm?: number
  weight_kg?: number
  preferred_foot: PreferredFoot
  primary_position: Position
  secondary_positions: Position[]
  current_club?: string
  league_level?: LeagueLevel
  contract_status: ContractStatus
  available_from?: string
  appearances?: number
  goals?: number
  assists?: number
  clean_sheets?: number
  profile_photo_url?: string
  highlight_reel_url?: string
  bio?: string
  is_verified: boolean
  is_featured: boolean
  is_searchable: boolean
  profile_completion_score: number
  created_at: string
  updated_at: string
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
