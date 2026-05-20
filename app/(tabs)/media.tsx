/**
 * app/(tabs)/media.tsx
 *
 * The player Media tab — renders the full PlayerMediaScreen.
 * Only visible to players (scout users have `href: null` in _layout.tsx).
 *
 * The screen lives at app/player/media.tsx; this file is a thin wrapper so
 * Expo Router's tab system can manage it as a native tab while keeping the
 * screen logic in one place.
 */
export { default } from '@/app/player/media'
