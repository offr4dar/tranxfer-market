import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Validation schemas ────────────────────────────────────────────────────────

const searchSchema = z.object({
  position: z.string().optional(),
  nationality: z.string().optional(),
  ageMin: z.coerce.number().min(16).max(50).optional(),
  ageMax: z.coerce.number().min(16).max(50).optional(),
  availability: z.string().optional(),
  leagueLevel: z.string().optional(),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

const createPlayerSchema = z.object({
  displayName: z.string().min(2).max(100),
  dob: z.string().optional(),
  nationality: z.string().optional(),
  primaryPosition: z.string(),
  secondaryPositions: z.array(z.string()).optional(),
  currentClub: z.string().optional(),
  leagueLevel: z.string().optional(),
  contractStatus: z.enum(['available_now', 'available_end_of_season', 'under_contract', 'trial_period']),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  bio: z.string().max(500).optional(),
  hasAgent: z.boolean().default(false),
  agentName: z.string().optional(),
  agentContact: z.string().optional(),
})

// ─── GET /api/players — Search players ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl

  // Validate and parse query params
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { position, nationality, ageMin, ageMax, availability, leagueLevel, preferredFoot, q, page, limit } =
    parsed.data

  const supabase = createServerClient()

  let query = supabase
    .from('player_profiles')
    .select(
      `
      id,
      display_name,
      primary_position,
      secondary_positions,
      nationality,
      dob,
      height_cm,
      current_club,
      league_level,
      contract_status,
      available_from_date,
      preferred_foot,
      profile_photo_url,
      is_featured,
      verified_status,
      profile_completion_score,
      stat_goals,
      stat_assists,
      stat_appearances,
      stat_clean_sheets,
      stat_season,
      last_active,
      bio
    `,
      { count: 'exact' }
    )
    .eq('is_searchable', true)

  // ── Filters ──────────────────────────────────────────────

  // Position: match primary or secondary
  if (position) {
    query = query.or(`primary_position.eq.${position},secondary_positions.cs.{${position}}`)
  }

  // Nationality
  if (nationality) {
    query = query.eq('nationality', nationality)
  }

  // Age range — convert to DOB range
  if (ageMin !== undefined) {
    const maxDob = new Date()
    maxDob.setFullYear(maxDob.getFullYear() - ageMin)
    query = query.lte('dob', maxDob.toISOString().split('T')[0])
  }

  if (ageMax !== undefined) {
    const minDob = new Date()
    minDob.setFullYear(minDob.getFullYear() - ageMax)
    query = query.gte('dob', minDob.toISOString().split('T')[0])
  }

  // Availability / contract status
  if (availability) {
    query = query.eq('contract_status', availability)
  }

  // League level
  if (leagueLevel) {
    query = query.eq('league_level', leagueLevel)
  }

  // Preferred foot
  if (preferredFoot) {
    query = query.eq('preferred_foot', preferredFoot)
  }

  // Name search (case-insensitive)
  if (q) {
    query = query.ilike('display_name', `%${q}%`)
  }

  // ── Ordering: featured first, then by profile completeness, then last active ──
  query = query
    .order('is_featured', { ascending: false })
    .order('profile_completion_score', { ascending: false })
    .order('last_active', { ascending: false, nullsFirst: false })

  // ── Pagination ────────────────────────────────────────────────────────────────
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data: players, error, count } = await query

  if (error) {
    console.error('[api/players] Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({
    players,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

// ─── POST /api/players — Create player profile ────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createPlayerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // Get the internal user ID from Clerk user ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('player_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
  }

  const data = parsed.data

  const { data: profile, error: createError } = await supabase
    .from('player_profiles')
    .insert({
      user_id: user.id,
      display_name: data.displayName,
      dob: data.dob ?? null,
      nationality: data.nationality ?? null,
      primary_position: data.primaryPosition,
      secondary_positions: data.secondaryPositions ?? [],
      current_club: data.currentClub ?? null,
      league_level: data.leagueLevel ?? null,
      contract_status: data.contractStatus,
      preferred_foot: data.preferredFoot ?? null,
      height_cm: data.heightCm ?? null,
      weight_kg: data.weightKg ?? null,
      bio: data.bio ?? null,
      has_agent: data.hasAgent,
      agent_name: data.agentName ?? null,
      agent_contact: data.agentContact ?? null,
      is_searchable: true,
    })
    .select()
    .single()

  if (createError) {
    console.error('[api/players] Create error:', createError)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  return NextResponse.json({ player: profile }, { status: 201 })
}
