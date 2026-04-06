import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PlayerWizard } from '@/components/onboarding/PlayerWizard'

export const metadata = {
  title: 'Set Up Player Profile',
}

export default async function PlayerOnboardingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4">
      <div className="absolute inset-0 bg-green-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">
            Tranxfer<span className="text-[#00FF87]">.</span>
          </h1>
          <div className="mt-6">
            <h2 className="text-3xl font-bold mb-2">Build your player profile</h2>
            <p className="text-white/50 text-sm">
              Takes 3 minutes. Clubs can find you as soon as you&apos;re live.
            </p>
          </div>
        </div>

        <PlayerWizard />
      </div>
    </div>
  )
}
