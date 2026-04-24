import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { Colors } from '@/constants/theme'

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

  useEffect(() => {
    if (!isLoaded) return

    const inAuthGroup  = segments[0] === '(auth)'
    const onSplash     = segments[0] === 'splash'

    // Don't interrupt the splash screen — it navigates itself
    if (onSplash) return

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)/feed')
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    }
  }, [isLoaded, isSignedIn, segments])

  return <Slot />
}

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
        <AuthGuard />
      </View>
    </ClerkProvider>
  )
}
