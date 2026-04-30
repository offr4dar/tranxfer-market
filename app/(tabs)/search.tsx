import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import PlayerCard from '@/components/PlayerCard'
import { PlayerProfile } from '@/types'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'
import { useDevRole } from '@/lib/devRole'
import { FilterIcon, SearchIcon } from '@/components/icons/TabIcons'
import Input from '@/components/Input'
import CloseButton from '@/components/CloseButton'
import FilterPanel, {
  PlayerFilters, DEFAULT_FILTERS, isFiltered, ageBracketRange,
} from '@/components/FilterPanel'

export default function SearchScreen() {
  const { userId } = useAuth()
  const { devRole } = useDevRole()
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<PlayerProfile[]>([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters]   = useState<PlayerFilters>(DEFAULT_FILTERS)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scout-specific state (real data)
  const [isScout, setIsScout] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())

  // Dev override
  const resolvedIsScout      = __DEV__ ? devRole !== 'player'           : isScout
  const resolvedIsSubscribed = __DEV__ ? devRole === 'scout_subscribed' : isSubscribed
  const resolvedScoutId      = resolvedIsScout ? (userId ?? undefined) : undefined

  useEffect(() => {
    if (!userId) return
    const loadScoutContext = async () => {
      const { data } = await supabase
        .from('scout_profiles')
        .select('id, subscription_tier')
        .eq('user_id', userId)
        .maybeSingle()

      if (!data) return

      setIsScout(true)
      setIsSubscribed(data.subscription_tier !== 'free' && data.subscription_tier != null)

      const { data: watchlist } = await supabase
        .from('watchlist_items')
        .select('player_id')
        .eq('scout_id', userId)

      if (watchlist) {
        setShortlistedIds(new Set(watchlist.map(w => w.player_id)))
      }
    }
    loadScoutContext()
  }, [userId])

  const search = useCallback(async (q: string, f: PlayerFilters) => {
    setLoading(true)
    setSearched(true)

    let qb = supabase
      .from('player_profiles')
      .select('id,user_id,first_name,last_name,primary_position,age,current_club,contract_status,nationality,is_verified')
      .eq('is_searchable', true)

    if (q.trim()) {
      qb = qb.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,current_club.ilike.%${q}%`
      )
    }

    if (f.gender)               qb = qb.eq('gender', f.gender)
    if (f.foot)                 qb = qb.eq('preferred_foot', f.foot)
    if (f.availability.length)  qb = qb.in('contract_status', f.availability)
    if (f.positions.length)     qb = qb.in('primary_position', f.positions)
    if (f.leagueLevel.length)   qb = qb.in('league_level', f.leagueLevel)
    if (f.ageBracket) {
      const [min, max] = ageBracketRange(f.ageBracket)
      if (min !== null) qb = qb.gte('age', min)
      if (max !== null) qb = qb.lte('age', max)
    }

    const { data } = await qb.limit(50)
    setResults((data as PlayerProfile[]) ?? [])
    setLoading(false)
  }, [])

  const onChangeText = (text: string) => {
    setQuery(text)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(text, filters), 300)
  }

  const handleApply = (newFilters: PlayerFilters) => {
    setFilters(newFilters)
    setFilterOpen(false)
    search(query, newFilters)
  }

  const active = isFiltered(filters)

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

      {/* Search input */}
      <View style={styles.inputSection}>
        <Input
          value={query}
          onChangeText={onChangeText}
          placeholder="Name, club, nationality…"
          returnKeyType="search"
          onSubmitEditing={() => search(query, filters)}
          leftIcon={<SearchIcon color="#909090" size={20} />}
          rightElement={
            query.length > 0
              ? <CloseButton onPress={() => { setQuery(''); setResults([]); setSearched(false) }} size={16} />
              : undefined
          }
        />
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.brand} /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{searched ? '😶' : '🔍'}</Text>
              <Text style={styles.emptyTitle}>
                {searched ? 'No players found' : 'Scout the talent pool'}
              </Text>
              <Text style={styles.emptySub}>
                {searched
                  ? 'Try adjusting your search or filters.'
                  : 'Search by name, club, or use filters to narrow results.'}
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

      <FilterPanel
        visible={filterOpen}
        initialFilters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={handleApply}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  filterBtn: { padding: 4 },
  filterDot: {
    position: 'absolute', top: 2, right: 2,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#e51a76',
  },
  inputSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  list: { padding: Spacing.lg, paddingBottom: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
