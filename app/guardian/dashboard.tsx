import { useCallback, useEffect, useState, ReactNode } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@clerk/clerk-expo'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing, Radius } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

// ─── Local types ──────────────────────────────────────────────────────────────

interface ManagedPlayer {
  id: string
  user_id: string
  first_name: string
  last_name: string
  contact_permission: 'none' | 'endorsed_only' | 'all_verified'
  guardian_consent_active: boolean
}

interface ContactRequest {
  notification_id: string
  scout_user_id: string
  scout_name: string
  affiliation: string | null
  requested_at: string
}

interface ApprovedContact {
  approval_id: string
  scout_user_id: string
  scout_name: string
  affiliation: string | null
  approved_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSENT_TEXT =
  'By continuing, you confirm you are the parent or legal guardian of the player ' +
  'you are about to register. You consent to Tranxfer Market processing their personal ' +
  'data for the purpose of football recruitment visibility. You can withdraw consent or ' +
  'delete all data at any time from Settings.'

const PERMISSION_OPTIONS: {
  value: 'none' | 'endorsed_only' | 'all_verified'
  label: string
  description: string
}[] = [
  {
    value: 'none',
    label: 'No contact',
    description: 'Scouts cannot message this player.',
  },
  {
    value: 'endorsed_only',
    label: 'Endorsed scouts only',
    description: 'Only scouts you have approved can message.',
  },
  {
    value: 'all_verified',
    label: 'All verified scouts',
    description: 'Any scout with a complete, verified profile can message.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={Colors.brand}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function ArrowLeftIcon({ color = Colors.text }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={Colors.brand}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return <View style={cardSt.root}>{children}</View>
}
const cardSt = StyleSheet.create({
  root: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
})

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <View style={shSt.row}>
      <Text style={shSt.title}>{title}</Text>
      {!!count && count > 0 && (
        <View style={shSt.badge}>
          <Text style={shSt.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  )
}
const shSt = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  title:     { fontFamily: 'Anton_400Regular', fontSize: 16, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  badge:     { backgroundColor: Colors.brand, borderRadius: Radius.full, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#000' },
})

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs }} />
}

function EmptyRow({ label }: { label: string }) {
  return <Text style={emSt.text}>{label}</Text>
}
const emSt = StyleSheet.create({
  text: { fontSize: 14, color: Colors.textMuted, paddingVertical: Spacing.sm, textAlign: 'center' },
})

// ─── Contact request row ──────────────────────────────────────────────────────

function ContactRequestRow({
  item, onApprove, onBlock, busy,
}: {
  item: ContactRequest
  onApprove: () => void
  onBlock: () => void
  busy: boolean
}) {
  return (
    <View style={crSt.row}>
      <View style={crSt.info}>
        <Text style={crSt.name}>{item.scout_name}</Text>
        {item.affiliation ? <Text style={crSt.sub}>{item.affiliation}</Text> : null}
        <Text style={crSt.date}>{formatDate(item.requested_at)}</Text>
      </View>
      <View style={crSt.actions}>
        <TouchableOpacity style={crSt.approveBtn} onPress={onApprove} disabled={busy} activeOpacity={0.8}>
          <Text style={crSt.approveTxt}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={crSt.blockBtn} onPress={onBlock} disabled={busy} activeOpacity={0.8}>
          <Text style={crSt.blockTxt}>Block</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
const crSt = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  info:       { flex: 1, gap: 2 },
  name:       { fontSize: 15, fontWeight: '600', color: Colors.text },
  sub:        { fontSize: 13, color: Colors.textSecondary },
  date:       { fontSize: 12, color: Colors.textMuted },
  actions:    { flexDirection: 'row', gap: 8 },
  approveBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: 'rgba(0,255,135,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)' },
  approveTxt: { fontSize: 13, fontWeight: '700', color: Colors.brand },
  blockBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: 'rgba(255,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)' },
  blockTxt:   { fontSize: 13, fontWeight: '700', color: Colors.error },
})

// ─── Approved contact row ─────────────────────────────────────────────────────

function ApprovedContactRow({
  item, onRevoke, busy,
}: {
  item: ApprovedContact
  onRevoke: () => void
  busy: boolean
}) {
  return (
    <View style={acSt.row}>
      <View style={acSt.info}>
        <Text style={acSt.name}>{item.scout_name}</Text>
        {item.affiliation ? <Text style={acSt.sub}>{item.affiliation}</Text> : null}
        <Text style={acSt.date}>Approved {formatDate(item.approved_at)}</Text>
      </View>
      <TouchableOpacity style={acSt.revokeBtn} onPress={onRevoke} disabled={busy} activeOpacity={0.8}>
        <Text style={acSt.revokeTxt}>Revoke</Text>
      </TouchableOpacity>
    </View>
  )
}
const acSt = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  info:      { flex: 1, gap: 2 },
  name:      { fontSize: 15, fontWeight: '600', color: Colors.text },
  sub:       { fontSize: 13, color: Colors.textSecondary },
  date:      { fontSize: 12, color: Colors.textMuted },
  revokeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  revokeTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
})

// ─── Permission option ────────────────────────────────────────────────────────

function PermissionOption({
  option, selected, onSelect, busy,
}: {
  option: typeof PERMISSION_OPTIONS[number]
  selected: boolean
  onSelect: () => void
  busy: boolean
}) {
  return (
    <TouchableOpacity
      style={[poSt.row, selected && poSt.rowSelected]}
      onPress={onSelect}
      disabled={busy}
      activeOpacity={0.8}
    >
      <View style={poSt.textWrap}>
        <Text style={[poSt.label, selected && poSt.labelSelected]}>{option.label}</Text>
        <Text style={poSt.desc}>{option.description}</Text>
      </View>
      {selected ? <CheckIcon /> : <View style={poSt.emptyCheck} />}
    </TouchableOpacity>
  )
}
const poSt = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  rowSelected:  { borderColor: 'rgba(0,255,135,0.4)', backgroundColor: 'rgba(0,255,135,0.06)' },
  textWrap:     { flex: 1, gap: 3 },
  label:        { fontSize: 15, fontWeight: '600', color: Colors.text },
  labelSelected:{ color: Colors.brand },
  desc:         { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  emptyCheck:   { width: 18, height: 18 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GuardianDashboard() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { userId } = useAuth()

  const [players,          setPlayers]          = useState<ManagedPlayer[]>([])
  const [selectedIdx,      setSelectedIdx]      = useState(0)
  const [contactRequests,  setContactRequests]  = useState<ContactRequest[]>([])
  const [approvedContacts, setApprovedContacts] = useState<ApprovedContact[]>([])
  const [loading,          setLoading]          = useState(true)
  const [dataLoading,      setDataLoading]      = useState(false)
  const [busy,             setBusy]             = useState(false)
  const [fetchError,       setFetchError]       = useState<string | null>(null)

  const player = players[selectedIdx] ?? null

  // ── Fetch players managed by this guardian ─────────────────────────────────
  const fetchPlayers = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setFetchError(null)
    const { data, error } = await supabase
      .from('player_profiles')
      .select('id, user_id, first_name, last_name, contact_permission, guardian_consent_active')
      .eq('guardian_user_id', userId)
      .eq('is_minor', true)

    if (error) {
      setFetchError(error.message)
      setLoading(false)
      return
    }
    setPlayers((data ?? []) as ManagedPlayer[])
    setSelectedIdx(0)
    setLoading(false)
  }, [userId])

  // ── Fetch contact requests + approved contacts for the selected player ──────
  const fetchPlayerData = useCallback(async (p: ManagedPlayer) => {
    setDataLoading(true)

    const [notifsRes, approvalsRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, data, created_at')
        .eq('user_id', p.user_id)
        .eq('type', 'contact_request')
        .eq('read', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('guardian_contact_approvals')
        .select('id, scout_user_id, created_at')
        .eq('player_profile_id', p.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
    ])

    const notifs    = notifsRes.data    ?? []
    const approvals = approvalsRes.data ?? []

    // Batch-fetch scout info for all referenced scouts
    const requestScoutIds  = notifs.map(n => n.data?.scout_user_id as string | undefined).filter((id): id is string => !!id)
    const approvalScoutIds = approvals.map(a => a.scout_user_id as string)
    const allScoutIds = [...new Set([...requestScoutIds, ...approvalScoutIds])]

    type ScoutRow = { user_id: string; first_name: string; last_name: string; affiliated_club?: string | null; organisation_name?: string | null }
    let scoutMap: Record<string, ScoutRow> = {}

    if (allScoutIds.length > 0) {
      const { data: scouts } = await supabase
        .from('scout_profiles')
        .select('user_id, first_name, last_name, affiliated_club, organisation_name')
        .in('user_id', allScoutIds)
      for (const s of (scouts ?? []) as ScoutRow[]) {
        scoutMap[s.user_id] = s
      }
    }

    setContactRequests(
      notifs.map(n => {
        const scoutId = (n.data?.scout_user_id as string | undefined) ?? ''
        const s       = scoutMap[scoutId]
        return {
          notification_id: n.id,
          scout_user_id:   scoutId,
          scout_name:      s ? `${s.first_name} ${s.last_name}` : 'Unknown Scout',
          affiliation:     s?.affiliated_club ?? s?.organisation_name ?? null,
          requested_at:    n.created_at,
        }
      }),
    )

    setApprovedContacts(
      approvals.map(a => {
        const s = scoutMap[a.scout_user_id]
        return {
          approval_id:   a.id,
          scout_user_id: a.scout_user_id,
          scout_name:    s ? `${s.first_name} ${s.last_name}` : 'Unknown Scout',
          affiliation:   s?.affiliated_club ?? s?.organisation_name ?? null,
          approved_at:   a.created_at,
        }
      }),
    )

    setDataLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { fetchPlayers() }, [fetchPlayers]))
  useEffect(() => { if (player) fetchPlayerData(player) }, [player?.id, fetchPlayerData])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function approveContact(req: ContactRequest) {
    if (!player || !userId || busy) return
    setBusy(true)
    try {
      await Promise.all([
        supabase.from('guardian_contact_approvals').upsert(
          { guardian_user_id: userId, player_profile_id: player.id, scout_user_id: req.scout_user_id, status: 'approved' },
          { onConflict: 'player_profile_id,scout_user_id' },
        ),
        supabase.from('notifications').update({ read: true }).eq('id', req.notification_id),
      ])
      await fetchPlayerData(player)
    } finally {
      setBusy(false)
    }
  }

  async function blockContact(req: ContactRequest) {
    if (!player || !userId || busy) return
    setBusy(true)
    try {
      await Promise.all([
        supabase.from('guardian_contact_approvals').upsert(
          { guardian_user_id: userId, player_profile_id: player.id, scout_user_id: req.scout_user_id, status: 'blocked' },
          { onConflict: 'player_profile_id,scout_user_id' },
        ),
        supabase.from('notifications').update({ read: true }).eq('id', req.notification_id),
      ])
      await fetchPlayerData(player)
    } finally {
      setBusy(false)
    }
  }

  async function revokeContact(approvalId: string) {
    if (!player || busy) return
    setBusy(true)
    try {
      await supabase.from('guardian_contact_approvals').update({ status: 'blocked' }).eq('id', approvalId)
      await fetchPlayerData(player)
    } finally {
      setBusy(false)
    }
  }

  async function updatePermission(value: 'none' | 'endorsed_only' | 'all_verified') {
    if (!player || busy) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('player_profiles')
        .update({ contact_permission: value })
        .eq('id', player.id)
      if (error) { Alert.alert('Error', error.message); return }
      setPlayers(prev => prev.map((p, i) => i === selectedIdx ? { ...p, contact_permission: value } : p))
    } finally {
      setBusy(false)
    }
  }

  function confirmDeleteProfile() {
    if (!player) return
    Alert.alert(
      'Delete Profile',
      `Are you sure? This will permanently delete ${player.first_name}'s profile and all associated data. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteProfile },
      ],
    )
  }

  async function deleteProfile() {
    if (!player || busy) return
    setBusy(true)
    try {
      const { error } = await supabase.from('player_profiles').delete().eq('id', player.id)
      if (error) { Alert.alert('Error', error.message); return }
      router.replace('/(tabs)/profile' as any)
    } finally {
      setBusy(false)
    }
  }

  function confirmWithdrawConsent() {
    if (!player) return
    Alert.alert(
      'Withdraw Consent',
      `Withdrawing consent will deactivate ${player.first_name}'s profile. It will be hidden from all scouts and messaging will be disabled. After 30 days, all data will be permanently deleted. You can re-grant consent within 30 days to reactivate.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: withdrawConsent },
      ],
    )
  }

  async function withdrawConsent() {
    if (!player || !userId || busy) return
    setBusy(true)
    try {
      const { error: consentErr } = await supabase.from('parental_consents').insert({
        guardian_user_id:      userId,
        player_profile_id:     player.id,
        consent_type:          'withdrawn',
        consent_version:       'v1.0',
        consent_text_snapshot: CONSENT_TEXT,
      })
      if (consentErr) { Alert.alert('Error', consentErr.message); return }

      const { error: profileErr } = await supabase
        .from('player_profiles')
        .update({ guardian_consent_active: false })
        .eq('id', player.id)
      if (profileErr) { Alert.alert('Error', profileErr.message); return }

      Alert.alert(
        'Consent Withdrawn',
        `${player.first_name}'s profile has been deactivated. All data will be permanently deleted in 30 days.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile' as any) }],
      )
    } finally {
      setBusy(false)
    }
  }

  const handleBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/profile' as any)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenBackground>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[st.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={st.headerBtn} onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
          <ArrowLeftIcon />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <ShieldIcon />
          <Text style={st.headerTitle}>GUARDIAN VIEW</Text>
        </View>
        <View style={st.headerBtn} />
      </View>

      {/* ── Guardian mode banner ─────────────────────────────────────────────── */}
      <View style={st.modeBanner}>
        <ShieldIcon size={15} />
        <Text style={st.modeBannerText}>
          You are in Guardian View. Your child cannot see this screen.
        </Text>
      </View>

      {/* ── States ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={st.centred}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : fetchError ? (
        <View style={st.centred}>
          <Text style={st.errorText}>{fetchError}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={fetchPlayers} activeOpacity={0.8}>
            <Text style={st.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : players.length === 0 ? (
        <View style={st.centred}>
          <Text style={st.errorText}>No U16 players linked to this account.</Text>
        </View>
      ) : (

        <ScrollView
          contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Player switcher (multi-player only) ──────────────────────────── */}
          {players.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={st.switcherScroll}
              contentContainerStyle={st.switcherContent}
            >
              {players.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  style={[st.switcherPill, i === selectedIdx && st.switcherPillActive]}
                  onPress={() => setSelectedIdx(i)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.switcherPillText, i === selectedIdx && st.switcherPillTextActive]}>
                    {p.first_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {dataLoading && (
            <ActivityIndicator style={{ marginBottom: Spacing.md }} color={Colors.brand} />
          )}

          {/* ── 1. Overview ──────────────────────────────────────────────────── */}
          {player && (
            <Card>
              <SectionHeading title="Overview" count={contactRequests.length} />
              <View style={st.overviewRow}>
                <View style={st.overviewItem}>
                  <Text style={st.overviewValue} numberOfLines={1}>
                    {player.first_name} {player.last_name}
                  </Text>
                  <Text style={st.overviewLabel}>Player</Text>
                </View>
                <View style={[st.overviewItem, st.overviewItemSep]}>
                  <Text style={[st.overviewValue, contactRequests.length > 0 && st.overviewValueAlert]}>
                    {contactRequests.length}
                  </Text>
                  <Text style={st.overviewLabel}>Pending</Text>
                </View>
                <View style={[st.overviewItem, st.overviewItemSep]}>
                  <View style={[
                    st.consentBadge,
                    player.guardian_consent_active ? st.consentActive : st.consentInactive,
                  ]}>
                    <Text style={st.consentBadgeText}>
                      {player.guardian_consent_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Text style={st.overviewLabel}>Consent</Text>
                </View>
              </View>
            </Card>
          )}

          {/* ── 2. Contact Requests ──────────────────────────────────────────── */}
          <Card>
            <SectionHeading title="Contact Requests" count={contactRequests.length} />
            {contactRequests.length === 0 ? (
              <EmptyRow label="No pending contact requests" />
            ) : (
              contactRequests.map((req, i) => (
                <View key={req.notification_id}>
                  {i > 0 && <Divider />}
                  <ContactRequestRow
                    item={req}
                    onApprove={() => approveContact(req)}
                    onBlock={() => blockContact(req)}
                    busy={busy}
                  />
                </View>
              ))
            )}
          </Card>

          {/* ── 3. Approved Contacts ─────────────────────────────────────────── */}
          <Card>
            <SectionHeading title="Approved Contacts" />
            {approvedContacts.length === 0 ? (
              <EmptyRow label="No approved contacts yet" />
            ) : (
              approvedContacts.map((contact, i) => (
                <View key={contact.approval_id}>
                  {i > 0 && <Divider />}
                  <ApprovedContactRow
                    item={contact}
                    onRevoke={() => revokeContact(contact.approval_id)}
                    busy={busy}
                  />
                </View>
              ))
            )}
          </Card>

          {/* ── 4. Contact Settings ──────────────────────────────────────────── */}
          <Card>
            <SectionHeading title="Contact Settings" />
            {player && PERMISSION_OPTIONS.map(opt => (
              <PermissionOption
                key={opt.value}
                option={opt}
                selected={player.contact_permission === opt.value}
                onSelect={() => updatePermission(opt.value)}
                busy={busy}
              />
            ))}
          </Card>

          {/* ── 5. Data & Privacy ────────────────────────────────────────────── */}
          <Card>
            <SectionHeading title="Data & Privacy" />

            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Coming soon', 'Data export will be available in a future update.')}
              activeOpacity={0.8}
            >
              <Text style={st.actionBtnText}>Export Player Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[st.actionBtn, st.actionBtnWarning]}
              onPress={confirmWithdrawConsent}
              disabled={busy || (player != null && !player.guardian_consent_active)}
              activeOpacity={0.8}
            >
              <Text style={[st.actionBtnText, st.actionBtnWarningText]}>Withdraw Consent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[st.actionBtn, st.actionBtnDanger]}
              onPress={confirmDeleteProfile}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text style={[st.actionBtnText, st.actionBtnDangerText]}>Delete Player Profile</Text>
            </TouchableOpacity>
          </Card>

          {/* ── Back to player view ──────────────────────────────────────────── */}
          <TouchableOpacity style={st.backToPlayerBtn} onPress={handleBack} activeOpacity={0.8}>
            <ArrowLeftIcon />
            <Text style={st.backToPlayerText}>Back to Player View</Text>
          </TouchableOpacity>
          <Text style={st.backNote}>Switching back to Player View does not require a PIN.</Text>

        </ScrollView>
      )}

    </ScreenBackground>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,135,0.12)',
  },
  headerBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 18,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Guardian banner ──────────────────────────────────────────────────────────
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,255,135,0.06)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.15)',
  },
  modeBannerText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0,255,135,0.8)',
    lineHeight: 18,
  },

  // ── States ───────────────────────────────────────────────────────────────────
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // ── Player switcher ──────────────────────────────────────────────────────────
  switcherScroll: {
    marginBottom: Spacing.md,
  },
  switcherContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  switcherPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  switcherPillActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.1)',
  },
  switcherPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  switcherPillTextActive: {
    color: Colors.brand,
  },

  // ── Overview card ────────────────────────────────────────────────────────────
  overviewRow: {
    flexDirection: 'row',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  overviewItemSep: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  overviewValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  overviewValueAlert: {
    color: Colors.brand,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  consentActive: {
    backgroundColor: 'rgba(0,255,135,0.12)',
  },
  consentInactive: {
    backgroundColor: 'rgba(255,68,68,0.12)',
  },
  consentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },

  // ── Action buttons (Data & Privacy) ─────────────────────────────────────────
  actionBtn: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  actionBtnWarning: {
    borderColor: 'rgba(255,165,0,0.35)',
    backgroundColor: 'rgba(255,165,0,0.07)',
  },
  actionBtnWarningText: {
    color: '#FFA500',
  },
  actionBtnDanger: {
    borderColor: 'rgba(255,68,68,0.35)',
    backgroundColor: 'rgba(255,68,68,0.07)',
  },
  actionBtnDangerText: {
    color: Colors.error,
  },

  // ── Back to player ───────────────────────────────────────────────────────────
  backToPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginTop: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backToPlayerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  backNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
})
