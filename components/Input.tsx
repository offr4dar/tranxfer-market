import { forwardRef, ReactNode } from 'react'
import { View, TextInput, TextInputProps, StyleSheet, StyleProp, ViewStyle } from 'react-native'

interface Props extends TextInputProps {
  leftIcon?: ReactNode
  rightElement?: ReactNode
  containerStyle?: StyleProp<ViewStyle>
}

const Input = forwardRef<TextInput, Props>(
  ({ leftIcon, rightElement, style, containerStyle, ...props }, ref) => (
    <View style={[styles.container, !!(leftIcon || rightElement) && styles.withSlots, containerStyle]}>
      {leftIcon}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor="#909090"
        {...props}
      />
      {rightElement}
    </View>
  )
)

export default Input

const styles = StyleSheet.create({
  container: {
    height: 59,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 1,
    borderColor: '#4f4f4f',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  withSlots: {
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.32,
  },
})
