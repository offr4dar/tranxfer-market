import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Colors, Spacing, Radius } from '@/constants/theme'
import { UK_OUTCODES } from '@/lib/uk-outcodes'

const MAX_CHIPS = 30 // cap displayed results so the list doesn't overwhelm

interface Props {
  value: string         // selected outward code e.g. "SE13"
  onChange: (outcode: string) => void
  error?: string
}

export default function PostcodeSearch({ value, onChange, error }: Props) {
  const [query, setQuery] = useState(value)

  // Client-side filter — instant, no network required
  const suggestions =
    query.trim().length >= 1
      ? UK_OUTCODES.filter(code =>
          code.startsWith(query.trim().toUpperCase())
        ).slice(0, MAX_CHIPS)
      : []

  const showSuggestions = suggestions.length > 0 && query !== value

  const handleChange = (text: string) => {
    // Sanitise: uppercase, letters + numbers only, max 4 chars
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    setQuery(clean)
    // Clear selection if the user edits after picking
    if (clean !== value) onChange('')
  }

  const handleSelect = (outcode: string) => {
    setQuery(outcode)
    onChange(outcode)
  }

  const isSelected = value.length > 0

  return (
    <View style={styles.wrapper}>
      {/* Input row */}
      <View style={[styles.inputRow, error && styles.inputRowError, isSelected && styles.inputRowSelected]}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder="e.g. SE1"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={4}
        />
        {isSelected && (
          <TouchableOpacity
            onPress={() => { setQuery(''); onChange('') }}
            style={styles.clearBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results panel */}
      {showSuggestions && (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Select your postcode area</Text>

          {/* Show overflow hint */}
          {UK_OUTCODES.filter(c =>
            c.startsWith(query.trim().toUpperCase())
          ).length > MAX_CHIPS && (
            <Text style={styles.overflowHint}>
              Showing first {MAX_CHIPS} — type more to narrow down
            </Text>
          )}

          <View style={styles.chipGrid}>
            {suggestions.map(code => (
              <TouchableOpacity
                key={code}
                style={styles.chip}
                onPress={() => handleSelect(code)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Selected confirmation */}
      {isSelected && (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>📍 Postcode area selected: </Text>
          <Text style={styles.selectedValue}>{value}</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  inputRowError: { borderColor: 'rgba(255,68,68,0.5)' },
  inputRowSelected: { borderColor: 'rgba(0,255,135,0.4)' },

  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },

  clearBtn: { padding: 4 },
  clearBtnText: { color: Colors.textMuted, fontSize: 14 },

  panel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  panelLabel: {
    color: Colors.brand,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  overflowHint: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    gap: 4,
  },
  selectedLabel: { color: Colors.textSecondary, fontSize: 13 },
  selectedValue: { color: Colors.brand, fontSize: 13, fontWeight: '700' },

  errorText: { color: Colors.error, fontSize: 12 },
})
