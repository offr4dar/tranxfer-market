import { useRef, useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Colors, Radius } from '@/constants/theme'

export type FilterToggleOption = 'all' | 'players' | 'agents'

const TABS: { key: FilterToggleOption; label: string }[] = [
  { key: 'all',     label: 'ALL' },
  { key: 'players', label: 'PLAYERS' },
  { key: 'agents',  label: 'AGENTS' },
]

interface FilterToggleProps {
  value: FilterToggleOption
  onChange: (value: FilterToggleOption) => void
}

export default function FilterToggle({ value, onChange }: FilterToggleProps) {
  const slideAnim = useRef(new Animated.Value(0)).current
  const [tabWidth, setTabWidth] = useState(0)

  useEffect(() => {
    const index = TABS.findIndex(t => t.key === value)
    Animated.timing(slideAnim, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [value, tabWidth])

  const handlePress = (key: FilterToggleOption, index: number) => {
    Animated.timing(slideAnim, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: true,
    }).start()
    onChange(key)
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.tabRow}
        onLayout={e => setTabWidth(e.nativeEvent.layout.width / TABS.length)}
      >
        {/* Sliding green pill */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slider,
              { width: tabWidth, transform: [{ translateX: slideAnim }] },
            ]}
          />
        )}

        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handlePress(tab.key, index)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, value === tab.key && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#284135',
    borderRadius: Radius.full,
    padding: 4,
  },

  tabRow: {
    flexDirection: 'row',
  },

  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
  },

  tab: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 1,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },

  labelActive: {
    color: '#000000',
  },
})
