import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import PlayerCard, { PlayerProfile } from '@/components/PlayerCard'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors } from '@/constants/theme'

const BRAND = '#00FF87'
const DARK = '#0B0F0B'

export default function FeedScreen() {
  const { userId } = useAuth()
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'available'>('all')

  const fetchPlayers = useCallback(async () => {
    let query = supabase
      .from('player_profiles')
      .select('id,user_id,first_name,last_name,primary_position,secondary_positions,age,current_club,contract_status,nationality,is_verified,is_featured,appearances,goals,assists')
      .eq('is_searchable', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (filter === 'available') {
      query = query.in('contract_status', ['available_now', 'available_eot'])
    }

    const { data, error } = await query
    if (!error && data) setPlayers(data as PlayerProfile[])
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchPlayers().finally(() => setLoading(false))
  }, [fetchPlayers])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPlayers()
    setRefreshing(false)
  }

  return (
    <ScreenBackground>

      {/* ── Header ── */}
      <ScreenHeader
        right={
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, filter === 'all' && styles.toggleBtnActive]}
              onPress={() => setFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, filter === 'all' && styles.toggleTextActive]}>
                ALL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filter === 'available' && styles.toggleBtnActive]}
              onPress={() => setFilter('available')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, filter === 'available' && styles.toggleTextActive]}>
                AVAILABLE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚽</Text>
              <Text style={styles.emptyTitle}>No players yet</Text>
              <Text style={styles.emptySub}>Check back soon — the talent pool is filling up.</Text>
            </View>
          }
          renderItem={({ item }) => <PlayerCard player={item} />}
        />
      )}
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ALL | AVAILABLE toggle
  toggle: {
    flexDirection: 'row',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#003B1F',
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  toggleBtnActive: { backgroundColor: BRAND },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.5)',
  },
  toggleTextActive: { color: DARK },

  list:   { padding: 16, paddingTop: 30, paddingBottom: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySub:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
