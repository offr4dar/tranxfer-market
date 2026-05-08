import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Pressable, Animated,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Colors, Spacing, Radius } from '@/constants/theme'
import {
  ENDORSEMENTS,
  ENDORSEMENT_CATEGORIES,
  MAX_ENDORSEMENTS_PER_SCOUT,
  getEndorsementById,
  EndorsementDef,
  EndorsementCategory,
} from '@/constants/endorsements'
import { EndorsementCount, PlayerEndorsement } from '@/types'
import { aggregateEndorsements } from '@/lib/demoData'

// ─── Props ────────────────────────────────────────────────────────────────────
interface EndorsementsSectionProps {
  /** Player's ID — used to write/read endorsements */
  playerId: string
  /** Whether the viewer is a scout (any tier). Players see read-only. */
  isScout: boolean
  /** Current viewer's scout user ID (used to determine "endorsed_by_me") */
  scoutUserId?: string
  /** Current viewer's display name (written alongside endorsement) */
  scoutName?: string
  /** Pre-loaded endorsements (from DB or demo data) */
  initialEndorsements: PlayerEndorsement[]
  /** If true, all DB writes are skipped (demo mode) */
  isDemoMode?: boolean
}

// ─── Section header (matches existing SectionTitle style) ─────────────────────
function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  )
}

// ─── Single endorsement chip (displayed on profile) ──────────────────────────
function EndorsementChip({
  def,
  count,
  endorsedByMe,
  onPress,
  isScout,
}: {
  def: EndorsementDef
  count: number
  endorsedByMe: boolean
  onPress?: () => void
  isScout: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, endorsedByMe && styles.chipActive]}
      onPress={isScout ? onPress : undefined}
      activeOpacity={isScout ? 0.7 : 1}
    >
      <Text style={styles.chipEmoji}>{def.emoji}</Text>
      <View style={styles.chipBody}>
        <Text style={[styles.chipLabel, endorsedByMe && styles.chipLabelActive]}>
          {def.label}
        </Text>
        <Text style={[styles.chipCount, endorsedByMe && styles.chipCountActive]}>
          {count} scout{count !== 1 ? 's' : ''}
        </Text>
      </View>
      {endorsedByMe && (
        <View style={styles.checkBadge}>
          <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2 6l2.5 2.5L10 3.5"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── Picker row inside the modal ──────────────────────────────────────────────
function PickerRow({
  def,
  selected,
  disabled,
  onToggle,
}: {
  def: EndorsementDef
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity
      style={[
        styles.pickerRow,
        selected && styles.pickerRowSelected,
        disabled && !selected && styles.pickerRowDisabled,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      disabled={disabled && !selected}
    >
      <Text style={styles.pickerEmoji}>{def.emoji}</Text>
      <View style={styles.pickerBody}>
        <Text style={[styles.pickerLabel, selected && styles.pickerLabelSelected]}>
          {def.label}
        </Text>
        <Text style={styles.pickerDesc}>{def.description}</Text>
      </View>
      <View style={[styles.pickerCheck, selected && styles.pickerCheckSelected]}>
        {selected && (
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2 6l2.5 2.5L10 3.5"
              stroke="#000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EndorsementsSection({
  playerId,
  isScout,
  scoutUserId,
  scoutName,
  initialEndorsements,
  isDemoMode = false,
}: EndorsementsSectionProps) {
  const [endorsements, setEndorsements] = useState<PlayerEndorsement[]>(initialEndorsements)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState<EndorsementCategory>('technical')

  // Aggregate into counts + "endorsed by me" flags
  const aggregated: EndorsementCount[] = useMemo(
    () => aggregateEndorsements(endorsements, scoutUserId),
    [endorsements, scoutUserId],
  )

  // IDs this scout has already endorsed
  const myEndorsedIds = useMemo(
    () => new Set(endorsements.filter(e => e.scout_user_id === scoutUserId).map(e => e.endorsement_id)),
    [endorsements, scoutUserId],
  )

  const myCount = myEndorsedIds.size
  const atLimit = myCount >= MAX_ENDORSEMENTS_PER_SCOUT

  // Draft state while picker is open (copy so we can cancel)
  const [draft, setDraft] = useState<Set<string>>(new Set())

  const openPicker = () => {
    setDraft(new Set(myEndorsedIds))
    setActiveCategory('technical')
    setPickerVisible(true)
  }

  const toggleDraft = (id: string) => {
    setDraft(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= MAX_ENDORSEMENTS_PER_SCOUT) return prev // hard cap
        next.add(id)
      }
      return next
    })
  }

  const confirmEndorsements = () => {
    if (!scoutUserId || !scoutName) return

    // Build a new endorsements list:
    // - Remove all of this scout's existing endorsements
    // - Add back the drafted ones
    const others = endorsements.filter(e => e.scout_user_id !== scoutUserId)
    const mine: PlayerEndorsement[] = Array.from(draft).map(endorsement_id => ({
      id: `local-${endorsement_id}`,
      player_id: playerId,
      scout_user_id: scoutUserId,
      scout_name: scoutName,
      endorsement_id,
      created_at: new Date().toISOString(),
    }))

    setEndorsements([...others, ...mine])
    setPickerVisible(false)

    // TODO: persist to Supabase when not in demo mode
    // if (!isDemoMode) { await supabase.from('player_endorsements').upsert(...) }
  }

  const cancelPicker = () => {
    setPickerVisible(false)
  }

  // Endorsements filtered for display: only show those with a known def
  const displayedAggregated = aggregated.filter(a => !!getEndorsementById(a.endorsement_id))
  const categorisedEndorsements = ENDORSEMENT_CATEGORIES.map(cat => ({
    ...cat,
    items: ENDORSEMENTS.filter(e => e.category === cat.key),
  }))

  return (
    <View>
      <SectionTitle label="ENDORSEMENTS" />

      {/* ── Empty state ── */}
      {displayedAggregated.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No endorsements yet. Be the first scout to endorse this player.
          </Text>
        </View>
      )}

      {/* ── Endorsement chips ── */}
      {displayedAggregated.length > 0 && (
        <View style={styles.chipGrid}>
          {displayedAggregated.map(item => {
            const def = getEndorsementById(item.endorsement_id)!
            return (
              <EndorsementChip
                key={item.endorsement_id}
                def={def}
                count={item.count}
                endorsedByMe={item.endorsed_by_me}
                isScout={isScout}
                onPress={isScout ? openPicker : undefined}
              />
            )
          })}
        </View>
      )}

      {/* ── Endorse button (scouts only) ── */}
      {isScout && (
        <TouchableOpacity
          style={styles.endorseBtn}
          onPress={openPicker}
          activeOpacity={0.8}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke={Colors.brand}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.endorseBtnText}>
            {myCount > 0 ? `EDIT MY ENDORSEMENTS (${myCount}/${MAX_ENDORSEMENTS_PER_SCOUT})` : 'ENDORSE THIS PLAYER'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Picker Modal ── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={cancelPicker}
      >
        <Pressable style={styles.modalBackdrop} onPress={cancelPicker} />
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Endorse Player</Text>
              <Text style={styles.sheetSubtitle}>
                Choose up to {MAX_ENDORSEMENTS_PER_SCOUT} traits · {draft.size}/{MAX_ENDORSEMENTS_PER_SCOUT} selected
              </Text>
            </View>
            <TouchableOpacity onPress={cancelPicker} hitSlop={12}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={Colors.textSecondary}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {ENDORSEMENT_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryTab, activeCategory === cat.key && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryTabText,
                  activeCategory === cat.key && styles.categoryTabTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Endorsement list */}
          <ScrollView
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
          >
            {categorisedEndorsements
              .find(c => c.key === activeCategory)
              ?.items.map(def => (
                <PickerRow
                  key={def.id}
                  def={def}
                  selected={draft.has(def.id)}
                  disabled={atLimit && !draft.has(def.id)}
                  onToggle={() => toggleDraft(def.id)}
                />
              ))}
            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, draft.size === 0 && styles.confirmBtnDisabled]}
            onPress={confirmEndorsements}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {draft.size === 0 ? 'SELECT TRAITS TO ENDORSE' : `CONFIRM ${draft.size} ENDORSEMENT${draft.size !== 1 ? 'S' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Section title (matches app pattern) ──────────────────────────────────
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitleText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.text,
  },

  // ── Chip grid ────────────────────────────────────────────────────────────
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.08)',
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipBody: {
    gap: 2,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  chipLabelActive: {
    color: Colors.brand,
  },
  chipCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipCountActive: {
    color: 'rgba(0,255,135,0.7)',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Endorse button ────────────────────────────────────────────────────────
  endorseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.06)',
    marginBottom: Spacing.lg,
  },
  endorseBtnText: {
    color: Colors.brand,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Modal / Bottom sheet ──────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Category tabs ─────────────────────────────────────────────────────────
  categoryTabs: {
    marginBottom: Spacing.md,
  },
  categoryTabsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(0,255,135,0.12)',
    borderColor: Colors.brand,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryTabTextActive: {
    color: Colors.brand,
  },

  // ── Picker rows ───────────────────────────────────────────────────────────
  pickerList: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pickerRowSelected: {
    backgroundColor: 'rgba(0,255,135,0.07)',
    borderColor: Colors.brand,
  },
  pickerRowDisabled: {
    opacity: 0.4,
  },
  pickerEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  pickerBody: {
    flex: 1,
    gap: 3,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  pickerLabelSelected: {
    color: Colors.brand,
  },
  pickerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  pickerCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCheckSelected: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },

  // ── Confirm button ────────────────────────────────────────────────────────
  confirmBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(0,255,135,0.25)',
  },
  confirmBtnText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 15,
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
