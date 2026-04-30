/**
 * Temporary in-memory store for the wizard profile payload.
 * Populated in onboarding.tsx before navigating to verify-email,
 * consumed and cleared in verify-email.tsx after the Clerk session is active.
 */
export type PendingProfile = {
  table:   'player_profiles' | 'scout_profiles'
  payload: Record<string, unknown>   // user_id filled in after verification
}

let _pending: PendingProfile | null = null

export function setPendingProfile(p: PendingProfile) { _pending = p }
export function getPendingProfile(): PendingProfile | null { return _pending }
export function clearPendingProfile()                { _pending = null }
