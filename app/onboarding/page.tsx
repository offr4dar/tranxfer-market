import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { RoleSelector } from '@/components/onboarding/RoleSelector'

export const metadata = {
  title: 'Get Started',
}

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-white mb-1">
            Tranxfer<span className="text-[#00FF87]">.</span>
          </h1>
          <div className="mt-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              How are you using Tranxfer?
            </h2>
            <p className="text-white/50">
              We&apos;ll personalise your experience based on your role.
            </p>
          </div>
        </div>

        <RoleSelector />
      </div>
    </div>
  )
}
