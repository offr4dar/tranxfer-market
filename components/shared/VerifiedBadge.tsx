import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-[#00FF87]', className)}>
      <CheckCircle size={12} />
      Verified
    </span>
  )
}
