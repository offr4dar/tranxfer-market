import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const contactSchema = z.object({
  playerId: z.string().uuid(),
  initialMessage: z.string().max(1000).optional(),
})

// POST /api/contacts — Contact a player (gated by subscription)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerClient()

  // Get internal user
  const { data: user } = await supabase
    .from('users')
    .select('id, account_type')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Only clubs/scouts/agents can initiate contact
  if (user.account_type === 'player') {
    return NextResponse.json(
      { error: 'Players cannot initiate contact requests' },
      { status: 403 }
    )
  }

  // ── Subscription gate ─────────────────────────────────────────────────────
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .single()

  const hasPaidSub =
    subscription && ['starter', 'pro', 'elite'].includes(subscription.tier)

  if (!hasPaidSub) {
    return NextResponse.json(
      {
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'You need an active paid plan to contact players. Upgrade to get started.',
      },
      { status: 402 }
    )
  }

  // Check if already contacted this player
  const { data: existing } = await supabase
    .from('contacts')
    .select('id, status')
    .eq('initiator_user_id', user.id)
    .eq('player_id', parsed.data.playerId)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Already contacted this player', existing },
      { status: 409 }
    )
  }

  // Get player's user_id for the contact record
  const { data: playerProfile } = await supabase
    .from('player_profiles')
    .select('id, user_id')
    .eq('id', parsed.data.playerId)
    .eq('is_searchable', true)
    .single()

  if (!playerProfile) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  // Create contact record
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      initiator_user_id: user.id,
      player_id: playerProfile.id,
      player_user_id: playerProfile.user_id,
      status: 'pending',
      initial_message: parsed.data.initialMessage ?? null,
    })
    .select()
    .single()

  if (contactError) {
    console.error('[api/contacts] Error creating contact:', contactError)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }

  // Create notification for player
  await supabase.from('notifications').insert({
    user_id: playerProfile.user_id,
    type: 'contact_request',
    title: 'New contact request',
    body: 'A club or scout wants to get in touch',
    data: { contact_id: contact.id, initiator_user_id: user.id },
  })

  return NextResponse.json({ contact }, { status: 201 })
}

// GET /api/contacts — Get contacts for current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      *,
      player_profiles!player_id(
        id,
        display_name,
        primary_position,
        profile_photo_url,
        current_club,
        league_level
      )
    `)
    .order('initiated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }

  return NextResponse.json({ contacts })
}
