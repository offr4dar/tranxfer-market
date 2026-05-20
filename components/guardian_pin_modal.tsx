/**
 * components/guardian_pin_modal.tsx
 *
 * Full-screen PIN entry modal for switching to Guardian View.
 *
 * Features:
 *  - 4-digit PIN entry with the existing NumPad + PinDots from parental_gate
 *  - SHA-256 hash comparison against player_profiles.guardian_pin_hash
 *  - Shake animation on incorrect PIN
 *  - 3 failed attempts → 30-second lockout with live countdown
 *  - "Forgot PIN?" → informational alert
 *  - Slides up from bottom as a modal sheet
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Pressable,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import * as Crypto from 'expo-crypto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_LENGTH   = 4
const MAX_ATTEMPTS = 3
const LOCKOUT_SECS = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin,
  )
}

// ─── Sub-components (identical to parental_gate for visual consistency) ───────

function PinDots({ value }: { value: string }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View key={i} style={[dot.dot, i < value.length && dot.filled]} />
      ))}
    </View>
  )
}
const dot = StyleSheet.create({
  row:    { flexDirection: 'row', gap: 16, marginVertical: 28 },
  dot:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  filled: { backgroundColor: Colors.brand, borderColor: Colors.brand },
})

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const

function NumPad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  return (
    <View style={pad.grid}>
      {PAD_KEYS.map((key, i) => {
        if (key === '') return <View key={i} style={pad.spacer} />
        if (key === '⌫') return (
          <TouchableOpacity key={i} style={pad.key} onPress={onDelete} activeOpacity={0.6}>
            <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
              <Path d="M8 1H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-7-7 7-7z"
                stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinejoin="round" />
              <Path d="M13 6l-4 4M9 6l4 4"
                stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )
        return (
          <TouchableOpacity key={i} style={pad.key} onPress={() => onPress(key)} activeOpacity={0.6}>
            <Text style={pad.label}>{key}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
const pad = StyleSheet.create({
  grid:    { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12 },
  key:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  spacer:  { width: 80, height: 80 },
  label:   { color: '#fff', fontSize: 28, fontWeight: '300' },
})

// ─── Lockout countdown hook ───────────────────────────────────────────────────

function useLockout() {
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLockout = useCallback(() => {
    setSeconds(LOCKOUT_SECS)
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current) }, [])

  return { lockedOut: seconds > 0, seconds, startLockout }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  visible:    boolean
  pinHash:    string | null   // SHA-256 hash from player_profiles
  onSuccess:  () => void      // called when PIN verified
  onDismiss:  () => void      // called on cancel / backdrop tap
}

export default function GuardianPinModal({ visible, pinHash, onSuccess, onDismiss }: Props) {
  const insets = useSafeAreaInsets()
  const [pin,      setPin]      = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [busy,     setBusy]     = useState(false)
  const shakeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(400)).current
  const { lockedOut, seconds, startLockout } = useLockout()

  // Slide sheet in/out
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 400,
      useNativeDriver: true,
      tension: 85,
      friction: 14,
    }).start()
    if (!visible) {
      // Reset state on close
      setTimeout(() => { setPin(''); setError(null); setAttempts(0) }, 300)
    }
  }, [visible])

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start()
  }

  async function handleDigit(digit: string) {
    if (busy || lockedOut || pin.length >= PIN_LENGTH) return
    setError(null)
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      setTimeout(() => submit(next), 120)
    }
  }

  function handleDelete() {
    if (busy || lockedOut) return
    setPin(p => p.slice(0, -1))
    setError(null)
  }

  async function submit(completed: string) {
    if (busy || !pinHash) return
    setBusy(true)
    try {
      const hash = await hashPin(completed)
      if (hash === pinHash) {
        setError(null)
        setAttempts(0)
        onSuccess()
      } else {
        const next = attempts + 1
        setAttempts(next)
        setPin('')
        shake()
        if (next >= MAX_ATTEMPTS) {
          startLockout()
          setError(`Too many attempts. Try again in ${LOCKOUT_SECS}s.`)
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} remaining.`)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          st.sheet,
          { paddingBottom: insets.bottom + 24 },
          { transform: [{ translateY: slideAnim }] },
        ]}
        // Prevent backdrop tap from firing through the sheet
        pointerEvents="box-none"
      >
        <Pressable style={st.sheetInner}>

          {/* Drag handle */}
          <View style={st.handle} />

          {/* Lock icon */}
          <View style={st.iconWrap}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
                stroke={Colors.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M7 11V7a5 5 0 0 1 10 0v4"
                stroke={Colors.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>

          <Text style={st.title}>GUARDIAN VIEW</Text>
          <Text style={st.subtitle}>
            {lockedOut
              ? `Too many attempts. Try again in ${seconds}s.`
              : 'Enter your 4-digit guardian PIN to continue.'}
          </Text>

          {/* PIN dots */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinDots value={lockedOut ? '' : pin} />
          </Animated.View>

          {/* Error */}
          {error && !lockedOut && <Text style={st.error}>{error}</Text>}

          {/* Lockout progress bar */}
          {lockedOut && (
            <View style={st.lockBar}>
              <View style={[st.lockBarFill, { width: `${(seconds / LOCKOUT_SECS) * 100}%` }]} />
            </View>
          )}

          {/* Number pad — greyed out during lockout */}
          <View style={lockedOut && { opacity: 0.3 }} pointerEvents={lockedOut ? 'none' : 'auto'}>
            <NumPad onPress={handleDigit} onDelete={handleDelete} />
          </View>

          {/* Forgot PIN */}
          <TouchableOpacity
            style={st.forgot}
            onPress={() => {
              // Dismiss and let parent show an alert or navigate to reset
              onDismiss()
            }}
            activeOpacity={0.7}
          >
            <Text style={st.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>

        </Pressable>
      </Animated.View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F1A13',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.12)',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetInner: { width: '100%', alignItems: 'center' },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 28,
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,255,135,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 26,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
  error: {
    fontSize: 13,
    color: '#FF5A5A',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockBar: {
    width: 200, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  lockBarFill: {
    height: '100%',
    backgroundColor: '#FF5A5A',
    borderRadius: 2,
  },
  forgot:     { marginTop: 24 },
  forgotText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
})
