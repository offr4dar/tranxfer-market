import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { supabase } from '@/lib/supabase'
import { PlayerProfile } from '@/types'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'
import { DEMO_FEED_PLAYERS } from '@/lib/demoData'

const MASK = '*****'

// ─── Section title — matches the "VIDEO ——— +" pattern from the design ────────
function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  )
}

// ─── Stat chip (Age / Nationality) ────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  )
}

// ─── Stats row with left green border ─────────────────────────────────────────
function StatRow({ label, value, visible = false }: { label: string; value: string; visible?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, visible && styles.statValueVisible]}>{value}</Text>
    </View>
  )
}

// ─── FAB (floating action button) ─────────────────────────────────────────────
function FAB({ icon, onPress }: { icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      {icon}
    </TouchableOpacity>
  )
}

// ─── Find or create a conversation ────────────────────────────────────────────
async function findOrCreateConversation(userId1: string, userId2: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .contains('participant_ids', [userId1, userId2])
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('conversations')
    .insert({ participant_ids: [userId1, userId2] })
    .select('id')
    .single()

  return created?.id ?? null
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PlayerProfileScoutView() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { userId } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [player, setPlayer]           = useState<PlayerProfile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [shortlisted, setShortlisted] = useState(false)
  const [toggling, setToggling]       = useState(false)
  const [messaging, setMessaging]     = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { devRole } = useDevRole()
  const { isDemoMode } = useDevRole()

  const resolvedIsSubscribed = (isDemoMode || __DEV__) ? devRole === 'scout_subscribed' : isSubscribed

  useEffect(() => {
    if (devRole === 'player' && !isDemoMode) {
      router.replace('/profile')
      return
    }

    // Demo mode: match the tapped player from dummy data
    if (isDemoMode) {
      const match = DEMO_FEED_PLAYERS.find(p => p.id === id) ?? DEMO_FEED_PLAYERS[0]
      setPlayer(match)
      setShortlisted(false)
      setLoading(false)
      return
    }

    if (!id || !userId) return

    ;(async () => {
      const [{ data: p }, { data: wl }, { data: scout }] = await Promise.all([
        supabase
          .from('player_profiles')
          .select('id,user_id,first_name,last_name,age,nationality,gender,height_cm,weight_kg,preferred_foot,primary_position,secondary_positions,league_level,skill_level,is_verified,profile_photo_url,highlight_reel_url')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('watchlist_items')
          .select('id')
          .eq('scout_id', userId)
          .eq('player_id', id)
          .maybeSingle(),
        supabase
          .from('scout_profiles')
          .select('subscription_tier')
          .eq('user_id', userId)
          .maybeSingle(),
      ])

      if (p) setPlayer(p as PlayerProfile)
      setShortlisted(!!wl)
      if (scout) {
        setIsSubscribed(scout.subscription_tier !== 'free' && scout.subscription_tier != null)
      }
      setLoading(false)
    })()
  }, [id, userId])

  const toggleShortlist = async () => {
    // In demo mode, just toggle local state — no DB writes
    if (isDemoMode) {
      setShortlisted(v => !v)
      return
    }
    if (!userId || !id || toggling) return
    setToggling(true)
    if (shortlisted) {
      await supabase.from('watchlist_items').delete().eq('scout_id', userId).eq('player_id', id)
      setShortlisted(false)
    } else {
      await supabase.from('watchlist_items').insert({ scout_id: userId, player_id: id })
      setShortlisted(true)
    }
    setToggling(false)
  }

  const handleMessage = async () => {
    if (!userId || !player?.user_id || messaging) return
    setMessaging(true)
    const convId = await findOrCreateConversation(userId, player.user_id)
    setMessaging(false)
    if (convId) router.push(`/(tabs)/conversation/${convId}` as any)
  }

  if (loading) {
    return (
      <ScreenBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      </ScreenBackground>
    )
  }

  if (!player) {
    return (
      <ScreenBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <Text style={styles.notFound}>Player not found.</Text>
        </View>
      </ScreenBackground>
    )
  }

  const maskedFirst = resolvedIsSubscribed 
    ? (player.first_name ?? '').toUpperCase()
    : ((player.first_name?.[0] ?? '?').toUpperCase() + '.')
  const maskedLast  = resolvedIsSubscribed
    ? (player.last_name ?? '').toUpperCase()
    : '*'.repeat((player.last_name ?? 'PLAYER').length)
  const gender      = player.gender ?? 'unknown'
  const initials    = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('').toUpperCase()

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
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarWrap, !resolvedIsSubscribed && styles.avatarRedacted]}>
            {(player.profile_photo_url && resolvedIsSubscribed) ? (
              <Image source={{ uri: player.profile_photo_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{resolvedIsSubscribed ? initials : '?'}</Text>
              </View>
            )}
            {player.is_verified && resolvedIsSubscribed && (
              <View style={styles.verifiedBadge}>
                <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <Path d="M2 6l2.5 2.5L10 3.5" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            )}
          </View>
          <Text style={styles.firstName}>{maskedFirst}</Text>
          <Text style={styles.lastName}>{maskedLast}</Text>
        </View>

        {/* ── Age / Nationality ── */}
        <View style={styles.chipRow}>
          <StatChip label="AGE" value={resolvedIsSubscribed ? `${player.age ?? '**'} YRS` : "** YRS"} />
          <View style={[styles.chip, styles.chipFlex]}>
            <Text style={styles.chipLabel}>NATIONALITY</Text>
            <Text style={styles.chipValue}>{resolvedIsSubscribed ? (player.nationality ?? 'UNKNOWN') : MASK}</Text>
          </View>
        </View>

        {/* ── Attributes strip ── */}
        <View style={styles.attributeBlock}>
          <View style={styles.attributeStrip}>
            <StatRow label="GENDER"         value={gender.toUpperCase()} visible />
            <StatRow label="HEIGHT"         value={resolvedIsSubscribed ? `${player.height_cm ?? '--'} CM` : MASK} />
            <StatRow label="WEIGHT"         value={resolvedIsSubscribed ? `${player.weight_kg ?? '--'} KG` : MASK} />
            <StatRow label="PREFERRED FOOT" value={resolvedIsSubscribed ? (player.preferred_foot ?? '--') : MASK} />
            <StatRow label="POSITIONS"      value={resolvedIsSubscribed ? (player.primary_position ?? '--') : MASK} />
          </View>
        </View>

        {/* ── Player level card ── */}
        <View style={styles.levelCard}>
          <Image
            source={require('@/assets/player-level.png')}
            style={styles.levelImage}
            resizeMode="contain"
          />
          <View style={styles.levelText}>
            <Text style={styles.levelHeading}>
              {resolvedIsSubscribed
                ? (player.league_level ?? 'NON-LEAGUE').replace(/_/g, ' ').toUpperCase() + '\nLEVEL'
                : '*****\nLEVEL'}
            </Text>
            <Text style={styles.levelDesc}>
              {'This player has described themselves as '}
              <Text style={styles.levelDescBold}>
                {resolvedIsSubscribed ? (player.skill_level ?? 'mid-level skill') : '*****'}
              </Text>
            </Text>
          </View>
        </View>

        {/* ── Video ── */}
        <SectionTitle label="VIDEO" />
        <View style={styles.videoBox}>
          {!resolvedIsSubscribed ? (
            <>
              <Text style={styles.proFeatureText}>This is a PRO feature.</Text>
              <View style={styles.playBtnOverlay} pointerEvents="none">
                <View style={styles.playBtn}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 3l14 9-14 9V3z" fill="rgba(255,255,255,0.9)" />
                  </Svg>
                </View>
              </View>
            </>
          ) : (
            player.highlight_reel_url ? (
              <Text style={styles.proFeatureText}>Video Player would be here (URL: {player.highlight_reel_url})</Text>
            ) : (
              <Text style={styles.proFeatureText}>No video uploaded by player.</Text>
            )
          )}
        </View>

        {/* ── Performance tracker ── */}
        <SectionTitle label="PERFORMANCE TRACKER" />
        <Text style={styles.consentNote}>
          Please note that the player has consented that the entries are a true reflection of their activity.
        </Text>

        <View style={styles.logChipRow}>
          <View style={styles.logChip}>
            <Text style={styles.logChipValue}>{resolvedIsSubscribed ? '0' : MASK}</Text>
            <Text style={styles.logChipLabel}>PERFORMANCE LOG ENTRIES</Text>
          </View>
          <View style={styles.logChip}>
            <Text style={styles.logChipValue}>{resolvedIsSubscribed ? '0' : MASK}</Text>
            <Text style={styles.logChipLabel}>ADDED THIS WEEK</Text>
          </View>
        </View>

        <View style={styles.viewEntriesWrap}>
          <TouchableOpacity 
            style={[styles.viewEntriesBtn, !resolvedIsSubscribed && styles.viewEntriesBtnDisabled]}
            disabled={!resolvedIsSubscribed}
            onPress={() => router.push(`/player/performance/${player.id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewEntriesBtnText}>VIEW ENTRIES</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Floating action buttons ── */}
      <View style={[styles.fabStack, { bottom: insets.bottom + 24 }]}>
        <FAB
          onPress={handleMessage}
          icon={
            messaging
              ? <ActivityIndicator color="#000" size="small" />
              : (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )
          }
        />
        <FAB
          onPress={toggleShortlist}
          icon={
            toggling
              ? <ActivityIndicator color="#000" size="small" />
              : (
                <Svg width={20} height={22} viewBox="0 0 20 24" fill="none">
                  <Path
                    d="M3 3h14a1 1 0 0 1 1 1v16l-8-4-8 4V4a1 1 0 0 1 1-1z"
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={shortlisted ? '#000' : 'none'}
                  />
                </Svg>
              )
          }
        />
      </View>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: Colors.textSecondary, fontSize: 16 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 0,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  avatarRedacted: {
    opacity: 0.5,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Anton_400Regular',
    fontSize: 32,
    color: Colors.brand,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lastName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 52,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 60,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chip: {
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 15,
    gap: 8,
    width: 95,
  },
  chipFlex: {
    flex: 1,
    width: undefined,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Attribute strip ───────────────────────────────────────────────────────
  attributeBlock: {
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  attributeStrip: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    paddingLeft: Spacing.lg,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 130,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueVisible: {
    color: Colors.brand,
  },

  // ── Player level card ─────────────────────────────────────────────────────
  levelCard: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  levelImage: {
    width: 110,
    height: 96,
  },
  levelText: {
    flex: 1,
    gap: 10,
  },
  levelHeading: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: '#000',
    textTransform: 'uppercase',
    lineHeight: 32,
  },
  levelDesc: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  levelDescBold: {
    fontWeight: '700',
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitleText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.text,
  },

  // ── Video ─────────────────────────────────────────────────────────────────
  videoBox: {
    height: 175,
    backgroundColor: '#151515',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  proFeatureText: {
    color: Colors.text,
    fontSize: 12,
    letterSpacing: 0.24,
  },
  playBtnOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  playBtn: {
    width: 67,
    height: 67,
    borderRadius: 33.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Performance tracker ───────────────────────────────────────────────────
  consentNote: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  logChipRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  logChip: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 15,
    gap: 8,
  },
  logChipValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 33,
    color: Colors.text,
    textTransform: 'uppercase',
  },
  logChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewEntriesWrap: {
    marginBottom: Spacing.lg,
  },
  viewEntriesBtn: {
    height: 52,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.31)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewEntriesBtnDisabled: {
    opacity: 0.2,
  },
  viewEntriesBtnText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── FABs ─────────────────────────────────────────────────────────────────
  fabStack: {
    position: 'absolute',
    right: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  fab: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
})
