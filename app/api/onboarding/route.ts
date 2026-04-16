import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { role, first_name, last_name, ...rest } = body

  if (!role || !first_name || !last_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (role === 'player') {
    const { error } = await supabaseAdmin.from('player_profiles').upsert({
      user_id: userId,
      first_name,
      last_name,
      age: rest.age ?? null,
      nationality: rest.nationality ?? null,
      primary_position: rest.primary_position ?? null,
      contract_status: rest.contract_status ?? null,
      is_searchable: true,
      profile_completion_score: calculatePlayerCompletion({ first_name, last_name, ...rest }),
    })
    if (error) {
      console.error('[onboarding] player error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ role: 'player', redirect: '/dashboard' })
  }

  if (role === 'agent') {
    const { error } = await supabaseAdmin.from('agent_profiles').upsert({
      user_id: userId,
      first_name,
      last_name,
      organisation_name: rest.organisation_name ?? null,
      country: rest.country ?? null,
      positions_seeking: rest.positions_seeking ?? [],
      league_level: rest.league_level ?? null,
      subscription_tier: 'free',
    })
    if (error) {
      console.error('[onboarding] agent error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ role: 'agent', redirect: '/dashboard' })
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
}

// Basic completion score — each filled wizard field is worth ~25 points
function calculatePlayerCompletion(data: Record<string, unknown>): number {
  const fields = ['first_name', 'last_name', 'age', 'nationality', 'primary_position', 'contract_status']
  const filled = fields.filter(f => data[f] !== null && data[f] !== undefined && data[f] !== '').length
  return Math.round((filled / fields.length) * 30) // wizard fills ~30% of total profile
}
