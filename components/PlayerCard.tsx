import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export type ContractStatus =
  | 'available_now' | 'available_eot' | 'under_contract' | 'trial' | null | undefined

export interface PlayerProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  primary_position?: string | null
  secondary_positions?: string[] | null
  age?: number | null
  current_club?: string | null
  contract_status?: ContractStatus
  nationality?: string | null
  is_verified?: boolean
  is_featured?: boolean
  appearances?: number
  goals?: number
  assists?: number
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  available_now: {
    label: 'AVAILABLE',
    bg:    '#00FF87',
    text:  '#000000',
  },
  available_eot: {
    label: 'AVAILABLE EOT',
    bg:    '#C49B1E',
    text:  '#000000',
  },
  under_contract: {
    label:  'UNDER CONTRACT',
    bg:     'rgba(255,255,255,0.07)',
    text:   'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.15)',
  },
  trial: {
    label: 'ON TRIAL',
    bg:    'rgba(110,140,255,0.15)',
    text:  '#8AABFF',
    border:'rgba(110,140,255,0.3)',
  },
}

interface Props {
  player: PlayerProfile
  onPress?: () => void
}

export default function PlayerCard({ player, onPress }: Props) {
  const initials = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('')
  const status   = player.contract_status ?? 'under_contract'
  const cfg      = STATUS[status] ?? STATUS.under_contract

  // Meta: "CB · 22YRS · ENGLAND"
  const parts = [
    player.primary_position,
    player.age ? `${player.age}YRS` : null,
    player.nationality?.toUpperCase(),
  ].filter(Boolean)
  const meta = parts.join(' · ')

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ── Top: avatar floated right ── */}
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
          {player.is_verified && (
            <View style={styles.verifiedDot}>
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Bottom: name + info ── */}
      <View style={styles.bottomBlock}>
        {/* Player name — two lines, Anton font */}
        <View style={styles.nameBlock}>
          <Text style={styles.firstName} numberOfLines={1}>
            {player.first_name.toUpperCase()}
          </Text>
          <Text style={styles.lastName} numberOfLines={1}>
            {player.last_name.toUpperCase()}
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
          {player.current_club ? (
            <Text style={styles.club} numberOfLines={1}>{player.current_club.toUpperCase()}</Text>
          ) : null}
        </View>

        {/* Meta + shortlist */}
        {meta ? (
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{meta}</Text>
            <TouchableOpacity activeOpacity={0.65}>
              <Text style={styles.shortlist}>SHORTLIST</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const CARD_BG = '#111810'
const BRAND   = '#00FF87'

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },

  // Top row — avatar on right, space on left
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spacer: { flex: 1 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,255,135,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: BRAND,
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

  // Name block
  bottomBlock: { gap: 8 },
  nameBlock:   { gap: -4 },
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

  // Status + club row
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

  // Meta + shortlist
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  shortlist: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
})
