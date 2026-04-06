import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Users, Eye, MessageSquare, TrendingUp, Search, Star } from 'lucide-react'

export const metadata = {
  title: 'Dashboard',
}

async function PlayerDashboard({ userId }: { userId: string }) {
  const supabase = createServerClient()

  // Fetch player profile and recent analytics
  const { data: profile } = await supabase
    .from('player_profiles')
    .select(`
      *,
      users!inner(clerk_user_id)
    `)
    .eq('users.clerk_user_id', userId)
    .single()

  const stats = [
    {
      label: 'Profile Views',
      value: profile?.profile_views_count ?? 0,
      icon: Eye,
      change: '+12% this week',
      positive: true,
    },
    {
      label: 'Contact Requests',
      value: 0,
      icon: MessageSquare,
      change: '2 new',
      positive: true,
    },
    {
      label: 'Profile Score',
      value: `${profile?.profile_completion_score ?? 0}%`,
      icon: TrendingUp,
      change: 'Complete your profile',
      positive: false,
    },
    {
      label: 'Shortlisted By',
      value: 0,
      icon: Star,
      change: 'Clubs watching you',
      positive: true,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {profile?.display_name ? `Hey, ${profile.display_name.split(' ')[0]} 👋` : 'Your Dashboard'}
        </h1>
        <p className="text-white/50 text-sm mt-1">Here&apos;s how your profile is performing</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-xl border border-white/5 hover-green">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-[#00FF87]" />
            </div>
            <div className="stat-number text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-white/50 text-xs">{stat.label}</div>
            <div className={`text-xs mt-1 ${stat.positive ? 'text-[#00FF87]' : 'text-white/40'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Profile completion prompt */}
      {(profile?.profile_completion_score ?? 0) < 80 && (
        <div className="glass-card p-6 rounded-xl border border-[#00FF87]/20 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Complete your profile</h3>
            <span className="stat-number text-sm">
              {profile?.profile_completion_score ?? 0}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-3">
            <div
              className="bg-[#00FF87] h-2 rounded-full transition-all duration-500"
              style={{ width: `${profile?.profile_completion_score ?? 0}%` }}
            />
          </div>
          <p className="text-white/50 text-sm">
            Players with complete profiles get 3x more views. Add your photo, highlight reel, and stats.
          </p>
          <a
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 text-[#00FF87] text-sm font-medium mt-3 hover:underline"
          >
            Complete profile →
          </a>
        </div>
      )}
    </div>
  )
}

async function ClubDashboard() {
  const stats = [
    { label: 'Players Viewed', value: '0', icon: Eye, change: 'This month', positive: true },
    { label: 'Active Shortlists', value: '0', icon: Star, change: 'Players saved', positive: true },
    { label: 'Contact Requests', value: '0', icon: MessageSquare, change: 'Sent this month', positive: true },
    { label: 'New Players', value: '0', icon: Users, change: 'Joined this week', positive: true },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Scouting Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Your recruitment activity at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-xl border border-white/5 hover-green">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-[#00FF87]" />
            </div>
            <div className="stat-number text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-white/50 text-xs">{stat.label}</div>
            <div className="text-[#00FF87] text-xs mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Quick search CTA */}
      <div className="glass-card p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00FF87]/10 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6 text-[#00FF87]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Start searching for players</h3>
            <p className="text-white/50 text-sm">
              Filter by position, nationality, age, availability, and league level.
            </p>
          </div>
          <a
            href="/dashboard/search"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-5 py-2.5 font-semibold text-sm hover:bg-[#00CC6A] transition-colors shrink-0"
          >
            Search Players
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const role = (user?.unsafeMetadata?.role as string) ?? 'player'

  return role === 'player' ? (
    <PlayerDashboard userId={userId} />
  ) : (
    <ClubDashboard />
  )
}
