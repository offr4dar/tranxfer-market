import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import PlayerCard from '@/components/PlayerCard'
import { PlayerProfile } from '@/types'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'

export default function ShortlistScreen() {
  const { userId } = useAuth()
  const { devRole } = useDevRole()
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isScout, setIsScout] = useState<boolean | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Dev override
  const resolvedIsScout      = __DEV__ ? devRole !== 'player'           : isScout
  const resolvedIsSubscribed = __DEV__ ? devRole === 'scout_subscribed' : isSubscribed

  const fetchShortlist = useCallback(async () => {
    if (!userId) return

    const { data: scout } = await supabase
      .from('scout_profiles')
      .select('id, subscription_tier')
      .eq('user_id', userId)
      .maybeSingle()

    if (!scout) {
      setIsScout(false)
      return
    }

    setIsScout(true)
    setIsSubscribed(scout.subscription_tier !== 'free' && scout.subscription_tier != null)

    const { data: watchlist } = await supabase
      .from('watchlist_items')
      .select('player_id')
      .eq('scout_id', userId)
      .order('created_at', { ascending: false })

    if (!watchlist || watchlist.length === 0) {
      setPlayers([])
      return
    }

    const ids = watchlist.map(w => w.player_id)

    const { data: profileData } = await supabase
      .from('player_profiles')
      .select('id,user_id,first_name,last_name,primary_position,secondary_positions,age,current_club,contract_status,nationality,is_verified,appearances,goals,assists')
      .in('id', ids)

    if (profileData) {
      // Preserve watchlist order
      const map = new Map(profileData.map(p => [p.id, p]))
      setPlayers(ids.map(id => map.get(id)).filter(Boolean) as PlayerProfile[])
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    fetchShortlist().finally(() => setLoading(false))
  }, [fetchShortlist])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchShortlist()
    setRefreshing(false)
  }

  // Non-scout placeholder
  if (resolvedIsScout === false) {
    return (
      <ScreenBackground>
        <ScreenHeader />
        <View style={styles.locked}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Scout accounts only</Text>
          <Text style={styles.lockedSub}>
            Shortlists are available to scouts and recruiters.{'\n'}
            Switch to a scout account to use this feature.
          </Text>
        </View>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground>
      <ScreenHeader />

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
          ListHeaderComponent={
            !resolvedIsSubscribed && players.length > 0 ? (
              <View style={styles.gateBanner}>
                <Text style={styles.gateBannerText}>
                  Subscribe to reveal full player details and club info.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No players shortlisted</Text>
              <Text style={styles.emptySub}>
                Tap SHORTLIST on any player card to save them here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              scoutId={userId ?? undefined}
              isShortlisted
              isSubscribed={resolvedIsSubscribed}
            />
          )}
        />
      )}
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg, paddingTop: 30, paddingBottom: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Gate banner for unsubscribed scouts
  gateBanner: {
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  gateBannerText: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Non-scout locked state
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  lockedIcon: { fontSize: 40 },
  lockedTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  lockedSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
