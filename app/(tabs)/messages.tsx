import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'

interface Conversation {
  conversation_id: string
  other_user_id: string
  other_first_name: string
  other_last_name: string
  other_role: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function MessagesScreen() {
  const { userId } = useAuth()
  const router = useRouter()
  const [convos, setConvos]   = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConvos = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: userId })
    if (error) console.error('fetchConvos:', error.message)
    setConvos((data as Conversation[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchConvos() }, [fetchConvos])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.brand} /></View>
  }

  return (
    <ScreenBackground>
      <ScreenHeader />

      <FlatList
        data={convos}
        keyExtractor={item => item.conversation_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              When a scout or player contacts you, the conversation will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = [item.other_first_name?.[0], item.other_last_name?.[0]]
            .filter(Boolean).join('')
          const hasUnread = item.unread_count > 0

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/conversation/${item.conversation_id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, hasUnread && styles.nameBold]}>
                    {item.other_first_name} {item.other_last_name}
                  </Text>
                  <Text style={styles.time}>{timeAgo(item.last_message_at)}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text
                    style={[styles.preview, hasUnread && styles.previewBold]}
                    numberOfLines={1}
                  >
                    {item.last_message ?? 'No messages yet'}
                  </Text>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unread_count > 9 ? '9+' : item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.role}>
                  {item.other_role === 'scout' ? '🔍 Scout' : '⚽ Player'}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  rowBody:   { flex: 1, gap: 3 },
  rowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:      { color: Colors.text, fontSize: 15, fontWeight: '500' },
  nameBold:  { fontWeight: '700' },
  time:      { color: Colors.textMuted, fontSize: 12 },
  preview:   { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  previewBold: { color: Colors.text, fontWeight: '500' },
  role:      { color: Colors.textMuted, fontSize: 11 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: { color: Colors.background, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  emptySub:   { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
})
