import { useUser, useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Colors, Spacing, Radius } from '@/constants/theme'

export default function ProfileScreen() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || '?'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>⚽ Free Player</Text>
        </View>
      </View>

      {/* Profile completion */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile completion</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '10%' }]} />
        </View>
        <Text style={styles.progressText}>10% complete — add your position and stats</Text>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {[
          { icon: '🏃', label: 'Edit profile' },
          { icon: '📹', label: 'Upload highlight reel' },
          { icon: '📊', label: 'Profile analytics', badge: 'Premium' },
          { icon: '🔔', label: 'Notification settings' },
          { icon: '💳', label: 'Boost my profile', badge: 'Paid' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{item.badge}</Text>
              </View>
            )}
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => signOut()}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,255,135,0.15)',
    borderWidth: 2,
    borderColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.brand },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary },
  freeBadge: {
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  freeBadgeText: { color: Colors.brand, fontSize: 12, fontWeight: '600' },
  section: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.brand,
    borderRadius: 3,
  },
  progressText: { color: Colors.textSecondary, fontSize: 13 },
  menu: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  menuBadge: {
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuBadgeText: { color: Colors.brand, fontSize: 11, fontWeight: '600' },
  menuChevron: { color: Colors.textMuted, fontSize: 20 },
  signOutButton: {
    margin: Spacing.lg,
    marginTop: Spacing.xl,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
})
