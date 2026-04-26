import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Tabs } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import {
  FeedIcon, SearchIcon, ProfileIcon, MessagesIcon, BellIcon,
} from '@/components/icons/TabIcons'
import FloatingTabBar from '@/components/FloatingTabBar'

// ─── Unread badge overlay ─────────────────────────────────────────────────────
function BadgeIcon({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <View>
      {icon}
      {count > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          minWidth: 16, height: 16, borderRadius: 8,
          backgroundColor: '#000000',
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#00FF87', fontSize: 10, fontWeight: '700' }}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </View>
  )
}

// ─── Tabs layout ──────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { userId } = useAuth()
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

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <SearchIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <BadgeIcon
              icon={<MessagesIcon color={color} />}
              count={unreadMessages}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <BadgeIcon
              icon={<BellIcon color={color} />}
              count={unreadNotifications}
            />
          ),
        }}
      />
      {/* Hidden — navigated to programmatically */}
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
    </Tabs>
  )
}
