import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Settings, User, CreditCard, Bell, Shield } from 'lucide-react'

export const metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#00FF87]" />
          Settings
        </h1>
        <p className="text-white/50 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Account */}
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-[#00FF87]" />
            <h2 className="font-semibold text-white">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Name</label>
              <p className="text-white mt-1">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
              <p className="text-white mt-1">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#00FF87]" />
              <h2 className="font-semibold text-white">Subscription</h2>
            </div>
            <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Free Plan
            </span>
          </div>
          <p className="text-white/50 text-sm mb-4">
            Upgrade to unlock advanced features and get more visibility.
          </p>
          <a
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00FF87] text-[#0A0F1E] px-5 py-2.5 font-semibold text-sm hover:bg-[#00CC6A] transition-colors"
          >
            View Plans
          </a>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-[#00FF87]" />
            <h2 className="font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Profile views', desc: 'When a club views your profile' },
              { label: 'Contact requests', desc: 'When a club wants to get in touch' },
              { label: 'Messages', desc: 'New messages in your inbox' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#00FF87] transition-colors">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-[#0A0F1E] transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-[#00FF87]" />
            <h2 className="font-semibold text-white">Privacy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Searchable profile</p>
                <p className="text-white/40 text-xs">Allow clubs to find you in search</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#00FF87] transition-colors">
                <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-[#0A0F1E] transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
