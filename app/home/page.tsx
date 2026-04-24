import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowRight, Search, Shield, Zap, Users, TrendingUp, CheckCircle, Star } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

// ─── Hero Section ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0A0F1E]" />
      <div className="absolute inset-0 bg-green-glow opacity-40" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,135,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF87]/20 bg-[#00FF87]/5 px-4 py-2 text-sm text-[#00FF87] mb-8">
            <Zap className="w-3.5 h-3.5" />
            <span>The Future of Football Recruitment</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Your next move
            <br />
            <span className="gradient-text text-glow">starts here</span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            The two-sided football talent marketplace. Players showcase their ability
            to the clubs and scouts who matter. Clubs discover the next signing before
            anyone else does.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-8 py-4 font-semibold text-base hover:bg-[#00CC6A] transition-all duration-200 hover:shadow-green-md"
              >
                Select your profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-8 py-4 font-semibold text-base hover:bg-[#00CC6A] transition-all duration-200 hover:shadow-green-md"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedIn>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00FF87]" />
              <span>2,400+ Players</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00FF87]" />
              <span>340+ Verified Clubs</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00FF87]" />
              <span>180+ Transfers facilitated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Select Your Profile ─────────────────────────────────────────────────────

function SelectProfile() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-[#0A0F1E] to-[#0D1526]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#00FF87] text-xs font-semibold uppercase tracking-widest mb-4">
            Get started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Select your profile</h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Tell us who you are and we&apos;ll tailor your experience from the very first step.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Player */}
          <Link
            href="/get-started?role=player"
            className="group relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#00FF87]/40 hover:bg-[#00FF87]/5 transition-all duration-300"
          >
            <div className="text-5xl mb-6">⚽</div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#00FF87] transition-colors">
              Player
            </h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Build your professional profile, set your availability, and get discovered by clubs and scouts worldwide.
            </p>
            <div className="inline-flex items-center gap-2 text-[#00FF87] text-sm font-semibold">
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Agent */}
          <Link
            href="/get-started?role=agent"
            className="group relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#00FF87]/40 hover:bg-[#00FF87]/5 transition-all duration-300"
          >
            <div className="text-5xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#00FF87] transition-colors">
              Agent
            </h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Search our verified player database, build shortlists, and make direct contact with the talent your club needs.
            </p>
            <div className="inline-flex items-center gap-2 text-[#00FF87] text-sm font-semibold">
              Start searching
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const playerSteps = [
  {
    step: '01',
    title: 'Build your profile',
    desc: 'Add your stats, highlight reel, career history, and availability status. Your professional identity, owned by you.',
  },
  {
    step: '02',
    title: 'Get discovered',
    desc: 'Clubs and scouts search by position, nationality, age, and availability. Your profile surfaces in front of the right people.',
  },
  {
    step: '03',
    title: 'Move on your terms',
    desc: 'Review contact requests, negotiate directly, and track every club that viewed your profile. Full transparency.',
  },
]

const clubSteps = [
  {
    step: '01',
    title: 'Set your criteria',
    desc: 'Search by position, age range, nationality, league level, availability, and preferred foot. Precision filters built for scouts.',
  },
  {
    step: '02',
    title: 'Shortlist candidates',
    desc: 'Save players to private shortlists, add scouting notes and ratings. Share lists with your technical team.',
  },
  {
    step: '03',
    title: 'Make contact',
    desc: 'Contact verified players directly through the platform. No agents, no middlemen — unless the player has one.',
  },
]

function HowItWorks() {
  return (
    <section className="py-24 bg-[#0A0F1E]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Built from the ground up for both sides of the transfer market.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Players */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[#00FF87] font-semibold text-sm uppercase tracking-wider">
                For Players
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-6">
              {playerSteps.map((s) => (
                <div key={s.step} className="glass-card p-6 hover-green border border-white/5">
                  <div className="flex items-start gap-4">
                    <span className="stat-number text-2xl font-bold shrink-0">{s.step}</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clubs */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[#00FF87] font-semibold text-sm uppercase tracking-wider">
                For Clubs & Scouts
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-6">
              {clubSteps.map((s) => (
                <div key={s.step} className="glass-card p-6 hover-green border border-white/5">
                  <div className="flex items-start gap-4">
                    <span className="stat-number text-2xl font-bold shrink-0">{s.step}</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const playerPlans = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    desc: 'Get your profile live and start getting discovered.',
    features: [
      'Full player profile',
      'Appear in club searches',
      'Accept contact requests',
      'View who contacted you',
    ],
    cta: 'Create free profile',
    href: '/sign-up?type=player',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '£9.99',
    period: 'per month',
    desc: 'Stand out. Get seen first. Control your career.',
    features: [
      'Everything in Free',
      'Featured in search results',
      'Profile view analytics',
      'Priority in search rankings',
      'Verified badge',
      'Highlight reel hosting',
    ],
    cta: 'Go Premium',
    href: '/sign-up?type=player&plan=premium',
    highlighted: true,
  },
]

const clubPlans = [
  {
    name: 'Starter',
    price: '£49',
    period: 'per month',
    desc: 'For scouts and small clubs just getting started.',
    features: [
      '50 player profile views/mo',
      '5 contact requests/mo',
      '3 active shortlists',
      'Basic filters',
    ],
    cta: 'Start Scouting',
    href: '/sign-up?type=club&plan=starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '£99',
    period: 'per month',
    desc: 'For active clubs running multiple recruitment campaigns.',
    features: [
      'Unlimited profile views',
      '25 contact requests/mo',
      'Unlimited shortlists',
      'All filters + advanced search',
      'Team member access (3 seats)',
      'Agent contact info revealed',
    ],
    cta: 'Go Pro',
    href: '/sign-up?type=club&plan=pro',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: '£199',
    period: 'per month',
    desc: 'For academies and clubs running serious recruitment operations.',
    features: [
      'Everything in Pro',
      'Unlimited contact requests',
      '10 team member seats',
      'Wage data revealed',
      'Export shortlists (CSV)',
      'Dedicated account manager',
      'API access',
    ],
    cta: 'Contact Sales',
    href: '/sign-up?type=club&plan=elite',
    highlighted: false,
  },
]

function PlanCard({
  plan,
}: {
  plan: (typeof playerPlans)[0] | (typeof clubPlans)[0]
}) {
  return (
    <div
      className={`glass-card p-8 rounded-2xl border flex flex-col ${
        plan.highlighted
          ? 'border-[#00FF87]/40 shadow-green-sm'
          : 'border-white/5 hover-green'
      }`}
    >
      {plan.highlighted && (
        <div className="text-xs font-semibold text-[#00FF87] uppercase tracking-widest mb-4">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
        <p className="text-white/50 text-sm mb-4">{plan.desc}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-white/40 text-sm">/{plan.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/70">
            <CheckCircle className="w-4 h-4 text-[#00FF87] shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        className={`w-full text-center rounded-xl px-6 py-3 font-semibold text-sm transition-all duration-200 ${
          plan.highlighted
            ? 'bg-[#00FF87] text-[#0A0F1E] hover:bg-[#00CC6A] hover:shadow-green-sm'
            : 'border border-white/20 text-white hover:bg-white/5 hover:border-white/30'
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

function Pricing() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E] via-[#0D1526] to-[#0A0F1E]" />
      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Players are always free. Clubs choose the plan that fits their recruitment budget.
          </p>
        </div>

        {/* Players */}
        <div className="mb-16">
          <h3 className="text-center text-white/40 text-sm font-semibold uppercase tracking-widest mb-8">
            Players
          </h3>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {playerPlans.map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </div>
        </div>

        {/* Clubs */}
        <div>
          <h3 className="text-center text-white/40 text-sm font-semibold uppercase tracking-widest mb-8">
            Clubs & Scouts
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {clubPlans.map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 bg-[#0A0F1E]">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto glass-card p-12 rounded-2xl border border-[#00FF87]/10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00FF87]/10 mb-6">
            <Star className="w-7 h-7 text-[#00FF87]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to make your move?
          </h2>
          <p className="text-white/50 mb-8 leading-relaxed">
            Join thousands of players and clubs already on the platform.
            Your next opportunity is waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up?type=player"
              className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-8 py-4 font-semibold hover:bg-[#00CC6A] transition-all duration-200"
            >
              Create Player Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-up?type=club"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 text-white px-8 py-4 font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Start Scouting
              <Search className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SelectProfile />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
