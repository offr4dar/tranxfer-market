'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  User,
  Search,
  Star,
  MessageSquare,
  TrendingUp,
  Settings,
  Users,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: string
}

const playerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const clubNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/search', label: 'Search Players', icon: Search },
  { href: '/dashboard/shortlists', label: 'Shortlists', icon: Star },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function NavItem({
  item,
  currentPath,
}: {
  item: { href: string; label: string; icon: React.ElementType; exact?: boolean }
  currentPath: string
}) {
  const isActive = item.exact ? currentPath === item.href : currentPath.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        'nav-link',
        isActive && 'active'
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = role === 'player' ? playerNavItems : clubNavItems

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-white/5">
        <Link href="/" className="text-lg font-bold text-white">
          Tranxfer<span className="text-[#00FF87]">.</span>
        </Link>
        <p className="text-white/30 text-xs mt-1">
          {role === 'player' ? 'Player Portal' : 'Club Portal'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} currentPath={pathname} />
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: { avatarBox: 'w-8 h-8' },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Account</p>
            <p className="text-white/40 text-xs capitalize">{role}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0D1526] border-r border-white/5 flex flex-col z-40 hidden lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0D1526] border-b border-white/5 flex items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white">
          Tranxfer<span className="text-[#00FF87]">.</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/60 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-[#0D1526] border-r border-white/5 flex flex-col z-50">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  )
}
