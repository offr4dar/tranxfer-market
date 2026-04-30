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

export interface ScoutFilters {
  scoutType: 'club_scout' | 'freelance_scout' | null
  specialisms: string[]       // position codes the scout focuses on
  leagueLevel: string[]
  regions: string[]
  experience: string | null   // 'u5' | '5-10' | '10-15' | '15+'
  verifiedOnly: boolean
  proximity: string | null    // 'near' | 'regional' | 'national' | null = any
}

export const DEFAULT_SCOUT_FILTERS: ScoutFilters = {
  scoutType: null,
  specialisms: [],
  leagueLevel: [],
  regions: [],
  experience: null,
  verifiedOnly: false,
  proximity: null,
}

export function isScoutFiltered(f: ScoutFilters): boolean {
  return (
    f.scoutType !== null ||
    f.specialisms.length > 0 ||
    f.leagueLevel.length > 0 ||
    f.regions.length > 0 ||
    f.experience !== null ||
    f.verifiedOnly ||
    f.proximity !== null
  )
}

// ─── Static option lists ──────────────────────────────────────────────────────

const POSITIONS = ['GK','RB','CB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST']

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

const UK_REGIONS = [
  { key: 'London',                  label: 'London' },
  { key: 'South East',              label: 'South East' },
  { key: 'South West',              label: 'South West' },
  { key: 'East of England',         label: 'East of England' },
  { key: 'East Midlands',           label: 'East Midlands' },
  { key: 'West Midlands',           label: 'West Midlands' },
  { key: 'Yorkshire & The Humber',  label: 'Yorkshire & The Humber' },
  { key: 'North West',              label: 'North West' },
  { key: 'North East',              label: 'North East' },
  { key: 'Wales',                   label: 'Wales' },
  { key: 'Scotland',                label: 'Scotland' },
  { key: 'Northern Ireland',        label: 'Northern Ireland' },
]

const EXPERIENCE_OPTIONS = [
  { key: 'u5',   label: 'Under 5 years' },
  { key: '5-10', label: '5 – 10 years' },
  { key: '10-15',label: '10 – 15 years' },
  { key: '15+',  label: '15+ years' },
]

const PROXIMITY_OPTIONS = [
  { key: 'near',     label: 'Within 25 miles' },
  { key: 'regional', label: 'Within 50 miles' },
  { key: 'national', label: 'Within 100 miles' },
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
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean
  initialFilters: ScoutFilters
  hasLocation: boolean        // whether the player's postcode is known
  onClose: () => void
  onApply: (filters: ScoutFilters) => void
}

export default function PlayerFilterPanel({
  visible, initialFilters, hasLocation, onClose, onApply,
}: Props) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current
  const [local, setLocal] = useState<ScoutFilters>(initialFilters)

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
  const handleReset  = () => setLocal(DEFAULT_SCOUT_FILTERS)

  const set = <K extends keyof ScoutFilters>(key: K, val: ScoutFilters[K]) =>
    setLocal(f => ({ ...f, [key]: val }))

  const toggleSingle = <K extends 'scoutType' | 'experience' | 'proximity'>(
    key: K, val: ScoutFilters[K],
  ) => set(key, local[key] === val ? null : val)

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Scout type */}
          <Section title="SCOUT TYPE">
            {([
              { key: 'club_scout',      label: 'Club Scout' },
              { key: 'freelance_scout', label: 'Freelance Scout' },
            ] as const).map(o => (
              <RadioOption
                key={o.key}
                label={o.label}
                selected={local.scoutType === o.key}
                onPress={() => toggleSingle('scoutType', o.key)}
              />
            ))}
          </Section>

          {/* Position specialism */}
          <Section title="POSITION SPECIALISM">
            <View style={styles.chipGrid}>
              {POSITIONS.map(pos => (
                <PositionChip
                  key={pos}
                  label={pos}
                  active={local.specialisms.includes(pos)}
                  onPress={() => set('specialisms', toggleArray(local.specialisms, pos))}
                />
              ))}
            </View>
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

          {/* Regions covered */}
          <Section title="REGIONS COVERED">
            {UK_REGIONS.map(o => (
              <CheckboxOption
                key={o.key}
                label={o.label}
                checked={local.regions.includes(o.key)}
                onPress={() => set('regions', toggleArray(local.regions, o.key))}
              />
            ))}
          </Section>

          {/* Experience */}
          <Section title="EXPERIENCE">
            {EXPERIENCE_OPTIONS.map(o => (
              <RadioOption
                key={o.key}
                label={o.label}
                selected={local.experience === o.key}
                onPress={() => toggleSingle('experience', o.key)}
              />
            ))}
          </Section>

          {/* Proximity — only shown if the player has a saved location */}
          {hasLocation && (
            <Section title="PROXIMITY">
              {PROXIMITY_OPTIONS.map(o => (
                <RadioOption
                  key={o.key}
                  label={o.label}
                  selected={local.proximity === o.key}
                  onPress={() => toggleSingle('proximity', o.key)}
                />
              ))}
            </Section>
          )}

          {/* Trust & verification */}
          <Section title="TRUST">
            <CheckboxOption
              label="Verified scouts only"
              sub="Identity confirmed by Tranxfer Market"
              checked={local.verifiedOnly}
              onPress={() => set('verifiedOnly', !local.verifiedOnly)}
            />
          </Section>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Reset"         onPress={handleReset} variant="outline" flex={1} />
          <Button label="Apply Filters" onPress={handleApply} variant="primary" flex={2} />
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
    top: 0, bottom: 0, right: 0,
    width: PANEL_W,
    overflow: 'hidden',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,18,18,0.72)',
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
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
