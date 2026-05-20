import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Animated, Alert,
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
import FeaturedVideo from '@/components/featured_video'
import { CircleFAB } from '@/components/CircleFAB'
import { logProfileView } from '@/lib/queries/profile-views'
import { useContactPermission } from '@/hooks/useContactPermission'

const MASK = '*****'

// ─── Stat chip (Age / Nationality) ────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  )
}

// ─── Stat card row (label left, value right, no left border) ──────────────────
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
  const [endorseOpen, setEndorseOpen]   = useState(false)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [videoOpen, setVideoOpen]       = useState(false)
  const [perfOpen, setPerfOpen]         = useState(false)
  const { devRole } = useDevRole()
  const { isDemoMode } = useDevRole()

  const resolvedIsSubscribed = (isDemoMode || __DEV__) ? devRole === 'scout_subscribed' : isSubscribed

  const {
    canMessage,
    canRequest,
    reason: contactReason,
    loading: contactLoading,
  } = useContactPermission({
    playerProfileId:      player?.id ?? null,
    isMinor:              player?.is_minor ?? false,
    guardianConsentActive: player?.guardian_consent_active ?? false,
    contactPermission:    (player?.contact_permission as 'none' | 'endorsed_only' | 'all_verified') ?? 'none',
    scoutUserId:          devRole !== 'player' ? (userId ?? null) : null,
  })

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toastAnim     = useRef(new Animated.Value(0)).current
  const endorseRotate = useRef(new Animated.Value(0)).current
  const profileRotate = useRef(new Animated.Value(0)).current
  const videoRotate   = useRef(new Animated.Value(0)).current
  const perfRotate    = useRef(new Animated.Value(0)).current
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
          .select('id,user_id,first_name,last_name,age,nationality,gender,height_cm,weight_kg,preferred_foot,primary_position,secondary_positions,league_level,skill_level,is_verified,profile_photo_url,highlight_reel_url,is_minor,guardian_consent_active,contact_permission')
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

      if (p) {
        setPlayer(p as PlayerProfile)
        // Log the view — fire-and-forget, never block the UI
        // Only log if viewer is not the player themselves
        if (p.user_id && userId !== p.user_id) {
          logProfileView({ viewerUserId: userId, playerUserId: p.user_id })
        }
      }
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

  const sendContactRequest = async () => {
    if (!userId || !player?.user_id || !player?.first_name) return
    const { data: scout } = await supabase
      .from('scout_profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()
    const scoutName = scout ? `${scout.first_name} ${scout.last_name}` : 'A scout'
    const { error } = await supabase.from('notifications').insert({
      user_id: player.user_id,
      type: 'contact_request',
      title: 'Contact Request',
      body: `${scoutName} has requested permission to contact ${player.first_name}.`,
      read: false,
      data: { scout_user_id: userId },
    })
    if (error) { Alert.alert('Error', error.message); return }
    showToast('Contact request sent')
  }

  const handleMessage = async () => {
    if (!userId || !player?.user_id || messaging) return
    if (contactLoading) return

    if (canMessage) {
      setMessaging(true)
      const convId = await findOrCreateConversation(userId, player.user_id)
      setMessaging(false)
      if (convId) router.push(`/(tabs)/conversation/${convId}` as any)
      return
    }

    if (canRequest) {
      Alert.alert(
        'Contact restricted',
        contactReason,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Contact', onPress: sendContactRequest },
        ],
      )
      return
    }

    Alert.alert('Contact not available', contactReason)
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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.heroSection}>
          {/* Name block — fills available space */}
          <View style={styles.heroNameBlock}>
            <Text style={styles.firstName}>{maskedFirst}</Text>
            <Text style={styles.lastName}>{maskedLast}</Text>
            {player.is_minor && resolvedIsSubscribed && (
              <View style={styles.minorBadge}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M16.45 10.95L13.05 8.4C12.4278 7.93333 11.5722 7.93333 10.95 8.4L7.55 10.95C7.21863 11.1985 7.15147 11.6686 7.4 12C7.64853 12.3314 8.11863 12.3985 8.45 12.15L11.85 9.6C11.9389 9.53333 12.0611 9.53333 12.15 9.6L15.55 12.15C15.8814 12.3985 16.3515 12.3314 16.6 12C16.8485 11.6686 16.7814 11.1985 16.45 10.95Z" fill="rgba(0,255,135,0.7)" />
                  <Path d="M14.45 13.45L12.45 11.95C12.1833 11.75 11.8167 11.75 11.55 11.95L9.55 13.45C9.21863 13.6985 9.15147 14.1686 9.4 14.5C9.64853 14.8314 10.1186 14.8985 10.45 14.65L12 13.4875L13.55 14.65C13.8814 14.8985 14.3515 14.8314 14.6 14.5C14.8485 14.1686 14.7814 13.6985 14.45 13.45Z" fill="rgba(0,255,135,0.7)" />
                  <Path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.0625 1.25 10.1673 1.55658 8.72339 2.05112L7.99595 2.30014C6.51462 2.8072 5.3714 3.19852 4.55303 3.53099C4.14078 3.69846 3.78637 3.86067 3.50098 4.02641C3.22634 4.1859 2.95082 4.38484 2.76363 4.65154C2.5786 4.91516 2.48293 5.23924 2.42281 5.55122C2.36031 5.87556 2.32262 6.26464 2.2983 6.71136C2.25 7.59836 2.25 8.81351 2.25 10.3896V11.9914C2.25 18.0924 6.85803 21.0175 9.59833 22.2146L9.62543 22.2264C9.96523 22.3749 10.2846 22.5144 10.6516 22.6084C11.0391 22.7076 11.4507 22.75 12 22.75C12.5493 22.75 12.9609 22.7076 13.3484 22.6084C13.7154 22.5144 14.0348 22.3749 14.3745 22.2264L14.4017 22.2146C17.142 21.0175 21.75 18.0924 21.75 11.9914V10.3898C21.75 8.81361 21.75 7.5984 21.7017 6.71136C21.6774 6.26464 21.6397 5.87556 21.5772 5.55122C21.5171 5.23924 21.4214 4.91516 21.2364 4.65154C21.0492 4.38484 20.7737 4.1859 20.499 4.02641C20.2136 3.86067 19.8592 3.69846 19.447 3.53099C18.6286 3.19852 17.4854 2.8072 16.004 2.30013L15.2766 2.05112C13.8327 1.55658 12.9375 1.25 12 1.25ZM9.08062 3.5143C10.6951 2.96164 11.3423 2.75 12 2.75C12.6577 2.75 13.3049 2.96164 14.9194 3.5143L15.4922 3.71037C17.0048 4.22814 18.1079 4.60605 18.8824 4.92069C19.269 5.07774 19.5491 5.20935 19.7457 5.32353C19.8428 5.3799 19.9097 5.42642 19.9543 5.46273C19.9922 5.49349 20.0066 5.51092 20.0087 5.51348C20.0106 5.5166 20.0231 5.53737 20.0406 5.58654C20.0606 5.64265 20.0827 5.72309 20.1043 5.83506C20.148 6.06169 20.1811 6.37301 20.2039 6.79292C20.2497 7.63411 20.25 8.80833 20.25 10.4167V11.9914C20.25 17.1665 16.3801 19.7135 13.8012 20.84C13.4297 21.0023 13.2152 21.0941 12.9764 21.1552C12.7483 21.2136 12.47 21.25 12 21.25C11.53 21.25 11.2517 21.2136 11.0236 21.1552C10.7848 21.0941 10.5703 21.0023 10.1988 20.84C7.6199 19.7135 3.75 17.1665 3.75 11.9914V10.4167C3.75 8.80833 3.75028 7.63411 3.79608 6.79292C3.81894 6.37301 3.85204 6.06169 3.89571 5.83506C3.91729 5.72309 3.93944 5.64265 3.95943 5.58654C3.97693 5.5374 3.98936 5.51663 3.99129 5.51349C3.99336 5.51095 4.0078 5.49351 4.04567 5.46273C4.09034 5.42642 4.15722 5.3799 4.25429 5.32353C4.4509 5.20935 4.731 5.07774 5.11759 4.92069C5.8921 4.60605 6.99521 4.22814 8.5078 3.71037L9.08062 3.5143Z" fill="rgba(0,255,135,0.7)" />
                </Svg>
                <Text style={styles.minorBadgeText}>Account managed by parent/carer</Text>
              </View>
            )}
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

        {/* ── Collapsible sections ── */}
        <View style={styles.sectionsWrap}>

          {/* ── Endorsements ── */}
          <View style={styles.sectionBlock}>
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => {
                const toValue = endorseOpen ? 0 : 1
                Animated.timing(endorseRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                setEndorseOpen(v => !v)
              }}
            >
              <Text style={styles.sectionTitle}>Endorsements</Text>
              <View style={styles.sectionDivider} />
              <Animated.View style={{ transform: [{ rotate: endorseRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                  <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>
            {endorseOpen && (
              <View style={styles.sectionContent}>
                {(() => {
                  const uniqueEndorsers = isDemoMode
                    ? new Set(DEMO_ENDORSEMENTS.map(e => e.scout_user_id)).size
                    : 0
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
              </View>
            )}
          </View>

          {/* ── Profile ── */}
          <View style={styles.sectionBlock}>
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => {
                const toValue = profileOpen ? 0 : 1
                Animated.timing(profileRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                setProfileOpen(v => !v)
              }}
            >
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.sectionDivider} />
              <Animated.View style={{ transform: [{ rotate: profileRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                  <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>
            {profileOpen && (
              <View style={styles.sectionContent}>
                <View style={styles.profileStatsCard}>
                  <StatRow label="GENDER"         value={gender.toUpperCase()} />
                  <View style={styles.statsCardDivider} />
                  <StatRow label="HEIGHT"         value={resolvedIsSubscribed ? `${player.height_cm ?? '--'} CM` : MASK} />
                  <View style={styles.statsCardDivider} />
                  <StatRow label="WEIGHT"         value={resolvedIsSubscribed ? `${player.weight_kg ?? '--'} KG` : MASK} />
                  <View style={styles.statsCardDivider} />
                  <StatRow label="PREFERRED FOOT" value={resolvedIsSubscribed ? (player.preferred_foot ?? '--') : MASK} />
                  <View style={styles.statsCardDivider} />
                  <StatRow label="POSITIONS"      value={resolvedIsSubscribed ? (player.primary_position ?? '--') : MASK} />
                </View>
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
              </View>
            )}
          </View>

          {/* ── Featured Video ── */}
          <View style={styles.sectionBlock}>
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => {
                const toValue = videoOpen ? 0 : 1
                Animated.timing(videoRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                setVideoOpen(v => !v)
              }}
            >
              <Text style={styles.sectionTitle}>Featured Video</Text>
              <View style={styles.sectionDivider} />
              <Animated.View style={{ transform: [{ rotate: videoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                  <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>
            {videoOpen && (
              <View style={styles.sectionContent}>
                {!resolvedIsSubscribed ? (
                  <View style={styles.videoBox}>
                    <Text style={styles.proFeatureText}>This is a PRO feature.</Text>
                    <View style={styles.playBtnOverlay} pointerEvents="none">
                      <View style={styles.playBtn}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path d="M5 3l14 9-14 9V3z" fill="rgba(255,255,255,0.9)" />
                        </Svg>
                      </View>
                    </View>
                  </View>
                ) : (
                  <FeaturedVideo user_id={player.user_id ?? ''} is_own_profile={false} />
                )}
              </View>
            )}
          </View>

          {/* ── Performance ── */}
          <View style={styles.sectionBlock}>
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => {
                const toValue = perfOpen ? 0 : 1
                Animated.timing(perfRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                setPerfOpen(v => !v)
              }}
            >
              <Text style={styles.sectionTitle}>Performance Log</Text>
              <View style={styles.sectionDivider} />
              <Animated.View style={{ transform: [{ rotate: perfRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                  <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>
            {perfOpen && (
              <View style={styles.sectionContent}>
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
            )}
          </View>

          {/* ── Your move ── */}
          <View style={styles.yourMoveRow}>
            <Text style={styles.sectionTitle}>Your move</Text>
            <View style={styles.fabRow}>
              <CircleFAB
                onPress={handleMessage}
                loading={messaging || contactLoading}
                icon={
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M8 8H16M8 12H13M7 16V21L12 16H20V4H4V16H7Z"
                      stroke="#000"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
              />
              <CircleFAB
                onPress={toggleShortlist}
                loading={toggling}
                icon={
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={shortlisted
                        ? 'M5 12H19'
                        : 'M12 5V19M5 12H19'
                      }
                      stroke="#000"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: Colors.textSecondary, fontSize: 16 },

  // ── U16 minor badge ───────────────────────────────────────────────────────
  minorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  minorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,255,135,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

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

  // ── Attributes card ───────────────────────────────────────────────────────
  profileStatsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    overflow: 'hidden',
  },
  statsCardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'right',
    flex: 1,
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

  // ── Collapsible sections ──────────────────────────────────────────────────
  sectionsWrap: {
    marginHorizontal: -Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.48,
  },
  sectionDivider: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.text,
  },
  sectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  yourMoveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  fabRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
