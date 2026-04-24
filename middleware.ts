import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
])

// Routes that are public (no auth needed)
const isPublicRoute = createRouteMatcher([
  '/',
  '/home(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/players/(.*)',        // Public player profiles
  '/api/webhooks(.*)',    // Webhook handlers bypass auth
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth()

  // If accessing a protected route while not signed in → redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // If signed in and hitting /dashboard → check if onboarding is complete
  if (userId && req.nextUrl.pathname.startsWith('/dashboard')) {
    const metadata = sessionClaims?.metadata as { role?: string; onboardingComplete?: boolean } | undefined

    // If onboarding not complete, redirect to onboarding
    if (!metadata?.onboardingComplete) {
      const onboardingUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }

  // If signed in and hitting sign-in/sign-up → redirect to dashboard
  if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Signed-in users visiting the splash skip straight to home
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
