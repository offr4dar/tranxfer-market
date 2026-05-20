/**
 * app/settings.tsx
 *
 * Settings screen — accessible from the gear icon on the profile tab.
 *
 * Shows a "Switch to Guardian View" row only when:
 *   - The player profile has is_minor = true
 *   - AND guardian_user_id matches the current Clerk user ID
 *
 * Tapping that row opens the GuardianPinModal. A correct PIN navigates
 * to the Guardian Dashboard. Player → guardian never requires a PIN on the way back.
 */

import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useClerk } from '@clerk/clerk-expo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import GuardianPinModal from '@/components/guardian_pin_modal'
import { useGuardianMode } from '@/hooks/useGuardianMode'
import { Colors, Spacing } from '@/constants/theme'
import { openLink, LINKS } from '@/lib/browser'

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon()    { return <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg> }
function ShieldIcon()  { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={Colors.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg> }
function LockIcon()    { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" stroke={Colors.textSecondary} strokeWidth={1.8} strokeLinecap="round" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={Colors.textSecondary} strokeWidth={1.8} strokeLinecap="round" /></Svg> }
function InfoIcon()    { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={Colors.textSecondary} strokeWidth={1.8} /><Path d="M12 8v4M12 16h.01" stroke={Colors.textSecondary} strokeWidth={1.8} strokeLinecap="round" /></Svg> }
function SignOutIcon() { return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#FF5A5A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg> }
function ChevronIcon() { return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" /></Svg> }

// ─── Row component ────────────────────────────────────────────────────────────

interface RowProps {
  icon:       React.ReactNode
  label:      string
  sublabel?:  string
  onPress:    () => void
  danger?:    boolean
  accent?:    boolean     // green label for the guardian row
  disabled?:  boolean
}

function SettingsRow({ icon, label, sublabel, onPress, danger, accent, disabled }: RowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger, accent && styles.rowLabelAccent]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <ChevronIcon />
    </TouchableOpacity>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Sep() { return <View style={styles.sep} /> }

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const clerk    = useClerk()
  const { canSwitch, pinHash, loading } = useGuardianMode()
  const [pinModalVisible, setPinModalVisible] = useState(false)

  const handleGuardianPinSuccess = () => {
    setPinModalVisible(false)
    // Small delay so modal can slide out before navigating
    setTimeout(() => router.push('/guardian/dashboard' as any), 200)
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try { await clerk.signOut() } catch { }
            router.replace('/(auth)/welcome' as any)
          },
        },
      ],
    )
  }

  return (
    <ScreenBackground>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12} activeOpacity={0.7}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Guardian section — only visible for U16 guardian accounts ─── */}
        {!loading && canSwitch && (
          <>
            <SectionHeader title="Guardian" />
            <View style={styles.card}>
              <SettingsRow
                icon={<ShieldIcon />}
                label="Switch to Guardian View"
                sublabel="Manage contact settings and consent for your child's account"
                onPress={() => setPinModalVisible(true)}
                accent
              />
            </View>
          </>
        )}

        {/* ── Dev: direct guardian dashboard access (no PIN) ─────────────── */}
        {__DEV__ && (
          <>
            <SectionHeader title="Dev Tools" />
            <View style={styles.card}>
              <SettingsRow
                icon={<ShieldIcon />}
                label="Guardian Dashboard [DEV]"
                sublabel="Skip PIN — test the dashboard directly"
                onPress={() => router.push('/guardian/dashboard' as any)}
              />
            </View>
          </>
        )}

        {/* ── Account ──────────────────────────────────────────────────── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingsRow
            icon={<LockIcon />}
            label="Privacy & Security"
            sublabel="Manage your data and account security"
            onPress={() => openLink(LINKS.privacy)}
          />
          <Sep />
          <SettingsRow
            icon={<InfoIcon />}
            label="Terms of Service"
            onPress={() => openLink(LINKS.terms)}
          />
          <Sep />
          <SettingsRow
            icon={<InfoIcon />}
            label="Safeguarding Policy"
            onPress={() => openLink(LINKS.safeguarding)}
          />
        </View>

        {/* ── Support ──────────────────────────────────────────────────── */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <SettingsRow
            icon={<InfoIcon />}
            label="Help & FAQ"
            onPress={() => openLink(LINKS.faq)}
          />
          <Sep />
          <SettingsRow
            icon={<InfoIcon />}
            label="Contact Support"
            onPress={() => openLink(LINKS.support)}
          />
        </View>

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <SectionHeader title="" />
        <View style={styles.card}>
          <SettingsRow
            icon={<SignOutIcon />}
            label="Sign out"
            onPress={handleSignOut}
            danger
          />
        </View>

        <Text style={styles.version}>Tranxfer Market v1.0.0</Text>
      </ScrollView>

      {/* ── Guardian PIN modal ─────────────────────────────────────────── */}
      <GuardianPinModal
        visible={pinModalVisible}
        pinHash={pinHash}
        onSuccess={handleGuardianPinSuccess}
        onDismiss={() => setPinModalVisible(false)}
      />
    </ScreenBackground>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scroll: { paddingTop: Spacing.lg },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg + 4,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    gap: Spacing.md,
  },
  rowDisabled: { opacity: 0.4 },
  rowIcon:     { width: 24, alignItems: 'center' },
  rowBody:     { flex: 1, gap: 2 },
  rowLabel:    { fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowLabelDanger: { color: '#FF5A5A' },
  rowLabelAccent: { color: Colors.brand },
  rowSublabel: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },
  sep:         { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg + 24 + Spacing.md },

  version: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
})
