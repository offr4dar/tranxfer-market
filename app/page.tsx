'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const SPLASH_DURATION = 3000
const FADE_DURATION = 600

export default function SplashPage() {
  const router = useRouter()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), SPLASH_DURATION)
    const navTimer = setTimeout(
      () => router.push('/home'),
      SPLASH_DURATION + FADE_DURATION,
    )
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [router])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#001209',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
      }}
    >
      {/* Background football boot image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      >
        <Image
          src="/images/splash-bg.png"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'right center' }}
          priority
        />
      </div>

      {/* Top rule — corner icon + line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Image
          src="/images/splash-corner.svg"
          alt=""
          width={13}
          height={13}
          priority
        />
        <div style={{ flex: 1, height: '4px', background: 'white' }} />
      </div>

      {/* Hero text block */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '10px',
        }}
      >
        {['YOUR', 'GAME.', 'YOUR', 'CAREER.'].map((word) => (
          <span
            key={word}
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(72px, 22vw, 89px)',
              lineHeight: 0.95,
              letterSpacing: '1.78px',
              background: 'linear-gradient(to bottom, #ffffff, #82c3a5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'block',
            }}
          >
            {word}
          </span>
        ))}
        <span
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(72px, 22vw, 89px)',
            lineHeight: 0.95,
            letterSpacing: '1.78px',
            color: '#00FF87',
            WebkitTextFillColor: '#00FF87',
            display: 'block',
          }}
        >
          YOUR MOVE.
        </span>
      </div>

      {/* Bottom rule — flipped corner icon + line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <Image
          src="/images/splash-corner.svg"
          alt=""
          width={13}
          height={13}
        />
        <div style={{ flex: 1, height: '4px', background: 'white' }} />
      </div>
    </div>
  )
}
