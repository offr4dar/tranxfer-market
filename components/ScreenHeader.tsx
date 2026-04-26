import { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XLogoMark } from '@/components/icons/TabIcons'

const BRAND = '#00FF87'

interface ScreenHeaderProps {
  /** Optional right-side slot — filter toggles, action buttons, etc. */
  right?: ReactNode
}

/**
 * ScreenHeader — single source of truth for all tab screen headers.
 *
 * Default layout: logo on left, optional right slot.
 *
 * Design tokens:
 *   - BlurView dark, intensity 60
 *   - Background overlay: rgba(0,0,0,0.35)
 *   - Border bottom: 1px #003B1F
 *   - Safe-area aware top padding
 */
export default function ScreenHeader({ right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()
  const topPad = Math.max(insets.top + 10, 50)

  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={[styles.blur, { paddingTop: topPad }]}
    >
      <View style={styles.overlay} />
      <View style={styles.row}>
        {/* Logo — always present on the left */}
        <View style={styles.left}>
          <XLogoMark color={BRAND} size={57} />
        </View>

        {/* Right slot — page-specific content */}
        {right && <View style={styles.right}>{right}</View>}
      </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  blur: {
    borderBottomWidth: 1,
    borderBottomColor: '#003B1F',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
})
