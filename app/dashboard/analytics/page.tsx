import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TrendingUp, Eye, Building2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Analytics',
}

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerClient()

  // Get player profile
  const { data: profile } = await supabase
    .from('player_profiles')
    .select('id, profile_views_count, display_name')
    .single()

  // Get recent profile views with viewer org info
  const { data: recentViews } = profile
    ? await supabase
        .from('profile_views')
        .select(`
          *,
          organisations(name, logo_url, league_level)
        `)
        .eq('player_id', profile.id)
        .order('viewed_at', { ascending: false })
        .limit(20)
    : { data: [] }

  // Get views in last 7 days (simple count)
  const { count: weekViews } = profile
    ? await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', profile.id)
        .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    : { count: 0 }

  const stats = [
    {
      label: 'Total Profile Views',
      value: profile?.profile_views_count ?? 0,
      icon: Eye,
      sub: 'All time',
    },
    {
      label: 'Views This Week',
      value: weekViews ?? 0,
      icon: TrendingUp,
      sub: 'Last 7 days',
    },
    {
      label: 'Clubs Viewing',
      value: recentViews?.filter((v) => v.viewer_org_id).length ?? 0,
      icon: Building2,
      sub: 'Recent viewers',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#00FF87]" />
          Analytics
        </h1>
        <p className="text-white/50 text-sm mt-1">
          See who&apos;s been viewing your profile
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-xl border border-white/5">
            <stat.icon className="w-5 h-5 text-[#00FF87] mb-3" />
            <div className="stat-number text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-white/60 text-sm">{stat.label}</div>
            <div className="text-white/30 text-xs">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent views */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent viewers</h2>
        {recentViews && recentViews.length > 0 ? (
          <div className="space-y-3">
            {recentViews.map((view) => {
              const org = view.organisations as Record<string, string> | null
              return (
                <div
                  key={view.id}
                  className="glass-card p-4 rounded-xl border border-white/5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">
                      {org?.name ?? 'Anonymous viewer'}
                    </p>
                    {org?.league_level && (
                      <p className="text-white/40 text-xs">{org.league_level}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/30 text-xs shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Eye className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No views recorded yet</p>
            <p className="text-white/25 text-xs mt-1">
              Complete your profile to start getting discovered
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
