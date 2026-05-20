/**
 * components/stripe_web_checkout.tsx
 *
 * Reusable Stripe checkout screen via react-native-webview.
 * Avoids Apple IAP 30% commission by routing payment through
 * Stripe's hosted checkout on the web.
 *
 * Flow:
 *  1. Backend creates a Stripe Checkout Session and returns the URL
 *  2. This component opens that URL in a WebView
 *  3. On success redirect → onSuccess(sessionId) is called
 *  4. On cancel redirect → onCancel() is called
 *
 * Usage:
 *   <StripeWebCheckout
 *     checkoutUrl="https://checkout.stripe.com/..."
 *     successUrlPattern="tranxfer://payment-success"
 *     cancelUrlPattern="tranxfer://payment-cancel"
 *     onSuccess={(sessionId) => router.replace('/(tabs)/feed')}
 *     onCancel={() => router.back()}
 *   />
 */

import React, { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing } from '@/constants/theme'

// ─── Chevron icon (inline — no extra dep) ─────────────────────────────────────
function CloseIcon() {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 2, backgroundColor: '#fff', transform: [{ rotate: '45deg' }, { translateY: 0 }], position: 'absolute' }} />
      <View style={{ width: 14, height: 2, backgroundColor: '#fff', transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
    </View>
  )
}

interface StripeWebCheckoutProps {
  /** Full Stripe Checkout Session URL */
  checkoutUrl: string
  /** URL prefix your backend redirects to on success (e.g. https://tranxfermarket.com/payment-success) */
  successUrlPattern?: string
  /** URL prefix your backend redirects to on cancel */
  cancelUrlPattern?: string
  /** Called with the Stripe session_id query param extracted from the success URL */
  onSuccess?: (sessionId: string | null) => void
  /** Called when the user cancels or the cancel redirect fires */
  onCancel?: () => void
  /** Optional title shown in the header bar */
  title?: string
}

export default function StripeWebCheckout({
  checkoutUrl,
  successUrlPattern = '/payment-success',
  cancelUrlPattern  = '/payment-cancel',
  onSuccess,
  onCancel,
  title = 'Checkout',
}: StripeWebCheckoutProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const webRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleClose = () => {
    onCancel?.()
    if (router.canGoBack()) router.back()
  }

  const handleNavChange = (event: WebViewNavigation) => {
    const { url } = event

    // ── Success redirect ──────────────────────────────────────────────────────
    if (url.includes(successUrlPattern)) {
      // Extract ?session_id= from the URL if present
      const match = url.match(/[?&]session_id=([^&]+)/)
      const sessionId = match ? match[1] : null
      onSuccess?.(sessionId)
      return
    }

    // ── Cancel redirect ───────────────────────────────────────────────────────
    if (url.includes(cancelUrlPattern)) {
      onCancel?.()
      if (router.canGoBack()) router.back()
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
          <CloseIcon />
        </TouchableOpacity>
      </View>

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Loading secure checkout…</Text>
        </View>
      )}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load checkout</Text>
          <Text style={styles.errorSub}>Check your connection and try again.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(false); webRef.current?.reload() }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── WebView ─────────────────────────────────────────────────────────── */}
      {!error && (
        <WebView
          ref={webRef}
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true) }}
          onNavigationStateChange={handleNavChange}
          // Stripe requires cookies + JS
          javaScriptEnabled
          domStorageEnabled
          // Hide the default WebView navigation controls
          hideKeyboardAccessoryView
          // iOS: allow inline media playback
          allowsInlineMediaPlayback
          // Prevent user from navigating away to arbitrary URLs
          setSupportMultipleWindows={false}
          // User-agent: some Stripe checks require a non-headless UA
          applicationNameForUserAgent="TranxferMarket/1.0"
        />
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft:    { width: 36 },
  headerTitle:   { color: Colors.text, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  closeBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── WebView
  webview: { flex: 1 },

  // ── Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    // Sit above the WebView while it loads
    zIndex: 10,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // ── Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  errorSub:   { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.28 },
})
