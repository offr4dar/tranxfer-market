import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-green-glow opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Tranxfer<span className="text-[#00FF87]">.</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Welcome back</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'w-full shadow-none',
            },
          }}
        />
      </div>
    </div>
  )
}
