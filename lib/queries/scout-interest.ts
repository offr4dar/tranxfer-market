import { supabase } from '@/lib/supabase'
import { ChartDataPoint } from '@/components/ScoutInterestChart'

export interface ScoutInterestResult {
  data30: ChartDataPoint[]
  data7:  ChartDataPoint[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatLabel(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function fetchScoutInterest(
  playerProfileId: string,
): Promise<ScoutInterestResult> {
  const now   = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 29)
  const sinceStr = start.toISOString()

  const [{ data: viewRows }, { data: shortRows }] = await Promise.all([
    supabase
      .from('profile_views')
      .select('viewed_at')
      .eq('viewed_profile_id', playerProfileId)
      .gte('viewed_at', sinceStr),
    supabase
      .from('watchlist_items')
      .select('created_at')
      .eq('player_id', playerProfileId)
      .gte('created_at', sinceStr),
  ])

  // Build zeroed 30-day maps keyed by YYYY-MM-DD
  const viewMap:  Record<string, number> = {}
  const shortMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    viewMap[toKey(d)]  = 0
    shortMap[toKey(d)] = 0
  }

  viewRows?.forEach(r => {
    const k = (r.viewed_at as string).split('T')[0]
    if (k in viewMap) viewMap[k]++
  })
  shortRows?.forEach(r => {
    const k = (r.created_at as string).split('T')[0]
    if (k in shortMap) shortMap[k]++
  })

  const data30: ChartDataPoint[] = Object.keys(viewMap)
    .sort()
    .map(key => {
      const d = new Date(key + 'T00:00:00')
      return { date: formatLabel(d), views: viewMap[key], shortlists: shortMap[key] }
    })

  return { data30, data7: data30.slice(-7) }
}
