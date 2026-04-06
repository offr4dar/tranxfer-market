'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, ShieldCheck } from 'lucide-react'
import { AvailabilityBadge } from './AvailabilityBadge'
import { cn } from '@/lib/utils'
import { formatAge } from '@/lib/utils'

interface PlayerCardProps {
  player: {
    id: string
    display_name: string
    primary_position: string
    nationality?: string | null
    dob?: string | null
    current_club?: string | null
    league_level?: string | null
    contract_status: 'available_now' | 'available_end_of_season' | 'under_contract' | 'trial_period'
    profile_photo_url?: string | null
    is_featured?: boolean
    verified_status?: string
    profile_completion_score?: number
    stat_goals?: number
    stat_assists?: number
    stat_appearances?: number
    stat_clean_sheets?: number
    stat_season?: string | null
  }
  onAddToShortlist?: (playerId: string) => void
  className?: string
}

// Position badge colour map
const positionColors: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-400',
  CB: 'bg-blue-500/20 text-blue-400',
  RB: 'bg-blue-500/20 text-blue-400',
  LB: 'bg-blue-500/20 text-blue-400',
  RWB: 'bg-blue-500/20 text-blue-400',
  LWB: 'bg-blue-500/20 text-blue-400',
  CDM: 'bg-purple-500/20 text-purple-400',
  CM: 'bg-purple-500/20 text-purple-400',
  CAM: 'bg-orange-500/20 text-orange-400',
  RM: 'bg-orange-500/20 text-orange-400',
  LM: 'bg-orange-500/20 text-orange-400',
  RW: 'bg-red-500/20 text-red-400',
  LW: 'bg-red-500/20 text-red-400',
  SS: 'bg-red-500/20 text-red-400',
  CF: 'bg-red-500/20 text-red-400',
  ST: 'bg-red-500/20 text-red-400',
}

function getFlagEmoji(nationality: string) {
  // Simple country code to flag emoji conversion
  const flagMap: Record<string, string> = {
    'GB-ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'GB-SCT': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'GB-WLS': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'IE': '🇮🇪',
    'NG': '🇳🇬',
    'GH': '🇬🇭',
    'FR': '🇫🇷',
    'ES': '🇪🇸',
    'PT': '🇵🇹',
    'BR': '🇧🇷',
    'AR': '🇦🇷',
    'SN': '🇸🇳',
    'CM': '🇨🇲',
    'CI': '🇨🇮',
    'MA': '🇲🇦',
    'DE': '🇩🇪',
    'IT': '🇮🇹',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
    'PL': '🇵🇱',
  }
  return flagMap[nationality] ?? '🌍'
}

export function PlayerCard({ player, onAddToShortlist, className }: PlayerCardProps) {
  const age = player.dob ? formatAge(player.dob) : null
  const isGK = player.primary_position === 'GK'

  const keyStats = isGK
    ? [
        { label: 'CS', value: player.stat_clean_sheets ?? 0 },
        { label: 'Apps', value: player.stat_appearances ?? 0 },
      ]
    : [
        { label: 'Goals', value: player.stat_goals ?? 0 },
        { label: 'Assists', value: player.stat_assists ?? 0 },
        { label: 'Apps', value: player.stat_appearances ?? 0 },
      ]

  return (
    <div
      className={cn(
        'group glass-card rounded-2xl border border-white/5 hover-green overflow-hidden flex flex-col transition-all duration-300',
        player.is_featured && 'border-[#00FF87]/20 shadow-green-sm',
        className
      )}
    >
      {/* Featured ribbon */}
      {player.is_featured && (
        <div className="bg-[#00FF87]/10 border-b border-[#00FF87]/20 px-4 py-1.5 flex items-center gap-1.5">
          <Star className="w-3 h-3 text-[#00FF87] fill-[#00FF87]" />
          <span className="text-[#00FF87] text-xs font-semibold">Featured</span>
        </div>
      )}

      {/* Photo / Header */}
      <div className="relative h-44 bg-gradient-to-br from-white/5 to-white/0 overflow-hidden">
        {player.profile_photo_url ? (
          <Image
            src={player.profile_photo_url}
            alt={player.display_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-4xl font-bold">
              {player.display_name.charAt(0)}
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />

        {/* Position badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full',
              positionColors[player.primary_position] ?? 'bg-white/10 text-white/60'
            )}
          >
            {player.primary_position}
          </span>
        </div>

        {/* Verified badge */}
        {player.verified_status === 'verified' && (
          <div className="absolute top-3 right-3">
            <ShieldCheck className="w-5 h-5 text-[#00FF87]" />
          </div>
        )}

        {/* Name + nationality at bottom of photo */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base leading-tight">
              {player.display_name}
            </h3>
            {player.nationality && (
              <span className="text-lg">{getFlagEmoji(player.nationality)}</span>
            )}
          </div>
          {age && (
            <p className="text-white/50 text-xs mt-0.5">Age {age}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Club + League */}
        <div className="mb-3">
          <p className="text-white/70 text-sm font-medium truncate">
            {player.current_club ?? 'Free Agent'}
          </p>
          {player.league_level && (
            <p className="text-white/40 text-xs">{player.league_level}</p>
          )}
        </div>

        {/* Availability */}
        <div className="mb-4">
          <AvailabilityBadge status={player.contract_status} />
        </div>

        {/* Stats row */}
        {player.stat_appearances ? (
          <div className="flex items-center gap-4 mb-4">
            {keyStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="stat-number text-lg font-bold">{stat.value}</div>
                <div className="text-white/30 text-xs">{stat.label}</div>
              </div>
            ))}
            {player.stat_season && (
              <div className="ml-auto text-white/20 text-xs font-mono">{player.stat_season}</div>
            )}
          </div>
        ) : null}

        {/* Profile completion */}
        {player.profile_completion_score !== undefined && player.profile_completion_score < 100 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/30">Profile</span>
              <span className="stat-number">{player.profile_completion_score}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1">
              <div
                className="bg-[#00FF87] h-1 rounded-full"
                style={{ width: `${player.profile_completion_score}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/players/${player.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold py-2.5 hover:bg-white/10 hover:border-white/20 transition-all duration-150"
          >
            <Eye className="w-3.5 h-3.5" />
            View Profile
          </Link>

          {onAddToShortlist && (
            <button
              onClick={() => onAddToShortlist(player.id)}
              className="flex items-center justify-center w-10 h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-[#00FF87] hover:border-[#00FF87]/30 hover:bg-[#00FF87]/5 transition-all duration-150"
              title="Add to shortlist"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
