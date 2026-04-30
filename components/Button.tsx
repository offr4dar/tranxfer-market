import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'

interface Props {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline'
  flex?: number
  style?: ViewStyle
}

export default function Button({ label, onPress, variant = 'primary', flex, style }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.outline,
        flex !== undefined && { flex },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={variant === 'primary' ? styles.primaryText : styles.outlineText}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 57,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: {
    backgroundColor: '#00FF87',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },

  outline: {
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  outlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
