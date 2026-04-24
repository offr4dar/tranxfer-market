import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native'
import { Colors, Spacing, Radius } from '@/constants/theme'

const POSITIONS = ['All', 'GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST']

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('All')

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Players</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Name, club, nationality..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[styles.filterChip, selectedPosition === pos && styles.filterChipActive]}
            onPress={() => setSelectedPosition(pos)}
          >
            <Text style={[styles.filterText, selectedPosition === pos && styles.filterTextActive]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Scout the talent pool</Text>
        <Text style={styles.emptyBody}>
          Advanced search, filters, and shortlisting coming in Phase 3.{'\n'}
          Available to subscribed agents.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 48,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: 15,
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterChipActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  filterText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: Colors.background, fontWeight: '700' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyBody: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
})
