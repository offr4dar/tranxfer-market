import { useCallback, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native'
import Svg, { Path, Circle, G } from 'react-native-svg'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '@/lib/supabase'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import ScoutInterestChart, { ChartDataPoint } from '@/components/ScoutInterestChart'
import { fetchScoutInterest, ScoutInterestResult } from '@/lib/queries/scout-interest'
import PlayerLevelCard from '@/components/PlayerLevelCard'
import PerformanceLogSheet from '@/components/PerformanceLogSheet'
import { DevRoleProvider, useDevRole } from '@/lib/devRole'
import { Colors, Spacing } from '@/constants/theme'
import { DEMO_PLAYER_PROFILE, DEMO_SCOUT_FREE_PROFILE, DEMO_SCOUT_PRO_PROFILE, DEMO_ENDORSEMENTS } from '@/lib/demoData'

function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 18V20H0V18H20ZM13 0L18 5L7 16H2V11L13 0ZM9.70686 6.12108L4 11.828V14H6.172L11.8789 8.29308L9.70686 6.12108ZM13 2.828L11.1211 4.70686L13.2931 6.87886L15.172 5L13 2.828Z"
        fill="#B4B4B4"
      />
    </Svg>
  )
}

function GearIcon() {
  return (
    <Svg width={21} height={22} viewBox="0 0 21 22" fill="none">
      <Path
        d="M17.5433 11.7686C17.5848 11.4447 17.607 11.1186 17.6099 10.792C17.607 10.4654 17.5848 10.1393 17.5433 9.81543L19.6049 8.16016C19.698 8.08724 19.7616 7.98167 19.7835 7.86366C19.8055 7.74565 19.7843 7.62348 19.7239 7.52051L17.7718 4.04884C17.7153 3.94471 17.6236 3.86538 17.5139 3.82581C17.4043 3.78624 17.2843 3.78915 17.1767 3.834L14.7437 4.83986C14.2374 4.44361 13.6838 4.11543 13.0963 3.8633L12.7297 1.21194C12.7136 1.09461 12.6563 0.987325 12.5687 0.910066C12.4811 0.832806 12.3691 0.79085 12.2536 0.792016H8.3399C8.22437 0.79085 8.11237 0.832806 8.02477 0.910066C7.93717 0.987325 7.87995 1.09461 7.86379 1.21194L7.49717 3.8633C6.90892 4.11385 6.35511 4.44215 5.8498 4.83986L3.40731 3.834C3.29964 3.78915 3.17968 3.78624 3.07005 3.82581C2.96043 3.86538 2.8687 3.94471 2.81216 4.04884L0.860075 7.52051C0.799708 7.62348 0.778473 7.74565 0.800434 7.86366C0.822394 7.98167 0.886007 8.08724 0.979105 8.16016L3.03594 9.81543C2.99462 10.1393 2.97236 10.4654 2.96928 10.792C2.9722 11.1186 2.99446 11.4447 3.03594 11.7686L0.979105 13.4238C0.886007 13.4967 0.822394 13.6023 0.800434 13.7203C0.778473 13.8383 0.799708 13.9605 0.860075 14.0635L2.81216 17.5351C2.8687 17.6393 2.96043 17.7186 3.07005 17.7582C3.17968 17.7977 3.29964 17.75 3.40731 17.75L5.84028 16.7441C6.34654 17.1404 6.90016 17.4686 7.48765 17.7207L7.85426 20.372C7.87043 20.4894 7.92765 20.5967 8.01525 20.6739C8.10285 20.7512 8.21485 20.7931 8.33038 20.792H12.2346C12.3501 20.7931 12.4621 20.7512 12.5497 20.6739C12.6373 20.5967 12.6945 20.4894 12.7107 20.372L13.0773 17.7207C13.6655 17.4701 14.2193 17.1418 14.7247 16.7441L17.1576 17.75C17.2653 17.7948 17.3853 17.7977 17.4949 17.7582C17.6045 17.7186 17.6962 17.6393 17.7528 17.5351L19.7049 14.0635C19.7652 13.9605 19.7865 13.8383 19.7645 13.7203C19.7425 13.6023 19.6789 13.4967 19.5858 13.4238L17.5433 11.7686ZM10.292 14.2978C9.61567 14.2988 8.95426 14.094 8.39146 13.7094C7.82866 13.3247 7.38976 12.7775 7.13029 12.137C6.87081 11.4965 6.80244 10.7914 6.9338 10.111C7.06517 9.43064 7.39038 8.8055 7.86828 8.31471C8.34618 7.82392 8.95529 7.48954 9.61855 7.35387C10.2818 7.2182 10.9694 7.28734 11.5943 7.55254C12.2193 7.81775 12.7535 8.2671 13.1293 8.84374C13.5051 9.42038 13.7058 10.0984 13.7058 10.792C13.7064 11.2522 13.6186 11.7079 13.4473 12.1333C13.276 12.5586 13.0246 12.9451 12.7076 13.2707C12.3905 13.5963 12.014 13.8546 11.5995 14.0309C11.185 14.2071 10.7407 14.2978 10.292 14.2978Z"
        stroke="#B4B4B4"
        strokeWidth={1.584}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

const RING_R = 31
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

type Role = 'player' | 'scout' | null

interface PlayerData {
  first_name: string; last_name: string; primary_position?: string
  age?: number; current_club?: string; contract_status?: string
  nationality?: string; appearances?: number; goals?: number
  assists?: number; clean_sheets?: number; profile_completion_score?: number
  bio?: string; is_verified?: boolean; league_level?: string; skill_level?: string
  gender?: string; height_cm?: number; weight_kg?: number
  preferred_foot?: string; secondary_positions?: string[]
}


export default function ProfileScreen() {
  const { userId, signOut } = useAuth()
  const router = useRouter()
  const [role, setRole]   = useState<Role>(null)
  const [data, setData]   = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsOpen, setInsightsOpen]       = useState(false)
  const [yourDetailsOpen, setYourDetailsOpen] = useState(false)
  const [showreelOpen, setShowreelOpen]       = useState(false)
  const [perfLogOpen, setPerfLogOpen]         = useState(false)
  const [logSheetOpen, setLogSheetOpen]       = useState(false)
  const insightRotate  = useRef(new Animated.Value(0)).current
  const detailsRotate  = useRef(new Animated.Value(0)).current
  const showreelRotate = useRef(new Animated.Value(0)).current
  const perfLogRotate  = useRef(new Animated.Value(0)).current
  const [totalLogs, setTotalLogs] = useState(0)
  const [weekLogs,  setWeekLogs]  = useState(0)
  const [interestData, setInterestData] = useState<ScoutInterestResult | null>(null)
  const { devRole, isDemoMode } = useDevRole()
  const activeRole = (devRole === 'player' ? 'player' : 'scout') as Role

  const fetchProfile = useCallback(async () => {
    // ── Demo mode: hardcoded dummy data, no auth/Supabase needed ──────────────
    if (isDemoMode) {
      if (devRole === 'player') {
        setRole('player')
        setData(DEMO_PLAYER_PROFILE as any)
        // Mock 30-day data from spec
        const mock30: ChartDataPoint[] = [
          { date: '1 Apr',  views: 3,  shortlists: 0 },
          { date: '3 Apr',  views: 5,  shortlists: 1 },
          { date: '5 Apr',  views: 4,  shortlists: 0 },
          { date: '7 Apr',  views: 8,  shortlists: 1 },
          { date: '9 Apr',  views: 6,  shortlists: 1 },
          { date: '11 Apr', views: 11, shortlists: 2 },
          { date: '13 Apr', views: 7,  shortlists: 1 },
          { date: '15 Apr', views: 9,  shortlists: 1 },
          { date: '17 Apr', views: 13, shortlists: 3 },
          { date: '19 Apr', views: 10, shortlists: 1 },
          { date: '21 Apr', views: 8,  shortlists: 2 },
          { date: '23 Apr', views: 14, shortlists: 3 },
          { date: '25 Apr', views: 12, shortlists: 2 },
          { date: '27 Apr', views: 16, shortlists: 4 },
          { date: '29 Apr', views: 11, shortlists: 2 },
        ]
        setInterestData({ data30: mock30, data7: mock30.slice(-7) })
        setTotalLogs(12)
        setWeekLogs(3)
      } else {
        const scoutProfile = devRole === 'scout_subscribed'
          ? DEMO_SCOUT_PRO_PROFILE
          : DEMO_SCOUT_FREE_PROFILE
        setRole('scout')
        setData(scoutProfile as any)
      }
      setLoading(false)
      return
    }

    // ── Real mode: require userId ──────────────────────────────────────────────
    if (!userId) return

    const tryPlayer = async () => {
      const { data: p } = await supabase
        .from('player_profiles')
        .select('*').eq('user_id', userId).maybeSingle()
      return p
    }

    const tryScout = async () => {
      const { data: a } = await supabase
        .from('scout_profiles')
        .select('*').eq('user_id', userId).maybeSingle()
      return a
    }

    let pData: any = null
    let aData: any = null

    if (activeRole === 'player') {
      pData = await tryPlayer()
      if (!pData) aData = await tryScout()
    } else {
      aData = await tryScout()
      if (!aData) pData = await tryPlayer()
    }

    if (pData) {
      setRole('player')
      setData(pData)
      setLoading(false)

      // Mon of the current week — used for perf-log weekly count only
      const today     = new Date()
      const dow       = today.getDay()
      const toMonday  = dow === 0 ? -6 : 1 - dow
      const monday    = new Date(today)
      monday.setDate(today.getDate() + toMonday)
      const since = monday.toISOString().split('T')[0] + 'T00:00:00'

      const [{ count: totalLogCount }, { count: weekLogCount }, interestResult] =
        await Promise.all([
          supabase.from('performance_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('performance_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('match_date', since),
          fetchScoutInterest(pData.id),
        ])

      setTotalLogs(totalLogCount ?? 0)
      setWeekLogs(weekLogCount ?? 0)
      setInterestData(interestResult)
    } else if (aData) {
      setRole('scout')
      setData(aData as unknown as PlayerData)
    }
    setLoading(false)
  }, [userId, activeRole])

  // Re-fetch whenever this screen comes into focus (covers initial load + returning from edit-profile)
  useFocusEffect(useCallback(() => { fetchProfile() }, [fetchProfile]))

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.brand} /></View>
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No profile found</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/onboarding' as any)}>
          <Text style={styles.link}>Complete onboarding →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signOutEmpty}
          onPress={() => signOut().then(() => router.replace('/splash'))}
        >
          <Text style={styles.signOutEmptyText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const initials = [data.first_name?.[0], data.last_name?.[0]].filter(Boolean).join('')
  const player = activeRole === 'player' ? (data as PlayerData) : null
  const score  = player?.profile_completion_score ?? 0

  return (
    <ScreenBackground>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content}>
      {/* ── Edit / Settings row ── */}
      <View style={styles.editRow}>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => router.push('/edit-profile' as any)}>
          <Text style={styles.editLabel}>Edit Profile</Text>
          <EditIcon />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/settings' as any)} activeOpacity={0.7} hitSlop={10}>
          <GearIcon />
        </TouchableOpacity>
      </View>

      {/* ── Avatar hero ── */}
      <View style={styles.hero}>
        {/* Name block — fills available space */}
        <View style={styles.heroNameBlock}>
          <Text style={styles.heroFirstName}>{data.first_name}</Text>
          <Text style={styles.heroLastName}>{data.last_name}</Text>

          {/* Tier badge for scout in demo mode */}
          {isDemoMode && activeRole === 'scout' && (
            <View style={[
              styles.tierBadge,
              devRole === 'scout_subscribed' ? styles.tierBadgePro : styles.tierBadgeFree,
            ]}>
              <Text style={styles.tierBadgeText}>
                {devRole === 'scout_subscribed' ? '⭐  SCOUT PRO' : '🔍  SCOUT FREE'}
              </Text>
            </View>
          )}
        </View>

        {/* Avatar — floats right */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {data.is_verified && (
            <View style={styles.verifiedBadge}>
              <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <Path d="M2.5 7l3 3 6-6" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          )}
        </View>
      </View>

      {/* ── Scout info card (demo mode only) ── */}
      {isDemoMode && activeRole === 'scout' && (() => {
        const scout = devRole === 'scout_subscribed'
          ? DEMO_SCOUT_PRO_PROFILE
          : DEMO_SCOUT_FREE_PROFILE
        return (
          <View style={styles.scoutInfoCard}>
            {/* Type + org */}
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>Scout Type</Text>
              <Text style={styles.scoutInfoValue}>
                {scout.scout_type === 'club_scout' ? 'Club Scout' : 'Freelance Scout'}
                {(scout as any).affiliated_club ? ` · ${(scout as any).affiliated_club}` : ''}
              </Text>
            </View>
            <View style={styles.scoutInfoDivider} />
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>Organisation</Text>
              <Text style={styles.scoutInfoValue}>{scout.organisation_name}</Text>
            </View>
            <View style={styles.scoutInfoDivider} />
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>Experience</Text>
              <Text style={styles.scoutInfoValue}>{scout.years_experience} years</Text>
            </View>
            <View style={styles.scoutInfoDivider} />
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>Regions</Text>
              <Text style={styles.scoutInfoValue}>{scout.regions_covered.join(', ')}</Text>
            </View>
            <View style={styles.scoutInfoDivider} />
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>Specialisms</Text>
              <Text style={styles.scoutInfoValue}>{scout.specialisms.join(', ')}</Text>
            </View>
            <View style={styles.scoutInfoDivider} />
            <View style={styles.scoutInfoRow}>
              <Text style={styles.scoutInfoLabel}>DBS Verified</Text>
              <Text style={[styles.scoutInfoValue, { color: Colors.brand }]}>
                {scout.clearance_check ? '✓  Cleared' : 'Pending'}
              </Text>
            </View>

            {/* Upgrade CTA for free scouts */}
            {devRole === 'scout_free' && (
              <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
                <Text style={styles.upgradeBtnText}>Upgrade to Scout Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      })()}

      {/* ── Profile completion (players only) ── */}
      {player && (
        <View style={styles.section}>
          <View style={styles.profileScoreRow}>
            <View style={styles.ringWrap}>
              <Svg width={78} height={78}>
                <G transform="rotate(-90, 39, 39)">
                  <Circle
                    cx={39} cy={39} r={RING_R}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={8}
                    fill="none"
                  />
                  <Circle
                    cx={39} cy={39} r={RING_R}
                    stroke={Colors.brand}
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - score / 100)}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
              <View style={styles.ringLabel}>
                <Text style={styles.ringScore}>{score}</Text>
              </View>
            </View>
            <View style={styles.scoreTextCol}>
              <Text style={styles.profileScoreTitle}>Profile Score</Text>
              <Text style={styles.profileScoreDesc}>
                Complete your profile to help scouts find you easier
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Profile Insights (players only) ── */}
      {player && (
        <View style={styles.insightBlock}>
          <TouchableOpacity
            style={styles.insightHeader}
            onPress={() => {
              const toValue = insightsOpen ? 0 : 1
              Animated.timing(insightRotate, {
                toValue,
                duration: 200,
                useNativeDriver: true,
              }).start()
              setInsightsOpen(v => !v)
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.insightTitle}>Profile Insights</Text>
            <View style={styles.insightDivider} />
            <Animated.View style={{ transform: [{ rotate: insightRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
              <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                <Path
                  d="M10.5 1V20M1 10.5H20"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          </TouchableOpacity>
          {insightsOpen && interestData && (
            <View style={styles.insightContent}>
              <ScoutInterestChart data30={interestData.data30} data7={interestData.data7} />
            </View>
          )}
        </View>
      )}

      {/* ── Your Details (players only) ── */}
      {player && (
        <View style={styles.insightBlock}>
          <TouchableOpacity
            style={styles.insightHeader}
            onPress={() => {
              const toValue = yourDetailsOpen ? 0 : 1
              Animated.timing(detailsRotate, {
                toValue,
                duration: 200,
                useNativeDriver: true,
              }).start()
              setYourDetailsOpen(v => !v)
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.insightTitle}>Your Details</Text>
            <View style={styles.insightDivider} />
            <Animated.View style={{ transform: [{ rotate: detailsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
              <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                <Path
                  d="M10.5 1V20M1 10.5H20"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          </TouchableOpacity>
          {yourDetailsOpen && (
            <View style={styles.insightContent}>
              <View style={styles.detailsContentWrap}>

                {/* Age + Nationality */}
                <View style={styles.detailsCardRow}>
                  <View style={[styles.detailsCard, { width: 95 }]}>
                    <Text style={styles.detailsCardLabel}>Age</Text>
                    <Text style={styles.detailsCardValue}>
                      {player.age ? `${player.age} Yrs` : '22 Yrs'}
                    </Text>
                  </View>
                  <View style={[styles.detailsCard, { flex: 1 }]}>
                    <Text style={styles.detailsCardLabel}>Nationality</Text>
                    <Text style={styles.detailsCardValue} numberOfLines={1}>
                      {player.nationality?.toUpperCase() ?? 'ENGLAND'}
                    </Text>
                  </View>
                </View>

                {/* Endorsements */}
                {(() => {
                  const uniqueEndorsers = isDemoMode
                    ? new Set(DEMO_ENDORSEMENTS.map(e => e.scout_user_id)).size
                    : 0  // TODO: fetch from DB
                  return (
                    <View style={[styles.detailsCard, styles.detailsEndorseCard]}>
                      <Text style={styles.detailsCardLabel}>Scout Endorsements</Text>
                      <Text style={styles.detailsCardValue}>{uniqueEndorsers}</Text>
                      <View style={styles.btn_row_sml}>
                        <TouchableOpacity
                          style={[styles.btn_sml, styles.btn_outline_sml]}
                          activeOpacity={0.8}
                          onPress={() => router.push('/endorsements' as any)}
                        >
                          <Text style={styles.btn_text_sml}>View Endorsements</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn_sml, styles.btn_secondary_sml]} activeOpacity={0.85}>
                          <Text style={[styles.btn_text_sml, { color: '#000000' }]}>Request</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })()}

                {/* Attribute list */}
                {(() => {
                  const positions = [
                    player.primary_position,
                    ...(player.secondary_positions ?? []),
                  ].filter(Boolean) as string[]

                  const attrs = [
                    { label: 'Gender',         value: player.gender         ?? 'Male'  },
                    { label: 'Height',         value: player.height_cm      ? `${player.height_cm} cm`  : '171 cm' },
                    { label: 'Weight',         value: player.weight_kg      ? `${player.weight_kg}kg`   : '72kg'   },
                    { label: 'Preferred Foot', value: player.preferred_foot ?? 'Both'  },
                  ]

                  const displayPositions = positions.length > 0 ? positions : ['CB', 'LB', 'RB']

                  return (
                    <View style={styles.attrWrap}>
                      <View style={styles.attrInner}>
                        {attrs.map(a => (
                          <View key={a.label} style={styles.attrRow}>
                            <Text style={styles.attrLabel}>{a.label}</Text>
                            <Text style={styles.attrValue}>{a.value}</Text>
                          </View>
                        ))}
                        <View style={styles.attrRow}>
                          <Text style={styles.attrLabel}>Positions</Text>
                          {displayPositions.map(p => (
                            <Text key={p} style={styles.attrValue}>{p}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  )
                })()}

                {/* Player level card */}
                <PlayerLevelCard
                  playingLevel={(player.league_level ?? 'Grassroots').replace(/_/g, ' ')}
                  performanceLevel={player.skill_level ?? 'medium skill level'}
                />

              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Showreel (players only) ── */}
      {player && (
        <View style={styles.insightBlock}>
          <TouchableOpacity
            style={styles.insightHeader}
            onPress={() => {
              const toValue = showreelOpen ? 0 : 1
              Animated.timing(showreelRotate, {
                toValue,
                duration: 200,
                useNativeDriver: true,
              }).start()
              setShowreelOpen(v => !v)
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.insightTitle}>Showreel</Text>
            <View style={styles.insightDivider} />
            <Animated.View style={{ transform: [{ rotate: showreelRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
              <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </TouchableOpacity>

          {showreelOpen && (
            <View style={styles.insightContent}>
              <TouchableOpacity style={styles.videoPlayer} activeOpacity={0.8}>
                <View style={styles.playBtn}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M6 4l14 8-14 8V4z" fill="#000000" />
                  </Svg>
                </View>
                <Text style={styles.videoHint}>Tap to upload</Text>
                <Text style={styles.videoHintSub}>Max 30 secs.</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Performance Log (players only) ── */}
      {player && (
        <View style={styles.insightBlock}>
          <TouchableOpacity
            style={styles.insightHeader}
            onPress={() => {
              const toValue = perfLogOpen ? 0 : 1
              Animated.timing(perfLogRotate, {
                toValue,
                duration: 200,
                useNativeDriver: true,
              }).start()
              setPerfLogOpen(v => !v)
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.insightTitle}>Performance Log</Text>
            <View style={styles.insightDivider} />
            <Animated.View style={{ transform: [{ rotate: perfLogRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
              <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </TouchableOpacity>

          {perfLogOpen && (
            <View style={styles.insightContent}>
              <Text style={styles.perfDesc}>
                Logging your activity gives a strong indication that you're; playing regularly, developing deliberately, and serious about being discovered. Scouts notice players who show up consistently.
              </Text>

              {/* Stat chips */}
              <View style={styles.perfChipsRow}>
                <View style={[styles.perfChip, { width: 126 }]}>
                  <Text style={styles.perfChipNumber}>{totalLogs}</Text>
                  <Text style={styles.perfChipLabel}>Performance{'\n'}Log Entries</Text>
                </View>
                <View style={[styles.perfChip, { flex: 1 }]}>
                  <Text style={styles.perfChipNumber}>{weekLogs}</Text>
                  <Text style={styles.perfChipLabel}>Added{'\n'}This Week</Text>
                </View>
                <View style={[styles.perfChip, styles.perfChipFire, { width: 84 }]}>
                  <Text style={styles.perfChipEmoji}>🔥</Text>
                  <Text style={styles.perfChipLabel}>Keep{'\n'}It Up!</Text>
                </View>
              </View>

              {/* CTA buttons */}
              <View style={styles.btn_row}>
                <TouchableOpacity style={[styles.btn, styles.btn_outline]} activeOpacity={0.8} onPress={() => router.push('/performance-log' as any)}>
                  <Text style={[styles.btn_text, { color: '#ffffff' }]}>View Entries</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btn_secondary]} activeOpacity={0.8} onPress={() => setLogSheetOpen(true)}>
                  <Text style={[styles.btn_text, { color: '#000000' }]}>+ Add Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.signOut}
        onPress={() =>
          isDemoMode
            ? router.replace('/demo-select' as any)
            : signOut().then(() => router.replace('/splash'))
        }
      >
        <Text style={styles.signOutText}>
          {isDemoMode ? 'Exit Demo' : 'Sign out'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
      <PerformanceLogSheet
        visible={logSheetOpen}
        onClose={() => setLogSheetOpen(false)}
        onSaved={() => {
          setLogSheetOpen(false)
          setTotalLogs(n => n + 1)
          setWeekLogs(n => n + 1)
        }}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  content:    { paddingBottom: 200 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
                backgroundColor: Colors.background },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  link:       { color: Colors.brand, fontSize: 14 },
  signOutEmpty: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24 },
  signOutEmptyText: { color: Colors.error, fontSize: 14, fontWeight: '600' },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b4b4b4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,255,135,0.1)', borderWidth: 2,
    borderColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: Colors.brand },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  heroFirstName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroLastName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 52,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 64,
  },
  tierBadge: {
    marginTop: 8,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  tierBadgeFree: {
    backgroundColor: 'rgba(196,155,30,0.12)',
    borderColor: 'rgba(196,155,30,0.4)',
  },
  tierBadgePro: {
    backgroundColor: 'rgba(15,95,255,0.12)',
    borderColor: 'rgba(15,95,255,0.4)',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.text,
    textTransform: 'uppercase',
  },

  // ── Scout info card ────────────────────────────────────────────────────────
  scoutInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  scoutInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: 12,
  },
  scoutInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: Spacing.lg,
  },
  scoutInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  scoutInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    flexWrap: 'wrap',
  },
  upgradeBtn: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  insightBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  insightTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.48,
  },
  insightDivider: {
    flex: 1,
    height: 4,
    backgroundColor: '#fff',
  },
  insightContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  // ── Your Details content ─────────────────────────────────────────────────
  detailsContentWrap: {
    gap: Spacing.md,
  },
  detailsCardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    gap: 8,
    height: 82,
    justifyContent: 'space-between',
  },
  detailsCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCardValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  detailsEndorseCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: undefined,
    gap: 12,
  },
  endorseBtnRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
  },
  attrWrap: {
    paddingVertical: Spacing.md,
  },
  attrInner: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    paddingLeft: 20,
    gap: 8,
  },
  attrRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  attrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  attrValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand,
    textTransform: 'uppercase',
  },

  // ── Showreel ──────────────────────────────────────────────────────────────
  videoPlayer: {
    height: 175,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  playBtn: {
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  videoHint: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  videoHintSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  section: {
    padding: Spacing.lg, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionLabel: {
    color: Colors.textSecondary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  profileScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringWrap: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: '#ffffff',
  },
  scoreTextCol: {
    flex: 1,
    gap: 10,
  },
  profileScoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  profileScoreDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },

  // ── Performance Log ──────────────────────────────────────────────────────
  perfDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  perfChipsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  perfChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 82,
    gap: 6,
  },
  perfChipFire: {
    backgroundColor: '#260b0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfChipNumber: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: '#ffffff',
  },
  perfChipEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  perfChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  perfCtaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  // ── Large button variants ───────────────────────────────────────────
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
  btn_secondary: {
    backgroundColor: '#ffffff',
  },
  btn_text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Small button variants (_sml suffix) ─────────────────────────────
  btn_row_sml: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
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
  signOut: {
    margin: Spacing.lg, marginTop: Spacing.xl, height: 52,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
})
