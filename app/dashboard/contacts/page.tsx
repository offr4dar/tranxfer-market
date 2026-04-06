import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Contacts',
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-[#00FF87]' },
  declined: { label: 'Declined', icon: XCircle, color: 'text-red-400' },
  withdrawn: { label: 'Withdrawn', icon: XCircle, color: 'text-white/40' },
}

export default async function ContactsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      *,
      player_profiles!player_id(
        display_name,
        primary_position,
        profile_photo_url,
        current_club,
        league_level
      )
    `)
    .order('initiated_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[#00FF87]" />
          Contacts
        </h1>
        <p className="text-white/50 text-sm mt-1">Players you&apos;ve reached out to</p>
      </div>

      {contacts && contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const status = statusConfig[contact.status as keyof typeof statusConfig]
            const StatusIcon = status.icon
            const player = contact.player_profiles as Record<string, string> | null

            return (
              <div
                key={contact.id}
                className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0 overflow-hidden">
                  {player?.profile_photo_url ? (
                    <img
                      src={player.profile_photo_url}
                      alt={player.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-lg">
                      {player?.display_name?.[0] ?? '?'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-white truncate">
                      {player?.display_name ?? 'Unknown Player'}
                    </h3>
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                      {player?.primary_position}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm truncate">
                    {player?.current_club ?? 'Unknown Club'} · {player?.league_level ?? '—'}
                  </p>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-1.5 text-sm ${status.color} shrink-0`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{status.label}</span>
                </div>

                {/* Time */}
                <div className="text-white/30 text-xs shrink-0 hidden md:block">
                  {formatDistanceToNow(new Date(contact.initiated_at), { addSuffix: true })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <MessageSquare className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold mb-2">No contacts yet</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto mb-6">
            When you contact players, they&apos;ll appear here.
          </p>
          <a
            href="/dashboard/search"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-5 py-2.5 font-semibold text-sm hover:bg-[#00CC6A] transition-colors"
          >
            Search Players
          </a>
        </div>
      )}
    </div>
  )
}
