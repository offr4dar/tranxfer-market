import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import PlayerCard from '@/components/PlayerCard'
import { PlayerProfile } from '@/types'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'
import { haversineDistance } from '@/lib/geo'
import { useDevRole } from '@/lib/devRole'
import { FilterIcon, SearchIcon } from '@/components/icons/TabIcons'
import Input from '@/components/Input'
import CloseButton from '@/components/CloseButton'
import FilterPanel, {
  PlayerFilters, DEFAULT_FILTERS, isFiltered, ageBracketRange,
} from '@/components/FilterPanel'
import PlayerFilterPanel, {
  ScoutFilters, DEFAULT_SCOUT_FILTERS, isScoutFiltered,
} from '@/components/PlayerFilterPanel'

function ageBracketToRange(bracket: string) {
  return ageBracketRange(bracket)
}

export default function FeedScreen() {
  const { userId } = useAuth()
  const { devRole } = useDevRole()
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS)
  const [scoutFilters, setScoutFilters] = useState<ScoutFilters>(DEFAULT_SCOUT_FILTERS)

  // Search state — input value vs submitted value (fetch only triggers on submit)
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  // Scout-specific state (real data)
  const [isScout, setIsScout] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [clearanceCheck, setClearanceCheck] = useState<boolean | null>(null)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [scoutLat, setScoutLat] = useState<number | null>(null)
  const [scoutLng, setScoutLng] = useState<number | null>(null)
  const [playerLat, setPlayerLat] = useState<number | null>(null)
  const [playerLng, setPlayerLng] = useState<number | null>(null)

  // Dev override — replaces real role flags in __DEV__ builds
  const resolvedIsScout        = __DEV__ ? devRole !== 'player'           : isScout
  const resolvedIsSubscribed   = __DEV__ ? devRole === 'scout_subscribed' : isSubscribed
  const resolvedClearanceCheck = __DEV__ ? true                          : clearanceCheck
  const resolvedScoutId        = resolvedIsScout ? (userId ?? undefined) : undefined

  const fetchScoutContext = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('scout_profiles')
      .select('id, subscription_tier, clearance_check, lat, lng')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) console.error('fetchScoutContext:', error.message)
    if (!data) return

    setIsScout(true)
    setIsSubscribed(data.subscription_tier !== 'free' && data.subscription_tier != null)
    setClearanceCheck(data.clearance_check === true)
    setScoutLat(data.lat ?? null)
    setScoutLng(data.lng ?? null)

    const { data: watchlist, error: watchlistErr } = await supabase
      .from('watchlist_items')
      .select('player_id')
      .eq('scout_id', userId)

    if (watchlistErr) console.error('fetchScoutContext watchlist:', watchlistErr.message)
    if (watchlist) {
      setShortlistedIds(new Set(watchlist.map(w => w.player_id)))
    }
  }, [userId])

  const fetchPlayerContext = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('player_profiles')
      .select('lat, lng')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) console.error('fetchPlayerContext:', error.message)
    if (data) {
      setPlayerLat(data.lat ?? null)
      setPlayerLng(data.lng ?? null)
    }
  }, [userId])

  const fetchPlayers = useCallback(async () => {
    let query = supabase
      .from('player_profiles')
      .select('id,user_id,first_name,last_name,primary_position,secondary_positions,age,current_club,contract_status,nationality,is_verified,is_featured,appearances,goals,assists,lat,lng,last_activity_at')
      .eq('is_searchable', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (submittedQuery.trim()) {
      query = query.or(
        `first_name.ilike.%${submittedQuery}%,last_name.ilike.%${submittedQuery}%,current_club.ilike.%${submittedQuery}%`
      )
    }

    if (filters.gender)                query = query.eq('gender', filters.gender)
    if (filters.foot)                  query = query.eq('preferred_foot', filters.foot)
    if (filters.availability.length)   query = query.in('contract_status', filters.availability)
    if (filters.positions.length)      query = query.in('primary_position', filters.positions)
    if (filters.leagueLevel.length)    query = query.in('league_level', filters.leagueLevel)
    if (filters.ageBracket) {
      const [min, max] = ageBracketToRange(filters.ageBracket)
      if (min !== null) query = query.gte('age', min)
      if (max !== null) query = query.lte('age', max)
    }

    const { data, error } = await query
    if (error) console.error('fetchPlayers:', error.message)
    else if (data) setPlayers(data as PlayerProfile[])
  }, [filters, submittedQuery])

  useEffect(() => {
    setLoading(true)
    const tasks = [fetchPlayers(), fetchScoutContext()]
    if (!resolvedIsScout) tasks.push(fetchPlayerContext())
    Promise.all(tasks).finally(() => setLoading(false))
  }, [fetchPlayers, fetchScoutContext, fetchPlayerContext, resolvedIsScout])

  const onRefresh = async () => {
    setRefreshing(true)
    const tasks = [fetchPlayers(), fetchScoutContext()]
    if (!resolvedIsScout) tasks.push(fetchPlayerContext())
    await Promise.all(tasks)
    setRefreshing(false)
  }

  const handleApply = (newFilters: PlayerFilters) => {
    setFilters(newFilters)
    setFilterOpen(false)
  }

  const handleSearch = () => setSubmittedQuery(searchQuery)

  const handleClearSearch = () => {
    setSearchQuery('')
    setSubmittedQuery('')
  }

  const active = resolvedIsScout
    ? (isFiltered(filters) || !!submittedQuery.trim())
    : isScoutFiltered(scoutFilters)

  const displayPlayers = useMemo(() => {
    if (!filters.radiusMiles || scoutLat == null || scoutLng == null) return players
    return players.filter(p => {
      if (p.lat == null || p.lng == null) return true
      return haversineDistance(scoutLat, scoutLng, p.lat, p.lng) <= filters.radiusMiles!
    })
  }, [players, filters.radiusMiles, scoutLat, scoutLng])

  // Scouts who haven't been DBS-verified yet see a blocking screen
  if (resolvedIsScout && !loading && resolvedClearanceCheck === false) {
    return (
      <ScreenBackground>
        <ScreenHeader />
        <ScrollView contentContainerStyle={styles.pendingScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.pending}>
            <Svg width={72} height={72} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z"
                fill="rgba(229,26,118,0.12)" stroke="#e51a76" strokeWidth={1.5}
              />
              <Path
                d="M9 12l2 2 4-4"
                stroke="#e51a76" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              />
            </Svg>

            <Text style={styles.pendingTitle}>PENDING VERIFICATION</Text>

            <Text style={styles.pendingBody}>
              Before you can access player profiles, our team needs to verify your DBS certificate.
            </Text>

            <View style={styles.pendingDivider} />

            <Text style={styles.pendingEmphasis}>
              The safety of young people in football is our highest priority.
            </Text>
            <Text style={styles.pendingBody}>
              A valid Enhanced DBS check is a mandatory requirement for every scout and agent on Tranxfer Market — no exceptions.
            </Text>

            <View style={styles.pendingDivider} />

            <Text style={styles.pendingBody}>
              We will notify you once your account is active. This usually takes 1–2 working days.
            </Text>
            <Text style={styles.pendingContact}>
              Questions? Contact us at{' '}
              <Text style={styles.pendingContactLink}>safeguarding@tranxfermarket.com</Text>
            </Text>
          </View>
        </ScrollView>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground>
      <ScreenHeader
        right={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.7}
          >
            <FilterIcon color={Colors.brand} size={30} />
            {active && <View style={styles.filterDot} />}
          </TouchableOpacity>
        }
      />

      {resolvedIsScout && (
        <View style={styles.searchRow}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Name, club, nationality…"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            leftIcon={<SearchIcon color="#909090" size={20} />}
            rightElement={
              searchQuery.length > 0
                ? <CloseButton onPress={handleClearSearch} size={16} />
                : undefined
            }
          />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={displayPlayers}
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
              <Text style={styles.emptyTitle}>No players found</Text>
              <Text style={styles.emptySub}>
                {active
                  ? 'No results match your search or filters — try adjusting them.'
                  : 'Check back soon — the talent pool is filling up.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              scoutId={resolvedScoutId}
              isShortlisted={shortlistedIds.has(item.id)}
              isSubscribed={resolvedIsSubscribed}
            />
          )}
        />
      )}

      {resolvedIsScout ? (
        <FilterPanel
          visible={filterOpen}
          initialFilters={filters}
          scoutHasLocation={scoutLat != null}
          onClose={() => setFilterOpen(false)}
          onApply={handleApply}
        />
      ) : (
        <PlayerFilterPanel
          visible={filterOpen}
          initialFilters={scoutFilters}
          hasLocation={playerLat !== null}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => { setScoutFilters(f); setFilterOpen(false) }}
        />
      )}
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  filterBtn: { padding: 4 },
  filterDot: {
    position: 'absolute', top: 2, right: 2,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#0F5FFF',
  },
  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  list:   { padding: 16, paddingTop: 12, paddingBottom: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySub:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Pending DBS verification
  pendingScroll: { flexGrow: 1, justifyContent: 'center' },
  pending: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 16 },
  pendingTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22, letterSpacing: 2, textTransform: 'uppercase',
    color: Colors.text, marginTop: 8,
  },
  pendingBody: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },
  pendingEmphasis: {
    fontSize: 15, color: Colors.text, textAlign: 'center', lineHeight: 22, fontWeight: '600',
  },
  pendingDivider: {
    width: 40, height: 1, backgroundColor: Colors.border, marginVertical: 4,
  },
  pendingContact: {
    fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 4,
  },
  pendingContactLink: { color: Colors.text, textDecorationLine: 'underline' },
})
