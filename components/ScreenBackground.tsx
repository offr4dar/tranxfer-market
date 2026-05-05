import { useRef, useCallback } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Colors } from '@/constants/theme'

interface ScreenBackgroundProps {
  children: React.ReactNode
}

export default function ScreenBackground({ children }: ScreenBackgroundProps) {
  const opacity    = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(24)).current

  useFocusEffect(
    useCallback(() => {
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
    <View style={styles.root}>
      <Animated.View
        style={[styles.content, { opacity, transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
})
