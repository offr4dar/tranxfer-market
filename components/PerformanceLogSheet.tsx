import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing, Radius } from '@/constants/theme'

type EntryType = 'match' | 'training' | 'trial'

const ENTRY_CONFIG: Record<EntryType, {
  label: string
  contextLabel: string
  contextPlaceholder: string
  showStats: boolean
  notesPlaceholder: string
}> = {
  match: {
    label: 'Match',
    contextLabel: 'Opponent',
    contextPlaceholder: 'Which team did you play?',
    showStats: true,
    notesPlaceholder: "Tell us more — what competition was it, what was the result, how long did you play, and any standout moments? The more detail, the better your profile looks to scouts.",
  },
  training: {
    label: 'Training',
    contextLabel: 'Session focus',
    contextPlaceholder: 'What did you train today?',
    showStats: false,
    notesPlaceholder: "Describe the session — was it team or individual? What did you work on? Any drills, improvements, or breakthroughs worth noting?",
  },
  trial: {
    label: 'Trial',
    contextLabel: 'Club / Academy',
    contextPlaceholder: 'Which club or academy were you trialling for?',
    showStats: false,
    notesPlaceholder: "How did it go? What was the format, how long did you play, what level was the club, and did you receive any feedback? This is your chance to tell your story.",
  },
}

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

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
  const [rating, setRating]       = useState<number | null>(null)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const config = ENTRY_CONFIG[entryType]

  function reset() {
    setEntryType('match')
    setContext('')
    setGoals('')
    setAssists('')
    setRating(null)
    setNotes('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleTypeChange(type: EntryType) {
    setEntryType(type)
    setContext('')
    setGoals('')
    setAssists('')
  }

  async function handleSave() {
    if (!rating) { setError('Please give yourself a rating.'); return }
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
      rating,
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>

            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Log activity</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Entry type selector */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {(Object.keys(ENTRY_CONFIG) as EntryType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, entryType === type && styles.typePillActive]}
                    onPress={() => handleTypeChange(type)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.typePillText, entryType === type && styles.typePillTextActive]}>
                      {ENTRY_CONFIG[type].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Contextual input */}
              <Text style={styles.label}>{config.contextLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={config.contextPlaceholder}
                placeholderTextColor={Colors.textMuted}
                value={context}
                onChangeText={setContext}
                returnKeyType="next"
              />

              {/* Goals + Assists — match only */}
              {config.showStats && (
                <View style={styles.statsRow}>
                  <View style={styles.statField}>
                    <Text style={styles.label}>Goals</Text>
                    <TextInput
                      style={[styles.input, styles.statInput]}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      value={goals}
                      onChangeText={v => setGoals(v.replace(/[^0-9]/g, ''))}
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.statField}>
                    <Text style={styles.label}>Assists</Text>
                    <TextInput
                      style={[styles.input, styles.statInput]}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      value={assists}
                      onChangeText={v => setAssists(v.replace(/[^0-9]/g, ''))}
                      maxLength={2}
                    />
                  </View>
                </View>
              )}

              {/* Rating */}
              <Text style={styles.label}>Your rating</Text>
              <View style={styles.ratingRow}>
                {RATINGS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingBtn, rating === n && styles.ratingBtnActive]}
                    onPress={() => setRating(n)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.ratingText, rating === n && styles.ratingTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder={config.notesPlaceholder}
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />

              {error && <Text style={styles.error}>{error}</Text>}

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={Colors.background} />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  cancel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typePill: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typePillActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.08)',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typePillTextActive: {
    color: Colors.brand,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 14,
    color: Colors.text,
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
    fontSize: 18,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtnActive: {
    borderColor: Colors.brand,
    backgroundColor: 'rgba(0,255,135,0.08)',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ratingTextActive: {
    color: Colors.brand,
    fontWeight: '800',
  },
  notesInput: {
    height: 110,
    paddingTop: Spacing.sm + 2,
  },
  error: {
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.background,
    letterSpacing: 0.3,
  },
})
