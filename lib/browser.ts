/**
 * lib/browser.ts
 *
 * Thin wrapper around expo-web-browser for opening external URLs
 * inside a themed in-app browser sheet (SFSafariViewController on iOS,
 * Chrome Custom Tabs on Android).
 *
 * Usage:
 *   import { openLink } from '@/lib/browser'
 *   await openLink('https://example.com')
 */

import * as WebBrowser from 'expo-web-browser'

export async function openLink(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url, {
    // Dark/green-tinted toolbar to match the app
    toolbarColor: '#0A1A0F',
    controlsColor: '#00FF87',
    // Dismiss button label (iOS)
    dismissButtonStyle: 'close',
    // Prevent external browser from opening (keep it in-app)
    showInRecents: false,
  })
}

// ─── Pre-defined app URLs ─────────────────────────────────────────────────────
// Update these when the marketing site is live

const BASE_URL = 'https://tranxfermarket.com'

export const LINKS = {
  terms:        `${BASE_URL}/legal/terms`,
  privacy:      `${BASE_URL}/legal/privacy`,
  safeguarding: `${BASE_URL}/legal/safeguarding`,
  support:      `${BASE_URL}/support`,
  faq:          `${BASE_URL}/faq`,
} as const
