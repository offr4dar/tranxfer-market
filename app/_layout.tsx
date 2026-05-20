import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants/theme'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton'
import { DevRoleProvider, useDevRole } from '@/lib/devRole'
import { supabase } from '@/lib/supabase'

// Prevent the native splash from auto-hiding — we control when to hide it.
// This must be called at module level (before any component renders).
SplashScreen.preventAutoHideAsync()

// ─── Secure token cache for Clerk ────────────────────────────────────────────
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {}
  },
}

// ─── Persistent Exit Demo button (visible on every screen in demo mode) ───────
function DemoExitButton() {
  const { isDemoMode } = useDevRole()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  if (!isDemoMode) return null
  return (
    <View style={[demoStyles.container, { bottom: insets.bottom }]}>
      <TouchableOpacity
        style={demoStyles.btn}
        onPress={() => router.replace('/demo-select' as any)}
        activeOpacity={0.85}
      >
        <Text style={demoStyles.label}>EXIT DEMO</Text>
      </TouchableOpacity>
    </View>
  )
}
const demoStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1.5,
    borderColor: Colors.brand,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1,
  },
})

// ─── Auth guard — redirects based on sign-in state ──────────────────────────
function AuthGuard() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { isDemoMode, devRole } = useDevRole()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const segs         = segments as string[]
    const inAuthGroup  = segs[0] === '(auth)'
    const onVerify      = segs[0] === 'verify'
    const onSplash      = segs[0] === 'splash'
    const onIndex       = !segs[0]
    const onDemoSelect  = segs[0] === 'demo-select'
    const onOnboarding  = segs[1] === 'onboarding'

    // Entry point → always show demo-select first for everyone
    if (onIndex || onSplash) {
      router.replace('/demo-select' as any)
      return
    }

    if (onDemoSelect) return

    // Helper to determine where to send the user based on role and verification
    const getTargetRoute = async () => {
      let isScout = false
      let isVerified = false

      if (isDemoMode) {
        isScout = devRole.includes('scout')
        isVerified = devRole === 'scout_subscribed'
      } else if (isSignedIn && userId) {
        const { data } = await supabase
          .from('scout_profiles')
          .select('layer1_verified')
          .eq('user_id', userId)
          .single()
        if (data) {
          isScout = true
          isVerified = data.layer1_verified
        }
      }

      if (isScout && !isVerified) return '/verify'
      return '/(tabs)/profile'
    }

    const syncRoute = async () => {
      if (isSignedIn || isDemoMode) {
        if (inAuthGroup && !onOnboarding) {
          const target = await getTargetRoute()
          if (segments[0] !== target.replace(/^\//, '')) {
             router.replace(target as any)
          }
        }
        // Note: no redirect when already inside (tabs) — tab navigation handles itself
      } else if (!inAuthGroup) {
        router.replace('/(auth)/welcome')
      }
    }

    syncRoute()
  }, [isLoaded, isSignedIn, isDemoMode, segments, devRole])

  return null
}

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Anton_400Regular })

  // Hide the native splash as soon as fonts finish loading (or fail).
  // This runs for every user — signed-in users who bypass splash.tsx are covered.
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <DevRoleProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <StatusBar style="light" />
          <AuthGuard />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="index"       options={{ animation: 'none', gestureEnabled: false }} />
            <Stack.Screen name="splash"      options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="demo-select" options={{ animation: 'fade', gestureEnabled: false }} />
            {/* Auth group */}
            <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
            {/* Tabs: no back gesture once authenticated */}
            <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
            <Stack.Screen name="settings"        options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="performance-log" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="edit-profile"    options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="player/[id]"              options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="player/media"             options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="player/record"            options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="player/performance/[id]"  options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="upgrade"                  options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="verify"                   options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="guardian/dashboard"       options={{ headerShown: false, animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="checkout"                 options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          </Stack>
          <DemoExitButton />
        </View>
      </DevRoleProvider>
    </ClerkProvider>
  )
}
