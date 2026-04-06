import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

const updateSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  dob: z.string().optional(),
  nationality: z.string().optional(),
  primaryPosition: z.string().optional(),
  secondaryPositions: z.array(z.string()).optional(),
  currentClub: z.string().optional(),
  leagueLevel: z.string().optional(),
  contractStatus: z
    .enum(['available_now', 'available_end_of_season', 'under_contract', 'trial_period'])
    .optional(),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  bio: z.string().max(500).optional(),
  isSearchable: z.boolean().optional(),
  hasAgent: z.boolean().optional(),
  agentName: z.string().optional(),
  statGoals: z.number().optional(),
  statAssists: z.number().optional(),
  statAppearances: z.number().optional(),
  statCleanSheets: z.number().optional(),
  statSeason: z.string().optional(),
  highlightReelUrl: z.string().url().optional(),
})

// ─── GET /api/players/[id] ────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createServerClient()

  const { data: player, error } = await supabase
    .from('player_profiles')
    .select(`
      *,
      users(first_name, last_name, avatar_url),
      player_career_history(*)
    `)
    .eq('id', params.id)
    .eq('is_searchable', true)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  return NextResponse.json({ player })
}

// ─── PUT /api/players/[id] ────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // Verify ownership — player must own this profile
  const { data: profile } = await supabase
    .from('player_profiles')
    .select('id, users!inner(clerk_user_id)')
    .eq('id', params.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profileWithUser = profile as typeof profile & { users: { clerk_user_id: string } }
  if (profileWithUser.users.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = parsed.data

  // Map camelCase → snake_case for DB
  const updates: Record<string, unknown> = {}
  if (data.displayName !== undefined) updates.display_name = data.displayName
  if (data.dob !== undefined) updates.dob = data.dob
  if (data.nationality !== undefined) updates.nationality = data.nationality
  if (data.primaryPosition !== undefined) updates.primary_position = data.primaryPosition
  if (data.secondaryPositions !== undefined) updates.secondary_positions = data.secondaryPositions
  if (data.currentClub !== undefined) updates.current_club = data.currentClub
  if (data.leagueLevel !== undefined) updates.league_level = data.leagueLevel
  if (data.contractStatus !== undefined) updates.contract_status = data.contractStatus
  if (data.preferredFoot !== undefined) updates.preferred_foot = data.preferredFoot
  if (data.heightCm !== undefined) updates.height_cm = data.heightCm
  if (data.weightKg !== undefined) updates.weight_kg = data.weightKg
  if (data.bio !== undefined) updates.bio = data.bio
  if (data.isSearchable !== undefined) updates.is_searchable = data.isSearchable
  if (data.hasAgent !== undefined) updates.has_agent = data.hasAgent
  if (data.agentName !== undefined) updates.agent_name = data.agentName
  if (data.statGoals !== undefined) updates.stat_goals = data.statGoals
  if (data.statAssists !== undefined) updates.stat_assists = data.statAssists
  if (data.statAppearances !== undefined) updates.stat_appearances = data.statAppearances
  if (data.statCleanSheets !== undefined) updates.stat_clean_sheets = data.statCleanSheets
  if (data.statSeason !== undefined) updates.stat_season = data.statSeason
  if (data.highlightReelUrl !== undefined) updates.highlight_reel_url = data.highlightReelUrl

  const { data: updated, error: updateError } = await supabase
    .from('player_profiles')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (updateError) {
    console.error('[api/players/id] Update error:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ player: updated })
}

// ─── DELETE /api/players/[id] ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Verify ownership
  const { data: profile } = await supabase
    .from('player_profiles')
    .select('id, users!inner(clerk_user_id)')
    .eq('id', params.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profileWithUser = profile as typeof profile & { users: { clerk_user_id: string } }
  if (profileWithUser.users.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete — make profile unsearchable instead of hard delete
  const { error } = await supabase
    .from('player_profiles')
    .update({ is_searchable: false })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
