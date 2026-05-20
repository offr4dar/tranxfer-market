import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDevRole } from '@/lib/devRole'

const ALWAYS_HIDDEN = new Set(['search'])
const SCOUT_ONLY    = new Set(['feed', 'shortlist'])
const PLAYER_ONLY   = new Set(['media'])

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { devRole } = useDevRole()
  const isPlayer = devRole === 'player'

  return (
    <View style={[styles.outerWrapper, { bottom: 30 + insets.bottom }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]

          if (route.name.includes('conversation')) return null
          if (ALWAYS_HIDDEN.has(route.name)) return null
          if (isPlayer && SCOUT_ONLY.has(route.name)) return null
          if (!isPlayer && PLAYER_ONLY.has(route.name)) return null

          const label = options.title ?? route.name
          const isFocused = state.index === index
          const iconColor = isFocused ? '#0EDA7A' : '#B4B4B4'

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
          }

          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key })

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabItem, isFocused && styles.tabItemSelected]}
              activeOpacity={0.7}
            >
              <View style={styles.iconSlot}>
                {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 30 })}
              </View>
              <Text style={[styles.label, { color: iconColor }]}>
                {label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },

  pill: {
    height: 71,
    borderRadius: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#313131',
  },

  tabItem: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  tabItemSelected: {
    backgroundColor: '#232323',
  },

  iconSlot: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
})
