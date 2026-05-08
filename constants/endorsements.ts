// ─── Player Endorsement Definitions ──────────────────────────────────────────
// Scouts choose from these predefined traits when endorsing a player.
// id must be stable — it's stored in the DB.

export type EndorsementCategory = 'technical' | 'physical' | 'mental' | 'professional'

export interface EndorsementDef {
  id: string
  emoji: string
  label: string
  category: EndorsementCategory
  description: string
}

export const ENDORSEMENTS: EndorsementDef[] = [
  // ── Technical ──────────────────────────────────────────────────────────────
  {
    id: 'clinical_finisher',
    emoji: '🎯',
    label: 'Clinical Finisher',
    category: 'technical',
    description: 'Converts chances consistently',
  },
  {
    id: 'high_football_iq',
    emoji: '🧠',
    label: 'High Football IQ',
    category: 'technical',
    description: 'Reads the game exceptionally well',
  },
  {
    id: 'technical_dribbler',
    emoji: '🦶',
    label: 'Technical Dribbler',
    category: 'technical',
    description: 'Strong and effective in 1v1 situations',
  },
  {
    id: 'range_of_passing',
    emoji: '📡',
    label: 'Range of Passing',
    category: 'technical',
    description: 'Dictates play with excellent distribution',
  },
  {
    id: 'defensive_anchor',
    emoji: '🛡️',
    label: 'Defensive Anchor',
    category: 'technical',
    description: 'Dominant and reliable in defensive duties',
  },
  {
    id: 'two_footed',
    emoji: '⚖️',
    label: 'Two-Footed',
    category: 'technical',
    description: 'Equally effective on both feet',
  },
  {
    id: 'aerial_threat',
    emoji: '🧱',
    label: 'Aerial Threat',
    category: 'technical',
    description: 'Dominant in aerial duels',
  },
  {
    id: 'creative_playmaker',
    emoji: '🎭',
    label: 'Creative Playmaker',
    category: 'technical',
    description: 'Unlocks defences with vision and creativity',
  },

  // ── Physical ───────────────────────────────────────────────────────────────
  {
    id: 'explosive_pace',
    emoji: '⚡',
    label: 'Explosive Pace',
    category: 'physical',
    description: 'Exceptional speed and acceleration',
  },
  {
    id: 'physical_powerhouse',
    emoji: '💪',
    label: 'Physical Powerhouse',
    category: 'physical',
    description: 'Wins physical duels consistently',
  },
  {
    id: 'exceptional_stamina',
    emoji: '🏃',
    label: 'Exceptional Stamina',
    category: 'physical',
    description: 'Maintains intensity for the full 90 minutes',
  },

  // ── Mental ─────────────────────────────────────────────────────────────────
  {
    id: 'ice_cool',
    emoji: '🧊',
    label: 'Ice-Cool Under Pressure',
    category: 'mental',
    description: 'Performs at their best in big moments',
  },
  {
    id: 'natural_leader',
    emoji: '👑',
    label: 'Natural Leader',
    category: 'mental',
    description: 'Commands the dressing room and leads by example',
  },
  {
    id: 'quick_learner',
    emoji: '📈',
    label: 'Quick Learner',
    category: 'mental',
    description: 'Adapts to new tactics and systems rapidly',
  },
  {
    id: 'high_work_rate',
    emoji: '🔋',
    label: 'High Work Rate',
    category: 'mental',
    description: 'Presses relentlessly and never stops running',
  },
  {
    id: 'team_player',
    emoji: '🤝',
    label: 'Team Player',
    category: 'mental',
    description: 'Elevates those around them',
  },

  // ── Professional ───────────────────────────────────────────────────────────
  {
    id: 'injury_free',
    emoji: '🩺',
    label: 'Injury-Free Record',
    category: 'professional',
    description: 'Consistently available and rarely misses games',
  },
  {
    id: 'international_ready',
    emoji: '🌍',
    label: 'International Ready',
    category: 'professional',
    description: 'Quality and temperament for the next level',
  },
  {
    id: 'coachable',
    emoji: '📋',
    label: 'Coachable',
    category: 'professional',
    description: 'Responds positively to feedback and instruction',
  },
  {
    id: 'professional_attitude',
    emoji: '💼',
    label: 'Professional Attitude',
    category: 'professional',
    description: 'Exemplary conduct on and off the pitch',
  },
]

export const ENDORSEMENT_CATEGORIES: { key: EndorsementCategory; label: string }[] = [
  { key: 'technical',     label: 'Technical' },
  { key: 'physical',      label: 'Physical' },
  { key: 'mental',        label: 'Mental' },
  { key: 'professional',  label: 'Professional' },
]

export const MAX_ENDORSEMENTS_PER_SCOUT = 3

export function getEndorsementById(id: string): EndorsementDef | undefined {
  return ENDORSEMENTS.find(e => e.id === id)
}
