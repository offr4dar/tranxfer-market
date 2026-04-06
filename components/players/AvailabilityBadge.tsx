import { cn } from '@/lib/utils'

type ContractStatus =
  | 'available_now'
  | 'available_end_of_season'
  | 'under_contract'
  | 'trial_period'

interface AvailabilityBadgeProps {
  status: ContractStatus
  className?: string
  showDot?: boolean
}

const statusConfig: Record<ContractStatus, { label: string; color: string; dot: string }> = {
  available_now: {
    label: 'Available Now',
    color: 'bg-[#00FF87]/15 text-[#00FF87] border-[#00FF87]/30',
    dot: 'bg-[#00FF87]',
  },
  trial_period: {
    label: 'Trial Period',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  available_end_of_season: {
    label: 'End of Season',
    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  under_contract: {
    label: 'Under Contract',
    color: 'bg-white/5 text-white/50 border-white/10',
    dot: 'bg-white/40',
  },
}

export function AvailabilityBadge({ status, className, showDot = true }: AvailabilityBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.under_contract

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.color,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      )}
      {config.label}
    </span>
  )
}
