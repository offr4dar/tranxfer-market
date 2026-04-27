# Design System

All visual styling in Tranxfer Market is managed through a central design token file: `constants/theme.ts`. No colour, spacing value, or border radius should ever be hardcoded in a component.

## Colour Palette

| Token | Value | Usage |
|---|---|---|
| `Colors.brand` | `#00FF87` | Primary green accent — CTAs, active states, highlights |
| `Colors.background` | `#0A0F1E` | Deep navy — primary app background |
| `Colors.surface` | `#0D1526` | Slightly lighter surface — cards, overlays |
| `Colors.surfaceElevated` | `#111827` | Elevated surface — modals, drawers |
| `Colors.text` | `#FFFFFF` | Primary text |
| `Colors.textMuted` | `#8899AA` | Secondary / muted text |
| `Colors.border` | `#1E2A3B` | Subtle borders and dividers |

## Typography

| Token | Usage |
|---|---|
| Font family: **Anton** | Display headings, screen titles |
| Font family: **System Default** | Body text and UI labels |

Anton is loaded via `@expo-google-fonts/anton` and applied globally to heading components.

## Spacing Scale

Spacing values are defined in `Spacing` and follow a base-4 scale:

| Token | Value |
|---|---|
| `Spacing.xs` | 4 |
| `Spacing.sm` | 8 |
| `Spacing.md` | 16 |
| `Spacing.lg` | 24 |
| `Spacing.xl` | 32 |
| `Spacing.xxl` | 48 |

## Border Radius Scale

| Token | Value |
|---|---|
| `Radius.sm` | 4 |
| `Radius.md` | 8 |
| `Radius.lg` | 16 |
| `Radius.full` | 9999 (pill shape) |

## Usage Example

```ts
import { Colors, Spacing, Radius } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  label: {
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
});
```
