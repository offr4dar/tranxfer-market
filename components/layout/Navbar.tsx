'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0F1E]/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <Image
              src="/images/tm_logo.svg"
              alt="Tranxfer Market"
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/home#how-it-works" className="text-white/60 hover:text-white text-sm transition-colors">
              How it works
            </Link>
            <Link href="/home#pricing" className="text-white/60 hover:text-white text-sm transition-colors">
              Pricing
            </Link>

            <SignedOut>
              <Link
                href="/sign-in"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-xl bg-[#00FF87] text-[#0A0F1E] px-4 py-2 text-sm font-semibold hover:bg-[#00CC6A] transition-colors"
              >
                Get started
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/60 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-3">
            <Link href="/home#how-it-works" className="block text-white/60 hover:text-white text-sm py-2">
              How it works
            </Link>
            <Link href="/home#pricing" className="block text-white/60 hover:text-white text-sm py-2">
              Pricing
            </Link>
            <SignedOut>
              <Link href="/sign-in" className="block text-white/60 hover:text-white text-sm py-2">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block w-full text-center rounded-xl bg-[#00FF87] text-[#0A0F1E] px-4 py-2.5 text-sm font-semibold"
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="block text-white/60 hover:text-white text-sm py-2">
                Dashboard
              </Link>
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  )
}
