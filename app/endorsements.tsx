import { useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'
import { DEMO_ENDORSEMENTS } from '@/lib/demoData'

// ─── Category definitions (must match endorse.tsx) ────────────────────────────

const ENDORSEMENT_CATEGORIES = [
  {
    id: 'physical',
    label: 'Physical Ability',
    description:
      'Players must be robust enough to handle high-intensity, heavy-contact matches, often on pitches that are less than pristine.',
    attributes: ['Stamina', 'Strength', 'Pace', 'Acceleration', 'Agility', 'Leap', 'Robustness'],
  },
  {
    id: 'mentality',
    label: 'Mentality',
    description:
      "At the semi-professional and amateur levels, a player's mindset is often what separates them from the rest of the pack.",
    attributes: ['Work rate off the ball', 'Bravery', 'Ball recovery', 'Resilience', 'Composure', 'Leadership'],
  },
  {
    id: 'technical',
    label: 'Technical',
    description:
      'These are the fundamental on-the-ball skills. In non-league, doing the basics consistently well is often valued over flashy, inconsistent skills.',
    attributes: ['First touch', 'Passing', 'Tackling', 'Heading', 'Delivery/Crossing', 'Finishing', 'Ball retention'],
  },
  {
    id: 'tactical',
    label: 'Tactical',
    description: 'This is the "football brain" or intelligence of the player.',
    attributes: ['Positioning', 'Reading the game', 'Decision-making', 'Movement', 'Transitioning'],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Endorser {
  scout_user_id: string
  scout_name: string
}

// ─── Overlapping avatar cluster ───────────────────────────────────────────────

const AVATAR_SIZE  = 43
const AVATAR_OVERLAP = 11
const AVATAR_COLORS = ['#2D6A4F', '#1B4F72', '#6C3483']
const AVATAR_TEXT_COLORS = ['#52D48F', '#5DADE2', '#C39BD3']

function AvatarCluster({ endorsers }: { endorsers: Endorser[] }) {
  const shown = endorsers.slice(0, 3)
  const total = AVATAR_SIZE + (shown.length - 1) * (AVATAR_SIZE - AVATAR_OVERLAP)

  return (
    <View style={[styles.avatarCluster, { width: total }]}>
      {shown.map((e, i) => {
        const initials = e.scout_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        return (
          <View
            key={e.scout_user_id}
            style={[
              styles.avatarCircle,
              {
                left: i * (AVATAR_SIZE - AVATAR_OVERLAP),
                zIndex: shown.length - i,
                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                borderColor: '#1A1A1A',
              },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: AVATAR_TEXT_COLORS[i % AVATAR_TEXT_COLORS.length] }]}>
              {initials}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EndorsementsScreen() {
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const { devRole, isDemoMode } = useDevRole()

  const isPlayerView = devRole === 'player'

  // In demo mode use mock data; production will query Supabase
  const rawEndorsements = isDemoMode ? DEMO_ENDORSEMENTS : []

  // ── Aggregate counts per attribute ──────────────────────────────────────────
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of rawEndorsements) {
      map[e.endorsement_id] = (map[e.endorsement_id] ?? 0) + 1
    }
    return map
  }, [rawEndorsements])

  // ── Unique endorsers (up to 3 for avatar cluster) ───────────────────────────
  const endorsers = useMemo((): Endorser[] => {
    const seen = new Set<string>()
    const out: Endorser[] = []
    for (const e of rawEndorsements) {
      if (!seen.has(e.scout_user_id)) {
        seen.add(e.scout_user_id)
        out.push({ scout_user_id: e.scout_user_id, scout_name: e.scout_name })
      }
    }
    return out
  }, [rawEndorsements])

  // ── Build categories that have at least one endorsed attribute ──────────────
  const activeCategories = useMemo(() =>
    ENDORSEMENT_CATEGORIES
      .map(cat => ({
        ...cat,
        pills: cat.attributes
          .filter(a => (counts[a] ?? 0) > 0)
          .map(a => ({ label: a, count: counts[a] })),
      }))
      .filter(cat => cat.pills.length > 0),
  [counts])

  const totalEndorsements = rawEndorsements.length

  // ── Endorser sentence ───────────────────────────────────────────────────────
  const endorserSentence = useMemo(() => {
    if (endorsers.length === 0) return null
    if (!isPlayerView) {
      return `This player was endorsed by ${endorsers.length} ${endorsers.length === 1 ? 'person' : 'people'}`
    }
    // Player view — show first names
    const firstName = (name: string) => name.split(' ')[0]
    if (endorsers.length === 1) return `${firstName(endorsers[0].scout_name)} endorsed you`
    if (endorsers.length === 2) {
      return `${firstName(endorsers[0].scout_name)}, ${firstName(endorsers[1].scout_name)} endorsed you`
    }
    return `${firstName(endorsers[0].scout_name)}, ${firstName(endorsers[1].scout_name)} and ${endorsers.length - 2} other${endorsers.length - 2 > 1 ? 's' : ''} endorsed you`
  }, [endorsers, isPlayerView])

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Endorsements</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {totalEndorsements === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No endorsements yet</Text>
            <Text style={styles.emptyDesc}>
              {isPlayerView
                ? "You haven't received any endorsements yet. As scouts view and assess your profile, their endorsements will appear here."
                : 'This player does not yet have any endorsements.'}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Intro paragraph ──────────────────────────────────── */}
            <Text style={styles.intro}>
              {isPlayerView
                ? "These are the endorsements scouts have left on your profile. Each attribute is a direct signal of how professionals in the game rate your ability — the more endorsements you earn, the stronger your credibility to clubs and agents looking at your page."
                : "Endorsements are given by scouts who have reviewed this player's performance. Each attribute below reflects how many scouts have endorsed this player in that area."}
            </Text>

            {/* ── Endorser credit row ──────────────────────────────────────── */}
            {endorsers.length > 0 && (
              <View style={styles.endorserRow}>
                <AvatarCluster endorsers={endorsers} />
                <Text style={styles.endorserSentence}>{endorserSentence}</Text>
              </View>
            )}

            {/* ── Categories ─────────────────────────────────────────────── */}
            {activeCategories.map(cat => (
              <View key={cat.id} style={styles.categoryBlock}>
                {/* Title row */}
                <View style={styles.titleRow}>
                  <Text style={styles.categoryTitle}>{cat.label.toUpperCase()}</Text>
                  <View style={styles.titleLine} />
                </View>

                {/* Description */}
                <Text style={styles.categoryDesc}>{cat.description}</Text>

                {/* Wrapping pill grid */}
                <View style={styles.pillWrap}>
                  {cat.pills.map(pill => (
                    <View key={pill.label} style={styles.pill}>
                      <Text style={styles.pillText}>{pill.label}</Text>
                      <View style={styles.pillCountBadge}>
                        <Text style={styles.pillCountText}>{pill.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* ── Back to profile link ─────────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>← Back to profile</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: { width: 36 },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 0,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Intro ──────────────────────────────────────────────────────────────────
  intro: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    letterSpacing: 0.2,
  },

  // ── Endorser credit ────────────────────────────────────────────────────────
  endorserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatarCluster: {
    height: AVATAR_SIZE,
    position: 'relative',
    flexShrink: 0,
  },
  avatarCircle: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  endorserSentence: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Category ───────────────────────────────────────────────────────────────
  categoryBlock: {
    paddingTop: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.text,
  },
  categoryDesc: {
    fontSize: 14,
    color: '#8A8A8A',
    lineHeight: 20,
  },

  // ── Pills (wrapping) ───────────────────────────────────────────────────────
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  pillCountBadge: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pillCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.2,
  },

  // ── Back link ──────────────────────────────────────────────────────────────
  backLink: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.32,
  },
})
