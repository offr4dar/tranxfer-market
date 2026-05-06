import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'
import { DEMO_LOG_ENTRIES, DEMO_FEED_PLAYERS, LogEntry } from '@/lib/demoData'

// Players with entries vs empty state in demo
const PLAYERS_WITH_ENTRIES = ['demo-feed-001'] // Jordan Okafor has entries
// demo-feed-002 (Tom Bradley) and demo-feed-003 (Amara Diallo) show empty state

const TYPE_LABEL: Record<string, string> = {
  match:    'Match',
  training: 'Training',
  trial:    'Trial',
}

const MATCH_COLOR    = '#ffd998'
const MATCH_BADGE_BG = '#3c3324'
const DEFAULT_BADGE_BG = '#242424'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = ordinal(d.getDate())
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const year = String(d.getFullYear()).slice(2)
  return `${day} ${month}${year}`
}

export default function PlayerPerformanceLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()
  const { isDemoMode } = useDevRole()

  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    // ── Demo mode ────────────────────────────────────────────────────────────
    if (isDemoMode) {
      const player = DEMO_FEED_PLAYERS.find(p => p.id === id) ?? DEMO_FEED_PLAYERS[0]
      setPlayerName(`${player.first_name} ${player.last_name}`)

      // First dummy player gets entries; others see the empty state
      if (PLAYERS_WITH_ENTRIES.includes(id as string)) {
        setEntries(DEMO_LOG_ENTRIES.slice(0, 4)) // show 4 entries for demo
      } else {
        setEntries([])
      }
      setLoading(false)
      return
    }

    // ── Real mode ─────────────────────────────────────────────────────────────
    if (!userId || !id) return

    supabase
      .from('performance_logs')
      .select('id,match_date,entry_type,context,goals,assists,notes')
      .eq('player_profile_id', id)
      .order('match_date', { ascending: false })
      .then(({ data }) => {
        setEntries(data ?? [])
        setLoading(false)
      })
  }, [id, userId, isDemoMode])

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
        <View style={styles.headerText}>
          <Text style={styles.title}>Performance Log</Text>
          {playerName ? <Text style={styles.subtitle}>{playerName}</Text> : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      ) : entries.length === 0 ? (
        // ── Empty state ──────────────────────────────────────────────────────
        <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyWrap}>
            <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1.5}
              />
            </Svg>
            <Text style={styles.emptyTitle}>No Entries Yet</Text>
            <Text style={styles.emptyBody}>
              This player hasn't added any performance log entries yet.{'\n'}
              Entries will appear here once they begin tracking their activity.
            </Text>
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>
                Players log matches, training sessions, and trials to build a performance history visible to scouts.
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        // ── Entries list ─────────────────────────────────────────────────────
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry, index) => {
            const isHighlighted = index % 2 === 1
            const accentColor   = isHighlighted ? MATCH_COLOR : 'rgba(255,255,255,0.2)'
            const badgeBg       = isHighlighted ? MATCH_BADGE_BG : DEFAULT_BADGE_BG
            const badgeColor    = isHighlighted ? MATCH_COLOR : 'rgba(255,255,255,0.5)'
            const titleColor    = isHighlighted ? MATCH_COLOR : Colors.text

            return (
              <View key={entry.id} style={styles.entry}>
                {/* Date column */}
                <Text style={styles.dateLabel}>{formatDate(entry.match_date)}</Text>

                {/* Content */}
                <View style={[styles.entryBorder, { borderLeftColor: accentColor }]}>
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {TYPE_LABEL[entry.entry_type]}
                    </Text>
                  </View>

                  <Text style={[styles.entryTitle, { color: titleColor }]}>
                    {entry.context ?? TYPE_LABEL[entry.entry_type]}
                  </Text>

                  {entry.notes ? (
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  ) : null}

                  {entry.entry_type === 'match' && (
                    <>
                      <Text style={styles.statLine}>
                        Goals scored: <Text style={styles.statBold}>{entry.goals ?? 0}</Text>
                      </Text>
                      <Text style={styles.statLine}>
                        Assists: <Text style={styles.statBold}>{entry.assists ?? 0}</Text>
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </ScreenBackground>
  )
}

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
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSpacer: { width: 36 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 14,
  },
  emptyTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  emptyHintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Entries ────────────────────────────────────────────────────────────────
  list: { padding: Spacing.lg, gap: Spacing.xl },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  dateLabel: {
    width: 89,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    lineHeight: 18,
    paddingTop: 4,
  },
  entryBorder: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: 20,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entryTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    textTransform: 'uppercase',
    lineHeight: 28,
  },
  entryNotes: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  statLine: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  statBold: { fontWeight: '700' },
})
