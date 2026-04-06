import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PlayerProfile } from '@/components/players/PlayerProfile'
import { Navbar } from '@/components/layout/Navbar'
import type { Metadata } from 'next'

interface PlayerPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: player } = await supabase
    .from('player_profiles')
    .select('display_name, primary_position, current_club, nationality')
    .eq('id', params.id)
    .single()

  if (!player) {
    return { title: 'Player Not Found' }
  }

  return {
    title: `${player.display_name} — ${player.primary_position} | Tranxfer Market`,
    description: `${player.display_name} is a ${player.primary_position} currently at ${player.current_club ?? 'free agent'}.`,
  }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const supabase = createServerClient()

  const { data: player } = await supabase
    .from('player_profiles')
    .select(`
      *,
      users(first_name, last_name, avatar_url),
      player_career_history(*)
    `)
    .eq('id', params.id)
    .eq('is_searchable', true)
    .single()

  if (!player) {
    notFound()
  }

  // Record profile view (server-side)
  await supabase.from('profile_views').insert({
    player_id: player.id,
  }).single()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0A0F1E] pt-16">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <PlayerProfile player={player} />
        </div>
      </main>
    </>
  )
}
