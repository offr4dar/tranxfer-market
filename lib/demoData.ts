import { PlayerProfile, PlayerEndorsement, EndorsementCount } from '@/types'

// ─── Dummy performance log entries (Marcus Williams) ─────────────────────────
export interface LogEntry {
  id: string
  match_date: string
  entry_type: 'match' | 'training' | 'trial'
  context: string | null
  goals: number | null
  assists: number | null
  notes: string | null
}

export const DEMO_LOG_ENTRIES: LogEntry[] = [
  {
    id: 'log-001',
    match_date: '2025-04-26',
    entry_type: 'match',
    context: 'Hartfield United vs Ashdown FC',
    goals: 1,
    assists: 2,
    notes: 'Strong first half. Won a lot of duels in midfield and scored with a driven shot from outside the box.',
  },
  {
    id: 'log-002',
    match_date: '2025-04-19',
    entry_type: 'training',
    context: 'Pre-match prep session',
    goals: null,
    assists: null,
    notes: 'Focused on pressing triggers and transitional shape. Felt sharp.',
  },
  {
    id: 'log-003',
    match_date: '2025-04-12',
    entry_type: 'match',
    context: 'Hartfield United vs Bromley Cross',
    goals: 0,
    assists: 1,
    notes: 'Tough match against a physical side. Maintained discipline and played an incisive through-ball for the winner.',
  },
  {
    id: 'log-004',
    match_date: '2025-04-05',
    entry_type: 'trial',
    context: 'Melbury Town FC — Trial Session',
    goals: 1,
    assists: 0,
    notes: 'Invited for a trial day with the first team. Impressed in the small-sided games and contributed a goal in the scrimmage.',
  },
  {
    id: 'log-005',
    match_date: '2025-03-29',
    entry_type: 'match',
    context: 'Hartfield United vs Larkfield Town',
    goals: 2,
    assists: 0,
    notes: 'Best performance of the season. Both goals were from inside the box — one a tap-in, one a composed finish.',
  },
  {
    id: 'log-006',
    match_date: '2025-03-22',
    entry_type: 'training',
    context: 'Fitness and conditioning',
    goals: null,
    assists: null,
    notes: 'High-intensity interval session. Tested well on sprint distances.',
  },
  {
    id: 'log-007',
    match_date: '2025-03-15',
    entry_type: 'match',
    context: 'Hartfield United vs Westover City',
    goals: 0,
    assists: 1,
    notes: 'Comfortable 3–0 win. Good pressing from midfield kept the opposition pinned back.',
  },
]

export const DEMO_PLAYER_PROFILE = {
  id: 'demo-player-001',
  user_id: 'demo-user-player',
  first_name: 'Marcus',
  last_name: 'Williams',
  age: 22,
  nationality: 'English',
  gender: 'male' as const,
  height_cm: 180,
  weight_kg: 76,
  preferred_foot: 'right' as const,
  primary_position: 'CM',
  secondary_positions: ['CAM', 'CDM'],
  current_club: 'Hartfield United FC',
  contract_status: 'available_now' as const,
  league_level: 'Semi-Pro',
  skill_level: 'Excellent',
  profile_completion_score: 78,
  bio: 'Hardworking central midfielder with excellent vision and a knack for finding space in tight areas. Comfortable on the ball under pressure with good range of passing.',
  is_verified: true,
  is_featured: false,
  appearances: 34,
  goals: 6,
  assists: 11,
  clean_sheets: 0,
  profile_photo_url: null,
  highlight_reel_url: null,
}

// ─── Dummy scout profiles ─────────────────────────────────────────────────────
export const DEMO_SCOUT_FREE_PROFILE = {
  id: 'demo-scout-free-001',
  user_id: 'demo-user-scout-free',
  first_name: 'David',
  last_name: 'Chen',
  scout_type: 'freelance_scout' as const,
  organisation_name: 'Independent Scout',
  regions_covered: ['London', 'South East'],
  specialisms: ['Youth Development', 'Midfielders'],
  years_experience: 4,
  league_level: 'Step 3',
  is_verified: false,
  clearance_check: true,
  subscription_tier: 'free',
  created_at: '2024-09-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  // Layer 1 verification — freelance scout, partially verified
  id_verified: true,
  id_verified_at: '2025-02-10T00:00:00Z',
  dbs_certificate_number: null,
  dbs_issue_date: null,
  dbs_on_update_service: false,
  dbs_verified: false,
  dbs_verified_at: null,
  dbs_expiry_reminder: null,
  safeguarding_certified: false,
  safeguarding_certified_at: null,
  safeguarding_expiry: null,
  layer1_verified: false,
}

export const DEMO_SCOUT_PRO_PROFILE = {
  id: 'demo-scout-pro-001',
  user_id: 'demo-user-scout-pro',
  first_name: 'Sarah',
  last_name: 'Mitchell',
  scout_type: 'club_scout' as const,
  affiliated_club: 'Northgate FC',
  organisation_name: 'Premier Sports Agency',
  regions_covered: ['North West', 'Yorkshire', 'Midlands'],
  specialisms: ['Strikers', 'Wingers', 'Data Analysis'],
  years_experience: 9,
  league_level: 'Championship',
  is_verified: true,
  clearance_check: true,
  subscription_tier: 'pro',
  created_at: '2023-03-12T00:00:00Z',
  updated_at: '2025-04-20T00:00:00Z',
  // Layer 1 verification — club scout, fully verified
  id_verified: true,
  id_verified_at: '2024-06-15T00:00:00Z',
  dbs_certificate_number: '001234567890',
  dbs_issue_date: '2024-06-01',
  dbs_on_update_service: true,
  dbs_verified: true,
  dbs_verified_at: '2024-06-20T00:00:00Z',
  dbs_expiry_reminder: '2027-06-01',
  safeguarding_certified: true,
  safeguarding_certified_at: '2024-07-10T00:00:00Z',
  safeguarding_expiry: '2026-07-10',
  layer1_verified: true,
}

// ─── Dummy players shown in the scout feed ────────────────────────────────────
export const DEMO_FEED_PLAYERS: PlayerProfile[] = [
  {
    id: 'demo-feed-001',
    user_id: 'demo-feed-user-001',
    first_name: 'Jordan',
    last_name: 'Okafor',
    age: 19,
    nationality: 'Nigerian',
    gender: 'male',
    height_cm: 175,
    weight_kg: 70,
    preferred_foot: 'left',
    primary_position: 'RW',
    secondary_positions: ['LW', 'CAM'],
    current_club: 'Riverside Athletic',
    contract_status: 'available_now',
    league_level: 'Step 4',
    skill_level: 'High',
    is_verified: false,
    is_featured: true,
    profile_photo_url: null,
    highlight_reel_url: null,
    profile_completion_score: 65,
    appearances: 22,
    goals: 9,
    assists: 7,
    last_activity_at: new Date(Date.now() - 0).toISOString(), // today
  },
  {
    id: 'demo-feed-002',
    user_id: 'demo-feed-user-002',
    first_name: 'Tom',
    last_name: 'Bradley',
    age: 24,
    nationality: 'English',
    gender: 'male',
    height_cm: 188,
    weight_kg: 84,
    preferred_foot: 'right',
    primary_position: 'CB',
    secondary_positions: ['RB'],
    current_club: 'Millfield Town',
    contract_status: 'available_eot',
    league_level: 'Step 5',
    skill_level: 'Medium',
    is_verified: true,
    is_featured: false,
    profile_photo_url: null,
    highlight_reel_url: null,
    profile_completion_score: 82,
    appearances: 41,
    goals: 3,
    assists: 2,
    last_activity_at: new Date(Date.now() - 2 * 86_400_000).toISOString(), // 2 days ago
  },
  {
    id: 'demo-feed-003',
    user_id: 'demo-feed-user-003',
    first_name: 'Amara',
    last_name: 'Diallo',
    age: 21,
    nationality: 'French',
    gender: 'male',
    height_cm: 182,
    weight_kg: 78,
    preferred_foot: 'right',
    primary_position: 'ST',
    secondary_positions: ['CF'],
    current_club: 'Eastbrook FC',
    contract_status: 'available_now',
    league_level: 'Step 6',
    skill_level: 'High',
    is_verified: false,
    is_featured: false,
    profile_photo_url: null,
    highlight_reel_url: null,
    profile_completion_score: 71,
    appearances: 17,
    goals: 14,
    assists: 3,
    last_activity_at: new Date(Date.now() - 5 * 86_400_000).toISOString(), // this week
  },
]

// ─── Dummy endorsements for the demo player (Marcus Williams) ─────────────────
// Attribute IDs map to labels in the ENDORSEMENT_CATEGORIES constant (endorsements.tsx)

export const DEMO_ENDORSEMENTS: PlayerEndorsement[] = [
  // David Chen (scout_free) — 3 endorsements
  {
    id: 'demo-end-001',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-free',
    scout_name: 'David Chen',
    endorsement_id: 'Stamina',
    created_at: '2025-04-20T10:00:00Z',
  },
  {
    id: 'demo-end-002',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-free',
    scout_name: 'David Chen',
    endorsement_id: 'Composure',
    created_at: '2025-04-20T10:01:00Z',
  },
  {
    id: 'demo-end-003',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-free',
    scout_name: 'David Chen',
    endorsement_id: 'Passing',
    created_at: '2025-04-20T10:02:00Z',
  },
  // Sarah Mitchell (scout_pro) — 3 endorsements
  {
    id: 'demo-end-004',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-pro',
    scout_name: 'Sarah Mitchell',
    endorsement_id: 'Stamina',
    created_at: '2025-04-22T14:30:00Z',
  },
  {
    id: 'demo-end-005',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-pro',
    scout_name: 'Sarah Mitchell',
    endorsement_id: 'Passing',
    created_at: '2025-04-22T14:31:00Z',
  },
  {
    id: 'demo-end-006',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-pro',
    scout_name: 'Sarah Mitchell',
    endorsement_id: 'Reading the game',
    created_at: '2025-04-22T14:32:00Z',
  },
  // James Walker (third scout) — 2 endorsements
  {
    id: 'demo-end-007',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-3',
    scout_name: 'James Walker',
    endorsement_id: 'Composure',
    created_at: '2025-04-24T09:10:00Z',
  },
  {
    id: 'demo-end-008',
    player_id: 'demo-player-001',
    scout_user_id: 'demo-user-scout-3',
    scout_name: 'James Walker',
    endorsement_id: 'Leadership',
    created_at: '2025-04-24T09:11:00Z',
  },
]

/**
 * Build aggregated endorsement counts from a raw list.
 * `myScoutId` is used to flag which ones the current scout has already endorsed.
 */
export function aggregateEndorsements(
  endorsements: PlayerEndorsement[],
  myScoutId?: string,
): EndorsementCount[] {
  const map: Record<string, EndorsementCount> = {}
  for (const e of endorsements) {
    if (!map[e.endorsement_id]) {
      map[e.endorsement_id] = { endorsement_id: e.endorsement_id, count: 0, endorsed_by_me: false }
    }
    map[e.endorsement_id].count++
    if (myScoutId && e.scout_user_id === myScoutId) {
      map[e.endorsement_id].endorsed_by_me = true
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count)
}
