import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'

type Role = 'player' | 'scout' | null

interface PlayerData {
  first_name: string; last_name: string; primary_position?: string
  age?: number; current_club?: string; contract_status?: string
  nationality?: string; appearances?: number; goals?: number
  assists?: number; clean_sheets?: number; profile_completion_score?: number
  bio?: string; is_verified?: boolean; league_level?: string
}

interface PerformanceLog {
  id: string
  match_date: string
  entry_type: 'match' | 'training' | 'trial'
  context: string | null
  goals: number | null
  assists: number | null
  rating: number | null
  notes: string | null
}

const TYPE_LABEL: Record<PerformanceLog['entry_type'], string> = {
  match:    'Match',
  training: 'Training',
  trial:    'Trial',
}

const TYPE_COLOR: Record<PerformanceLog['entry_type'], string> = {
  match:    '#00FF87',
  training: '#8AABFF',
  trial:    '#FFB547',
}

interface ScoutData {
  first_name: string; last_name: string; organisation_name?: string
  scout_type?: string; positions_seeking?: string[]; regions_covered?: string[]
  league_level?: string; bio?: string; is_verified?: boolean
  years_experience?: number; subscription_tier?: string
}

const PLAYER_MENU = [
  { icon: '✏️', label: 'Edit profile' },
  { icon: '📹', label: 'Upload highlight reel' },
  { icon: '📊', label: 'Profile analytics', badge: 'Premium' },
  { icon: '🔔', label: 'Notification settings' },
  { icon: '💳', label: 'Boost my profile', badge: 'Paid' },
]

const SCOUT_MENU = [
  { icon: '✏️', label: 'Edit profile' },
  { icon: '📊', label: 'Scout reports', badge: 'Pro' },
  { icon: '🔔', label: 'Notification settings' },
]

export default function ProfileScreen() {
  const { userId, signOut } = useAuth()
  const router = useRouter()
  const [role, setRole]   = useState<Role>(null)
  const [data, setData]   = useState<PlayerData | ScoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs]   = useState<PerformanceLog[]>([])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data: p } = await supabase
        .from('player_profiles')
        .select('*').eq('user_id', userId).maybeSingle()
      if (p) {
        setRole('player')
        setData(p)
        setLoading(false)
        const { data: l } = await supabase
          .from('performance_logs')
          .select('id,match_date,entry_type,context,goals,assists,rating,notes')
          .eq('user_id', userId)
          .order('match_date', { ascending: false })
          .limit(5)
        setLogs(l ?? [])
        return
      }

      const { data: a } = await supabase
        .from('scout_profiles')
        .select('*').eq('user_id', userId).maybeSingle()
      if (a) { setRole('scout'); setData(a) }
      setLoading(false)
    })()
  }, [userId])

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
  const player   = role === 'player' ? (data as PlayerData) : null
  const scout    = role === 'scout'  ? (data as ScoutData)  : null
  const menu     = role === 'player' ? PLAYER_MENU : SCOUT_MENU
  const score    = player?.profile_completion_score ?? 0

  return (
    <ScreenBackground>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content}>
      {/* ── Avatar hero ── */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
          {data.is_verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>}
        </View>
        <Text style={styles.name}>{data.first_name} {data.last_name}</Text>

        {player && (
          <Text style={styles.heroSub}>
            {[player.primary_position, player.nationality, player.age ? `${player.age} yrs` : null]
              .filter(Boolean).join(' · ')}
          </Text>
        )}
        {scout && (
          <Text style={styles.heroSub}>
            {scout.organisation_name || (scout.scout_type ?? 'Scout').replace(/_/g, ' ')}
          </Text>
        )}

        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>
            {role === 'player' ? '⚽ Player' : '🔍 Scout'}
          </Text>
        </View>
      </View>

      {/* ── Player stats ── */}
      {player && (
        <View style={styles.statsRow}>
          {[
            { label: 'Apps',    value: player.appearances ?? 0 },
            { label: 'Goals',   value: player.goals       ?? 0 },
            { label: 'Assists', value: player.assists      ?? 0 },
            { label: 'CS',      value: player.clean_sheets ?? 0 },
          ].map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Recent activity (players only) ── */}
      {player && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent activity</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogs}>No activity yet — log your first match or session.</Text>
          ) : (
            logs.map(log => {
              const color = TYPE_COLOR[log.entry_type]
              const d     = new Date(log.match_date)
              const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.logTypePill, { borderColor: color }]}>
                    <Text style={[styles.logTypeText, { color }]}>{TYPE_LABEL[log.entry_type]}</Text>
                  </View>
                  <View style={styles.logMid}>
                    {log.context ? (
                      <Text style={styles.logContext} numberOfLines={1}>{log.context}</Text>
                    ) : (
                      <Text style={styles.logContextMuted}>—</Text>
                    )}
                    {log.entry_type === 'match' && (log.goals != null || log.assists != null) && (
                      <Text style={styles.logStats}>
                        {log.goals ?? 0}G · {log.assists ?? 0}A
                      </Text>
                    )}
                  </View>
                  <View style={styles.logRight}>
                    {log.rating != null && (
                      <View style={[styles.ratingBadge, { borderColor: color }]}>
                        <Text style={[styles.ratingBadgeText, { color }]}>{log.rating}</Text>
                      </View>
                    )}
                    <Text style={styles.logDate}>{dateStr}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>
      )}

      {/* ── Profile completion (players only) ── */}
      {player && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Profile completion</Text>
            <Text style={styles.scoreText}>{score}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${score}%` as any }]} />
          </View>
          {score < 100 && (
            <Text style={styles.progressHint}>
              Add your {[
                !player.bio && 'bio',
                !player.primary_position && 'position',
                !player.nationality && 'nationality',
              ].filter(Boolean).slice(0, 2).join(', ')} to increase visibility.
            </Text>
          )}
        </View>
      )}

      {/* ── Scout info ── */}
      {scout && scout.positions_seeking && scout.positions_seeking.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Positions Seeking</Text>
          <View style={styles.tagRow}>
            {scout.positions_seeking.map(p => (
              <View key={p} style={styles.tag}><Text style={styles.tagText}>{p}</Text></View>
            ))}
          </View>
        </View>
      )}

      {/* ── Menu ── */}
      <View style={styles.menu}>
        {menu.map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{item.badge}</Text>
              </View>
            )}
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.signOut}
        onPress={() => signOut().then(() => router.replace('/splash'))}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
      </ScrollView>
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

  hero: {
    alignItems: 'center', paddingTop: 30, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(0,255,135,0.1)', borderWidth: 2,
    borderColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: Colors.brand },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.background },
  name:    { fontSize: 22, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textSecondary },
  rolePill: {
    backgroundColor: 'rgba(0,255,135,0.08)', borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 4, marginTop: 4,
  },
  rolePillText: { color: Colors.brand, fontSize: 12, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stat: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },

  section: {
    padding: Spacing.lg, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: {
    color: Colors.textSecondary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  scoreText: { color: Colors.brand, fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: Colors.brand, borderRadius: 2 },
  progressHint: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },

  emptyLogs: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  logTypePill: {
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    minWidth: 68, alignItems: 'center',
  },
  logTypeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  logMid:      { flex: 1, gap: 2 },
  logContext:  { fontSize: 13, color: Colors.text, fontWeight: '500' },
  logContextMuted: { fontSize: 13, color: Colors.textMuted },
  logStats:    { fontSize: 11, color: Colors.textSecondary },
  logRight:    { alignItems: 'flex-end', gap: 4 },
  ratingBadge: {
    borderWidth: 1.5, borderRadius: Radius.sm,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  ratingBadgeText: { fontSize: 12, fontWeight: '800' },
  logDate:     { fontSize: 11, color: Colors.textMuted },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },

  menu: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: Colors.border, gap: Spacing.md,
  },
  menuIcon:        { fontSize: 18 },
  menuLabel:       { flex: 1, color: Colors.text, fontSize: 15 },
  menuBadge:       { backgroundColor: 'rgba(0,255,135,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  menuBadgeText:   { color: Colors.brand, fontSize: 11, fontWeight: '600' },
  menuChevron:     { color: Colors.textMuted, fontSize: 20 },

  signOut: {
    margin: Spacing.lg, marginTop: Spacing.xl, height: 52,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
})
