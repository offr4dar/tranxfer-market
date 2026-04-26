import { useSignIn } from '@clerk/clerk-expo'
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

// ─── Gradient title — matches onboarding design language ─────────────────────
const TITLE_SIZE = 50
const TITLE_LH   = TITLE_SIZE * 1.2   // 60px
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router     = useRouter()
  const navigation = useNavigation()
  const insets     = useSafeAreaInsets()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const WRONG_CREDS = "The login details you've entered are incorrect, please try again."

  // Map Clerk error codes to a single friendly message
  const friendlyError = (err: any): string => {
    const code = err?.errors?.[0]?.code ?? ''
    switch (code) {
      case 'form_identifier_not_found':
      case 'form_password_incorrect':
      case 'form_identifier_exists':
        return WRONG_CREDS
      case 'too_many_requests':
        return 'Too many attempts. Please wait a moment and try again.'
      case 'session_exists':
        return 'You are already signed in.'
      default:
        return err?.errors?.[0]?.longMessage
          ?? err?.errors?.[0]?.message
          ?? WRONG_CREDS
    }
  }

  const handleSignIn = async () => {
    if (!isLoaded) return
    if (!email.trim())  { setError('Please enter your email address.'); return }
    if (!password)      { setError('Please enter your password.'); return }
    setLoading(true); setError('')
    try {
      const result = await signIn.create({ identifier: email.trim().toLowerCase(), password })
      await setActive({ session: result.createdSessionId })
    } catch (err: any) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigation.setOptions({ animation: 'fade' })
    router.back()
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
          {/* ── Gradient title ─────────────────────────────────────────── */}
          <View style={st.titleBlock}>
            <GradientTitle text={'WELCOME\nBACK'} />
          </View>

          {/* ── Form fields ────────────────────────────────────────────── */}
          <View style={st.fields}>
            <View style={st.field}>
              <Text style={st.label}>Email address</Text>
              <TextInput
                style={[st.input, !!error && st.inputError]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#909090"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={st.field}>
              <Text style={st.label}>Password</Text>
              <TextInput
                style={[st.input, !!error && st.inputError]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#909090"
                secureTextEntry
              />
            </View>

            {!!error && (
              <View style={st.errorCard}>
                <Text style={st.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Flex spacer — pushes CTA to bottom on short screens */}
          <View style={{ flex: 1, minHeight: 36 }} />

          {/* ── CTA group ──────────────────────────────────────────────── */}
          <View style={[st.ctas, { paddingBottom: Math.max(insets.bottom + 66, 90) }]}>
            <TouchableOpacity
              style={[st.btn, loading && st.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={st.btnText}>LOGIN</Text>}
            </TouchableOpacity>

            <View style={st.linkRow}>
              <TouchableOpacity onPress={handleBack}>
                <Text style={st.link}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/(auth)/onboarding')}>
                <Text style={st.link}>Create an account</Text>
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
  scroll:     { flexGrow: 1, paddingHorizontal: H_PAD },
  titleBlock: { marginBottom: 40 },
  fields:     { gap: 24 },
  field:      { gap: 5 },
  label:      { fontSize: 16, color: '#fff', letterSpacing: 0.32 },
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
  errorCard: {
    gap: 8,
  },
  errorText:   { color: Colors.error, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  inputError:  { borderColor: Colors.error },
  ctas:    { gap: 16 },
  btn: {
    height: 57,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
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
