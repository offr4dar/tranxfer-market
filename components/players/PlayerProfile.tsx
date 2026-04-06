import Image from 'next/image'
import { ShieldCheck, MapPin, Ruler, Weight, Calendar, Star, Play } from 'lucide-react'
import { AvailabilityBadge } from './AvailabilityBadge'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { SubscriptionGate } from '@/components/shared/SubscriptionGate'
import { formatAge, formatDate } from '@/lib/utils'

interface CareerEntry {
  id: string
  club_name: string
  league_level?: string
  season_from?: string
  season_to?: string
  appearances?: number
  goals?: number
  assists?: number
  is_current?: boolean
}

interface PlayerProfileProps {
  player: {
    id: string
    display_name: string
    dob?: string | null
    nationality?: string | null
    second_nationality?: string | null
    height_cm?: number | null
    weight_kg?: number | null
    preferred_foot?: string | null
    primary_position: string
    secondary_positions?: string[]
    current_club?: string | null
    league_level?: string | null
    contract_status: 'available_now' | 'available_end_of_season' | 'under_contract' | 'trial_period'
    available_from_date?: string | null
    profile_photo_url?: string | null
    highlight_reel_url?: string | null
    is_featured?: boolean
    verified_status?: string
    profile_completion_score?: number
    bio?: string | null
    stat_goals?: number
    stat_assists?: number
    stat_appearances?: number
    stat_clean_sheets?: number
    stat_yellow_cards?: number
    stat_red_cards?: number
    stat_minutes_played?: number
    stat_season?: string | null
    has_agent?: boolean
    agent_name?: string | null
    agent_contact?: string | null
    player_career_history?: CareerEntry[]
  }
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
      <div className="stat-number text-2xl font-bold mb-1">{value}</div>
      <div className="text-white/40 text-xs">{label}</div>
    </div>
  )
}

export function PlayerProfile({ player }: PlayerProfileProps) {
  const age = player.dob ? formatAge(player.dob) : null

  const physicalStats = [
    player.height_cm ? { label: 'Height', value: `${player.height_cm}cm`, icon: Ruler } : null,
    player.weight_kg ? { label: 'Weight', value: `${player.weight_kg}kg`, icon: Weight } : null,
    player.preferred_foot ? { label: 'Foot', value: player.preferred_foot, icon: null } : null,
  ].filter(Boolean)

  const seasonStats = player.primary_position === 'GK'
    ? [
        { label: 'Clean Sheets', value: player.stat_clean_sheets ?? 0 },
        { label: 'Appearances', value: player.stat_appearances ?? 0 },
        { label: 'Minutes', value: player.stat_minutes_played ?? 0 },
        { label: 'Yellow Cards', value: player.stat_yellow_cards ?? 0 },
        { label: 'Red Cards', value: player.stat_red_cards ?? 0 },
      ]
    : [
        { label: 'Goals', value: player.stat_goals ?? 0 },
        { label: 'Assists', value: player.stat_assists ?? 0 },
        { label: 'Appearances', value: player.stat_appearances ?? 0 },
        { label: 'Minutes', value: player.stat_minutes_played ?? 0 },
        { label: 'Yellow Cards', value: player.stat_yellow_cards ?? 0 },
        { label: 'Red Cards', value: player.stat_red_cards ?? 0 },
      ]

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {/* Banner / photo */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[#101A2E] to-[#0A0F1E]">
          {player.profile_photo_url && (
            <Image
              src={player.profile_photo_url}
              alt={player.display_name}
              fill
              className="object-cover object-top opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
          {player.is_featured && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#00FF87]/20 border border-[#00FF87]/40 rounded-full px-3 py-1">
              <Star className="w-3 h-3 text-[#00FF87] fill-[#00FF87]" />
              <span className="text-[#00FF87] text-xs font-semibold">Featured</span>
            </div>
          )}
        </div>

        {/* Profile info */}
        <div className="p-6 -mt-6 relative">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-[#162035] border-4 border-[#0A0F1E] overflow-hidden mb-4">
            {player.profile_photo_url ? (
              <Image
                src={player.profile_photo_url}
                alt={player.display_name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-3xl">
                {player.display_name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{player.display_name}</h1>
                {player.verified_status === 'verified' && <VerifiedBadge />}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/50">
                <span className="font-mono text-[#00FF87] font-semibold">
                  {player.primary_position}
                </span>
                {player.secondary_positions && player.secondary_positions.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{player.secondary_positions.join(', ')}</span>
                  </>
                )}
                {age && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Age {age}
                    </span>
                  </>
                )}
                {player.nationality && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {player.nationality}
                    </span>
                  </>
                )}
              </div>
              {player.current_club && (
                <p className="text-white/60 text-sm mt-1">
                  {player.current_club}
                  {player.league_level && (
                    <span className="text-white/30"> · {player.league_level}</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <AvailabilityBadge status={player.contract_status} />
              {player.available_from_date && player.contract_status !== 'available_now' && (
                <p className="text-white/30 text-xs">
                  From {formatDate(player.available_from_date)}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {player.bio && (
            <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-2xl">
              {player.bio}
            </p>
          )}
        </div>
      </div>

      {/* Physical attributes */}
      {physicalStats.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold mb-4">Physical</h2>
          <div className="flex flex-wrap gap-4">
            {physicalStats.map((s) => s && (
              <div key={s.label} className="flex items-center gap-2">
                {s.icon && <s.icon className="w-4 h-4 text-white/40" />}
                <span className="text-white text-sm font-medium">{s.value}</span>
                <span className="text-white/30 text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season stats */}
      {player.stat_appearances ? (
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Season Stats</h2>
            {player.stat_season && (
              <span className="font-mono text-white/30 text-sm">{player.stat_season}</span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {seasonStats.map((stat) => (
              <StatBox key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Highlight reel */}
      {player.highlight_reel_url && (
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold mb-4">Highlight Reel</h2>
          <a
            href={player.highlight_reel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#00FF87]/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00FF87]/10 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-[#00FF87]" />
            </div>
            <div>
              <p className="text-white text-sm font-medium group-hover:text-[#00FF87] transition-colors">
                Watch Highlight Reel
              </p>
              <p className="text-white/30 text-xs truncate max-w-xs">{player.highlight_reel_url}</p>
            </div>
          </a>
        </div>
      )}

      {/* Career history */}
      {player.player_career_history && player.player_career_history.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <h2 className="text-white font-semibold mb-4">Career History</h2>
          <div className="space-y-3">
            {player.player_career_history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-[#00FF87] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{entry.club_name}</p>
                  {entry.league_level && (
                    <p className="text-white/40 text-xs">{entry.league_level}</p>
                  )}
                </div>
                <div className="text-right text-xs text-white/30 shrink-0">
                  {entry.season_from}
                  {entry.season_to ? ` – ${entry.season_to}` : ' – Present'}
                </div>
                {entry.goals !== undefined && (
                  <div className="text-right text-xs text-white/40 shrink-0 hidden sm:block">
                    <span className="font-mono">{entry.goals}G {entry.assists}A</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent info — gated by subscription */}
      {player.has_agent && (
        <SubscriptionGate
          fallback={
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-white font-semibold mb-2">Agent Information</h2>
              <p className="text-white/40 text-sm">
                Upgrade to Pro or Elite to view agent contact details.
              </p>
              <a
                href="/#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-4 py-2 text-sm font-semibold mt-3 hover:bg-[#00CC6A] transition-colors"
              >
                View Plans
              </a>
            </div>
          }
        >
          <div className="glass-card p-6 rounded-2xl border border-white/5">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00FF87]" />
              Agent Information
            </h2>
            {player.agent_name && (
              <p className="text-white text-sm mb-1">
                <span className="text-white/40">Agent: </span>
                {player.agent_name}
              </p>
            )}
            {player.agent_contact && (
              <p className="text-white text-sm">
                <span className="text-white/40">Contact: </span>
                {player.agent_contact}
              </p>
            )}
          </div>
        </SubscriptionGate>
      )}
    </div>
  )
}
