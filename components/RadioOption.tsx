import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '@/constants/theme'

interface Props {
  label: string
  sub?: string
  selected: boolean
  onPress: () => void
}

export default function RadioOption({ label, sub, selected, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected && <View style={styles.inner} />}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{label}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  outer: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  outerSelected: { borderColor: Colors.brand },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand },
  labels: { flex: 1 },
  label: { fontSize: 15, color: Colors.text, letterSpacing: 0.2, marginTop: 2 },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
})
