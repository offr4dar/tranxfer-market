import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Colors, Spacing, Radius } from '@/constants/theme'

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      await setActive({ session: result.createdSessionId })
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => { setPendingVerification(false); setCode(''); setError('') }}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/welcome')}
            style={styles.navBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={[styles.input, { textAlign: 'center', letterSpacing: 10, fontSize: 22 }]}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.buttonText}>Verify email</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setPendingVerification(false); setCode(''); setError('') }}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Wrong email?{' '}
              <Text style={styles.switchTextGreen}>Go back and change it</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Text style={styles.navBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 1 of 2</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/welcome')}
          style={styles.navBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Free for players. Always.</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Marcus"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Reid"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.buttonText}>Create free account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchTextGreen}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { minWidth: 60 },
  navBtnText: { color: Colors.brand, fontSize: 15 },
  cancelText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'right' },
  stepLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  inner: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 40, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  emailHighlight: { color: Colors.brand, fontWeight: '600' },
  form: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  field: { gap: Spacing.xs },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
  error: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  switchLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { color: Colors.textSecondary, fontSize: 14 },
  switchTextGreen: { color: Colors.brand, fontWeight: '600' },
})
