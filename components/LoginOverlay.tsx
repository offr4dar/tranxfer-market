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
const ACCENT        = '#00FF87'

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

type Step = 'email' | 'code'

export default function LoginOverlay({ visible, onClose }: LoginOverlayProps) {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { signIn, setActive, isLoaded } = useSignIn()
  const clerk = useClerk()

  const [step,    setStep]    = useState<Step>('email')
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [resent,  setResent]  = useState(false)
  // Keep mounted during close animation
  const [mounted, setMounted] = useState(false)

  const translateY     = useRef(new Animated.Value(H)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  // ─── Swipe-to-dismiss on drag handle ──────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 2,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 100 || vy > 0.5) {
          onClose()
        } else {
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
      setStep('email')
      setEmail('')
      setCode('')
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

  // ─── Step 1: Request OTP code ────────────────────────────────────────────
  const handleRequestCode = async () => {
    if (!isLoaded || !signIn) return
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try {
      await signIn.create({
        identifier: trimmed,
        strategy: 'email_code',
      })
      setStep('code')
    } catch (err: any) {
      const code = err?.errors?.[0]?.code ?? ''
      if (code === 'form_identifier_not_found') {
        setError("We couldn't find an account with that email. Please check and try again.")
      } else if (code === 'too_many_requests') {
        setError('Too many attempts. Please wait a moment and try again.')
      } else {
        setError(
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          'Something went wrong. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Verify OTP code ─────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!isLoaded || !signIn) return
    if (!code.trim()) { setError('Please enter the 6-digit code from your email.'); return }
    setLoading(true); setError('')
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // Gate: only allow users who completed onboarding
        const user = clerk.user
        if (!user?.unsafeMetadata?.onboarded) {
          await clerk.signOut()
          setError("No account found. Please tap 'CREATE AN ACCOUNT' to register first.")
          setStep('email')
          setCode('')
          setLoading(false)
          return
        }
        router.replace('/(tabs)/feed')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code ?? ''
      if (errCode === 'form_code_incorrect') {
        setError('Incorrect code. Please check your email and try again.')
      } else if (errCode === 'verification_expired') {
        setError('The code has expired. Please go back and request a new one.')
      } else {
        setError(
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          'Something went wrong. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Resend code ─────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!isLoaded || !signIn) return
    try {
      await signIn.create({
        identifier: email.trim().toLowerCase(),
        strategy: 'email_code',
      })
      setResent(true)
      setCode('')
      setError('')
      setTimeout(() => setResent(false), 4000)
    } catch {}
  }

  const hasError = !!error

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* ── Backdrop ── */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={28}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* ── Bottom sheet ── */}
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
          {/* Drag handle */}
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

          {step === 'email' ? (
            <>
              {/* ── Step 1: Email ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={[styles.input, { borderColor: hasError ? BORDER_ERROR : BORDER_NORMAL }]}
                  placeholder="you@example.com"
                  placeholderTextColor="#909090"
                  value={email}
                  onChangeText={v => { setEmail(v); setError('') }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleRequestCode}
                />
              </View>

              {hasError && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleRequestCode}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000000" />
                  : <Text style={styles.loginBtnText}>SEND LOGIN CODE</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ── Step 2: OTP Code ── */}
              <View>
                <Text style={styles.introText}>
                  We've sent a 6-digit code to{' '}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Verification code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput, { borderColor: hasError ? BORDER_ERROR : BORDER_NORMAL }]}
                  placeholder="000000"
                  placeholderTextColor="#909090"
                  value={code}
                  onChangeText={v => { setCode(v); setError('') }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyCode}
                />
              </View>

              {hasError && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.loginBtn, (loading || !code) && styles.loginBtnDisabled]}
                onPress={handleVerifyCode}
                activeOpacity={0.85}
                disabled={loading || !code}
              >
                {loading
                  ? <ActivityIndicator color="#000000" />
                  : <Text style={styles.loginBtnText}>VERIFY & LOGIN</Text>
                }
              </TouchableOpacity>

              {/* Back + Resend row */}
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError('') }}>
                  <Text style={styles.link}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResend} disabled={resent}>
                  <Text style={[styles.link, resent && styles.linkSent]}>
                    {resent ? 'Sent ✓' : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

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
    gap: 24,
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
    paddingVertical: 8,
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
  introText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  emailHighlight: {
    color: ACCENT,
    fontWeight: '600',
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
  codeInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: ERROR_RED,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginTop: -8,
  },
  loginBtn: {
    height: BTN_H,
    backgroundColor: ACCENT,
    borderRadius: BTN_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
  },
  link: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  linkSent: {
    opacity: 0.5,
  },
})
