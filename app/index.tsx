import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { View } from 'react-native'
import { Colors } from '@/constants/theme'

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()

  // Block all routing until Clerk has read from SecureStore.
  // This prevents the AuthGuard from racing ahead and redirecting
  // to /(auth)/welcome before we know whether the user is signed in.
  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />
  }

  // Already authenticated → go straight to the feed.
  if (isSignedIn) return <Redirect href="/(tabs)/feed" />

  // Not authenticated → play the splash/welcome flow.
  return <Redirect href="/splash" />
}
