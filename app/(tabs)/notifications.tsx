import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, SectionList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'

interface Notification {
  id: string
  type: 'profile_view' | 'message' | 'shortlist' | 'system'
  title: string
  body?: string
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  profile_view: '👁',
  message:      '💬',
  shortlist:    '⭐',
  system:       '📢',
}

function groupByDate(notifications: Notification[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const week  = today - 6 * 86400000

  const groups: Record<string, Notification[]> = {
    Today: [], 'This Week': [], Earlier: [],
  }
  for (const n of notifications) {
    const t = new Date(n.created_at).getTime()
    if (t >= today)   groups.Today.push(n)
    else if (t >= week) groups['This Week'].push(n)
    else              groups.Earlier.push(n)
  }
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }))
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsScreen() {
  const { userId } = useAuth()
  const { isDemoMode } = useDevRole()
  const [sections, setSections] = useState<{ title: string; data: Notification[] }[]>([])
  const [loading, setLoading]   = useState(true)

  const fetchNotifs = useCallback(async () => {
    if (isDemoMode) { setLoading(false); return }  // demo: no real notifications
    if (!userId) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) console.error('fetchNotifs:', error.message)
    setSections(groupByDate((data as Notification[]) ?? []))
    setLoading(false)
  }, [userId, isDemoMode])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setSections(prev =>
      prev.map(s => ({
        ...s,
        data: s.data.map(n => n.id === id ? { ...n, read: true } : n),
      })).filter(s => s.data.length > 0)
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.brand} /></View>
  }

  return (
    <ScreenBackground>
      <ScreenHeader
        right={
          sections.flatMap(s => s.data).some(n => !n.read) ? (
            <TouchableOpacity
              onPress={async () => {
                const ids = sections.flatMap(s => s.data).filter(n => !n.read).map(n => n.id)
                await supabase.from('notifications').update({ read: true }).in('id', ids)
                setSections(prev => prev.map(s => ({
                  ...s, data: s.data.map(n => ({ ...n, read: true })),
                })))
              }}
            >
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySub}>
              Profile views, contact requests and match alerts will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.read && styles.rowUnread]}
            onPress={() => markRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
              <Text style={styles.icon}>{TYPE_ICON[item.type] ?? '📢'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                {item.title}
              </Text>
              {item.body && <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>}
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAll:  { fontSize: 13, color: Colors.brand, fontWeight: '500' },
  sectionHeader: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  rowUnread: { backgroundColor: 'rgba(0,255,135,0.03)' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: 'rgba(0,255,135,0.08)' },
  icon:           { fontSize: 18 },
  rowBody:        { flex: 1, gap: 3 },
  notifTitle:     { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  notifTitleUnread: { color: Colors.text, fontWeight: '600' },
  notifBody:      { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  time:           { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brand, marginTop: 6,
  },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  emptySub:   { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
})
