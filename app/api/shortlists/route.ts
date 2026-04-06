import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createShortlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(true),
  playerId: z.string().uuid().optional(), // Optional: add player on creation
})

// GET /api/shortlists — Get all shortlists for current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: shortlists, error } = await supabase
    .from('shortlists')
    .select(`
      *,
      shortlist_players(
        id,
        notes,
        rating,
        added_at,
        player_profiles(
          id,
          display_name,
          primary_position,
          profile_photo_url,
          current_club,
          league_level,
          contract_status,
          nationality
        )
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch shortlists' }, { status: 500 })
  }

  return NextResponse.json({ shortlists })
}

// POST /api/shortlists — Create shortlist
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createShortlistSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: shortlist, error } = await supabase
    .from('shortlists')
    .insert({
      owner_user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      is_private: parsed.data.isPrivate,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create shortlist' }, { status: 500 })
  }

  // If playerId provided, add player to new shortlist immediately
  if (parsed.data.playerId) {
    await supabase.from('shortlist_players').insert({
      shortlist_id: shortlist.id,
      player_id: parsed.data.playerId,
      added_by: user.id,
    })
  }

  return NextResponse.json({ shortlist }, { status: 201 })
}
