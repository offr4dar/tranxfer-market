import { useState, useRef, useEffect } from 'react'
import {
  View, Text, Modal, ScrollView,
  StyleSheet, Animated, Dimensions, TouchableOpacity, TouchableWithoutFeedback, Easing,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { Colors, Radius } from '@/constants/theme'
import RadioOption from '@/components/RadioOption'
import CheckboxOption from '@/components/CheckboxOption'
import Button from '@/components/Button'
import CloseButton from '@/components/CloseButton'

const { width: W } = Dimensions.get('window')
const PANEL_W = Math.round(W * 0.88)

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface PlayerFilters {
  gender: 'male' | 'female' | null
  foot: 'left' | 'right' | 'both' | null
  availability: string[]
  positions: string[]
  ageBracket: string | null
  leagueLevel: string[]
  radiusMiles: number | null
}

export const DEFAULT_FILTERS: PlayerFilters = {
  gender: null,
  foot: null,
  availability: [],
  positions: [],
  ageBracket: null,
  leagueLevel: [],
  radiusMiles: null,
}

export function isFiltered(f: PlayerFilters): boolean {
  return (
    f.gender !== null ||
    f.foot !== null ||
    f.availability.length > 0 ||
    f.positions.length > 0 ||
    f.ageBracket !== null ||
    f.leagueLevel.length > 0 ||
    f.radiusMiles !== null
  )
}

export function ageBracketRange(bracket: string): [number | null, number | null] {
  switch (bracket) {
    case 'u18':   return [null, 17]
    case 'u21':   return [null, 20]
    case 'u23':   return [null, 22]
    case '24-30': return [24, 30]
    case '30+':   return [31, null]
    default:      return [null, null]
  }
}

// ─── Static option lists ──────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { key: 'available_now',  label: 'Available Now' },
  { key: 'available_eot',  label: 'Available End of Season' },
  { key: 'trial',          label: 'Trial' },
  { key: 'under_contract', label: 'Under Contract' },
]

const POSITIONS = ['GK','RB','CB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST']

const AGE_BRACKETS = [
  { key: 'u18',   label: 'Under 18' },
  { key: 'u21',   label: 'Under 21' },
  { key: 'u23',   label: 'Under 23' },
  { key: '24-30', label: '24 – 30' },
  { key: '30+',   label: '30+' },
]

const DISTANCE_OPTIONS = [
  { miles: 10,  label: 'Within 10 miles' },
  { miles: 25,  label: 'Within 25 miles' },
  { miles: 50,  label: 'Within 50 miles' },
  { miles: 100, label: 'Within 100 miles' },
  { miles: 200, label: 'Within 200 miles' },
]

const LEAGUE_OPTIONS = [
  { key: 'Premier League',  label: 'Premier League' },
  { key: 'Championship',    label: 'Championship' },
  { key: 'League 1',        label: 'League 1' },
  { key: 'League 2',        label: 'League 2' },
  { key: 'National League', label: 'National League' },
  { key: 'Step 3',          label: 'Step 3' },
  { key: 'Step 4',          label: 'Step 4' },
  { key: 'Step 5',          label: 'Step 5' },
  { key: 'Step 6',          label: 'Step 6' },
  { key: 'Amateur',         label: 'Amateur' },
  { key: 'Academy',         label: 'Academy' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggleArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function PositionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean
  initialFilters: PlayerFilters
  scoutHasLocation?: boolean
  onClose: () => void
  onApply: (filters: PlayerFilters) => void
}

export default function FilterPanel({ visible, initialFilters, scoutHasLocation = false, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current
  const [local, setLocal] = useState<PlayerFilters>(initialFilters)

  useEffect(() => {
    if (visible) {
      setLocal(initialFilters)
      slideAnim.setValue(PANEL_W)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const slideOut = (cb: () => void) => {
    Animated.timing(slideAnim, {
      toValue: PANEL_W,
      duration: 260,
      easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      useNativeDriver: true,
    }).start(cb)
  }

  const handleClose  = () => slideOut(onClose)
  const handleApply  = () => slideOut(() => onApply(local))
  const handleReset  = () => setLocal(DEFAULT_FILTERS)

  const set = <K extends keyof PlayerFilters>(key: K, val: PlayerFilters[K]) =>
    setLocal(f => ({ ...f, [key]: val }))

  const toggleSingle = <K extends 'gender' | 'foot' | 'ageBracket'>(
    key: K,
    val: PlayerFilters[K],
  ) => set(key, local[key] === val ? null : val)

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop — tap to dismiss */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Slide-in panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX: slideAnim }], paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.panelOverlay} />
        </BlurView>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Filters</Text>
          <CloseButton onPress={handleClose} />
        </View>

        {/* Scrollable filter sections */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Distance */}
          <Section title="DISTANCE">
            {scoutHasLocation ? (
              DISTANCE_OPTIONS.map(o => (
                <RadioOption
                  key={o.miles}
                  label={o.label}
                  selected={local.radiusMiles === o.miles}
                  onPress={() => set('radiusMiles', local.radiusMiles === o.miles ? null : o.miles)}
                />
              ))
            ) : (
              <Text style={styles.locationHint}>
                Add a postcode to your profile to enable proximity search.
              </Text>
            )}
          </Section>

          {/* Gender */}
          <Section title="GENDER">
            {([
              { key: 'male',   label: 'Male' },
              { key: 'female', label: 'Female' },
            ] as const).map(o => (
              <RadioOption
                key={o.key}
                label={o.label}
                selected={local.gender === o.key}
                onPress={() => toggleSingle('gender', o.key)}
              />
            ))}
          </Section>

          {/* Availability */}
          <Section title="AVAILABILITY">
            {AVAILABILITY_OPTIONS.map(o => (
              <CheckboxOption
                key={o.key}
                label={o.label}
                checked={local.availability.includes(o.key)}
                onPress={() => set('availability', toggleArray(local.availability, o.key))}
              />
            ))}
          </Section>

          {/* Position */}
          <Section title="POSITION">
            <View style={styles.chipGrid}>
              {POSITIONS.map(pos => (
                <PositionChip
                  key={pos}
                  label={pos}
                  active={local.positions.includes(pos)}
                  onPress={() => set('positions', toggleArray(local.positions, pos))}
                />
              ))}
            </View>
          </Section>

          {/* Age */}
          <Section title="AGE">
            {AGE_BRACKETS.map(o => (
              <RadioOption
                key={o.key}
                label={o.label}
                selected={local.ageBracket === o.key}
                onPress={() => toggleSingle('ageBracket', o.key)}
              />
            ))}
          </Section>

          {/* League level */}
          <Section title="LEAGUE LEVEL">
            {LEAGUE_OPTIONS.map(o => (
              <CheckboxOption
                key={o.key}
                label={o.label}
                checked={local.leagueLevel.includes(o.key)}
                onPress={() => set('leagueLevel', toggleArray(local.leagueLevel, o.key))}
              />
            ))}
          </Section>

          {/* Preferred foot */}
          <Section title="PREFERRED FOOT">
            {([
              { key: 'left',  label: 'Left' },
              { key: 'right', label: 'Right' },
              { key: 'both',  label: 'Both' },
            ] as const).map(o => (
              <RadioOption
                key={o.key}
                label={o.label}
                selected={local.foot === o.key}
                onPress={() => toggleSingle('foot', o.key)}
              />
            ))}
          </Section>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button label="Reset"         onPress={handleReset} variant="outline"  flex={1} />
          <Button label="Apply Filters" onPress={handleApply} variant="primary"  flex={2} />
        </View>
      </Animated.View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: PANEL_W,
    overflow: 'hidden',
  },

  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.72)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.text,
  },


  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 32, paddingBottom: 24 },

  section: { gap: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 2,
  },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: '#dedede' },
  chipText: { fontSize: 16, color: '#fff', fontWeight: '700', letterSpacing: 0.32 },
  chipTextActive: { color: '#fff' },

  locationHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
