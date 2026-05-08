import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ScrollView as HScroll,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenBackground from '@/components/ScreenBackground'
import { Colors, Spacing } from '@/constants/theme'

// ─── Data ────────────────────────────────────────────────────────────────────

const MAX_PER_CATEGORY = 3

const CATEGORIES = [
  {
    id: 'physical',
    label: 'Physical Ability',
    description:
      'Players must be robust enough to handle high-intensity, heavy-contact matches, often on pitches that are less than pristine.',
    attributes: ['Stamina', 'Strength', 'Pace', 'Acceleration', 'Agility', 'Leap', 'Robustness'],
  },
  {
    id: 'mentality',
    label: 'Mentality',
    description:
      "At the semi-professional and amateur levels, a player's mindset is often what separates them from the rest of the pack.",
    attributes: ['Work rate off the ball', 'Bravery', 'Ball recovery', 'Resilience', 'Composure', 'Leadership'],
  },
  {
    id: 'technical',
    label: 'Technical',
    description:
      'These are the fundamental on-the-ball skills. In non-league, doing the basics consistently well is often valued over flashy, inconsistent skills.',
    attributes: ['First touch', 'Passing', 'Tackling', 'Heading', 'Delivery/Crossing', 'Finishing', 'Ball retention'],
  },
  {
    id: 'tactical',
    label: 'Tactical',
    description: 'This is the "football brain" or intelligence of the player.',
    attributes: ['Positioning', 'Reading the game', 'Decision-making', 'Movement', 'Transitioning'],
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EndorseScreen() {
  const router   = useRouter()
  const insets   = useSafeAreaInsets()

  // selections: { [categoryId]: Set<string> }
  const [selections, setSelections] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.id, new Set<string>()])),
  )

  const toggle = (categoryId: string, attr: string) => {
    setSelections(prev => {
      const current = new Set(prev[categoryId])
      if (current.has(attr)) {
        current.delete(attr)
      } else if (current.size < MAX_PER_CATEGORY) {
        current.add(attr)
      }
      return { ...prev, [categoryId]: current }
    })
  }

  const handleSave = () => {
    // TODO: persist endorsements to Supabase
    router.back()
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
        <Text style={styles.headerTitle}>Endorse Player</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro paragraph */}
        <Text style={styles.intro}>
          You can select up to three areas for each category that you think this player excels in:
        </Text>

        {/* Categories */}
        {CATEGORIES.map(category => {
          const selected = selections[category.id]
          const count    = selected.size

          return (
            <View key={category.id} style={styles.categoryBlock}>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text style={styles.categoryTitle}>
                  {category.label.toUpperCase()} ({count}/{MAX_PER_CATEGORY})
                </Text>
                <View style={styles.titleLine} />
              </View>

              {/* Description */}
              <Text style={styles.categoryDesc}>{category.description}</Text>

              {/* Horizontally scrollable pill row */}
              <HScroll
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {category.attributes.map(attr => {
                  const isSelected = selected.has(attr)
                  const isDisabled = !isSelected && count >= MAX_PER_CATEGORY
                  return (
                    <TouchableOpacity
                      key={attr}
                      style={[
                        styles.pill,
                        isSelected  && styles.pillSelected,
                        isDisabled  && styles.pillDisabled,
                      ]}
                      onPress={() => toggle(category.id, attr)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isDisabled && styles.pillTextDisabled]}>
                        {attr}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </HScroll>
            </View>
          )
        })}

        {/* CTA group */}
        <View style={styles.ctaGroup}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.cancelWrap}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: { width: 36 },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 0,
  },

  intro: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },

  // ── Category ──────────────────────────────────────────────────────────────
  categoryBlock: {
    paddingTop: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.text,
  },

  categoryDesc: {
    fontSize: 14,
    color: '#8A8A8A',
    lineHeight: 20,
  },

  // ── Pills ─────────────────────────────────────────────────────────────────
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSelected: {
    borderColor: '#DEDEDE',
  },
  pillDisabled: {
    opacity: 0.35,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.32,
  },
  pillTextDisabled: {
    opacity: 0.6,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaGroup: {
    paddingTop: 32,
    gap: Spacing.md,
    alignItems: 'center',
  },
  saveBtn: {
    width: '100%',
    height: 57,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.28,
  },
  cancelWrap: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.32,
  },
})
