# Tranxfer Market — Coding Conventions

> **Effective from:** May 2026  
> These conventions apply to all new code written in this codebase. Legacy files are migrated to these standards opportunistically — when a file is touched for a functional reason, bring it in line.

---

## 1. File Naming

Use **`snake_case`** for all new files.

```
✅  components/mini_card.tsx
✅  components/performance_log_sheet.tsx
✅  components/scout_interest_chart.tsx
✅  lib/queries/profile_views.ts
✅  constants/theme.ts

❌  components/MiniCard.tsx
❌  components/performanceLogSheet.tsx
```

### Exceptions (framework-enforced)
Expo Router files keep their required names unchanged:

```
app/_layout.tsx
app/(tabs)/profile.tsx
app/player/[id].tsx
```

---

## 2. Component Names

React components always use **`PascalCase`** — this is a hard React requirement and does not change.

```tsx
✅  export default function MiniCard() {}
✅  export default function PerformanceLogSheet() {}
✅  export function ScoutInterestChart() {}
```

---

## 3. Style Names (StyleSheet keys)

Use **`snake_case`** for all `StyleSheet.create()` keys.

```ts
✅  mini_card, mini_card_label, mini_card_value
✅  btn_row, btn_outline, btn_secondary, btn_text
✅  week_streak, streak_emoji
✅  insight_block, insight_header, insight_divider
✅  profile_score_row, score_text_col, ring_wrap

❌  miniCard, btnRow, weekStreak, insightBlock
```

### Modifiers
Use double underscores to denote a modifier on a base element:

```ts
mini_card              // base
mini_card__streak      // streak variant
mini_card__label       // label element inside the card
mini_card__value       // value element inside the card
```

---

## 4. State & Variable Names

Use **`snake_case`** for all local state, constants and variables.

```ts
✅  const [week_streak, set_week_streak] = useState(0)
✅  const [log_sheet_open, set_log_sheet_open] = useState(false)
✅  const total_logs = 12
✅  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R   // SCREAMING_SNAKE for module-level constants

❌  const [weekStreak, setWeekStreak] = useState(0)
❌  const logSheetOpen = false
```

---

## 5. Component Architecture — Component-First

**All UI must live in dedicated component files.** Do not write significant JSX inline inside screen files.

### Rules
- Any UI block used in **more than one place** → extract immediately
- Any UI block exceeding **~40 lines of JSX** → extract into its own component
- Screen files (`app/`) should be orchestrators only: data fetching, state, layout glue

### Structure
```
components/
  mini_card.tsx            ← reusable data chip
  performance_log_sheet.tsx
  scout_interest_chart.tsx
  player_level_card.tsx
  endorsements_section.tsx
  screen_header.tsx
  screen_background.tsx
```

### Example — correct pattern
```tsx
// ✅ screen file (app/(tabs)/profile.tsx) — thin orchestrator
import MiniCard from '@/components/mini_card'

<MiniCard label="Profile Views\nThis Week" value={view_stats.this_week} />
```

```tsx
// ✅ component file (components/mini_card.tsx)
export default function MiniCard({ label, value }: Props) {
  return (
    <View style={styles.mini_card}>
      <Text style={styles.mini_card__label}>{label}</Text>
      <Text style={styles.mini_card__value}>{value}</Text>
    </View>
  )
}
```

---

## 6. Shared Design Tokens

Design tokens (colours, spacing, radii, shared style objects) live exclusively in **`constants/theme.ts`**.

```ts
// ✅ correct — exported from theme
export const MiniCardStyles = { ... }
export const Colors = { ... }
export const Spacing = { ... }
```

Never hardcode hex values or pixel sizes inline in a component. Always reference a token.

```ts
✅  color: Colors.text
✅  padding: Spacing.md
❌  color: '#ffffff'
❌  padding: 16
```

---

## 7. Imports — Order

Maintain this import order in every file:

```ts
// 1. React / React Native core
import { useState, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'

// 2. Third-party packages
import { useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'

// 3. Internal — lib / queries
import { supabase } from '@/lib/supabase'
import { fetch_profile_views } from '@/lib/queries/profile_views'

// 4. Internal — components
import MiniCard from '@/components/mini_card'
import ScreenBackground from '@/components/screen_background'

// 5. Internal — constants / types
import { Colors, Spacing } from '@/constants/theme'
```

---

## 8. Quick Reference

| Thing | Convention | Example |
|---|---|---|
| File name | `snake_case` | `mini_card.tsx` |
| Component name | `PascalCase` | `MiniCard` |
| Style key | `snake_case` | `mini_card__label` |
| State variable | `snake_case` | `week_streak` |
| Module constant | `SCREAMING_SNAKE` | `RING_CIRCUMFERENCE` |
| Design token | `PascalCase` export | `Colors.brand` |
