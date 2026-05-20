import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ContactPermissionResult {
  canMessage: boolean
  canRequest: boolean
  reason: string
  loading: boolean
}

interface Params {
  playerProfileId: string | null
  isMinor: boolean
  guardianConsentActive: boolean
  contactPermission: 'none' | 'endorsed_only' | 'all_verified'
  scoutUserId: string | null
}

export function useContactPermission({
  playerProfileId,
  isMinor,
  guardianConsentActive,
  contactPermission,
  scoutUserId,
}: Params): ContactPermissionResult {
  const [result, setResult] = useState<ContactPermissionResult>({
    canMessage: false,
    canRequest: false,
    reason: '',
    loading: true,
  })

  useEffect(() => {
    // Not a minor — always allow messaging
    if (!isMinor) {
      setResult({ canMessage: true, canRequest: false, reason: '', loading: false })
      return
    }

    // Guardian consent withdrawn
    if (!guardianConsentActive) {
      setResult({ canMessage: false, canRequest: false, reason: 'This profile is no longer active.', loading: false })
      return
    }

    if (!playerProfileId || !scoutUserId) {
      setResult({ canMessage: false, canRequest: false, reason: '', loading: false })
      return
    }

    if (contactPermission === 'none') {
      setResult({
        canMessage: false,
        canRequest: true,
        reason: "This player's guardian has not enabled messaging. You can send a contact request for the guardian to review.",
        loading: false,
      })
      return
    }

    if (contactPermission === 'all_verified') {
      setResult(s => ({ ...s, loading: true }))
      supabase
        .from('scout_profiles')
        .select('first_name')
        .eq('user_id', scoutUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.first_name) {
            setResult({ canMessage: true, canRequest: false, reason: '', loading: false })
          } else {
            setResult({ canMessage: false, canRequest: false, reason: 'Complete your scout profile to contact players.', loading: false })
          }
        })
      return
    }

    // endorsed_only — check the guardian's approval for this scout
    setResult(s => ({ ...s, loading: true }))
    supabase
      .from('guardian_contact_approvals')
      .select('status')
      .eq('player_profile_id', playerProfileId)
      .eq('scout_user_id', scoutUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === 'approved') {
          setResult({ canMessage: true, canRequest: false, reason: '', loading: false })
        } else if (data?.status === 'blocked') {
          setResult({ canMessage: false, canRequest: false, reason: 'Contact not available for this player.', loading: false })
        } else {
          setResult({
            canMessage: false,
            canRequest: true,
            reason: "This player's guardian has not enabled messaging. You can send a contact request for the guardian to review.",
            loading: false,
          })
        }
      })
  }, [playerProfileId, isMinor, guardianConsentActive, contactPermission, scoutUserId])

  return result
}
