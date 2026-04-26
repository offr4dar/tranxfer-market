import { useRef, useCallback } from 'react'
import { Animated, ImageBackground, StyleSheet, View } from 'react-native'
import { useFocusEffect } from 'expo-router'

const BG = require('@/assets/Frame 44.jpg')

interface ScreenBackgroundProps {
  children: React.ReactNode
}

/**
 * ScreenBackground — background image + slide-in transition for all interior screens.
 *
 * - ImageBackground stays fixed (no jank)
 * - Content layer fades + slides in from the right when the tab gains focus
 * - lazy: false in _layout.tsx pre-mounts all screens so there's no first-load flash
 */
export default function ScreenBackground({ children }: ScreenBackgroundProps) {
  const opacity    = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(24)).current

  useFocusEffect(
    useCallback(() => {
      // Reset then animate in
      opacity.setValue(0)
      translateX.setValue(24)

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])
  )

  return (
    <ImageBackground
      source={BG}
      style={styles.root}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      {/* Static dark overlay — always visible, no animation */}
      <View style={styles.overlay} />

      {/* Content layer — slides + fades in on focus */}
      <Animated.View
        style={[
          styles.content,
          { opacity, transform: [{ translateX }] },
        ]}
      >
        {children}
      </Animated.View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  image: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  content: {
    flex: 1,
  },
})
