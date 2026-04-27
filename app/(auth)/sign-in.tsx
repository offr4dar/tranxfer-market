import { useSignIn, useClerk } from '@clerk/clerk-expo'
import { useRouter, useNavigation } from 'expo-router'
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, ImageBackground,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

import { Colors } from '@/constants/theme'

const H_PAD = 20

// ─── Gradient title ───────────────────────────────────────────────────────────
const TITLE_SIZE = 50
const TITLE_LH   = TITLE_SIZE * 1.2
const TITLE_GAP  = -8

function GradientTitle({ text }: { text: string }) {
  const lines = text.split('\n')
  if (Platform.OS === 'web') {
    return (
      <View>
        {lines.map((l, i) => (
          <Text
            key={i}
            style={[gt.text, i < lines.length - 1 && { marginBottom: TITLE_GAP }, {
              background: 'linear-gradient(214deg, #ffffff 31%, #82c3a5 92%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } as any]}
          >{l}</Text>
        ))}
      </View>
    )
  }
  return (
    <View style={{ alignSelf: 'stretch' }}>
      {lines.map((l, i) => (
        <MaskedView
          key={i}
          style={[{ height: TITLE_LH }, i < lines.length - 1 && { marginBottom: TITLE_GAP }]}
          maskElement={
            <View style={{ backgroundColor: 'transparent', height: TITLE_LH, justifyContent: 'center' }}>
              <Text style={gt.text}>{l}</Text>
            </View>
          }
        >
          <LinearGradient
            colors={['#ffffff', '#82c3a5']}
            start={{ x: 0.7, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: '100%', height: TITLE_LH }}
          />
        </MaskedView>
      ))}
    </View>
  )
}
const gt = StyleSheet.create({
  text: {
    fontFamily: 'Anton_400Regular',
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LH,
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})

type Step = 'email' | 'code'

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const clerk      = useClerk()
  const router     = useRouter()
  const navigation = useNavigation()
  const insets     = useSafeAreaInsets()

  const [step,    setStep]    = useState<Step>('email')
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  // ─── Step 1: Request OTP ────────────────────────────────────────────────
  const handleRequestCode = async () => {
    if (!isLoaded || !signIn) return
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try {
      await signIn.create({ identifier: trimmed, strategy: 'email_code' })
      setStep('code')
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code ?? ''
      if (errCode === 'form_identifier_not_found') {
        setError("We couldn't find an account with that email.")
      } else if (errCode === 'too_many_requests') {
        setError('Too many attempts. Please wait a moment.')
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

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────
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
        const user = clerk.user
        if (!user?.unsafeMetadata?.onboarded) {
          await clerk.signOut()
          setError("No account found. Please create an account first.")
          setStep('email'); setCode('')
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

  const handleResend = async () => {
    if (!isLoaded || !signIn) return
    try {
      await signIn.create({ identifier: email.trim().toLowerCase(), strategy: 'email_code' })
      setResent(true); setCode(''); setError('')
      setTimeout(() => setResent(false), 4000)
    } catch {}
  }

  const handleBack = () => {
    if (step === 'code') {
      setStep('email'); setCode(''); setError('')
    } else {
      navigation.setOptions({ animation: 'fade' })
      router.back()
    }
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <ImageBackground
        source={require('../../assets/bg_onboarding.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.44)', 'rgba(155,155,155,0)']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            st.scroll,
            { paddingTop: Math.max(insets.top + 20, 60) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={st.titleBlock}>
            <GradientTitle text={'WELCOME\nBACK'} />
          </View>

          {step === 'email' ? (
            /* ── Step 1: Email ── */
            <View style={st.fields}>
              <View style={st.field}>
                <Text style={st.label}>Email address</Text>
                <TextInput
                  style={[st.input, !!error && st.inputError]}
                  value={email}
                  onChangeText={v => { setEmail(v); setError('') }}
                  placeholder="you@example.com"
                  placeholderTextColor="#909090"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRequestCode}
                />
              </View>
              {!!error && (
                <View style={st.errorCard}>
                  <Text style={st.errorText}>{error}</Text>
                </View>
              )}
            </View>
          ) : (
            /* ── Step 2: OTP Code ── */
            <View style={st.fields}>
              <Text style={st.introText}>
                We've sent a 6-digit code to{' '}
                <Text style={st.emailHighlight}>{email}</Text>
              </Text>
              <View style={st.field}>
                <Text style={st.label}>Verification code</Text>
                <TextInput
                  style={[st.input, st.codeInput, !!error && st.inputError]}
                  value={code}
                  onChangeText={v => { setCode(v); setError('') }}
                  placeholder="000000"
                  placeholderTextColor="#909090"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyCode}
                />
              </View>
              {!!error && (
                <View style={st.errorCard}>
                  <Text style={st.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ flex: 1, minHeight: 36 }} />

          {/* CTA group */}
          <View style={[st.ctas, { paddingBottom: Math.max(insets.bottom + 66, 90) }]}>
            <TouchableOpacity
              style={[st.btn, (loading || (step === 'code' && !code)) && st.btnDisabled]}
              onPress={step === 'email' ? handleRequestCode : handleVerifyCode}
              disabled={loading || (step === 'code' && !code)}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={st.btnText}>{step === 'email' ? 'SEND LOGIN CODE' : 'VERIFY & LOGIN'}</Text>
              }
            </TouchableOpacity>

            <View style={st.linkRow}>
              <TouchableOpacity onPress={handleBack}>
                <Text style={st.link}>{step === 'code' ? '← Back' : 'Back'}</Text>
              </TouchableOpacity>
              {step === 'code' ? (
                <TouchableOpacity onPress={handleResend} disabled={resent}>
                  <Text style={[st.link, resent && { opacity: 0.5 }]}>
                    {resent ? 'Sent ✓' : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.replace('/(auth)/onboarding')}>
                  <Text style={st.link}>Create an account</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  scroll:         { flexGrow: 1, paddingHorizontal: H_PAD },
  titleBlock:     { marginBottom: 40 },
  fields:         { gap: 24 },
  field:          { gap: 5 },
  label:          { fontSize: 16, color: '#fff', letterSpacing: 0.32 },
  introText:      { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  emailHighlight: { color: Colors.brand, fontWeight: '600' },
  input: {
    height: 59,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 1,
    borderColor: '#4f4f4f',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
  },
  errorCard:    { gap: 8 },
  errorText:    { color: Colors.error, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  inputError:   { borderColor: Colors.error },
  ctas:         { gap: 16 },
  btn: {
    height: 57,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled:  { opacity: 0.5 },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    fontSize: 16,
    color: Colors.brand,
    fontWeight: '700',
    letterSpacing: 0.32,
  },
})
