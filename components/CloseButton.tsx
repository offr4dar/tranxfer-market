import { Pressable } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface Props {
  onPress: () => void
  color?: string
  size?: number
}

export default function CloseButton({ onPress, color = '#ffffff', size = 21 }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={12}>
      <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
        <Path
          d="M1 1L20 20M20 1L1 20"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  )
}
