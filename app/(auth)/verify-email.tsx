import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, ImageBackground,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSignUp, useClerk } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import { getPendingProfile, clearPendingProfile } from '@/lib/pendingProfile'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT  = '#00FF87'
const H_PAD   = 20

// ─── Gradient title ───────────────────────────────────────────────────────────
const TITLE_SIZE = 50
const TITLE_LH   = TITLE_SIZE * 1.2

function GradientTitle({ text }: { text: string }) {
  const lines = text.split('\n')
  if (Platform.OS === 'web') {
    return (
      <View>
        {lines.map((l, i) => (
          <Text key={i} style={[gt.text, i < lines.length - 1 && { marginBottom: -8 }, {
            background: 'linear-gradient(214deg, #ffffff 31%, #82c3a5 92%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          } as any]}>{l}</Text>
        ))}
      </View>
    )
  }
  return (
    <View style={{ alignSelf: 'stretch' }}>
      {lines.map((l, i) => (
        <MaskedView
          key={i}
          style={[{ height: TITLE_LH }, i < lines.length - 1 && { marginBottom: -8 }]}
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function VerifyEmailScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const clerk = useClerk()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  // Send the verification email as soon as we land here
  useEffect(() => {
    if (!isLoaded || !signUp) return
    signUp.prepareEmailAddressVerification({ strategy: 'email_code' }).catch(() => {})
  }, [isLoaded])

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return
    if (!code.trim()) { setError('Please enter the code from your email.'); return }
    setLoading(true); setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId })
        // Save the profile now that we have a verified user ID and active session
        const pending = getPendingProfile()
        if (pending && result.createdUserId) {
          pending.payload.user_id = result.createdUserId
          const { error: dbErr } = await supabase.from(pending.table).upsert(pending.payload)
          if (dbErr) {
            console.error('Profile save failed:', dbErr)
            setError(`Profile could not be saved: ${dbErr.message}. Please contact support.`)
            setLoading(false)
            return
          }
          clearPendingProfile()
          // Mark this Clerk user as having completed onboarding
          await clerk.user?.update({ unsafeMetadata: { onboarded: true } })
        }
        router.replace('/(tabs)/feed')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.code === 'form_code_incorrect'
        ? 'Incorrect code. Please check your email and try again.'
        : e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!isLoaded || !signUp) return
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {}
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
          contentContainerStyle={[st.scroll, { paddingTop: Math.max(insets.top + 20, 60) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={st.titleBlock}>
            <GradientTitle text={'CHECK YOUR\nEMAIL'} />
          </View>

          {/* Instruction */}
          <Text style={st.intro}>
            We've sent a 6-digit verification code to{' '}
            <Text style={st.email}>{signUp?.emailAddress ?? 'your email'}</Text>.
            Enter it below to complete your registration.
          </Text>

          {/* Code input */}
          <View style={[st.field, { marginTop: 32 }]}>
            <Text style={st.label}>Verification code</Text>
            <TextInput
              style={[st.input, !!error && st.inputError]}
              value={code}
              onChangeText={v => { setCode(v); setError('') }}
              placeholder="000000"
              placeholderTextColor="#909090"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          {/* Error */}
          {!!error && <Text style={st.errorText}>{error}</Text>}

          {/* Flex spacer */}
          <View style={{ flex: 1, minHeight: 36 }} />

          {/* CTAs */}
          <View style={[st.ctas, { paddingBottom: Math.max(insets.bottom + 66, 90) }]}>
            <TouchableOpacity
              style={[st.btn, (loading || !code) && st.btnDisabled]}
              onPress={handleVerify}
              disabled={loading || !code}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={[st.btnText, !code && st.btnTextDisabled]}>VERIFY</Text>}
            </TouchableOpacity>

            <View style={st.linkRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={st.link}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResend}>
                <Text style={st.link}>{resent ? 'Sent ✓' : 'Resend code'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  scroll:      { flexGrow: 1, paddingHorizontal: H_PAD },
  titleBlock:  { marginBottom: 32 },
  intro:       { fontSize: 16, color: '#fff', letterSpacing: 0.32, lineHeight: 22 },
  email:       { color: ACCENT },
  field:       { gap: 5 },
  label:       { fontSize: 16, color: '#fff', letterSpacing: 0.32 },
  input: {
    height: 59,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 1, borderColor: '#4f4f4f',
    borderRadius: 10, paddingHorizontal: 20,
    fontSize: 24, color: '#fff', letterSpacing: 8, textAlign: 'center',
  },
  inputError:      { borderColor: '#EA4335' },
  errorText:       { fontSize: 16, color: '#EA4335', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  ctas:            { gap: 16 },
  btn: {
    height: 57, backgroundColor: ACCENT,
    borderRadius: 100, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled:     { backgroundColor: '#354e42' },
  btnText:         { fontSize: 14, fontWeight: '700', color: '#000', letterSpacing: 0.28, textTransform: 'uppercase' },
  btnTextDisabled: { color: '#507664' },
  linkRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link:            { fontSize: 16, color: ACCENT, fontWeight: '700', letterSpacing: 0.32 },
})
