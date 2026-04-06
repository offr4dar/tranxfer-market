'use client'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  requiredTier?: 'club' | 'player_premium'
  fallback?: React.ReactNode
}

export function SubscriptionGate({ children, requiredTier = 'club', fallback }: Props) {
  const { canContact, isPlayer, loading } = useSubscription()

  if (loading) return null

  const hasAccess = requiredTier === 'club' ? canContact : isPlayer

  if (!hasAccess) {
    return fallback ?? (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-gray-400 mb-3">
          {requiredTier === 'club' ? 'Upgrade to contact players' : 'Upgrade for premium features'}
        </p>
        <Button asChild size="sm" className="bg-[#00FF87] text-black hover:bg-[#00FF87]/90">
          <Link href="/dashboard/settings">Upgrade Plan</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
