import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { PlayerProfile, ContractStatus } from '@/types'

function activityLabel(dateStr: string | null | undefined): { text: string; color: string } | null {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return { text: 'Active today',        color: '#00FF87' }
  if (days <= 7)  return { text: `Active ${days}d ago`, color: '#00FF87' }
  if (days <= 30) return { text: `Active ${Math.ceil(days / 7)}w ago`, color: '#C49B1E' }
  return null
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  available_now: {
    label: 'AVAILABLE',
    bg: '#00FF87',
    text: '#000000',
  },
  available_eot: {
    label: 'AVAILABLE EOT',
    bg: '#C49B1E',
    text: '#000000',
  },
  under_contract: {
    label: 'UNDER CONTRACT',
    bg: 'rgba(255,255,255,0.07)',
    text: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.15)',
  },
  trial: {
    label: 'ON TRIAL',
    bg: 'rgba(110,140,255,0.15)',
    text: '#8AABFF',
    border: 'rgba(110,140,255,0.3)',
  },
}

interface Props {
  player: PlayerProfile
  onPress?: () => void
  scoutId?: string
  isShortlisted?: boolean
  isSubscribed?: boolean
}

export default function PlayerCard({ player, onPress, scoutId, isShortlisted = false, isSubscribed = true }: Props) {
  const [shortlisted, setShortlisted] = useState(isShortlisted)
  const [toggling, setToggling] = useState(false)

  const isScout  = !!scoutId
  const activity = activityLabel(player.last_activity_at)

  // Redact identity for unsubscribed scouts
  const displayFirstName = isScout && !isSubscribed
    ? player.first_name?.[0] ?? ''
    : player.first_name ?? ''
  const displayLastName = player.last_name ?? ''
  const displayClub = isScout && !isSubscribed ? null : player.current_club

  const initials = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('')
  const status = player.contract_status ?? 'under_contract'
  const cfg = STATUS[status] ?? STATUS.under_contract

  const parts = [
    player.primary_position,
    player.age ? `${player.age}YRS` : null,
    player.nationality?.toUpperCase(),
  ].filter(Boolean)
  const meta = parts.join(' · ')

  const toggleShortlist = async () => {
    if (!scoutId || toggling) return
    setToggling(true)
    if (shortlisted) {
      await supabase
        .from('watchlist_items')
        .delete()
        .eq('scout_id', scoutId)
        .eq('player_id', player.id)
      setShortlisted(false)
    } else {
      await supabase
        .from('watchlist_items')
        .insert({ scout_id: scoutId, player_id: player.id })
      setShortlisted(true)
    }
    setToggling(false)
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar — absolutely positioned */}
      <View style={[styles.avatar, isScout && !isSubscribed && styles.avatarRedacted]}>
        {isScout && !isSubscribed ? (
          <Text style={styles.initialsRedacted}>?</Text>
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
        {player.is_verified && isSubscribed && (
          <View style={styles.verifiedDot}>
            <Text style={styles.verifiedTick}>✓</Text>
          </View>
        )}
      </View>

      {/* ── Name + info ── */}
      <View style={styles.bottomBlock}>
        <View style={styles.nameBlock}>
          <Text style={styles.firstName} numberOfLines={1}>
            {isScout && !isSubscribed
              ? `${displayFirstName.toUpperCase()}.`
              : displayFirstName.toUpperCase()}
          </Text>
          <Text style={styles.lastName} numberOfLines={1}>
            {isScout && !isSubscribed
              ? '*'.repeat(displayLastName.length)
              : displayLastName.toUpperCase()}
          </Text>
        </View>

        {/* Status badge row + club */}
        <View style={styles.infoRow}>
          <View style={[
            styles.badge,
            { backgroundColor: cfg.bg },
            cfg.border ? { borderWidth: 1, borderColor: cfg.border } : null,
          ]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>
              {cfg.label}
            </Text>
          </View>
          {displayClub ? (
            <Text style={styles.club} numberOfLines={1}>{displayClub.toUpperCase()}</Text>
          ) : null}
        </View>

        {/* Meta + shortlist */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            {activity && (
              <View style={[styles.activityPill, { borderColor: activity.color }]}>
                <Text style={[styles.activityText, { color: activity.color }]}>{activity.text}</Text>
              </View>
            )}
          </View>
          {isScout && (
            <TouchableOpacity
              onPress={toggleShortlist}
              disabled={toggling}
              activeOpacity={0.65}
              style={[styles.shortlistBtn, shortlisted && styles.shortlistBtnActive]}
            >
              <Text style={[styles.shortlist, shortlisted && styles.shortlistActive]}>
                {shortlisted ? '✓ SHORTLISTED' : 'SHORTLIST'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const CARD_BG = '#111810'
const BRAND = '#00FF87'

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 8,
  },

  avatar: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,255,135,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRedacted: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  initials: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: BRAND,
    letterSpacing: 1,
  },
  initialsRedacted: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTick: { fontSize: 10, fontWeight: '800', color: '#000' },

  bottomBlock: { gap: 8 },
  nameBlock: { gap: -4 },
  firstName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  lastName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 40,
    color: '#ffffff',
    letterSpacing: 0.5,
    lineHeight: 52,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  club: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: 'right',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    flex: 1,
    gap: 6,
  },
  meta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  activityPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shortlistBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shortlistBtnActive: {
    borderColor: BRAND,
    backgroundColor: 'rgba(0,255,135,0.1)',
  },
  shortlist: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  shortlistActive: {
    color: BRAND,
  },
})
