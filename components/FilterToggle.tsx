import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Radius } from '@/constants/theme'

export type FilterToggleOption = 'all' | 'available'

interface FilterToggleProps {
  value: FilterToggleOption
  onChange: (value: FilterToggleOption) => void
}

export default function FilterToggle({ value, onChange }: FilterToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, value === 'all' && styles.tabActive]}
        onPress={() => onChange('all')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, value === 'all' && styles.labelActive]}>
          ALL
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, value === 'available' && styles.tabActive]}
        onPress={() => onChange('available')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, value === 'available' && styles.labelActive]}>
          AVAILABLE
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#284135',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tabActive: {
    backgroundColor: Colors.brand,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.background,
  },
})
