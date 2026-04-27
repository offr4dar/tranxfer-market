# Design System & Tokens

---

## Colour Palette

All colours are defined in `constants/theme.ts`. Never hardcode colour values anywhere in the codebase.

```ts
Colors.brand           = '#00FF87'   // Primary green accent — used for CTAs, highlights, badges
Colors.background      = '#0A0F1E'   // Deep navy — base background for all screens
Colors.surface         = '#0D1526'   // Slightly lighter surface — cards, modals
Colors.surfaceElevated = '#111827'   // Elevated surface — dropdowns, popovers
Colors.textPrimary     = '#FFFFFF'   // Primary text
Colors.textSecondary   = '#98A2B3'   // Secondary / muted text
Colors.textMuted       = '#667085'   // Timestamps, labels, captions
Colors.border          = '#1D2939'   // Subtle borders
Colors.error           = '#F04438'   // Error states
Colors.warning         = '#F79009'   // Warning states
Colors.success         = '#00FF87'   // Success — same as brand
```

---

## Spacing Scale

```ts
Spacing.xs  = 4
Spacing.sm  = 8
Spacing.md  = 16
Spacing.lg  = 24
Spacing.xl  = 32
Spacing.xxl = 48
```

---

## Border Radius Scale

```ts
Radius.sm  = 6
Radius.md  = 10
Radius.lg  = 16
Radius.xl  = 24
Radius.full = 9999
```

---

## Typography

Primary display font: **Anton** (via `@expo-google-fonts/anton`) — used for large headings, player names on cards, ratings.

Body text: React Native system default with `StyleSheet` overrides. Font sizes follow an 8-point scale (12, 14, 16, 20, 24, 32, 40).

---

## Overall Aesthetic

Dark, premium, and athletic. The visual language is closer to a sports broadcasting brand than a typical startup app. The deep navy background with the brand green accent creates contrast that reads well on mobile screens in varying lighting conditions — including outdoor pitches.

Avoid:
- White or light backgrounds
- Pastel colours
- Rounded, bubbly UI patterns
- Heavy use of gradients in body content (reserved for cards and hero elements)

---

## Key UI Patterns

### Floating Tab Bar
A custom pill-shaped tab bar that floats above the screen content. Uses `react-native-reanimated` for tab switch animations.

### Screen Background
`ScreenBackground` wraps all tab screens with a full-screen dark navy background and a subtle tiled texture overlay (`assets/Frame 44.jpg`). This creates visual depth without introducing colour complexity.

### Screen Header
`ScreenHeader` provides a consistent global top bar with the Tranxfer Market logo and context-appropriate action icons. Shared across all tab screens.

### Card Components
Player cards use a dark surface background with subtle border and elevation. The `PlayerCard` in the feed is a condensed version of the full player card. The shareable player card is the full portrait version with tier-specific visual treatment.
