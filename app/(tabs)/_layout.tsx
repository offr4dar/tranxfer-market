import { useEffect, useState, useCallback } from 'react'
import { View } from 'react-native'
import { Tabs, usePathname, useRouter } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { useFocusEffect } from '@react-navigation/native'
import * as Updates from 'expo-updates'
import { supabase } from '@/lib/supabase'
import {
  FeedIcon, ProfileIcon, InboxIcon, BellIcon, WatchlistIcon,
} from '@/components/icons/TabIcons'
import FloatingTabBar from '@/components/FloatingTabBar'
import { DevRoleProvider, useDevRole } from '@/lib/devRole'
import DevRoleSwitcher from '@/components/DevRoleSwitcher'
import PersistentFAB from '@/components/PersistentFAB'

// showRoleSwitcher is evaluated per-render inside TabsLayout
// so it can read the signed-in user's Clerk publicMetadata.

// ─── Unread badge overlay ─────────────────────────────────────────────────────
function BadgeIcon({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icon}
      {count > 0 && (
        <View style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: '#0F5FFF',
          marginLeft: 3,
        }} />
      )}
    </View>
  )
}

// ─── Inner layout — must live inside DevRoleProvider to call useDevRole ───────
function TabsContent() {
  const { userId } = useAuth()
  const { devRole } = useDevRole()
  const isPlayer = devRole === 'player'
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Poll unread counts every 30s
  useEffect(() => {
    if (!userId) return

    const fetchCounts = async () => {
      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
        .neq('sender_id', userId)
      setUnreadMessages(msgCount ?? 0)

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
      setUnreadNotifications(notifCount ?? 0)
    }

    fetchCounts()
    const timer = setInterval(fetchCounts, 30000)
    return () => clearInterval(timer)
  }, [userId])

  // Redirect if player tries to access scout tabs
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    if (isPlayer && (pathname === '/feed' || pathname === '/shortlist' || pathname === '/search')) {
      router.replace('/profile')
    }
  }, [isPlayer, pathname])

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      initialRouteName="profile"
      screenOptions={{
        headerShown: false,
        lazy: false,
      }}
    >
      {/* ── Scout-only tabs ───────────────────────────────────────────────── */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          href: isPlayer ? null : undefined,
          tabBarIcon: ({ color, size }) => <FeedIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="shortlist"
        options={{
          title: 'Watchlist',
          href: isPlayer ? null : undefined,
          tabBarIcon: ({ color, size }) => <WatchlistIcon color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />

      {/* ── Shared tabs ───────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon
              icon={<BellIcon color={color} size={size} />}
              count={unreadNotifications}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon
              icon={<InboxIcon color={color} size={size} />}
              count={unreadMessages}
            />
          ),
        }}
      />

      {/* ── Hidden — navigated to programmatically ────────────────────────── */}
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
    </Tabs>
  )
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  // Force-reload the Clerk user on mount so publicMetadata set in the Clerk
  // dashboard (e.g. { role: 'admin' }) is always fresh — even if the local
  // session was cached before the metadata was added. We store the result in
  // state so the component re-renders once the reload completes.
  useEffect(() => {
    if (!isLoaded || !user) return
    // Check cached value immediately
    const cached = (user.publicMetadata as { role?: string })?.role === 'admin'
    if (cached) { setIsAdmin(true); return }
    // Then fetch fresh data from Clerk servers
    user.reload()
      .then(() => {
        const fresh = (user.publicMetadata as { role?: string })?.role === 'admin'
        setIsAdmin(fresh)
      })
      .catch(() => {})
  }, [isLoaded])

  const showRoleSwitcher = __DEV__ || Updates.channel === 'preview' || isAdmin

  return (
    <DevRoleProvider>
      <TabsContent />
      <PersistentFAB />
      {showRoleSwitcher && <DevRoleSwitcher />}
    </DevRoleProvider>
  )
}
