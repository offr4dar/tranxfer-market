'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Splash stays visible for 3 seconds, then fades out over 0.6s
const SPLASH_DURATION = 3000
const FADE_DURATION = 600

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>('visible')

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), SPLASH_DURATION)
    const doneTimer = setTimeout(
      () => setPhase('done'),
      SPLASH_DURATION + FADE_DURATION,
    )
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#001209',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        overflow: 'hidden',
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
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
          gap: '0',
          // nudge slightly above vertical centre to match Figma
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
