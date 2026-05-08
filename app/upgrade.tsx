import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'

export default function UpgradeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <ScreenBackground>
      {/* Back */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>

        <Text style={styles.title}>{'UPGRADE TO\nSCOUT PRO'}</Text>

        <Text style={styles.subtitle}>
          Tracker, full player identity, video highlights and more — coming soon.
        </Text>

        {/* Placeholder CTA */}
        <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
          <Text style={styles.ctaText}>COMING SOON</Text>
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.08)',
  },
  badgeText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 14,
    color: Colors.brand,
    letterSpacing: 3,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 42,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    height: 56,
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    color: '#000',
    letterSpacing: 2,
  },
})
