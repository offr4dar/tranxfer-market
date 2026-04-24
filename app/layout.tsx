import type { Metadata, Viewport } from 'next'
import { Inter, Anton } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Tranxfer Market — Football Talent Marketplace',
    template: '%s | Tranxfer Market',
  },
  description:
    'The two-sided football talent marketplace. Players showcase their ability. Clubs and scouts discover the next signing. Your next move starts here.',
  keywords: [
    'football',
    'soccer',
    'player transfer',
    'talent marketplace',
    'scouting',
    'football agents',
    'player recruitment',
  ],
  authors: [{ name: 'Tranxfer Market' }],
  creator: 'Tranxfer Market',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Tranxfer Market — Football Talent Marketplace',
    description:
      'The two-sided football talent marketplace. Players showcase. Clubs discover. Your next move starts here.',
    siteName: 'Tranxfer Market',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tranxfer Market',
    description: 'Football talent marketplace for players and clubs.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0F1E',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00FF87',
          colorBackground: '#0A0F1E',
          colorInputBackground: '#101A2E',
          colorInputText: '#FFFFFF',
          colorText: '#FFFFFF',
          colorTextSecondary: '#8B9AB5',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'bg-navy-100 border border-white/10',
          headerTitle: 'text-white',
          headerSubtitle: 'text-white/60',
          socialButtonsBlockButton:
            'bg-white/5 border-white/10 text-white hover:bg-white/10',
          formFieldLabel: 'text-white/80',
          formFieldInput: 'bg-navy-50 border-white/10 text-white',
          footerActionLink: 'text-[#00FF87] hover:text-[#00CC6A]',
          identityPreviewText: 'text-white',
          identityPreviewEditButtonIcon: 'text-white/60',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className="dark">
        <body
          className={`${inter.variable} ${GeistMono.variable} ${anton.variable} font-sans antialiased bg-[#0A0F1E] text-white min-h-screen`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
