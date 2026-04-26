import { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import PlayerCard, { PlayerProfile } from '@/components/PlayerCard'
import FilterToggle, { FilterToggleOption } from '@/components/FilterToggle'
import ScreenHeader from '@/components/ScreenHeader'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'

const POSITIONS = ['All','GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST']

export default function SearchScreen() {
  const [query, setQuery]           = useState('')
  const [position, setPosition]     = useState('All')
  const [availability, setAvailability] = useState<FilterToggleOption>('all')
  const [results, setResults]       = useState<PlayerProfile[]>([])
  const [loading, setLoading]       = useState(false)
  const [searched, setSearched]     = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (
    q: string, pos: string, avail: FilterToggleOption
  ) => {
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
    if (pos !== 'All') qb = qb.eq('primary_position', pos)
    if (avail === 'available') {
      qb = qb.in('contract_status', ['available_now', 'available_eot'])
    }

    const { data } = await qb.limit(50)
    setResults((data as PlayerProfile[]) ?? [])
    setLoading(false)
  }, [])

  const onChangeText = (text: string) => {
    setQuery(text)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(text, position, availability), 300)
  }

  const onPositionPress = (pos: string) => {
    setPosition(pos)
    search(query, pos, availability)
  }

  const onAvailabilityChange = (avail: FilterToggleOption) => {
    setAvailability(avail)
    search(query, position, avail)
  }

  return (
    <ScreenBackground>
      <ScreenHeader />

      {/* Search input */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={onChangeText}
            placeholder="Name, club, nationality…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => search(query, position, availability)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false) }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Position chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {POSITIONS.map(pos => (
          <TouchableOpacity
            key={pos}
            style={[styles.chip, position === pos && styles.chipActive]}
            onPress={() => onPositionPress(pos)}
          >
            <Text style={[styles.chipText, position === pos && styles.chipTextActive]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Availability toggle */}
      <View style={styles.toggleRow}>
        <FilterToggle value={availability} onChange={onAvailabilityChange} />
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
                  : 'Search by name, club, position or availability.'}
              </Text>
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
  inputSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 48,
    gap: Spacing.sm,
  },
  inputIcon: { fontSize: 15 },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  clearBtn: { color: Colors.textMuted, fontSize: 16 },
  chips: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: Colors.background, fontWeight: '700' },
  toggleRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  list: { padding: Spacing.lg, paddingBottom: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
