import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDevRole } from '@/lib/devRole'

/**
 * FloatingTabBar
 *
 * Structure:
 *   ┌─── outerWrapper (position absolute, bottom 30, left/right 16) ───┐
 *   │  ┌─── pill (borderRadius 10, overflow hidden) ───────────────────┐│
 *   │  │  BlurView + green overlay (rgba(0,255,135,0.8))               ││
 *   │  │  tab buttons row                                               ││
 *   │  │    Feed tab: black pill when selected                          ││
 *   │  └────────────────────────────────────────────────────────────────┘│
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Colors (from Figma):
 *   selected feed   → white icon/label, black pill bg
 *   selected other  → black icon/label
 *   unselected      → #008A49 icon/label
 */
const ALWAYS_HIDDEN = new Set(['search'])
const SCOUT_ONLY = new Set(['feed', 'shortlist'])
const PLAYER_ONLY = new Set(['profile'])

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { devRole } = useDevRole()
  const isPlayer = devRole === 'player'

  return (
    <View style={[styles.outerWrapper, { bottom: 30 + insets.bottom }]}>
      <View style={styles.pill}>

        {/* Blur + green tint background */}
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
          <View style={styles.overlay} />
        </BlurView>

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]

          if (route.name.includes('conversation')) return null
          if (ALWAYS_HIDDEN.has(route.name)) return null
          if (isPlayer && SCOUT_ONLY.has(route.name)) return null
          if (!isPlayer && PLAYER_ONLY.has(route.name)) return null

          const label = options.title ?? route.name
          const isFocused = state.index === index
          const isFeed = route.name === 'feed'

          const iconColor = isFeed
            ? (isFocused ? '#FFFFFF' : '#0EDA7A')
            : (isFocused ? '#000000' : '#008A49')

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
              style={[styles.tabItem, isFeed && (isFocused ? styles.feedPillSelected : styles.feedPillDefault)]}
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
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 135, 0.8)',
  },

  tabItem: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  feedPillSelected: {
    backgroundColor: '#000000',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },

  feedPillDefault: {
    backgroundColor: '#08703F',
    alignSelf: 'stretch',
    justifyContent: 'center',
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
