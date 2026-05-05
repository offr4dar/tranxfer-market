import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, ActionSheetIOS, Platform,
  Modal, FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing } from '@/constants/theme'

// ─── Picker options ───────────────────────────────────────────────────────────

const NATIONALITIES = [
  'English', 'Scottish', 'Welsh', 'Northern Irish', 'Irish',
  'French', 'Spanish', 'Portuguese', 'Italian', 'German',
  'Dutch', 'Belgian', 'Brazilian', 'Argentine', 'Colombian',
  'Jamaican', 'Ghanaian', 'Nigerian', 'Senegalese', 'Ivorian',
  'Moroccan', 'Algerian', 'Cameroonian', 'South African', 'Zimbabwean',
  'American', 'Canadian', 'Australian', 'Japanese', 'South Korean',
  'Other',
]

const PLAYING_LEVELS = [
  'Grassroots',
  'Sunday League',
  'Amateur',
  'Semi-Professional',
  'Professional',
  'Academy (Youth)',
]

const PERFORMANCE_LEVELS = [
  'Beginner',
  'Developing',
  'Medium',
  'Good',
  'Excellent',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ageFromDob(dob: string): number | null {
  // Accepts DD/MM/YYYY
  const parts = dob.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 1900) return null
  const today = new Date()
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--
  return age >= 0 ? age : null
}

// Weighted score: each field has a point value summing to 100
function calcCompletionScore(p: {
  firstName: string; lastName: string; age: number | null
  nationality: string; primaryPosition: string
  playingLevel: string; performanceLevel: string
  photoUrl: string; reelUrl: string
}): number {
  const checks: [boolean, number][] = [
    [!!p.firstName,        10],
    [!!p.lastName,         10],
    [!!p.age,              10],
    [!!p.nationality,      15],
    [!!p.primaryPosition,  15],
    [!!p.playingLevel,     15],
    [!!p.performanceLevel, 10],
    [!!p.photoUrl,         10],
    [!!p.reelUrl,           5],
  ]
  return checks.reduce((sum, [filled, pts]) => sum + (filled ? pts : 0), 0)
}

// ─── Android picker modal ─────────────────────────────────────────────────────

interface PickerModalProps {
  visible: boolean
  title: string
  options: string[]
  onSelect: (value: string) => void
  onClose: () => void
}

function PickerModal({ visible, title, options, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={pickerStyles.sheet}>
        <Text style={pickerStyles.title}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={pickerStyles.option} onPress={() => { onSelect(item); onClose() }}>
              <Text style={pickerStyles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  )
}

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  title: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionText: { color: Colors.text, fontSize: 16 },
})

// ─── Reusable field components ────────────────────────────────────────────────

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.labelWrap}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

function SelectRow({
  value, placeholder, onPress,
}: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.input} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
        {value || placeholder}
      </Text>
      <Svg width={10} height={6} viewBox="0 0 10 6" fill="none">
        <Path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface FormState {
  firstName: string
  lastName: string
  dob: string
  nationality: string
  playingLevel: string
  performanceLevel: string
}

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()

  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', dob: '',
    nationality: '', playingLevel: '', performanceLevel: '',
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Fields not editable here but needed for the completion score
  const immutableRef = useRef({ primaryPosition: '', photoUrl: '', reelUrl: '' })

  const [pickerVisible, setPickerVisible] = useState(false)
  const [activePicker, setActivePicker]   = useState<{
    title: string; options: string[]; field: keyof FormState
  } | null>(null)

  // Load current profile
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('player_profiles')
        .select('first_name,last_name,age,nationality,league_level,skill_level,primary_position,profile_photo_url,highlight_reel_url')
        .eq('user_id', userId)
        .maybeSingle()

      if (data) {
        setForm({
          firstName:        data.first_name   ?? '',
          lastName:         data.last_name    ?? '',
          dob:              data.age          ? `${data.age}` : '',
          nationality:      data.nationality  ?? '',
          playingLevel:     data.league_level ?? '',
          performanceLevel: data.skill_level  ?? '',
        })
        immutableRef.current = {
          primaryPosition: data.primary_position   ?? '',
          photoUrl:        data.profile_photo_url  ?? '',
          reelUrl:         data.highlight_reel_url ?? '',
        }
      }
      setLoading(false)
    })()
  }, [userId])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function openPicker(title: string, options: string[], field: keyof FormState) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, 'Cancel'], cancelButtonIndex: options.length, title },
        index => { if (index < options.length) set(field, options[index]) },
      )
    } else {
      setActivePicker({ title, options, field })
      setPickerVisible(true)
    }
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setError(null)

    const age = ageFromDob(form.dob) ?? (parseInt(form.dob, 10) || null)
    const { primaryPosition, photoUrl, reelUrl } = immutableRef.current

    const score = calcCompletionScore({
      firstName:        form.firstName.trim(),
      lastName:         form.lastName.trim(),
      age,
      nationality:      form.nationality,
      primaryPosition,
      playingLevel:     form.playingLevel,
      performanceLevel: form.performanceLevel,
      photoUrl,
      reelUrl,
    })

    const { error: dbError } = await supabase
      .from('player_profiles')
      .update({
        first_name:               form.firstName.trim() || undefined,
        last_name:                form.lastName.trim()  || undefined,
        age:                      age                   ?? undefined,
        nationality:              form.nationality      || undefined,
        league_level:             form.playingLevel     || undefined,
        skill_level:              form.performanceLevel || undefined,
        profile_completion_score: score,
        updated_at:               new Date().toISOString(),
      })
      .eq('user_id', userId)

    setSaving(false)

    if (dbError) {
      console.error('edit-profile save:', dbError.message, dbError.details, dbError.hint)
      setError('Could not save. Please try again.')
      return
    }

    router.back()
  }

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground>
      {/* Header */}
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
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <TouchableOpacity style={styles.photoRow} activeOpacity={0.8}>
          <View style={styles.photoCircle}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
              />
            </Svg>
          </View>
          <Text style={styles.photoLabel}>Upload a photo</Text>
        </TouchableOpacity>

        {/* First name */}
        <FieldLabel label="First name" />
        <TextInput
          style={[styles.input, styles.inputText]}
          value={form.firstName}
          onChangeText={v => set('firstName', v)}
          placeholder="First name"
          placeholderTextColor="#909090"
          autoCapitalize="words"
        />

        {/* Last name */}
        <FieldLabel label="Last name" />
        <TextInput
          style={[styles.input, styles.inputText]}
          value={form.lastName}
          onChangeText={v => set('lastName', v)}
          placeholder="Last name"
          placeholderTextColor="#909090"
          autoCapitalize="words"
        />

        {/* Date of birth */}
        <FieldLabel label="Date of birth" />
        <TextInput
          style={[styles.input, styles.inputText]}
          value={form.dob}
          onChangeText={v => set('dob', v)}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#909090"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        {/* Nationality */}
        <FieldLabel label="Nationality" />
        <SelectRow
          value={form.nationality}
          placeholder="Select nationality"
          onPress={() => openPicker('Nationality', NATIONALITIES, 'nationality')}
        />

        {/* Playing level */}
        <FieldLabel label="Playing level" />
        <SelectRow
          value={form.playingLevel}
          placeholder="Select playing level"
          onPress={() => openPicker('Playing level', PLAYING_LEVELS, 'playingLevel')}
        />

        {/* Performance level */}
        <FieldLabel
          label="Performance level"
          hint="How would you describe your performance/ability on the field?"
        />
        <SelectRow
          value={form.performanceLevel}
          placeholder="Select performance level"
          onPress={() => openPicker('Performance level', PERFORMANCE_LEVELS, 'performanceLevel')}
        />

        {/* Showreel */}
        <View style={styles.showreelSection}>
          <FieldLabel label="Showreel" />
          <TouchableOpacity style={styles.videoBox} activeOpacity={0.8}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8 }}>
              <Path
                d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.895L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.videoLabel}>Tap to upload</Text>
            <Text style={styles.videoSub}>Max 30 secs.</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.updateBtn, saving && styles.updateBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.updateBtnText}>UPDATE</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Android picker modal */}
      {activePicker && (
        <PickerModal
          visible={pickerVisible}
          title={activePicker.title}
          options={activePicker.options}
          onSelect={v => set(activePicker.field, v)}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: { width: 36 },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 5,
  },

  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  photoLabel: {
    color: Colors.text,
    fontSize: 16,
    letterSpacing: 0.32,
  },

  labelWrap: {
    marginTop: Spacing.md,
    marginBottom: 6,
    gap: 4,
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    letterSpacing: 0.32,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 14,
    letterSpacing: 0.28,
    lineHeight: 20,
  },

  input: {
    height: 59,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 1,
    borderColor: '#4f4f4f',
    borderRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    color: Colors.text,
    fontSize: 16,
    letterSpacing: 0.32,
  },
  inputPlaceholder: {
    color: '#909090',
  },

  showreelSection: {
    marginTop: Spacing.md,
  },
  videoBox: {
    height: 175,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  videoLabel: {
    color: Colors.text,
    fontSize: 12,
    letterSpacing: 0.24,
  },
  videoSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  error: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
  },

  cta: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  updateBtn: {
    height: 57,
    width: '100%',
    backgroundColor: Colors.text,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnDisabled: { opacity: 0.5 },
  updateBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
  cancelLink: {
    color: Colors.brand,
    fontSize: 16,
    letterSpacing: 0.32,
    fontWeight: '600',
  },
})
