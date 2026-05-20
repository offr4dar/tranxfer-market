/**
 * hooks/useGuardianMode.ts
 *
 * Provides everything the app needs to know about the current user's
 * guardian status and handles PIN verification against the stored hash.
 *
 * Returns:
 *   isMinor       — the active player profile has is_minor = true
 *   isGuardian    — guardian_user_id matches the current Clerk user ID
 *   canSwitch     — isMinor && isGuardian (show the "Switch to Guardian View" button)
 *   pinHash       — the stored SHA-256 hash (used by the modal to verify)
 *   playerProfileId — UUID of the minor's player_profiles row
 *   loading       — true while fetching
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'

export interface GuardianStatus {
  isMinor:         boolean
  isGuardian:      boolean
  canSwitch:       boolean
  pinHash:         string | null
  playerProfileId: string | null
  loading:         boolean
}

export function useGuardianMode(): GuardianStatus {
  const { userId } = useAuth()
  const [status, setStatus] = useState<GuardianStatus>({
    isMinor:         false,
    isGuardian:      false,
    canSwitch:       false,
    pinHash:         null,
    playerProfileId: null,
    loading:         true,
  })

  useEffect(() => {
    if (!userId) {
      setStatus(s => ({ ...s, loading: false }))
      return
    }

    let cancelled = false

    supabase
      .from('player_profiles')
      .select('id, is_minor, guardian_user_id, guardian_pin_hash')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setStatus(s => ({ ...s, loading: false }))
          return
        }

        const isMinor    = !!data.is_minor
        const isGuardian = data.guardian_user_id === userId

        setStatus({
          isMinor,
          isGuardian,
          canSwitch:       isMinor && isGuardian,
          pinHash:         data.guardian_pin_hash ?? null,
          playerProfileId: data.id ?? null,
          loading:         false,
        })
      })

    return () => { cancelled = true }
  }, [userId])

  return status
}
