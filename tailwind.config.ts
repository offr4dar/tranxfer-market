import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Tranxfer Market Design System
        navy: {
          DEFAULT: '#0A0F1E',
          50: '#0D1526',
          100: '#101A2E',
          200: '#162035',
          300: '#1C2840',
          400: '#243050',
          500: '#2C3A60',
        },
        green: {
          electric: '#00FF87',
          dim: '#00CC6A',
          dark: '#00994F',
          glow: 'rgba(0, 255, 135, 0.15)',
        },
        // shadcn/ui compatible
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        anton: ['var(--font-anton)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #101A2E 50%, #0A0F1E 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(22, 32, 53, 0.8), rgba(10, 15, 30, 0.9))',
        'green-glow': 'radial-gradient(ellipse at center, rgba(0, 255, 135, 0.1) 0%, transparent 70%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 255, 135, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 255, 135, 0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-green': 'pulse-green 2s infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
      boxShadow: {
        'green-sm': '0 0 10px rgba(0, 255, 135, 0.2)',
        'green-md': '0 0 20px rgba(0, 255, 135, 0.3)',
        'green-lg': '0 0 40px rgba(0, 255, 135, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 255, 135, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
