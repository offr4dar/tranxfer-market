import { useState, useRef, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing, Radius } from '@/constants/theme'

type EntryType = 'match' | 'training' | 'trial'

const TABS: { key: EntryType; label: string }[] = [
  { key: 'match',    label: 'MATCH' },
  { key: 'training', label: 'TRAINING' },
  { key: 'trial',    label: 'TRIAL' },
]

const ENTRY_CONFIG: Record<EntryType, {
  contextLabel: string
  contextPlaceholder: string
  showStats: boolean
  notesPlaceholder: string
}> = {
  match: {
    contextLabel: 'Opponent',
    contextPlaceholder: 'Which team did you play?',
    showStats: true,
    notesPlaceholder: "Tell us more — what competition was it, what was the result, how long did you play, and any standout moments? The more detail, the better your profile looks to scouts.",
  },
  training: {
    contextLabel: 'Session focus',
    contextPlaceholder: 'What did you train today?',
    showStats: false,
    notesPlaceholder: "Describe the session — was it team or individual? What did you work on? Any drills, improvements, or breakthroughs worth noting?",
  },
  trial: {
    contextLabel: 'Club / Academy',
    contextPlaceholder: 'Which club or academy were you trialling for?',
    showStats: false,
    notesPlaceholder: "How did it go? What was the format, how long did you play, what level was the club, and did you receive any feedback? This is your chance to tell your story.",
  },
}


interface Props {
  visible: boolean
  onClose: () => void
  onSaved: () => void
}

export default function PerformanceLogSheet({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()

  const [entryType, setEntryType] = useState<EntryType>('match')
  const [context, setContext]     = useState('')
  const [goals, setGoals]         = useState('')
  const [assists, setAssists]     = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Sheet open/close animation
  const [isShown, setIsShown]       = useState(false)
  const sheetY         = useRef(new Animated.Value(700)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setIsShown(true)
      sheetY.setValue(700)
      overlayOpacity.setValue(0)
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(sheetY,         { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(sheetY,         { toValue: 700, duration: 240, useNativeDriver: true }),
      ]).start(() => setIsShown(false))
    }
  }, [visible])

  // Animated sliding pill for tab selector
  const slideAnim = useRef(new Animated.Value(0)).current
  const [tabWidth, setTabWidth] = useState(0)

  useEffect(() => {
    const index = TABS.findIndex(t => t.key === entryType)
    Animated.timing(slideAnim, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [entryType, tabWidth])

  const config = ENTRY_CONFIG[entryType]

  function reset() {
    setEntryType('match')
    setContext('')
    setGoals('')
    setAssists('')
    setNotes('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleTypeChange(type: EntryType, index: number) {
    Animated.timing(slideAnim, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: true,
    }).start()
    setEntryType(type)
    setContext('')
    setGoals('')
    setAssists('')
  }

  async function handleSave() {
    if (!userId) return

    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase.from('performance_logs').insert({
      user_id:    userId,
      match_date: new Date().toISOString().split('T')[0],
      entry_type: entryType,
      context:    context.trim() || null,
      goals:      entryType === 'match' && goals ? parseInt(goals, 10) : null,
      assists:    entryType === 'match' && assists ? parseInt(assists, 10) : null,
      notes:      notes.trim() || null,
    })

    setSaving(false)

    if (dbError) {
      setError('Could not save. Please try again.')
      return
    }

    reset()
    onSaved()
  }

  return (
    <Modal visible={isShown} animationType="none" transparent onRequestClose={handleClose}>
      {/* Backdrop — fades independently */}
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]} />

      {/* Sheet positioner */}
      <View style={styles.positioner} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md, transform: [{ translateY: sheetY }] }]}>

            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Log Entry</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

              {/* Entry type — animated sliding tab */}
              <Text style={styles.sectionLabel}>Type</Text>
              <View style={styles.tabContainer}>
                <View
                  style={styles.tabRow}
                  onLayout={e => setTabWidth(e.nativeEvent.layout.width / TABS.length)}
                >
                  {tabWidth > 0 && (
                    <Animated.View
                      style={[styles.tabSlider, { width: tabWidth, transform: [{ translateX: slideAnim }] }]}
                    />
                  )}
                  {TABS.map((tab, index) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={styles.tab}
                      onPress={() => handleTypeChange(tab.key, index)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabLabel, entryType === tab.key && styles.tabLabelActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Contextual input */}
              <Text style={styles.fieldLabel}>{config.contextLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={config.contextPlaceholder}
                placeholderTextColor="#909090"
                value={context}
                onChangeText={setContext}
                returnKeyType="next"
              />

              {/* Goals + Assists — match only */}
              {config.showStats && (
                <View style={styles.statsRow}>
                  <View style={styles.statField}>
                    <Text style={styles.fieldLabel}>Goals</Text>
                    <TextInput
                      style={[styles.input, styles.statInput]}
                      placeholder="0"
                      placeholderTextColor="#909090"
                      keyboardType="number-pad"
                      value={goals}
                      onChangeText={v => setGoals(v.replace(/[^0-9]/g, ''))}
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.statField}>
                    <Text style={styles.fieldLabel}>Assists</Text>
                    <TextInput
                      style={[styles.input, styles.statInput]}
                      placeholder="0"
                      placeholderTextColor="#909090"
                      keyboardType="number-pad"
                      value={assists}
                      onChangeText={v => setAssists(v.replace(/[^0-9]/g, ''))}
                      maxLength={2}
                    />
                  </View>
                </View>
              )}

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder={config.notesPlaceholder}
                placeholderTextColor="#909090"
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />

            </ScrollView>

            {/* Save — always visible, pinned outside scroll */}
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.saveBtnText}>SAVE</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  positioner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.text,
  },
  cancel: {
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.32,
  },

  // Section / field labels
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.32,
    marginTop: Spacing.md,
    marginBottom: 5,
  },

  // Animated tab toggle
  tabContainer: {
    borderWidth: 1,
    borderColor: '#284135',
    borderRadius: Radius.full,
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tabSlider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: '#000000',
  },

  // Inputs
  input: {
    height: 59,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderWidth: 1,
    borderColor: '#4f4f4f',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statField: {
    flex: 1,
  },
  statInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  notesInput: {
    height: 110,
    paddingTop: 16,
    textAlignVertical: 'top',
  },

  // Rating chips
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 42,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: '#dedede',
  },
  chipText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.32,
  },
  chipTextActive: {
    color: '#fff',
  },

  error: {
    fontSize: 14,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Save button
  saveBtn: {
    height: 57,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
