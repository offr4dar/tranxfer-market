'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const clubSchema = z.object({
  orgName: z.string().min(2, 'Club name must be at least 2 characters'),
  orgType: z.enum(['club', 'agency', 'scouting_network', 'independent']),
  country: z.string().min(2, 'Please select a country'),
  city: z.string().optional(),
  leagueLevel: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ClubFormValues = z.infer<typeof clubSchema>

const ORG_TYPES = [
  { value: 'club', label: 'Football Club' },
  { value: 'agency', label: 'Agency' },
  { value: 'scouting_network', label: 'Scouting Network' },
  { value: 'independent', label: 'Independent Scout' },
]

const LEAGUE_LEVELS = [
  'Premier League', 'Championship', 'League 1', 'League 2',
  'National League', 'National League North', 'National League South',
  'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Amateur', 'Academy',
]

export default function ClubOnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      orgType: 'club',
      orgName: '',
      country: '',
    },
  })

  async function onSubmit(values: ClubFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Update Clerk metadata to set role and onboarding complete
      await user?.update({
        unsafeMetadata: {
          role: 'club',
          onboardingComplete: true,
          orgName: values.orgName,
          orgType: values.orgType,
        },
      })

      // Create org in Supabase via API
      const res = await fetch('/api/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error('Failed to create organisation')

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4">
      <div className="absolute inset-0 bg-green-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">
            Tranxfer<span className="text-[#00FF87]">.</span>
          </h1>
          <div className="mt-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00FF87]/10 mb-4">
              <Building2 className="w-7 h-7 text-[#00FF87]" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Set up your organisation</h2>
            <p className="text-white/50 text-sm">
              Tell us about your club or scouting operation.
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="glass-card p-8 rounded-2xl border border-white/5 space-y-6"
        >
          {/* Org Type */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Organisation type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ORG_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    form.watch('orgType') === type.value
                      ? 'border-[#00FF87]/50 bg-[#00FF87]/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    value={type.value}
                    {...form.register('orgType')}
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.orgType && (
              <p className="text-red-400 text-xs mt-1">{form.formState.errors.orgType.message}</p>
            )}
          </div>

          {/* Org Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Organisation name <span className="text-red-400">*</span>
            </label>
            <input
              {...form.register('orgName')}
              placeholder="e.g. AFC Rovers"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            />
            {form.formState.errors.orgName && (
              <p className="text-red-400 text-xs mt-1">{form.formState.errors.orgName.message}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Country <span className="text-red-400">*</span>
            </label>
            <input
              {...form.register('country')}
              placeholder="e.g. England"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">City</label>
            <input
              {...form.register('city')}
              placeholder="e.g. Manchester"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            />
          </div>

          {/* League Level */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              League level
            </label>
            <select
              {...form.register('leagueLevel')}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            >
              <option value="">Select league level</option>
              {LEAGUE_LEVELS.map((l) => (
                <option key={l} value={l} className="bg-[#0A0F1E]">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Website URL
            </label>
            <input
              {...form.register('website')}
              placeholder="https://www.yourclub.com"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-6 py-4 font-semibold hover:bg-[#00CC6A] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Complete setup <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
