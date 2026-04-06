import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Star, Plus, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Shortlists',
}

export default async function ShortlistsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerClient()

  // Fetch shortlists with player count
  const { data: shortlists } = await supabase
    .from('shortlists')
    .select(`
      *,
      shortlist_players(count)
    `)
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Star className="w-6 h-6 text-[#00FF87]" />
            Shortlists
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Your saved player lists and scouting reports
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-4 py-2.5 font-semibold text-sm hover:bg-[#00CC6A] transition-colors">
          <Plus className="w-4 h-4" />
          New Shortlist
        </button>
      </div>

      {shortlists && shortlists.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortlists.map((list) => (
            <Link
              key={list.id}
              href={`/dashboard/shortlists/${list.id}`}
              className="glass-card p-6 rounded-xl border border-white/5 hover-green block group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00FF87]/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#00FF87]" />
                </div>
                {list.is_private && (
                  <span className="text-xs text-white/40 border border-white/10 rounded-full px-2 py-0.5">
                    Private
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#00FF87] transition-colors">
                {list.name}
              </h3>
              {list.description && (
                <p className="text-white/40 text-sm mb-3 line-clamp-2">{list.description}</p>
              )}
              <div className="flex items-center gap-1 text-white/40 text-sm">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {/* @ts-ignore */}
                  {list.shortlist_players?.[0]?.count ?? 0} players
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <Star className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold mb-2">No shortlists yet</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto mb-6">
            Create a shortlist to save and organise players you&apos;re tracking.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-5 py-2.5 font-semibold text-sm hover:bg-[#00CC6A] transition-colors">
            <Plus className="w-4 h-4" />
            Create first shortlist
          </button>
        </div>
      )}
    </div>
  )
}
