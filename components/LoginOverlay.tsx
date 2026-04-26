import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSignIn, useClerk } from '@clerk/clerk-expo'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'

const { height: H } = Dimensions.get('window')

const PANEL_PADDING = 20
const FIELD_RADIUS  = 10
const BTN_H         = 57
const BTN_RADIUS    = 100
const BORDER_NORMAL = '#4f4f4f'
const BORDER_ERROR  = '#ff5900'
const ERROR_RED     = '#ea4335'

function CloseIcon() {
  return (
    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
      <Path d="M1 1L20 20M20 1L1 20" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

interface LoginOverlayProps {
  visible: boolean
  onClose: () => void
}

export default function LoginOverlay({ visible, onClose }: LoginOverlayProps) {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { signIn, setActive, isLoaded } = useSignIn()
  const clerk = useClerk()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  // Keep mounted during close animation
  const [mounted, setMounted] = useState(false)

  const translateY      = useRef(new Animated.Value(H)).current
  const backdropOpacity  = useRef(new Animated.Value(0)).current

  // ─── Swipe-to-dismiss on drag handle ────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 2,
      onPanResponderMove: (_, { dy }) => {
        // Only allow dragging downward
        if (dy > 0) translateY.setValue(dy)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 100 || vy > 0.5) {
          // Crossed threshold — close
          onClose()
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            speed: 14,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      setError('')
      // Fade backdrop in and slide panel up simultaneously
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 4,
          speed: 14,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Fade backdrop out and slide panel down, then unmount
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: H,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false))
    }
  }, [visible])

  if (!mounted) return null

  const hasError = !!error

  const handleLogin = async () => {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // Gate: only allow users who completed onboarding (have a profile)
        const user = clerk.user
        if (!user?.unsafeMetadata?.onboarded) {
          await clerk.signOut()
          setError('No account found. Please tap \'CREATE AN ACCOUNT\' to register first.')
          setLoading(false)
          return
        }
        router.replace('/(tabs)/feed')
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message
      setError(msg || 'Incorrect email or password, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* ── Backdrop: fades in, tap to dismiss ── */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* ── Bottom sheet: slides up ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.panel,
            { paddingBottom: Math.max(insets.bottom + 16, 40) },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle — centred, pan to dismiss */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>WELCOME BACK</Text>
            <View style={styles.headerLine} />
            <Pressable onPress={onClose} hitSlop={12}>
              <CloseIcon />
            </Pressable>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: hasError ? BORDER_ERROR : BORDER_NORMAL }]}
              placeholder="you@example.com"
              placeholderTextColor="#909090"
              value={email}
              onChangeText={v => { setEmail(v); setError('') }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, { borderColor: hasError ? BORDER_ERROR : BORDER_NORMAL }]}
              placeholderTextColor="#909090"
              value={password}
              onChangeText={v => { setPassword(v); setError('') }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Error */}
          {hasError && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000000" />
              : <Text style={styles.loginBtnText}>LOGIN</Text>
            }
          </TouchableOpacity>

        </Animated.View>
      </KeyboardAvoidingView>

    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 7, 7, 0.75)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  panel: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: PANEL_PADDING,
    paddingTop: 60,
    gap: 32,
    shadowColor: '#000',
    shadowOpacity: 0.44,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },
  dragHandleContainer: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,   // extra hit area
  },
  dragHandle: {
    width: 52,
    height: 6,
    borderRadius: 100,
    backgroundColor: '#4e4e4e',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  headerLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#ffffff',
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.32,
  },
  input: {
    height: 59,
    backgroundColor: 'rgba(0, 0, 0, 0.31)',
    borderWidth: 1,
    borderRadius: FIELD_RADIUS,
    paddingHorizontal: PANEL_PADDING,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.32,
  },
  errorText: {
    fontSize: 16,
    color: ERROR_RED,
    textAlign: 'center',
    letterSpacing: 0.32,
    marginTop: -16,
  },
  loginBtn: {
    height: BTN_H,
    backgroundColor: '#00FF87',
    borderRadius: BTN_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
  },
})
