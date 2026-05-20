import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { Colors, Spacing } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** True → "Set your PIN" flow. False → "Enter PIN" verification flow. */
  mode:           'set' | 'verify'
  on_success:     () => void           // called when PIN verified or set successfully
  on_save_pin?:   (pin: string) => Promise<void>  // required when mode === 'set'
  on_verify_pin?: (pin: string) => Promise<boolean>  // required when mode === 'verify'
}

// ─── PIN DOT display ─────────────────────────────────────────────────────────

function PinDots({ value, length = 4 }: { value: string; length?: number }) {
  return (
    <View style={dot_styles.row}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            dot_styles.dot,
            i < value.length && dot_styles.dot_filled,
          ]}
        />
      ))}
    </View>
  )
}

const dot_styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, marginVertical: 28 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  dot_filled: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
})

// ─── Number pad ──────────────────────────────────────────────────────────────

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const

function NumPad({
  on_press,
  on_delete,
}: {
  on_press:  (digit: string) => void
  on_delete: () => void
}) {
  return (
    <View style={pad_styles.grid}>
      {PAD_KEYS.map((key, i) => {
        if (key === '') return <View key={i} style={pad_styles.key_spacer} />
        if (key === '⌫') {
          return (
            <TouchableOpacity
              key={i}
              style={pad_styles.key}
              onPress={on_delete}
              activeOpacity={0.6}
            >
              <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
                <Path
                  d="M8 1H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-7-7 7-7z"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                <Path
                  d="M13 6l-4 4M9 6l4 4"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          )
        }
        return (
          <TouchableOpacity
            key={i}
            style={pad_styles.key}
            onPress={() => on_press(key)}
            activeOpacity={0.6}
          >
            <Text style={pad_styles.key_text}>{key}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const pad_styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: 12,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  key_spacer: { width: 80, height: 80 },
  key_text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function ParentalGate({
  mode,
  on_success,
  on_save_pin,
  on_verify_pin,
}: Props) {
  const [pin,         set_pin]         = useState('')
  const [confirm_pin, set_confirm_pin] = useState('')
  const [step,        set_step]        = useState<'enter' | 'confirm'>('enter')
  const [error,       set_error]       = useState<string | null>(null)
  const [busy,        set_busy]        = useState(false)

  const shake_anim = useRef(new Animated.Value(0)).current

  const PIN_LENGTH = 4
  const active_pin  = step === 'confirm' ? confirm_pin : pin
  const set_active  = step === 'confirm' ? set_confirm_pin : set_pin

  function trigger_shake() {
    Animated.sequence([
      Animated.timing(shake_anim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake_anim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake_anim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake_anim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  function handle_digit(digit: string) {
    if (active_pin.length >= PIN_LENGTH) return
    set_error(null)
    const next = active_pin + digit
    set_active(next)

    if (next.length === PIN_LENGTH) {
      // Auto-submit when 4 digits are entered
      setTimeout(() => handle_submit(next), 120)
    }
  }

  function handle_delete() {
    set_active(prev => prev.slice(0, -1))
    set_error(null)
  }

  async function handle_submit(completed_pin: string) {
    if (busy) return
    set_busy(true)

    try {
      if (mode === 'set') {
        if (step === 'enter') {
          // Move to confirm step
          set_step('confirm')
          set_busy(false)
          return
        }

        // Confirm step — check they match
        if (completed_pin !== pin) {
          set_error('PINs don\'t match. Try again.')
          set_confirm_pin('')
          trigger_shake()
          set_busy(false)
          return
        }

        await on_save_pin?.(pin)
        on_success()

      } else {
        // Verify mode
        const ok = await on_verify_pin?.(completed_pin)
        if (ok) {
          on_success()
        } else {
          set_error('Incorrect PIN. Try again.')
          set_pin('')
          trigger_shake()
        }
      }
    } finally {
      set_busy(false)
    }
  }

  const title = mode === 'set'
    ? step === 'enter' ? 'Set a parental PIN' : 'Confirm your PIN'
    : 'Enter parental PIN'

  const subtitle = mode === 'set'
    ? step === 'enter'
      ? 'Choose a 4-digit PIN to protect access to messages.'
      : 'Enter the same PIN again to confirm.'
    : 'This account is protected. Enter the PIN to access messages.'

  return (
    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.overlay}>

        {/* Lock icon */}
        <View style={styles.icon_wrap}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
              stroke={Colors.brand}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke={Colors.brand}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* PIN dots */}
        <Animated.View style={{ transform: [{ translateX: shake_anim }] }}>
          <PinDots value={active_pin} />
        </Animated.View>

        {/* Error */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Number pad */}
        <NumPad on_press={handle_digit} on_delete={handle_delete} />

        {/* Forgot PIN (verify mode only) */}
        {mode === 'verify' && (
          <TouchableOpacity
            style={styles.forgot_btn}
            onPress={() =>
              Alert.alert(
                'Forgot PIN?',
                'Ask a parent or guardian to reset the PIN in Settings.',
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.forgot_text}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  icon_wrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 26,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    color: '#FF5A5A',
    fontWeight: '600',
    marginBottom: 12,
  },
  forgot_btn: {
    marginTop: 28,
  },
  forgot_text: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
})
