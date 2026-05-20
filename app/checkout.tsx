/**
 * app/checkout.tsx
 *
 * Stripe payment screen — opened modally when a scout upgrades their plan.
 *
 * Expected query params:
 *   url      — Stripe Checkout Session URL (created by your backend)
 *   plan     — e.g. "scout_pro" (for post-payment routing logic)
 *
 * The backend must set:
 *   success_url → https://tranxfermarket.com/payment-success?session_id={CHECKOUT_SESSION_ID}
 *   cancel_url  → https://tranxfermarket.com/payment-cancel
 *
 * This screen intercepts those redirects via WebView onNavigationStateChange
 * and routes the user accordingly — no App Store IAP involved.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert } from 'react-native'
import StripeWebCheckout from '@/components/stripe_web_checkout'

export default function CheckoutScreen() {
  const router = useRouter()
  const { url, plan } = useLocalSearchParams<{ url: string; plan?: string }>()

  if (!url) {
    // Should never happen — guard against bad navigation
    router.back()
    return null
  }

  const handleSuccess = (sessionId: string | null) => {
    // TODO: Call your backend to verify the session and update the subscription tier
    // await supabase.functions.invoke('confirm-payment', { body: { sessionId, plan } })
    Alert.alert(
      'Payment successful! 🎉',
      'Your subscription has been activated.',
      [{ text: 'Continue', onPress: () => router.replace('/(tabs)/feed') }],
    )
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <StripeWebCheckout
      checkoutUrl={url}
      successUrlPattern="/payment-success"
      cancelUrlPattern="/payment-cancel"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      title={plan === 'scout_pro' ? 'Scout Pro Upgrade' : 'Checkout'}
    />
  )
}
