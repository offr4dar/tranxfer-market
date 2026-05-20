import { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDevRole, DevRole } from '@/lib/devRole'
import { Colors, Spacing } from '@/constants/theme'

// ─── Role card data ───────────────────────────────────────────────────────────
const ROLES: {
  role: DevRole
  label: string
  sublabel: string
  emoji: string
  accent: string
  description: string
  tags: string[]
}[] = [
  {
    role: 'player',
    label: 'Player',
    sublabel: 'Marcus Williams · CM',
    emoji: '👤',
    accent: '#00FF87',
    description: 'See the app as a player. View your profile, performance log, insights, and featured video.',
    tags: ['Profile', 'Performance Log', 'Insights'],
  },
  {
    role: 'scout_free',
    label: 'Scout Free',
    sublabel: 'David Chen · Independent',
    emoji: '🔍',
    accent: '#C49B1E',
    description: 'Explore the feed with limited access. Player details are redacted until you upgrade.',
    tags: ['Feed', 'Redacted Profiles', 'Tracker'],
  },
  {
    role: 'scout_subscribed',
    label: 'Scout Pro',
    sublabel: 'Sarah Mitchell · Premier Sports',
    emoji: '⭐',
    accent: '#0F5FFF',
    description: 'Full access to all player data, videos, performance entries, and direct messaging. Feed includes U16 players to test all contact-gate scenarios.',
    tags: ['Full Access', 'Video', 'Messaging', 'U16 Gate'],
  },
  {
    role: 'scout_unverified',
    label: 'Scout — New',
    sublabel: 'James Okafor · Just signed up',
    emoji: '🆕',
    accent: '#E85D75',
    description: 'Walk through the full verification flow — identity check, DBS, and FA safeguarding from Step 2.',
    tags: ['Verify Flow', 'Step 2 Active', 'Demo Gate'],
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DemoSelectScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isSignedIn } = useAuth()
  const { enterDemo, exitDemo } = useDevRole()

  // Clear any active demo session the moment we land here
  useEffect(() => { exitDemo() }, [])

  const handlePickRole = (role: DevRole) => {
    enterDemo(role)
    // New scouts go to verification gate; all others go to main app
    if (role === 'scout_unverified' || role === 'scout_free') {
      router.replace('/verify' as any)
    } else {
      router.replace('/(tabs)/profile')
    }
  }

  const handleSignIn = () => {
    if (isSignedIn) {
      router.replace('/(tabs)/profile')
    } else {
      router.replace('/(auth)/welcome' as any)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ADMIN PREVIEW</Text>
          </View>
          <Text style={styles.title}>Explore the App</Text>
          <Text style={styles.subtitle}>
            Choose a demo profile to preview the experience for each user type.
          </Text>
        </View>

        {/* ── Role cards ── */}
        <View style={styles.cards}>
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={[styles.card, { borderColor: item.accent + '33' }]}
              onPress={() => handlePickRole(item.role)}
              activeOpacity={0.85}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, { backgroundColor: item.accent + '18' }]}>
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.cardTopText}>
                  <Text style={[styles.cardLabel, { color: item.accent }]}>{item.label}</Text>
                  <Text style={styles.cardSublabel}>{item.sublabel}</Text>
                </View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>

              {/* Divider */}
              <View style={[styles.cardDivider, { backgroundColor: item.accent + '22' }]} />

              {/* Description */}
              <Text style={styles.cardDesc}>{item.description}</Text>

              {/* Tags */}
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { borderColor: item.accent + '44' }]}>
                    <Text style={[styles.tagText, { color: item.accent }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Sign in normally ── */}
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={8} r={4} stroke="rgba(255,255,255,0.6)" strokeWidth={1.8} />
            <Path
              d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.signInText}>Sign in or create a real account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: 0,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(0,255,135,0.12)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 38,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // ── Cards ──────────────────────────────────────────────────────────────────
  cards: {
    gap: 14,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTopText: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSublabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ── OR divider ─────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
  },

  // ── Sign in button ─────────────────────────────────────────────────────────
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
})
