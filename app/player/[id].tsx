import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Animated, Pressable,
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
import { DEMO_FEED_PLAYERS, DEMO_SCOUT_FREE_PROFILE, DEMO_SCOUT_PRO_PROFILE, DEMO_ENDORSEMENTS } from '@/lib/demoData'

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
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
      ]}
      onPress={onPress}
    >
      {icon}
    </Pressable>
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

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toastAnim   = useRef(new Animated.Value(0)).current  // 0=hidden, 1=visible
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (message: string) => {
    setToastMsg(message)
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()
  }

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
      const next = !shortlisted
      setShortlisted(next)
      showToast(next ? '\u2713  Added to tracker' : 'Removed from tracker')
      return
    }
    if (!userId || !id || toggling) return
    setToggling(true)
    if (shortlisted) {
      await supabase.from('watchlist_items').delete().eq('scout_id', userId).eq('player_id', id)
      setShortlisted(false)
      showToast('Removed from tracker')
    } else {
      await supabase.from('watchlist_items').insert({ scout_id: userId, player_id: id })
      setShortlisted(true)
      showToast('\u2713  Added to tracker')
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

      {/* ── Top toast ── */}
      <Animated.View
        style={[
          styles.toast,
          { top: insets.top + 60 },
          {
            opacity: toastAnim,
            transform: [{
              translateY: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.heroSection}>
          {/* Name block — fills available space */}
          <View style={styles.heroNameBlock}>
            <Text style={styles.firstName}>{maskedFirst}</Text>
            <Text style={styles.lastName}>{maskedLast}</Text>
          </View>
          {/* Avatar — floats right */}
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
        </View>

        {/* ── Age / Nationality ── */}
        <View style={styles.chipRow}>
          <StatChip label="AGE" value={resolvedIsSubscribed ? `${player.age ?? '**'} YRS` : "** YRS"} />
          <View style={[styles.chip, styles.chipFlex]}>
            <Text style={styles.chipLabel}>NATIONALITY</Text>
            <Text style={styles.chipValue}>{resolvedIsSubscribed ? (player.nationality ?? 'UNKNOWN') : MASK}</Text>
          </View>
        </View>

        {/* ── Endorsements ── */}
        {(() => {
          const uniqueEndorsers = isDemoMode
            ? new Set(DEMO_ENDORSEMENTS.map(e => e.scout_user_id)).size
            : 0  // TODO: fetch from DB
          return (
            <View style={styles.endorseCard}>
              <Text style={styles.endorseCardLabel}>Scout Endorsements</Text>
              <Text style={styles.endorseCardValue}>{uniqueEndorsers}</Text>
              <View style={styles.btn_row_sml}>
                <TouchableOpacity
                  style={[styles.btn_sml, styles.btn_outline_sml]}
                  activeOpacity={0.8}
                  onPress={() => router.push('/endorsements' as any)}
                >
                  <Text style={styles.btn_text_sml} numberOfLines={1}>View Endorsements</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn_sml, styles.btn_secondary_sml]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/endorse' as any)}
                >
                  <Text style={[styles.btn_text_sml, { color: '#000000' }]} numberOfLines={1}>Endorse</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })()}

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
                ? 'Playing Level:\n' + (player.league_level ?? 'Non-League').replace(/_/g, ' ')
                : 'Playing Level:\n*****'}
            </Text>
            <Text style={styles.levelDesc}>
              {'This player has described their performance level as '}
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
          <View style={styles.btn_row}>
            <TouchableOpacity
              style={[styles.btn, styles.btn_outline, !resolvedIsSubscribed && styles.btn_outline_disabled]}
              disabled={!resolvedIsSubscribed}
              onPress={() => router.push(`/player/performance/${player.id}` as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.btn_text, { color: '#ffffff' }]}>View Entries</Text>
            </TouchableOpacity>
          </View>
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
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 8H16M8 12H13M7 16V21L12 16H20V4H4V16H7Z"
                    stroke="#000"
                    strokeWidth={1.5}
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
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d={shortlisted
                      ? 'M5 12H19'           // minus
                      : 'M12 5V19M5 12H19'  // plus
                    }
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

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
    gap: Spacing.md,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  heroNameBlock: {
    flex: 1,
    gap: 2,
    paddingTop: 3,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    flexShrink: 0,
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
    lineHeight: 64,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  chip: {
    backgroundColor: '#1A1A1A',
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
    lineHeight: 34,
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
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#1A1A1A',
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
  // ── Large button design system ─────────────────────────────────────────
  btn_row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_outline: {
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  btn_outline_disabled: {
    opacity: 0.3,
  },
  btn_text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  fabPressed: {
    backgroundColor: '#d4d4d4',
  },
  // ── Endorsements card ───────────────────────────────────────────────────────
  endorseCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    gap: 12,
  },
  endorseCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  endorseCardValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: '#ffffff',
    textTransform: 'uppercase',
  },

  // ── Small button variants (_sml suffix) ────────────────────────────────────
  btn_row_sml: {
    flexDirection: 'row',
    gap: 8,
  },
  btn_sml: {
    flex: 1,
    height: 32,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  btn_outline_sml: {
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  btn_secondary_sml: {
    backgroundColor: '#ffffff',
  },
  btn_text_sml: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
