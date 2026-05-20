import { useCallback, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated, Image,
} from 'react-native'
import Svg, { Path, Circle, G } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import ScoutInterestChart, { ChartDataPoint } from '@/components/ScoutInterestChart'
import { fetchScoutInterest, ScoutInterestResult } from '@/lib/queries/scout-interest'
import { fetchProfileViewStats, ProfileViewStats } from '@/lib/queries/profile-views'
import PlayerLevelCard from '@/components/PlayerLevelCard'
import PerformanceLogSheet from '@/components/PerformanceLogSheet'
import ProfilePhotoUpload from '@/components/profile_photo_upload'
import FeaturedVideo from '@/components/featured_video'
import { useDevRole } from '@/lib/devRole'
import { Colors, Spacing, MiniCardStyles } from '@/constants/theme'
import { DEMO_PLAYER_PROFILE, DEMO_SCOUT_FREE_PROFILE, DEMO_SCOUT_PRO_PROFILE, DEMO_ENDORSEMENTS } from '@/lib/demoData'

// ─── Scout Pro gradient badge ─────────────────────────────────────────────────
function ScoutProBadge() {
  return (
    <LinearGradient
      colors={['#96895A', '#F0DB8F', '#ffffff', '#D8C581', '#96895A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={scoutBadgeStyles.wrap}
    >
      {/* X logo — same path as FeedIcon in TabIcons */}
      <Svg width={14} height={Math.round(14 * 20 / 19)} viewBox="0 0 19 20" fill="none">
        <Path
          d="M10.3915 17.817L16.2798 16.5811L12.639 9.1573L19 0L13.1117 1.23596L10.6735 4.7191L10.4828 4.75923L9.16412 2.0626L3.18464 3.31461L6.7093 10.4013L0 20L5.97949 18.748L8.66652 14.8636L8.90703 14.8154L10.3915 17.817Z"
          fill="#7C6F42"
        />
      </Svg>
      <Text style={scoutBadgeStyles.label}>SCOUT PRO</Text>
    </LinearGradient>
  )
}
const scoutBadgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Anton_400Regular',
    fontSize: 14,
    color: '#7C6F42',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})

// ─── Hexagon verified badge (for scouts) ─────────────────────────────────────
function HexagonVerifiedBadge() {
  return (
    <View style={hexStyles.wrap}>
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        {/* Hexagon shape */}
        <Path
          d="M13 1L24.2583 7.25V19.75L13 26L1.74167 19.75V7.25L13 1Z"
          fill={Colors.brand}
        />
        {/* Checkmark */}
        <Path
          d="M8 13l3.5 3.5 6.5-7"
          stroke="#000"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
const hexStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
})

// ─── ID & DBS Verified banner ──────────────────────────────────────────────────
function VerifiedBanner({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={verifiedStyles.wrap}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={verifiedStyles.left}>
        <Svg width={31} height={34} viewBox="0 0 31 34" fill="none">
          <Path
            d="M19.748 14.2596C20.1732 13.7833 20.1319 13.0524 19.6555 12.6271C19.1791 12.2018 18.4482 12.2432 18.0229 12.7195L13.3795 17.9202L12.0396 16.4195C11.6143 15.9431 10.8833 15.9018 10.407 16.327C9.93066 16.7524 9.88928 17.4833 10.3146 17.9596L12.5169 20.4263C12.7363 20.6721 13.0501 20.8125 13.3795 20.8125C13.7088 20.8125 14.0225 20.6721 14.2419 20.4263L19.748 14.2596Z"
            fill="#00FF87"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.0312 0C13.5859 0 12.2058 0.472644 9.97981 1.23506L8.85834 1.61897C6.57462 2.40068 4.81216 3.00397 3.5505 3.51653C2.91495 3.77471 2.36857 4.02478 1.92859 4.2803C1.50519 4.52618 1.08043 4.83288 0.791846 5.24404C0.506591 5.65045 0.359101 6.15008 0.266416 6.63105C0.170061 7.13107 0.111956 7.7309 0.0744625 8.4196C4.02021e-08 9.78706 0 11.6604 0 14.0902V16.5597C0 25.9654 7.10405 30.4749 11.3287 32.3204L11.3705 32.3386C11.8943 32.5676 12.3867 32.7826 12.9525 32.9275C13.5499 33.0805 14.1844 33.1458 15.0312 33.1458C15.8781 33.1458 16.5126 33.0805 17.11 32.9275C17.6758 32.7826 18.1682 32.5676 18.6919 32.3386L18.7339 32.3204C22.9585 30.4749 30.0625 25.9654 30.0625 16.5597V14.0905C30.0625 11.6606 30.0625 9.78712 29.988 8.4196C29.9506 7.7309 29.8925 7.13107 29.7961 6.63105C29.7034 6.15008 29.5559 5.65045 29.2707 5.24404C28.9821 4.83288 28.5574 4.52618 28.1339 4.2803C27.6939 4.02478 27.1475 3.77471 26.512 3.51653C25.2503 3.00397 23.4879 2.40068 21.2041 1.61895L20.0827 1.23506C17.8567 0.472644 16.4766 0 15.0312 0ZM10.5305 3.4908C13.0195 2.63878 14.0173 2.3125 15.0312 2.3125C16.0452 2.3125 17.043 2.63878 19.532 3.4908L20.4151 3.79307C22.747 4.5913 24.4476 5.17391 25.6416 5.65898C26.2376 5.9011 26.6694 6.104 26.9725 6.28003C27.1222 6.36693 27.2254 6.43865 27.2941 6.49463C27.3526 6.54205 27.3748 6.56892 27.378 6.57287C27.3809 6.57768 27.4002 6.6097 27.4272 6.6855C27.458 6.772 27.4921 6.89601 27.5254 7.06863C27.5927 7.41802 27.6438 7.89797 27.6789 8.54533C27.7495 9.84217 27.75 11.6524 27.75 14.132V16.5597C27.75 24.5379 21.7839 28.4646 17.8081 30.2013C17.2354 30.4515 16.9047 30.593 16.5365 30.6872C16.1849 30.7772 15.7558 30.8333 15.0312 30.8333C14.3067 30.8333 13.8776 30.7772 13.526 30.6872C13.1578 30.593 12.8271 30.4515 12.2544 30.2013C8.2786 28.4646 2.3125 24.5379 2.3125 16.5597V14.132C2.3125 11.6524 2.31293 9.84217 2.38354 8.54533C2.41878 7.89797 2.46981 7.41802 2.53714 7.06863C2.57041 6.89601 2.60455 6.772 2.63537 6.6855C2.66235 6.60974 2.68151 6.57772 2.68449 6.57288C2.68768 6.56896 2.70994 6.54208 2.76832 6.49463C2.83719 6.43865 2.9403 6.36693 3.08995 6.28003C3.39305 6.104 3.82487 5.9011 4.42087 5.65898C5.6149 5.17391 7.31553 4.5913 9.64744 3.79307L10.5305 3.4908Z"
            fill="#00FF87"
          />
        </Svg>
        <Text style={verifiedStyles.label}>ID AND DBS{'  '}VERIFIED</Text>
      </View>
      {/* Chevron right */}
      <Svg width={7} height={14} viewBox="0 0 9 16" fill="none">
        <Path d="M1 1l7 7-7 7" stroke={Colors.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  )
}
const verifiedStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d271a',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})


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

// ─── Shared attribute list (green left-border rows) ──────────────────────────
type AttrItem =
  | { label: string; value: string; values?: never }
  | { label: string; values: string[]; value?: never }

function AttrList({ items, style }: { items: AttrItem[]; style?: object }) {
  return (
    <View style={[attrListStyles.wrap, style]}>
      <View style={attrListStyles.inner}>
        {items.map(item => (
          <View key={item.label} style={attrListStyles.row}>
            <Text style={attrListStyles.label}>{item.label}</Text>
            {item.values
              ? <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {item.values.map(v => (
                  <Text key={v} style={attrListStyles.value}>{v}</Text>
                ))}
              </View>
              : <Text style={[attrListStyles.value, { flex: 1, flexWrap: 'wrap' }]}>{item.value}</Text>
            }
          </View>
        ))}
      </View>
    </View>
  )
}
const attrListStyles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.md,
  },
  inner: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
    paddingLeft: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#868686',
    textTransform: 'uppercase',
    width: 121,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
})

const RING_R = 34
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
  profile_photo_url?: string; postcode?: string
}


export default function ProfileScreen() {
  const { userId, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [role, setRole] = useState<Role>(null)
  const [data, setData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsOpen, setInsightsOpen]               = useState(false)
  const [yourDetailsOpen, setYourDetailsOpen]         = useState(false)
  const [featuredVideoOpen, setFeaturedVideoOpen]     = useState(false)
  const [perfLogOpen, setPerfLogOpen]                 = useState(false)
  const [scoutExperienceOpen, setScoutExperienceOpen] = useState(false)
  const [scoutDetailsOpen, setScoutDetailsOpen]       = useState(false)
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  const insightRotate        = useRef(new Animated.Value(0)).current
  const detailsRotate        = useRef(new Animated.Value(0)).current
  const featuredVideoRotate  = useRef(new Animated.Value(0)).current
  const perfLogRotate        = useRef(new Animated.Value(0)).current
  const scoutExperienceRotate = useRef(new Animated.Value(0)).current
  const scoutDetailsRotate    = useRef(new Animated.Value(0)).current
  const [totalLogs, setTotalLogs] = useState(0)
  const [weekLogs, setWeekLogs]   = useState(0)
  const [weekStreak, setWeekStreak] = useState(0)
  const [interestData, setInterestData] = useState<ScoutInterestResult | null>(null)
  const [viewStats, setViewStats] = useState<ProfileViewStats | null>(null)
  const [hasVideo, setHasVideo] = useState(false)
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
          { date: '1 Apr', views: 3, shortlists: 0 },
          { date: '3 Apr', views: 5, shortlists: 1 },
          { date: '5 Apr', views: 4, shortlists: 0 },
          { date: '7 Apr', views: 8, shortlists: 1 },
          { date: '9 Apr', views: 6, shortlists: 1 },
          { date: '11 Apr', views: 11, shortlists: 2 },
          { date: '13 Apr', views: 7, shortlists: 1 },
          { date: '15 Apr', views: 9, shortlists: 1 },
          { date: '17 Apr', views: 13, shortlists: 3 },
          { date: '19 Apr', views: 10, shortlists: 1 },
          { date: '21 Apr', views: 8, shortlists: 2 },
          { date: '23 Apr', views: 14, shortlists: 3 },
          { date: '25 Apr', views: 12, shortlists: 2 },
          { date: '27 Apr', views: 16, shortlists: 4 },
          { date: '29 Apr', views: 11, shortlists: 2 },
        ]
        // Mock view stats for demo
        setViewStats({
          thisWeek: 14,
          lastWeek: 10,
          trendPct: 40,
          trendUp: true,
          dailyThisWeek: [
            { date: 'Mon', count: 1 },
            { date: 'Tue', count: 3 },
            { date: 'Wed', count: 2 },
            { date: 'Thu', count: 4 },
            { date: 'Fri', count: 2 },
            { date: 'Sat', count: 1 },
            { date: 'Sun', count: 1 },
          ],
        })
        setHasVideo(true)  // demo always has a video
        setInterestData({ data30: mock30, data7: mock30.slice(-7) })
        setTotalLogs(12)
        setWeekLogs(3)
        setWeekStreak(3)   // demo: 3-week streak, shows fire
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
      const today = new Date()
      const dow = today.getDay()
      const toMonday = dow === 0 ? -6 : 1 - dow
      const monday = new Date(today)
      monday.setDate(today.getDate() + toMonday)
      const since = monday.toISOString().split('T')[0] + 'T00:00:00'

      const [{ count: totalLogCount }, { count: weekLogCount }, interestResult, viewStatsResult, { count: videoCount }, { data: streakDates }] =
        await Promise.all([
          supabase.from('performance_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('performance_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('match_date', since),
          fetchScoutInterest(pData.id),
          fetchProfileViewStats(userId),
          supabase.from('player_videos').select('id', { count: 'exact', head: true }).eq('player_user_id', userId).eq('status', 'ready'),
          // Last 52 weeks of match_dates for streak calculation
          supabase
            .from('performance_logs')
            .select('match_date')
            .eq('user_id', userId)
            .gte('match_date', new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('match_date', { ascending: false }),
        ])

      // ── Compute week streak ────────────────────────────────────────────────
      let streak = 0
      if (streakDates && streakDates.length > 0) {
        const getISOWeekKey = (dateStr: string): string => {
          const d = new Date(dateStr)
          const jan4 = new Date(d.getFullYear(), 0, 4)
          const startOfWeek1 = new Date(jan4)
          startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
          const weekNum = Math.floor((d.getTime() - startOfWeek1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
          return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
        }
        const weekCounts: Record<string, number> = {}
        for (const row of streakDates) {
          const key = getISOWeekKey(row.match_date)
          weekCounts[key] = (weekCounts[key] ?? 0) + 1
        }
        const currentWeekKey = getISOWeekKey(new Date().toISOString().split('T')[0])
        const sortedWeeks = Object.keys(weekCounts).sort().reverse()
        const startFrom = sortedWeeks[0] === currentWeekKey ? sortedWeeks.slice(1) : sortedWeeks
        for (const wk of startFrom) {
          if ((weekCounts[wk] ?? 0) >= 3) { streak++ } else { break }
        }
      }

      setTotalLogs(totalLogCount ?? 0)
      setWeekLogs(weekLogCount ?? 0)
      setWeekStreak(streak)
      setInterestData(interestResult)
      setViewStats(viewStatsResult)
      setHasVideo((videoCount ?? 0) > 0)
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
  const score = player?.profile_completion_score ?? 0

  // ── Next action prompt ────────────────────────────────────────────────────────
  // Ordered by spec weight descending — first unfilled item wins
  type NextAction = { label: string; pts: number; route: string }
  function getNextAction(p: PlayerData, videoReady: boolean): NextAction | null {
    const actions: [boolean, NextAction][] = [
      [!!p.profile_photo_url, { label: 'Upload a profile photo', pts: 20, route: '/edit-profile' }],
      [videoReady, { label: 'Upload a highlight video', pts: 20, route: '/player/media' }],
      [!!p.first_name && !!p.last_name, { label: 'Add your full name', pts: 10, route: '/edit-profile' }],
      [!!p.primary_position, { label: 'Set your position', pts: 10, route: '/edit-profile' }],
      [!!p.nationality, { label: 'Set your nationality', pts: 10, route: '/edit-profile' }],
      [!!p.postcode, { label: 'Add your postcode', pts: 10, route: '/edit-profile' }],
      [!!p.bio, { label: 'Write a short bio', pts: 10, route: '/edit-profile' }],
      [!!p.height_cm, { label: 'Add your height', pts: 5, route: '/edit-profile' }],
      [!!p.preferred_foot, { label: 'Set your preferred foot', pts: 5, route: '/edit-profile' }],
    ]
    const missing = actions.find(([done]) => !done)
    return missing ? missing[1] : null
  }

  const nextAction = player ? getNextAction(player, hasVideo) : null

  return (
    <ScreenBackground>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Edit / Settings row ── */}
        <View style={[
          styles.editRow,
          (isDemoMode && activeRole === 'scout' && devRole === 'scout_subscribed')
            ? { justifyContent: 'space-between' }
            : { justifyContent: 'flex-end' },
        ]}>
          {isDemoMode && activeRole === 'scout' && devRole === 'scout_subscribed' && (
            <ScoutProBadge />
          )}
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => router.push('/edit-profile' as any)}>
              <Text style={styles.editLabel}>Edit Profile</Text>
              <EditIcon />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings' as any)} activeOpacity={0.7} hitSlop={10}>
              <GearIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Avatar hero ── */}
        <View style={[styles.hero, activeRole === 'scout' && { borderBottomWidth: 0 }]}>
          {/* Name block — fills available space */}
          <View style={styles.heroNameBlock}>
            {isDemoMode && activeRole === 'scout' && devRole === 'scout_free' && (
              <View style={[styles.tierBadge, styles.tierBadgeFree]}>
                <Text style={styles.tierBadgeText}>🔍  SCOUT FREE</Text>
              </View>
            )}
            <Text style={styles.heroFirstName}>{data.first_name}</Text>
            <Text style={styles.heroLastName}>{data.last_name}</Text>
          </View>

          {/* Avatar — floats right; tappable to upload photo for own player profile */}
          <View style={styles.avatarWrap}>
            {player ? (
              <ProfilePhotoUpload
                photo_url={data.profile_photo_url}
                initials={initials}
                size={100}
                is_demo_mode={isDemoMode}
                on_change={(url) => {
                  // Update local data so the score ring and profile stay in sync
                  setData((prev: any) => prev ? { ...prev, profile_photo_url: url } : prev)
                }}
              />
            ) : (
              // Scout view — static avatar, no upload
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {data.is_verified && activeRole === 'player' && (
              <View style={styles.verifiedBadge}>
                <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <Path d="M2.5 7l3 3 6-6" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            )}
            {data.is_verified && activeRole === 'scout' && (
              <HexagonVerifiedBadge />
            )}
          </View>
        </View>

        {/* ── Scout info (demo mode only) ── */}
        {isDemoMode && activeRole === 'scout' && (() => {
          const scout = devRole === 'scout_subscribed'
            ? DEMO_SCOUT_PRO_PROFILE
            : DEMO_SCOUT_FREE_PROFILE
          const s = scout as any

          return (
            <View>
              {/* ID & DBS verified banner — always visible */}
              {s.layer1_verified && (
                <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
                  <VerifiedBanner onPress={() => { }} />
                </View>
              )}

              {/* ── Experience ── */}
              <View style={styles.insightBlock}>
                <TouchableOpacity
                  style={styles.insightHeader}
                  activeOpacity={0.7}
                  onPress={() => {
                    const toValue = scoutExperienceOpen ? 0 : 1
                    Animated.timing(scoutExperienceRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                    setScoutExperienceOpen(v => !v)
                  }}
                >
                  <Text style={styles.insightTitle}>Experience</Text>
                  <View style={styles.insightDivider} />
                  <Animated.View style={{ transform: [{ rotate: scoutExperienceRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                      <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </Animated.View>
                </TouchableOpacity>
                {scoutExperienceOpen && (
                  <View style={styles.insightContent}>
                    <View style={styles.detailsContentWrap}>
                      <View style={styles.detailsCardRow}>
                        <View style={[styles.detailsCard, { flex: 1 }]}>
                          <Text style={styles.detailsCardLabel}>Experience</Text>
                          <Text style={styles.detailsCardValue}>{scout.years_experience} Yrs</Text>
                        </View>
                        <View style={[styles.detailsCard, { flex: 1 }]}>
                          <Text style={styles.detailsCardLabel}>Scout Type</Text>
                          <Text style={styles.detailsCardValue} numberOfLines={1}>
                            {scout.scout_type === 'club_scout' ? 'Club' : 'Freelance'}
                          </Text>
                        </View>
                      </View>
                      {(() => {
                        const isClub = scout.scout_type === 'club_scout'
                        const label = isClub ? 'Club Name' : 'Scouting Network'
                        const value = isClub ? s.affiliated_club : s.scouting_network
                        if (!value) return null
                        return (
                          <View style={[styles.detailsCard, { height: undefined, minHeight: 82, gap: 8 }]}>
                            <Text style={styles.detailsCardLabel}>{label}</Text>
                            <Text style={styles.detailsCardValue} numberOfLines={2}>{value}</Text>
                          </View>
                        )
                      })()}
                    </View>
                  </View>
                )}
              </View>

              {/* ── Your Details ── */}
              <View style={styles.insightBlock}>
                <TouchableOpacity
                  style={styles.insightHeader}
                  activeOpacity={0.7}
                  onPress={() => {
                    const toValue = scoutDetailsOpen ? 0 : 1
                    Animated.timing(scoutDetailsRotate, { toValue, duration: 200, useNativeDriver: true }).start()
                    setScoutDetailsOpen(v => !v)
                  }}
                >
                  <Text style={styles.insightTitle}>Your Details</Text>
                  <View style={styles.insightDivider} />
                  <Animated.View style={{ transform: [{ rotate: scoutDetailsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                      <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </Animated.View>
                </TouchableOpacity>
                {scoutDetailsOpen && (
                  <View style={styles.insightContent}>
                    <View style={styles.profileStatsCard}>
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>Nationality</Text>
                        <Text style={styles.profileStatsValue}>{s.nationality ?? '—'}</Text>
                      </View>
                      <View style={styles.profileStatsDivider} />
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>Regions</Text>
                        <Text style={styles.profileStatsValue}>{scout.regions_covered.join(' • ')}</Text>
                      </View>
                      <View style={styles.profileStatsDivider} />
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>Specialisms</Text>
                        <Text style={styles.profileStatsValue}>{scout.specialisms.join(' • ')}</Text>
                      </View>
                      <View style={styles.profileStatsDivider} />
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>Safeguarding</Text>
                        <Text style={styles.profileStatsValue}>{s.safeguarding_certified ? 'Fully compliant' : 'Not completed'}</Text>
                      </View>
                      <View style={styles.profileStatsDivider} />
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>League Level</Text>
                        <Text style={styles.profileStatsValue}>{scout.league_level ?? '—'}</Text>
                      </View>
                      <View style={styles.profileStatsDivider} />
                      <View style={styles.profileStatsRow}>
                        <Text style={styles.profileStatsLabel}>Positions</Text>
                        <Text style={styles.profileStatsValue}>{(s.positions_seeking ?? []).join(' • ') || '—'}</Text>
                      </View>
                    </View>
                  </View>
                )}
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
          <TouchableOpacity
            style={styles.section}
            activeOpacity={0.7}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <View style={styles.profileScoreRow}>
              <View style={styles.ringWrap}>
                <Svg width={78} height={78}>
                  <G transform="rotate(-90, 39, 39)">
                    <Circle
                      cx={39} cy={39} r={RING_R}
                      stroke="#2B4052"
                      strokeWidth={5}
                      fill="none"
                    />
                    <Circle
                      cx={39} cy={39} r={RING_R}
                      stroke="#38A6FF"
                      strokeWidth={5}
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
                {score >= 100 ? (
                  <Text style={[styles.profileScoreDesc, { color: '#38A6FF', marginTop: 4 }]}>
                    Profile complete ✓
                  </Text>
                ) : nextAction ? (
                  <Text style={[styles.profileScoreDesc, { marginTop: 4 }]}>
                    <Text>Next: </Text>
                    <Text style={{ color: '#ffffff' }}>
                      {nextAction.label} (+{nextAction.pts} pts)
                    </Text>
                  </Text>
                ) : null}
              </View>
              <Svg width={9} height={16} viewBox="0 0 9 16" fill="none">
                <Path
                  d="M1 1l7 7-7 7"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
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
            {insightsOpen && (
              <View style={styles.insightContent}>

                {/* ── Scout interest chart ── */}
                {interestData && (
                  <ScoutInterestChart
                    data30={interestData.data30}
                    data7={interestData.data7}
                    views_this_week={viewStats?.thisWeek ?? 0}
                  />
                )}
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

                    const displayPositions = positions.length > 0 ? positions : ['CB', 'LB', 'RB']

                    return (
                      <View style={styles.profileStatsCard}>
                        <View style={styles.profileStatsRow}>
                          <Text style={styles.profileStatsLabel}>Gender</Text>
                          <Text style={styles.profileStatsValue}>{player.gender ?? 'Male'}</Text>
                        </View>
                        <View style={styles.profileStatsDivider} />
                        <View style={styles.profileStatsRow}>
                          <Text style={styles.profileStatsLabel}>Height</Text>
                          <Text style={styles.profileStatsValue}>{player.height_cm ? `${player.height_cm} cm` : '171 cm'}</Text>
                        </View>
                        <View style={styles.profileStatsDivider} />
                        <View style={styles.profileStatsRow}>
                          <Text style={styles.profileStatsLabel}>Weight</Text>
                          <Text style={styles.profileStatsValue}>{player.weight_kg ? `${player.weight_kg}kg` : '72kg'}</Text>
                        </View>
                        <View style={styles.profileStatsDivider} />
                        <View style={styles.profileStatsRow}>
                          <Text style={styles.profileStatsLabel}>Preferred Foot</Text>
                          <Text style={styles.profileStatsValue}>{player.preferred_foot ?? 'Both'}</Text>
                        </View>
                        <View style={styles.profileStatsDivider} />
                        <View style={styles.profileStatsRow}>
                          <Text style={styles.profileStatsLabel}>Positions</Text>
                          <Text style={styles.profileStatsValue}>{displayPositions.join(' · ')}</Text>
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

        {/* ── Featured Video (players only) ── */}
        {player && (
          <View style={styles.insightBlock}>
            <TouchableOpacity
              style={styles.insightHeader}
              onPress={() => {
                const toValue = featuredVideoOpen ? 0 : 1
                Animated.timing(featuredVideoRotate, {
                  toValue,
                  duration: 200,
                  useNativeDriver: true,
                }).start()
                setFeaturedVideoOpen(v => !v)
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.insightTitle}>Featured Video</Text>
              <View style={styles.insightDivider} />
              <Animated.View style={{ transform: [{ rotate: featuredVideoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                  <Path d="M10.5 1V20M1 10.5H20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            </TouchableOpacity>

            {featuredVideoOpen && (
              <View style={styles.insightContent}>
                <FeaturedVideo
                  user_id={userId ?? ''}
                  is_own_profile={activeRole === 'player'}
                />
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
                <View style={styles.miniCardRow}>
                  <View style={[styles.miniCard, { width: 126 }]}>
                    <Text style={styles.miniCardValue}>{totalLogs}</Text>
                    <Text style={styles.miniCardLabel}>Performance{'\n'}Log Entries</Text>
                  </View>
                  <View style={[styles.miniCard, { flex: 1 }]}>
                    <Text style={styles.miniCardValue}>{weekLogs}</Text>
                    <Text style={styles.miniCardLabel}>Added{'\n'}This Week</Text>
                  </View>
                  {/* Streak chip */}
                  <View style={[styles.miniCard, styles.miniCardStreak, { width: 84 }]}>
                    <Text style={[styles.miniCardValue, { textAlign: 'center', zIndex: 1 }]}>{weekStreak}</Text>
                    <Text style={[styles.miniCardLabel, { textAlign: 'center', zIndex: 1 }]}>Week{"\n"}Streak</Text>
                    {weekStreak >= 2 && (
                      <Text style={styles.miniCardStreakEmoji}>🔥</Text>
                    )}
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
  container: { flex: 1 },
  content: { paddingBottom: 200 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: Colors.background
  },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  link: { color: Colors.brand, fontSize: 14 },
  signOutEmpty: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24 },
  signOutEmptyText: { color: Colors.error, fontSize: 14, fontWeight: '600' },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    marginBottom: 8,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
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
    alignItems: 'flex-start',
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
  },

  // ── Profile stats card (shared with scout player view) ──────────────────────
  profileStatsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    overflow: 'hidden',
  },
  profileStatsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 15,
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 12,
  },
  profileStatsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  profileStatsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'right',
    flex: 1,
  },

  // ── Featured Video ─────────────────────────────────────────────────────────
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
  viewMediaLink: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  viewMediaLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.3,
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
  // ── Mini cards (from shared theme) ──────────────────────────────────────────
  ...MiniCardStyles,
  // Streak chip modifier (local only — not shared)
  miniCardStreak: {
    overflow: 'hidden',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniCardStreakEmoji: {
    position: 'absolute' as const,
    top: 4,
    left: 0,
    right: 0,
    textAlign: 'center' as const,
    fontSize: 60,
    opacity: 0.4,
    lineHeight: 70,
    zIndex: 0,
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
