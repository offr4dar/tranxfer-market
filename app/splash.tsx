import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Image, Text, StyleSheet, Animated,
  Dimensions, Easing, TouchableOpacity, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { useOAuth } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg'
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton'
import * as SplashScreen from 'expo-splash-screen'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoginOverlay from '@/components/LoginOverlay'

SplashScreen.preventAutoHideAsync()

const { width: W, height: H } = Dimensions.get('window')

// ─── Image geometry ───────────────────────────────────────────────────────────
const IMG_W = W * 3.165
const IMG_H = IMG_W * (2496 / 3344)
const IMG_Y = H / 2 - 21 - IMG_H / 2
const SPLASH_IMG_X = -W * 0.3787
const WELCOME_IMG_X = -W * 1.3627

// ─── Text layout ──────────────────────────────────────────────────────────────
const HOLD_MS = 3000
const PADDING = 20
const INNER_W = W - PADDING * 2
const TEXT_SIZE = Platform.OS === 'web' ? 89 : INNER_W * 0.252
const LINE_H = TEXT_SIZE * 1.2
const LINE_GAP = -22
const LINE_STEP = LINE_H + LINE_GAP           // distance between word tops

// All 6 lines in order
const WORDS = [
  { text: 'YOUR', gradient: true },
  { text: 'GAME.', gradient: true },
  { text: 'YOUR', gradient: true },
  { text: 'CAREER.', gradient: true },
  { text: 'YOUR', gradient: false },
  { text: 'MOVE.', gradient: false },
]

// Total height of the absolute-positioned word block
const BLOCK_H = LINE_STEP * (WORDS.length - 1) + LINE_H

// Button tokens
const BTN_H = 57
const BTN_R = 100

// Cascade config
const WORD_DUR = 300
const STAGGER = 200

export default function SplashWelcome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<'splash' | 'welcome'>('splash')
  const [showLogin, setShowLogin] = useState(false)

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const handleGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/'),
      })
      if (createdSessionId && setActive) await setActive({ session: createdSessionId })
    } catch (e) { console.error('Google OAuth error', e) }
  }, [])
  // Image layer
  const imageX = useRef(new Animated.Value(SPLASH_IMG_X)).current
  const imageOpacity = useRef(new Animated.Value(0.28)).current

  // Splash content
  const ruleOpacity = useRef(new Animated.Value(1)).current
  const wordYs = useRef(WORDS.map(() => new Animated.Value(0))).current

  // Welcome content
  const gradientOpacity = useRef(new Animated.Value(0)).current
  const welcomeOpacity = useRef(new Animated.Value(0)).current

  const [fontsLoaded] = useFonts({ Anton_400Regular })

  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync() }, [fontsLoaded])

  useEffect(() => {
    if (!fontsLoaded) return
    const t = setTimeout(() => {
      Animated.parallel([
        // Rules fade quickly
        Animated.timing(ruleOpacity, {
          toValue: 0, duration: WORD_DUR + STAGGER, useNativeDriver: true,
        }),
        // Each word cascades down — next starts before previous finishes
        ...wordYs.map((y, i) =>
          Animated.sequence([
            Animated.delay(i * STAGGER),
            Animated.timing(y, {
              toValue: TEXT_SIZE * 0.88, duration: WORD_DUR,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: false,
            }),
          ])
        ),
        // Image pans mid-cascade (starts at 700ms)
        Animated.sequence([
          Animated.delay(700),
          Animated.parallel([
            Animated.timing(imageX, {
              toValue: WELCOME_IMG_X, duration: 900,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(imageOpacity, {
              toValue: 1, duration: 900, useNativeDriver: true,
            }),
            Animated.timing(gradientOpacity, {
              toValue: 1, duration: 600, useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        setPhase('welcome')
        Animated.timing(welcomeOpacity, {
          toValue: 1, duration: 350, useNativeDriver: true,
        }).start()
      })
    }, HOLD_MS)
    return () => clearTimeout(t)
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <View style={styles.root}>

      {/* ── Boot image ── */}
      <Animated.View style={[
        styles.bgWrapper,
        { top: IMG_Y, width: IMG_W, height: IMG_H },
        { opacity: imageOpacity, transform: [{ translateX: imageX }] },
      ]}>
        <Image
          source={require('../assets/splash-bg.png')}
          style={{ width: IMG_W, height: IMG_H }}
          resizeMode="cover"
        />
      </Animated.View>

      {/* ── Bottom gradient (welcome phase) ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: gradientOpacity }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', '#001209cc', '#001209']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.35 }}
          end={{ x: 0, y: 0.72 }}
        />
      </Animated.View>

      {/* ── Splash content (rules + cascading words) ── */}
      <View style={styles.splashContent}>

        <Animated.View style={{ opacity: ruleOpacity }}>
          <Rule />
        </Animated.View>

        {/* Absolute-positioned clip containers for each word */}
        <View style={[styles.textBlock, { height: BLOCK_H }]}>
          {WORDS.map((word, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: i * LINE_STEP,
                left: 0, right: 0,
                height: TEXT_SIZE * 0.88,   // tighter clip — text hides as soon as it crosses the bottom edge
                overflow: 'hidden',
              }}
            >
              <Animated.View style={{ transform: [{ translateY: wordYs[i] }] }}>
                {word.gradient ? (
                  <GradientWord text={word.text} />
                ) : (
                  <Text style={styles.accentWord}>{word.text}</Text>
                )}
              </Animated.View>
            </View>
          ))}
        </View>

        <Animated.View style={{ opacity: ruleOpacity }}>
          <Rule flipped />
        </Animated.View>

      </View>

      {/* ── Welcome content ── */}
      <Animated.View
        style={[
          styles.welcomeContent,
          {
            opacity: welcomeOpacity,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        pointerEvents={phase === 'welcome' ? 'auto' : 'none'}
      >
        <View style={styles.loginRow}>
          <View style={styles.shortLine} />
          <Text style={styles.loginText}>LOGIN HERE</Text>
          <View style={styles.fullLine} />
        </View>

        <View style={styles.buttonGroup}>
          <View style={styles.topBtnRow}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <GoogleIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={() => setShowLogin(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>BY EMAIL</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/onboarding')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>CREATE AN ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <LoginOverlay visible={showLogin} onClose={() => setShowLogin(false)} />
    </View>
  )
}

// ─── Per-word gradient (each word gets its own MaskedView) ───────────────────
function GradientWord({ text }: { text: string }) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.heroWord,
          {
            background: 'linear-gradient(to bottom, #ffffff, #82c3a5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          } as any,
        ]}
      >
        {text}
      </Text>
    )
  }
  return (
    <MaskedView
      style={{ height: LINE_H, alignSelf: 'stretch' }}
      maskElement={
        <View style={{ backgroundColor: 'transparent' }}>
          <Text style={styles.heroWord}>{text}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={['#ffffff', '#82c3a5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: LINE_H, flex: 1 }}
      />
    </MaskedView>
  )
}

// ─── SVG Plus icon ────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 13 13" fill="none">
      <Path
        d="M8.82716 13V8.82716H13V4.17284H8.82716V0H4.17284V4.17284H0V8.82716H4.17284V13H8.82716Z"
        fill="white"
      />
    </Svg>
  )
}

function Rule({ flipped = false }: { flipped?: boolean }) {
  return (
    <View style={[styles.rule, flipped && { transform: [{ rotate: '180deg' }] }]}>
      <PlusIcon />
      <View style={styles.ruleLine} />
    </View>
  )
}

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs><ClipPath id="gc"><Rect width={24} height={24} /></ClipPath></Defs>
      <G clipPath="url(#gc)">
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
  root: { flex: 1, backgroundColor: '#001209' },
  bgWrapper: { position: 'absolute', left: 0 },

  splashContent: {
    flex: 1,
    paddingHorizontal: PADDING,
    justifyContent: 'center',
    gap: 12,
  },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleLine: { flex: 1, height: 4, backgroundColor: '#ffffff' },

  textBlock: { alignSelf: 'stretch', marginTop: 50, marginBottom: 20 },

  heroWord: {
    fontFamily: 'Anton_400Regular',
    fontSize: TEXT_SIZE,
    lineHeight: LINE_H,
    letterSpacing: 1.78,
    color: '#000000',
  },
  accentWord: {
    fontFamily: 'Anton_400Regular',
    fontSize: TEXT_SIZE,
    lineHeight: LINE_H,
    letterSpacing: 1.78,
    color: '#00FF87',
  },

  welcomeContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: PADDING,
    gap: 40,
  },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shortLine: { width: 29, height: 4, backgroundColor: '#ffffff' },
  fullLine: { flex: 1, height: 4, backgroundColor: '#ffffff' },
  loginText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 0.48,
  },
  buttonGroup: { gap: 32 },
  topBtnRow: { flexDirection: 'row', gap: 10 },
  googleBtn: {
    width: 108, height: BTN_H,
    backgroundColor: '#ffffff', borderRadius: BTN_R,
    alignItems: 'center', justifyContent: 'center',
  },
  emailBtn: {
    flex: 1, height: BTN_H,
    backgroundColor: '#ffffff', borderRadius: BTN_R,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#000000', letterSpacing: 0.28 },
  primaryBtn: {
    height: BTN_H, backgroundColor: '#00FF87',
    borderRadius: BTN_R, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#000000', letterSpacing: 0.28 },
})
