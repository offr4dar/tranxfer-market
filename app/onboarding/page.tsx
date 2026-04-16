'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const raw = localStorage.getItem('tm_onboarding')

    // No wizard data — already onboarded or arrived directly, send to dashboard
    if (!raw) {
      router.replace('/dashboard')
      return
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(raw)
    } catch {
      localStorage.removeItem('tm_onboarding')
      router.replace('/dashboard')
      return
    }

    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((result) => {
        localStorage.removeItem('tm_onboarding')
        router.replace(result.redirect ?? '/dashboard')
      })
      .catch(() => setStatus('error'))
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <div className="text-center">
        <Image
          src="/images/tm_logo.svg"
          alt="Tranxfer Market"
          width={120}
          height={30}
          className="h-8 w-auto mx-auto mb-10"
        />

        {status === 'loading' && (
          <>
            <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Setting up your profile...</p>
          </>
        )}

        {status === 'error' && (
          <div>
            <p className="text-white/60 text-sm mb-2">Something went wrong saving your profile.</p>
            <a href="/dashboard" className="text-[#00FF87] text-sm hover:underline">
              Continue to dashboard →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
