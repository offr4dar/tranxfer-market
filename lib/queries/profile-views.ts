/**
 * lib/queries/profile-views.ts
 *
 * Logging and querying profile views for the scout-interest signal.
 *
 * The profile_views table stores:
 *   player_id  TEXT  — Clerk user_id of the player being viewed
 *   viewer_id  TEXT  — Clerk user_id of the viewer
 *   viewed_at  TIMESTAMPTZ
 *
 * Rules enforced here:
 *   - Do not log self-views
 *   - Deduplicate: only one row per viewer per player per 24-hour window
 */

import { supabase } from '@/lib/supabase'

// ─── Log a profile view ───────────────────────────────────────────────────────

export async function logProfileView(params: {
  viewerUserId:  string   // Clerk user ID of the person looking
  playerUserId:  string   // Clerk user ID of the player being viewed
}): Promise<void> {
  const { viewerUserId, playerUserId } = params

  // Never log self-views
  if (viewerUserId === playerUserId) return

  // Check if this viewer has already logged a view in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: existing } = await supabase
    .from('profile_views')
    .select('id')
    .eq('viewer_id', viewerUserId)
    .eq('player_id', playerUserId)
    .gte('viewed_at', since)
    .limit(1)
    .maybeSingle()

  if (existing) return  // already logged within the last 24h — skip

  await supabase.from('profile_views').insert({
    viewer_id: viewerUserId,
    player_id: playerUserId,
  })
}

// ─── Fetch view counts for the player's own profile screen ───────────────────

export interface ProfileViewStats {
  thisWeek:      number
  lastWeek:      number
  trendPct:      number | null   // null if lastWeek === 0 (can't calculate %)
  trendUp:       boolean
  dailyThisWeek: { date: string; count: number }[]  // 7 entries, Mon→Sun
}

export async function fetchProfileViewStats(playerUserId: string): Promise<ProfileViewStats> {
  const now   = new Date()

  // Monday of the current week at 00:00 local midnight (UTC-based is fine for display)
  const dow       = now.getDay()          // 0=Sun … 6=Sat
  const toMonday  = dow === 0 ? -6 : 1 - dow
  const monday    = new Date(now)
  monday.setDate(now.getDate() + toMonday)
  monday.setHours(0, 0, 0, 0)

  const lastMonday = new Date(monday)
  lastMonday.setDate(monday.getDate() - 7)

  const thisWeekStart = monday.toISOString()
  const lastWeekStart = lastMonday.toISOString()

  // Fetch last 14 days of views in one query (avoids two round-trips)
  const { data, error } = await supabase
    .from('profile_views')
    .select('viewed_at')
    .eq('player_id', playerUserId)
    .gte('viewed_at', lastWeekStart)
    .order('viewed_at', { ascending: true })

  if (error || !data) {
    return { thisWeek: 0, lastWeek: 0, trendPct: null, trendUp: false, dailyThisWeek: [] }
  }

  const thisWeekRows = data.filter(r => r.viewed_at >= thisWeekStart)
  const lastWeekRows = data.filter(r => r.viewed_at < thisWeekStart)

  const thisWeek = thisWeekRows.length
  const lastWeek = lastWeekRows.length
  const trendPct = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)

  // Build daily breakdown for this week (Mon → today)
  const dailyMap: Record<string, number> = {}
  for (const row of thisWeekRows) {
    const day = new Date(row.viewed_at).toLocaleDateString('en-GB', { weekday: 'short' })
    dailyMap[day] = (dailyMap[day] ?? 0) + 1
  }

  // Always return 7 slots Mon–Sun regardless of data
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dailyThisWeek = DAY_LABELS.map(d => ({ date: d, count: dailyMap[d] ?? 0 }))

  return {
    thisWeek,
    lastWeek,
    trendPct,
    trendUp: thisWeek >= lastWeek,
    dailyThisWeek,
  }
}
