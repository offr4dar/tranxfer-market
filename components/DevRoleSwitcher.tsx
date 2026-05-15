import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDevRole, DevRole } from '@/lib/devRole'

const LABELS: Record<DevRole, string> = {
  player:             '👤  PLAYER',
  scout_free:         '🔍  SCOUT FREE',
  scout_subscribed:   '🔍  SCOUT PRO',
  scout_unverified:   '🆕  SCOUT NEW',
}

const COLORS: Record<DevRole, string> = {
  player:             '#8AABFF',
  scout_free:         '#C49B1E',
  scout_subscribed:   '#00FF87',
  scout_unverified:   '#E85D75',
}

export default function DevRoleSwitcher() {
  const { devRole, cycleRole } = useDevRole()
  const insets = useSafeAreaInsets()

  return (
    <TouchableOpacity
      onPress={cycleRole}
      activeOpacity={0.8}
      style={[
        styles.pill,
        { bottom: 120 + insets.bottom, borderColor: COLORS[devRole] },
      ]}
    >
      <Text style={[styles.label, { color: COLORS[devRole] }]}>
        {LABELS[devRole]}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
})
