import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoginOverlay from '@/components/LoginOverlay'

const { width: W, height: H } = Dimensions.get('window')

// ─── Image geometry (matches splash.tsx pan position) ────────────────────────
const IMG_W         = W * 3.165
const IMG_H         = IMG_W * (2496 / 3344)
const IMG_Y         = H / 2 - 21 - IMG_H / 2
const WELCOME_IMG_X = -W * 1.3627

const PADDING = 20
const BTN_H   = 57
const BTN_R   = 100

export default function WelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <View style={styles.root}>

      {/* Background image */}
      <View
        style={[
          styles.bgWrapper,
          { top: IMG_Y, width: IMG_W, height: IMG_H },
          { transform: [{ translateX: WELCOME_IMG_X }] },
        ]}
      >
        <Image
          source={require('../../assets/splash-bg.png')}
          style={{ width: IMG_W, height: IMG_H }}
          resizeMode="cover"
        />
      </View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', '#001209cc', '#001209']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 0.72 }}
        pointerEvents="none"
      />

      {/* Content — anchored to bottom */}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>

        {/* "Login here" divider */}
        <View style={styles.loginRow}>
          <View style={styles.shortLine} />
          <Text style={styles.loginText}>LOGIN HERE</Text>
          <View style={styles.fullLine} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>

          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => setShowLogin(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.emailBtnText}>BY EMAIL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/onboarding')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>CREATE AN ACCOUNT</Text>
          </TouchableOpacity>

        </View>
      </View>

      <LoginOverlay visible={showLogin} onClose={() => setShowLogin(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#001209',
  },
  bgWrapper: {
    position: 'absolute',
    left: 0,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: PADDING,
    gap: 40,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shortLine: {
    width: 29,
    height: 4,
    backgroundColor: '#ffffff',
  },
  fullLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#ffffff',
  },
  loginText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  buttonGroup: {
    gap: 32,
  },
  emailBtn: {
    height: BTN_H,
    backgroundColor: '#ffffff',
    borderRadius: BTN_R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    height: BTN_H,
    backgroundColor: '#00FF87',
    borderRadius: BTN_R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
