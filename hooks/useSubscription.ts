'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'

export function useSubscription() {
  const { user } = useUser()
  const [tier, setTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
      .then(({ data }) => {
        if (data) setTier(data.tier)
        setLoading(false)
      })
  }, [user])

  return {
    tier,
    loading,
    isPlayer: tier === 'player_premium',
    canContact: ['club_starter', 'club_pro', 'club_enterprise'].includes(tier),
    isClub: ['club_starter', 'club_pro', 'club_enterprise'].includes(tier),
  }
}
