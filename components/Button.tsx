import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'

interface Props {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  flex?: number
  style?: ViewStyle
}

export default function Button({ label, onPress, variant = 'primary', flex, style }: Props) {
  const btnStyle = variant === 'primary' ? styles.primary
    : variant === 'secondary' ? styles.secondary
    : styles.outline
  const txtStyle = variant === 'primary' ? styles.primaryText
    : variant === 'secondary' ? styles.secondaryText
    : styles.outlineText
  return (
    <TouchableOpacity
      style={[styles.base, btnStyle, flex !== undefined && { flex }, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={txtStyle}>{label}</Text>
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

  // primary — brand green fill
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

  // secondary — white fill
  secondary: {
    backgroundColor: '#ffffff',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },

  // outline — transparent + white border
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
