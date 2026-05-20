/**
 * CircleFAB — shared circular floating action button.
 *
 * Matches the white-circle style used on the scout view of a player profile
 * (app/player/[id].tsx). Both that screen and the player's own profile
 * import from here so the appearance is always in sync.
 *
 * Usage:
 *   <FABStack bottom={insets.bottom + PROFILE_FAB_BOTTOM}>
 *     <CircleFAB onPress={...} icon={<SomeIcon />} />
 *     <CircleFAB onPress={...} icon={<AnotherIcon />} loading={toggling} />
 *   </FABStack>
 *
 * PROFILE_FAB_BOTTOM is exported so every screen uses the same baseline.
 */

import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { Colors, Spacing } from '@/constants/theme'

export const PROFILE_FAB_BOTTOM = 148

// ─── Individual circular button ──────────────────────────────────────────────
interface CircleFABProps {
  /** Icon or any ReactNode rendered inside the circle */
  icon: React.ReactNode
  onPress: () => void
  /** Shows a spinner in place of the icon while true */
  loading?: boolean
  /** Optionally override the background (defaults to white = Colors.text) */
  backgroundColor?: string
}

export function CircleFAB({ icon, onPress, loading = false, backgroundColor }: CircleFABProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        backgroundColor ? { backgroundColor } : undefined,
        pressed && styles.fabPressed,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
    >
      {loading
        ? <ActivityIndicator color="#000" size="small" />
        : icon}
    </Pressable>
  )
}

// ─── Stack container ─────────────────────────────────────────────────────────
interface FABStackProps {
  children: React.ReactNode
  /** Absolute bottom position (caller should add insets.bottom) */
  bottom: number
  right?: number
}

export function FABStack({ children, bottom, right = Spacing.lg }: FABStackProps) {
  return (
    <View style={[styles.stack, { bottom, right }]}>
      {children}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fab: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    backgroundColor: Colors.text,   // white — matches scout profile FABs
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    backgroundColor: '#d4d4d4',
  },
  stack: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
})
