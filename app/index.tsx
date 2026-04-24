import { Redirect } from 'expo-router'

// Entry point — always show the splash screen first.
// The splash navigates to /(auth)/welcome after 3 seconds.
export default function Index() {
  return <Redirect href="/splash" />
}
