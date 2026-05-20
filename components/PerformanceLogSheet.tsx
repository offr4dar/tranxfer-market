import { useState, useRef, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, PanResponder, Dimensions, TouchableWithoutFeedback,
} from 'react-native'
import { BlurView } from 'expo-blur'
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

const SCREEN_H = Dimensions.get('window').height

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

  // Measure the Match tab's form area height once, then lock all tabs to it
  const [formMinHeight, setFormMinHeight] = useState<number | undefined>(undefined)
  const matchHeightCaptured = useRef(false)

  const [isShown, setIsShown]   = useState(false)
  const sheetY                  = useRef(new Animated.Value(SCREEN_H)).current
  const overlayOpacity          = useRef(new Animated.Value(0)).current
  const isDraggingClose         = useRef(false)

  useEffect(() => {
    if (visible) {
      isDraggingClose.current = false
      setIsShown(true)
      sheetY.setValue(SCREEN_H)
      overlayOpacity.setValue(0)
      Animated.parallel([
        Animated.timing(sheetY,         { toValue: 0,    duration: 300, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
      ]).start()
    } else if (!isDraggingClose.current) {
      Animated.parallel([
        Animated.timing(sheetY,         { toValue: SCREEN_H, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0,         duration: 240, useNativeDriver: true }),
      ]).start(() => setIsShown(false))
    }
  }, [visible])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 2,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) sheetY.setValue(dy)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 100 || vy > 0.5) {
          isDraggingClose.current = true
          Animated.parallel([
            Animated.timing(sheetY,         { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
            Animated.timing(overlayOpacity, { toValue: 0,         duration: 220, useNativeDriver: true }),
          ]).start(() => {
              setIsShown(false)
              handleClose()
            })
        } else {
          Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
        }
      },
    })
  ).current

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
      <View style={styles.positioner} pointerEvents="box-none">

        {/* ── Backdrop: blur + dark scrim ── */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md, transform: [{ translateY: sheetY }] }]}>

            {/* Draggable handle */}
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Log Entry</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/*
              Form content area.
              onLayout captures the Match tab height on first render and stores it as
              minHeight so all other tabs expand to fill the same space.
            */}
            <View
              style={[styles.formContent, formMinHeight !== undefined && { minHeight: formMinHeight }]}
              onLayout={e => {
                if (entryType === 'match' && !matchHeightCaptured.current) {
                  matchHeightCaptured.current = true
                  setFormMinHeight(e.nativeEvent.layout.height)
                }
              }}
            >
              {/* Entry type tabs */}
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
            </View>

            {/* CTA — always at the bottom of the sheet */}
            <View style={styles.ctaSection}>
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
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  positioner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  formContent: {
    // minHeight set dynamically to Match tab height after first render
  },
  ctaSection: {
    paddingTop: Spacing.md,
  },
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
  error: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  saveBtn: {
    height: 57,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
