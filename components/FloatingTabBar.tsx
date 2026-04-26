import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * FloatingTabBar
 *
 * Structure:
 *   ┌─── outerWrapper (position absolute, bottom 30, left/right 16) ───┐
 *   │  ┌─── pill (borderRadius 10, overflow hidden, 100% of wrapper) ──┐│
 *   │  │  BlurView + green overlay (background)                        ││
 *   │  │  tab buttons row                                               ││
 *   │  └────────────────────────────────────────────────────────────────┘│
 *   └──────────────────────────────────────────────────────────────────────┘
 */
export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    // Outer wrapper — fixed position, 16px padding each side, 30px from bottom
    <View style={[styles.outerWrapper, { bottom: 30 + insets.bottom }]}>
      {/* Pill — fills 100% of wrapper, rounded, clipped */}
      <View style={styles.pill}>

        {/* Blur + green tint background */}
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
          <View style={styles.overlay} />
        </BlurView>

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]

          // Skip hidden screens — check href:null (Expo Router) and route name
          const expoOpts = options as any
          if (expoOpts.href === null || expoOpts.href === false) return null
          if (route.name.includes('conversation')) return null

          const label = options.title ?? route.name
          const isFocused = state.index === index

          const tintColor = isFocused
            ? (options.tabBarActiveTintColor ?? '#002513')
            : (options.tabBarInactiveTintColor ?? '#008a49')

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
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({ focused: isFocused, color: tintColor, size: 24 })}
              <Text style={[styles.label, { color: tintColor }]}>
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
  // Fixed wrapper — stays put regardless of scroll
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    // iOS shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 35,
    // Android shadow
    elevation: 12,
  },

  // Pill — 100% of wrapper width, rounded corners, clips the blur
  pill: {
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
  },

  // Green tint layer over the blur
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 135, 0.8)',
  },

  // Each tab button
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 7,
  },

  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
})
