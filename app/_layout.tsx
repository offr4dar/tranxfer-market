import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { Colors } from '@/constants/theme'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton'

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

// ─── Auth guard — redirects based on sign-in state ──────────────────────────
function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  function redirectToHome() {
    router.replace('/(tabs)/profile')
  }

  useEffect(() => {
    if (!isLoaded) return

    const segs         = segments as string[]
    const inAuthGroup  = segs[0] === '(auth)'
    const onSplash     = segs[0] === 'splash'
    const onIndex      = !segs[0]
    const onOnboarding = segs[1] === 'onboarding'

    if (isSignedIn && (onSplash || onIndex)) {
      redirectToHome()
      return
    }

    if (onSplash || onIndex) return

    // Standard guard for all other routes
    if (isSignedIn && inAuthGroup && !onOnboarding) {
      redirectToHome()
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    }
  }, [isLoaded, isSignedIn, segments])

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
          <Stack.Screen name="index"  options={{ animation: 'none', gestureEnabled: false }} />
          <Stack.Screen name="splash" options={{ animation: 'fade', gestureEnabled: false }} />
          {/* Auth group: slides in as a unit, internal steps handle their own stack */}
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
          {/* Tabs: slides in, no back gesture once authenticated */}
          <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="performance-log" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </ClerkProvider>
  )
}
