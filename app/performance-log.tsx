import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'

type EntryType = 'match' | 'training' | 'trial'

interface LogEntry {
  id: string
  match_date: string
  entry_type: EntryType
  context: string | null
  goals: number | null
  assists: number | null
  notes: string | null
}

const TYPE_LABEL: Record<EntryType, string> = {
  match:    'Match',
  training: 'Training',
  trial:    'Trial',
}

const MATCH_COLOR = '#ffd998'
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

export default function PerformanceLogScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('performance_logs')
      .select('id,match_date,entry_type,context,goals,assists,notes')
      .eq('user_id', userId)
      .order('match_date', { ascending: false })
      .then(({ data }) => {
        setEntries(data ?? [])
        setLoading(false)
      })
  }, [userId])

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
        <Text style={styles.title}>Performance Log</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No entries yet. Start logging your activity.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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

                {/* Divider */}
                <View style={[styles.entryBorder, { borderLeftColor: accentColor }]}>
                  {/* Type badge */}
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {TYPE_LABEL[entry.entry_type]}
                    </Text>
                  </View>

                  {/* Context / title */}
                  <Text style={[styles.entryTitle, { color: titleColor }]}>
                    {entry.context ?? TYPE_LABEL[entry.entry_type]}
                  </Text>

                  {/* Notes */}
                  {entry.notes ? (
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  ) : null}

                  {/* Goals + Assists — match only */}
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
  title: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: {
    width: 36,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
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
  statLine: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  statBold: {
    fontWeight: '700',
  },
})
