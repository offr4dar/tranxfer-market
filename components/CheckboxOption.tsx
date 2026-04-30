import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Colors } from '@/constants/theme'

function Tick() {
  return (
    <Svg width={11} height={9} viewBox="0 0 14 11" fill="none">
      <Path
        d="M1 5.5L5 9.5L13 1"
        stroke="#001209"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface Props {
  label: string
  sub?: string
  checked: boolean
  onPress: () => void
}

export default function CheckboxOption({ label, sub, checked, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Tick />}
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
  box: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  boxChecked: { backgroundColor: Colors.brand, borderWidth: 0 },
  labels: { flex: 1 },
  label: { fontSize: 15, color: Colors.text, letterSpacing: 0.2, marginTop: 2 },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
})
