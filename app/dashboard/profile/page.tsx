import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PlayerProfileForm } from '@/components/players/PlayerProfileForm'

export const metadata = {
  title: 'Edit Profile',
}

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: profile } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('users.clerk_user_id', userId)
    .single()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="text-white/50 text-sm mt-1">
          Keep your profile up to date — clubs check it before reaching out
        </p>
      </div>

      <div className="max-w-2xl">
        <PlayerProfileForm initialData={profile} />
      </div>
    </div>
  )
}
