'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'player' | 'agent'

interface WizardData {
  role?: Role
  first_name?: string
  last_name?: string
  // Player-specific
  age?: number
  nationality?: string
  primary_position?: string
  contract_status?: string
  // Agent-specific
  organisation_name?: string
  country?: string
  positions_seeking?: string[]
  league_level?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIONS = [
  'GK',  'RB',  'CB',  'LB',  'RWB',
  'LWB', 'CDM', 'CM',  'CAM', 'RM',
  'LM',  'RW',  'LW',  'CF',  'ST',
]

const NATIONALITIES = [
  'English', 'Welsh', 'Scottish', 'Northern Irish', 'Irish',
  'French', 'Spanish', 'German', 'Italian', 'Portuguese',
  'Brazilian', 'Argentine', 'Nigerian', 'Ghanaian', 'Senegalese',
  'Moroccan', 'Ivorian', 'Dutch', 'Belgian', 'Swedish',
  'Norwegian', 'Danish', 'Polish', 'Czech', 'Croatian',
  'Serbian', 'Turkish', 'American', 'Canadian', 'Australian',
  'Japanese', 'Korean', 'South African', 'Jamaican', 'Other',
]

const COUNTRIES = [
  'United Kingdom', 'France', 'Spain', 'Germany', 'Italy',
  'Portugal', 'Netherlands', 'Belgium', 'Ireland', 'Sweden',
  'Norway', 'Denmark', 'Poland', 'United States', 'Canada',
  'Brazil', 'Argentina', 'Nigeria', 'Ghana', 'Morocco',
  'South Africa', 'Australia', 'Japan', 'Other',
]

const LEAGUE_LEVELS = [
  'Premier League', 'Championship', 'League 1', 'League 2',
  'National League', 'Step 3', 'Step 4', 'Step 5', 'Step 6',
  'Amateur', 'Academy', 'International',
]

const CONTRACT_STATUSES = [
  {
    value: 'available_now',
    label: 'Available Now',
    desc: 'Free agent, ready to move immediately',
  },
  {
    value: 'available_eot',
    label: 'Available End of Season',
    desc: 'Contract ending, open to pre-contract talks',
  },
  {
    value: 'under_contract',
    label: 'Under Contract',
    desc: 'Contracted but open to offers',
  },
  {
    value: 'trial',
    label: 'Looking for a Trial',
    desc: 'Seeking a trial opportunity',
  },
]

const TOTAL_STEPS = 4 // 0 = role, 1 = name, 2 = details, 3 = preferences

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = (err: boolean) =>
  cn(
    'w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-white/20',
    'outline-none transition-all duration-200',
    'focus:ring-1 focus:ring-[#00FF87] focus:border-[#00FF87]',
    err ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'
  )

const selectCls = (err: boolean) =>
  cn(
    'w-full bg-[#0D1526] border rounded-xl px-4 py-3.5 text-white',
    'outline-none transition-all duration-200 appearance-none cursor-pointer',
    'focus:ring-1 focus:ring-[#00FF87] focus:border-[#00FF87]',
    err ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'
  )

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-[#00FF87] text-xs font-semibold uppercase tracking-widest mb-3">
        {eyebrow}
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

// ─── Step 0: Role Selection ───────────────────────────────────────────────────

function StepRoleSelect({
  selected,
  onSelect,
}: {
  selected?: Role
  onSelect: (role: Role) => void
}) {
  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          I am a<span className="text-[#00FF87]">...</span>
        </h1>
        <p className="text-white/40">Choose your role to get started — it only takes 2 minutes.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Player */}
        <button
          onClick={() => onSelect('player')}
          className={cn(
            'relative text-left p-7 rounded-2xl border transition-all duration-200 group',
            selected === 'player'
              ? 'border-[#00FF87] bg-[#00FF87]/5 shadow-green-sm'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
          )}
        >
          {selected === 'player' && (
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#00FF87] flex items-center justify-center">
              <svg className="w-3 h-3 text-[#0A0F1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="text-4xl mb-5">⚽</div>
          <h2 className={cn('text-xl font-bold mb-2 transition-colors', selected === 'player' ? 'text-[#00FF87]' : 'text-white')}>
            Player
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Showcase your talent and get discovered by clubs and scouts worldwide.
          </p>
        </button>

        {/* Agent */}
        <button
          onClick={() => onSelect('agent')}
          className={cn(
            'relative text-left p-7 rounded-2xl border transition-all duration-200 group',
            selected === 'agent'
              ? 'border-[#00FF87] bg-[#00FF87]/5 shadow-green-sm'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
          )}
        >
          {selected === 'agent' && (
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#00FF87] flex items-center justify-center">
              <svg className="w-3 h-3 text-[#0A0F1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="text-4xl mb-5">🔍</div>
          <h2 className={cn('text-xl font-bold mb-2 transition-colors', selected === 'agent' ? 'text-[#00FF87]' : 'text-white')}>
            Agent
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Find and recruit the right players for your club, academy or agency.
          </p>
        </button>
      </div>

      <p className="text-center text-white/20 text-xs mt-8">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#00FF87] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

// ─── Step 1: Name (shared) ────────────────────────────────────────────────────

function StepName({
  data,
  update,
  errors,
}: {
  data: WizardData
  update: (f: Partial<WizardData>) => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <StepHeader
        eyebrow={`${data.role === 'player' ? 'Player' : 'Agent'} Setup · Step 1 of 3`}
        title="What's your name?"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" error={errors.first_name}>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Marcus"
            value={data.first_name ?? ''}
            onChange={(e) => update({ first_name: e.target.value })}
            className={inputCls(!!errors.first_name)}
          />
        </Field>
        <Field label="Last name" error={errors.last_name}>
          <input
            type="text"
            placeholder="e.g. Rashford"
            value={data.last_name ?? ''}
            onChange={(e) => update({ last_name: e.target.value })}
            className={inputCls(!!errors.last_name)}
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Step 2 (Player): Age + Nationality ───────────────────────────────────────

function StepPlayerBasics({
  data,
  update,
  errors,
}: {
  data: WizardData
  update: (f: Partial<WizardData>) => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <StepHeader eyebrow="Player Setup · Step 2 of 3" title="Tell us about yourself" />
      <div className="space-y-5">
        <Field label="How old are you?" error={errors.age}>
          <input
            type="number"
            min={14}
            max={50}
            placeholder="e.g. 22"
            value={data.age ?? ''}
            onChange={(e) =>
              update({ age: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className={inputCls(!!errors.age)}
          />
        </Field>
        <Field label="What nationality are you?" error={errors.nationality}>
          <select
            value={data.nationality ?? ''}
            onChange={(e) => update({ nationality: e.target.value })}
            className={selectCls(!!errors.nationality)}
          >
            <option value="">Select nationality...</option>
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Step 2 (Agent): Organisation + Country ───────────────────────────────────

function StepAgentBasics({
  data,
  update,
  errors,
}: {
  data: WizardData
  update: (f: Partial<WizardData>) => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <StepHeader eyebrow="Agent Setup · Step 2 of 3" title="Who do you represent?" />
      <div className="space-y-5">
        <Field label="Club or organisation name" error={errors.organisation_name}>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Fulham FC, Elite Sports Agency"
            value={data.organisation_name ?? ''}
            onChange={(e) => update({ organisation_name: e.target.value })}
            className={inputCls(!!errors.organisation_name)}
          />
        </Field>
        <Field label="Country you operate from" error={errors.country}>
          <select
            value={data.country ?? ''}
            onChange={(e) => update({ country: e.target.value })}
            className={selectCls(!!errors.country)}
          >
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Step 3 (Player): Position + Availability ─────────────────────────────────

function StepPlayerPosition({
  data,
  update,
  errors,
}: {
  data: WizardData
  update: (f: Partial<WizardData>) => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <StepHeader eyebrow="Player Setup · Step 3 of 3" title="Your playing details" />
      <div className="space-y-7">
        {/* Position grid */}
        <Field label="What position do you play?" error={errors.primary_position}>
          <div className="grid grid-cols-5 gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => update({ primary_position: pos })}
                className={cn(
                  'py-2.5 rounded-lg text-sm font-mono font-semibold transition-all duration-150',
                  data.primary_position === pos
                    ? 'bg-[#00FF87] text-[#0A0F1E] shadow-green-sm'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                )}
              >
                {pos}
              </button>
            ))}
          </div>
          {errors.primary_position && (
            <p className="text-red-400 text-xs mt-1.5">{errors.primary_position}</p>
          )}
        </Field>

        {/* Availability */}
        <Field label="What's your current availability?" error={errors.contract_status}>
          <div className="space-y-2">
            {CONTRACT_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => update({ contract_status: s.value })}
                className={cn(
                  'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
                  data.contract_status === s.value
                    ? 'border-[#00FF87] bg-[#00FF87]/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                )}
              >
                <div
                  className={cn(
                    'font-semibold text-sm',
                    data.contract_status === s.value ? 'text-[#00FF87]' : 'text-white'
                  )}
                >
                  {s.label}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
          {errors.contract_status && (
            <p className="text-red-400 text-xs mt-1.5">{errors.contract_status}</p>
          )}
        </Field>
      </div>
    </div>
  )
}

// ─── Step 3 (Agent): Positions + League Level ─────────────────────────────────

function StepAgentPreferences({
  data,
  update,
  errors,
}: {
  data: WizardData
  update: (f: Partial<WizardData>) => void
  errors: Record<string, string>
}) {
  const togglePos = (pos: string) => {
    const current = data.positions_seeking ?? []
    update({
      positions_seeking: current.includes(pos)
        ? current.filter((p) => p !== pos)
        : [...current, pos],
    })
  }

  return (
    <div>
      <StepHeader eyebrow="Agent Setup · Step 3 of 3" title="Who are you looking for?" />
      <div className="space-y-7">
        {/* Position multi-select */}
        <Field label="Positions you're targeting" error={errors.positions_seeking}>
          <div className="grid grid-cols-5 gap-2">
            {POSITIONS.map((pos) => {
              const selected = (data.positions_seeking ?? []).includes(pos)
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePos(pos)}
                  className={cn(
                    'py-2.5 rounded-lg text-sm font-mono font-semibold transition-all duration-150',
                    selected
                      ? 'bg-[#00FF87] text-[#0A0F1E] shadow-green-sm'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  )}
                >
                  {pos}
                </button>
              )
            })}
          </div>
          <p className="text-white/20 text-xs mt-2">Select all that apply</p>
          {errors.positions_seeking && (
            <p className="text-red-400 text-xs mt-1">{errors.positions_seeking}</p>
          )}
        </Field>

        {/* League level */}
        <Field label="League level you recruit for" error={errors.league_level}>
          <select
            value={data.league_level ?? ''}
            onChange={(e) => update({ league_level: e.target.value })}
            className={selectCls(!!errors.league_level)}
          >
            <option value="">Select level...</option>
            {LEAGUE_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function GetStartedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-select role from URL param if provided
  useEffect(() => {
    const role = searchParams.get('role') as Role | null
    if (role === 'player' || role === 'agent') {
      setData({ role })
      setStep(1)
    }
  }, [searchParams])

  const update = (fields: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...fields }))
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(fields).forEach((k) => delete next[k])
      return next
    })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    switch (step) {
      case 1:
        if (!data.first_name?.trim()) errs.first_name = 'Required'
        if (!data.last_name?.trim()) errs.last_name = 'Required'
        break
      case 2:
        if (data.role === 'player') {
          if (!data.age || data.age < 14 || data.age > 50)
            errs.age = 'Enter a valid age (14–50)'
          if (!data.nationality) errs.nationality = 'Please select your nationality'
        } else {
          if (!data.organisation_name?.trim()) errs.organisation_name = 'Required'
          if (!data.country) errs.country = 'Please select your country'
        }
        break
      case 3:
        if (data.role === 'player') {
          if (!data.primary_position) errs.primary_position = 'Please select your position'
          if (!data.contract_status) errs.contract_status = 'Please select your availability'
        } else {
          if (!data.positions_seeking?.length)
            errs.positions_seeking = 'Select at least one position'
          if (!data.league_level) errs.league_level = 'Please select a league level'
        }
        break
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    if (step === TOTAL_STEPS - 1) {
      localStorage.setItem('tm_onboarding', JSON.stringify(data))
      router.push('/sign-up')
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step === 0) router.push('/')
    else setStep((s) => s - 1)
  }

  const progress = step === 0 ? 0 : (step / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 bg-green-glow opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/tm_logo.svg"
            alt="Tranxfer Market"
            width={120}
            height={30}
            className="h-7 w-auto"
          />
        </Link>
        {step > 0 && (
          <span className="text-white/30 text-sm tabular-nums">
            {step} <span className="text-white/10 mx-1">/</span> {TOTAL_STEPS - 1}
          </span>
        )}
      </header>

      {/* Progress bar */}
      {step > 0 && (
        <div className="relative z-10 h-[2px] bg-white/5">
          <div
            className="h-full bg-[#00FF87] transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 8px rgba(0,255,135,0.6)',
            }}
          />
        </div>
      )}

      {/* Wizard content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <StepRoleSelect
              selected={data.role}
              onSelect={(role) => {
                update({ role })
                setStep(1)
              }}
            />
          )}
          {step === 1 && <StepName data={data} update={update} errors={errors} />}
          {step === 2 && data.role === 'player' && (
            <StepPlayerBasics data={data} update={update} errors={errors} />
          )}
          {step === 2 && data.role === 'agent' && (
            <StepAgentBasics data={data} update={update} errors={errors} />
          )}
          {step === 3 && data.role === 'player' && (
            <StepPlayerPosition data={data} update={update} errors={errors} />
          )}
          {step === 3 && data.role === 'agent' && (
            <StepAgentPreferences data={data} update={update} errors={errors} />
          )}

          {/* Navigation */}
          {step > 0 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#00FF87] text-[#0A0F1E] px-8 py-3.5 rounded-xl font-semibold hover:bg-[#00CC6A] transition-all duration-200 hover:shadow-green-sm"
              >
                {step === TOTAL_STEPS - 1 ? 'Create my account' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
