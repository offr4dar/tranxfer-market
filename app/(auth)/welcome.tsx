import { } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Anton_400Regular, useFonts } from '@expo-google-fonts/anton'

WebBrowser.maybeCompleteAuthSession()

const { width: W, height: H } = Dimensions.get('window')

// ─── Image geometry (Figma: same image, different X offset per screen) ────────
const IMG_W         = W * 3.165                    // image width = 316.5% of screen
const IMG_H         = IMG_W * (2496 / 3344)        // maintain 3344×2496 aspect ratio
const IMG_Y         = H / 2 - 21 - IMG_H / 2      // vertically centred -21px (Figma)
const SPLASH_IMG_X  = -W * 0.3787                  // Figma splash: left -37.87%
const WELCOME_IMG_X = -W * 1.3627                  // Figma welcome: left -136.27%

const PADDING = 20
const BTN_H   = 57
const BTN_R   = 100

export default function WelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>

      {/* Background image — already panned to position by splash transition */}
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

      {/* Bottom gradient — ensures content is readable over the image */}
      <LinearGradient
        colors={['transparent', '#001209cc', '#001209']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 0.72 }}
        pointerEvents="none"
      />

      {/* Content — anchored to bottom */}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>

        {/* "Login here" row */}
        <View style={styles.loginRow}>
          <View style={styles.shortLine} />
          <Text style={styles.loginText}>LOGIN HERE</Text>
          <View style={styles.fullLine} />
        </View>

        {/* Button group */}
        <View style={styles.buttonGroup}>

          {/* Google + Email */}
          <View style={styles.topBtnRow}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <GoogleIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>BY EMAIL</Text>
            </TouchableOpacity>
          </View>

          {/* Create account */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/onboarding')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>CREATE AN ACCOUNT</Text>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  )
}

// ─── Google "G" icon ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id="clip">
          <Rect width={24} height={24} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip)">
        <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </G>
    </Svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#001209',
  },

  // Positioned image — animated horizontally
  bgWrapper: {
    position: 'absolute',
    left: 0,
  },

  // Bottom-anchored content
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: PADDING,
    gap: 40,
  },

  // "Login here" divider row
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
  },

  // Buttons
  buttonGroup: {
    gap: 32,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  googleBtn: {
    width: 108,
    height: BTN_H,
    backgroundColor: '#ffffff',
    borderRadius: BTN_R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtn: {
    flex: 1,
    height: BTN_H,
    backgroundColor: '#ffffff',
    borderRadius: BTN_R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
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
  },
})
