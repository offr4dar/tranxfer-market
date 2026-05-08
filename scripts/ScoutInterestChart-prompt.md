# Task — Build ScoutInterestChart Component

## Context preamble

I am building a React Native mobile app called Tranxfer Market using Expo ~54,
Expo Router ~6, TypeScript strict mode, Clerk for auth, and Supabase for the
database. Design tokens are in `constants/theme.ts`. The Anton_400Regular font
is loaded globally. All components are functional with hooks, no inline styles —
always use StyleSheet.create. No implicit any.

---

## Goal

Build a self-contained `ScoutInterestChart` component that displays a player's
profile views vs shortlists over time. It should be as close as possible to the
following reference design:

- Two line datasets: Views (muted grey, dashed) and Shortlists (brand green, solid)
- Three stat cards above the chart: Total Views, Shortlists, Conversion %
- A 7 day / 30 day period toggle (segmented control)
- A conversion insight sentence below the chart:
  e.g. "1 in every 8 scouts who viewed your profile added you to a shortlist."
- Tooltips on press showing the values for that data point
- The gap between the two lines is the key visual story — shortlists always lower

---

## Step 1 — Install dependencies

Run the following and confirm they install without errors before writing any code:

```bash
npx expo install react-native-gifted-charts react-native-linear-gradient react-native-svg
```

`react-native-svg` may already be installed — that is fine, expo install will
skip it. Do not install `victory-native` or any other charting library.

---

## Step 2 — Create the component

Create the file at:

```
components/ScoutInterestChart.tsx
```

### Props interface

```typescript
export interface ChartDataPoint {
  date: string        // display label e.g. '1 Apr'
  views: number
  shortlists: number
}

interface Props {
  data30: ChartDataPoint[]   // 30 days of data
  data7: ChartDataPoint[]    // 7 days of data (subset)
}
```

### Component structure

The component renders top to bottom:

1. **Period toggle** — right-aligned row with two buttons: "7 days" and "30 days"
   - Active button: background from `Colors.card` or equivalent surface token,
     border colour from `Colors.textSecondary`, text `Colors.textPrimary`
   - Inactive button: transparent background, muted text

2. **Stat cards row** — three equal-width cards in a row with `gap: 10`
   Each card:
   - Background: `Colors.card` or surface token (slightly elevated from page bg)
   - Border radius: 8
   - Padding: 12
   - Label (12px, `Colors.textSecondary`): "Total views" / "Shortlists" / "Conversion"
   - Value (24px, weight 500, `Colors.textPrimary`): computed total or percentage
   - Sub-label (12px, `Colors.textSecondary`): "this period" / "this period" / "views → shortlist"

3. **Chart** — rendered using `react-native-gifted-charts` `LineChart` component
   - Height: 220
   - Two datasets passed via the `data` and `data2` props
   - Dataset 1 (Views):
     - color: `'#888780'` (muted grey)
     - dataPointsColor: `'#888780'`
     - dataPointsRadius: 3
     - thickness: 2
     - isSecondary: false
     - curved: true
   - Dataset 2 (Shortlists):
     - color: `'#1D9E75'` (brand green)
     - dataPointsColor: `'#1D9E75'`
     - dataPointsRadius: 4
     - thickness: 2
     - curved: true
   - x-axis labels: show the `date` string, max 7 labels visible regardless of
     period (use `xAxisLabelTexts` prop, skip every Nth label for 30 day view)
   - No built-in legend (we build our own — see below)
   - `spacing`: set so all data points fit within the component width
     (calculate as `(screenWidth - 64) / dataLength`)
   - `yAxisTextStyle`: `{ color: Colors.textSecondary, fontSize: 11 }`
   - `xAxisLabelTextStyle`: `{ color: Colors.textSecondary, fontSize: 11 }`
   - `rulesColor`: `'rgba(0,0,0,0.06)'` (light mode) — use a fixed value
   - `backgroundColor`: `'transparent'`
   - `initialSpacing`: 12
   - `endSpacing`: 12
   - Show a tooltip on press using the `onPress` callback — display a small
     absolute-positioned View with the views and shortlists values for that index

4. **Custom legend** — sits between the toggle and the stat cards, left-aligned
   Two items side by side:
   - Grey square (10×10, borderRadius 2) + "Views" label
   - Green square (10×10, borderRadius 2) + "Shortlists" label
   - The Views square should have a dashed border effect:
     use `borderStyle: 'dashed'` with `borderWidth: 2` and
     `borderColor: '#888780'` and transparent background instead of fill,
     or simply use a solid fill of `'#888780'` at 50% opacity if dashed
     borders look poor on device

5. **Conversion sentence** — below the chart
   - Thin top border: `0.5px solid Colors.border` (or equivalent)
   - Padding top: 12
   - Font size: 13, colour `Colors.textSecondary`
   - Bold the computed ratio: "1 in every **N**" using `<Text>` with
     `fontWeight: '500'` and `color: Colors.textPrimary` inline

### Computed values

```typescript
const totalViews = data.reduce((sum, d) => sum + d.views, 0)
const totalShortlists = data.reduce((sum, d) => sum + d.shortlists, 0)
const conversionPct = totalViews > 0
  ? Math.round((totalShortlists / totalViews) * 100)
  : 0
const conversionRatio = totalShortlists > 0
  ? Math.round(totalViews / totalShortlists)
  : null
```

### Data shaping for gifted-charts

`react-native-gifted-charts` expects data in this shape:

```typescript
const viewsData = activeData.map(d => ({ value: d.views, label: d.date }))
const shortlistsData = activeData.map(d => ({ value: d.shortlists }))
```

Pass `viewsData` as the primary `data` prop and `shortlistsData` as `data2`.

---

## Step 3 — Wire to Supabase

Create the file:

```
lib/queries/scout-interest.ts
```

Export this function:

```typescript
import { supabase } from '@/lib/supabase'

export interface ScoutInterestResult {
  data30: ChartDataPoint[]
  data7: ChartDataPoint[]
}

export async function fetchScoutInterest(
  playerProfileId: string
): Promise<ScoutInterestResult>
```

Implementation:

- Query `profile_views` table: select `viewed_at` for this `viewed_profile_id`
  where `viewed_at > NOW() - INTERVAL '30 days'`
- Query `watchlist_items` table: select `created_at` for this `player_id`
  where `created_at > NOW() - INTERVAL '30 days'`
- Group both result sets by day (use JS `Date` to extract `YYYY-MM-DD`)
- Build a full 30-day array where every day has a `views` and `shortlists`
  count (default 0 if no records for that day)
- Format the `date` label as `'D MMM'` (e.g. `'1 Apr'`) — implement this
  with vanilla JS, do not install a date library
- Derive `data7` as the last 7 items of `data30`
- Return `{ data30, data7 }`

---

## Step 4 — Add to profile screen

In `app/(tabs)/profile.tsx`:

- Import `ScoutInterestChart` and `fetchScoutInterest`
- Add state: `const [interestData, setInterestData] = useState<ScoutInterestResult | null>(null)`
- In the existing `useEffect` that loads profile data, after the player profile
  is fetched, call `fetchScoutInterest(playerProfile.id)` and set state
- Render `<ScoutInterestChart>` only when:
  1. The current user's role is `'player'` (not scout)
  2. `interestData` is not null
- Place it in the profile screen below the profile completion bar section
- Show a loading skeleton (a grey rounded rect, height 280) while data is fetching
- Section label above the chart: "SCOUT INTEREST" in the same style as other
  section labels on the profile screen

---

## Step 5 — Verify

Run `npx tsc --noEmit` — confirm zero TypeScript errors.

Open the app on a device or simulator and navigate to a player profile. The
chart section should render below the completion bar. Toggle between 7 and 30
days and confirm the chart and stat cards update correctly.

If `profile_views` or `watchlist_items` tables do not yet exist in Supabase,
the query will return empty arrays — the chart should still render with all
zeros rather than crashing. Confirm this works.

---

## Reference values (for testing with mock data)

```typescript
const mock30: ChartDataPoint[] = [
  { date: '1 Apr', views: 3,  shortlists: 0 },
  { date: '3 Apr', views: 5,  shortlists: 1 },
  { date: '5 Apr', views: 4,  shortlists: 0 },
  { date: '7 Apr', views: 8,  shortlists: 1 },
  { date: '9 Apr', views: 6,  shortlists: 1 },
  { date: '11 Apr', views: 11, shortlists: 2 },
  { date: '13 Apr', views: 7,  shortlists: 1 },
  { date: '15 Apr', views: 9,  shortlists: 1 },
  { date: '17 Apr', views: 13, shortlists: 3 },
  { date: '19 Apr', views: 10, shortlists: 1 },
  { date: '21 Apr', views: 8,  shortlists: 2 },
  { date: '23 Apr', views: 14, shortlists: 3 },
  { date: '25 Apr', views: 12, shortlists: 2 },
  { date: '27 Apr', views: 16, shortlists: 4 },
  { date: '29 Apr', views: 11, shortlists: 2 },
]
const mock7: ChartDataPoint[] = mock30.slice(-7)
```

Use these as default prop values or in a local dev toggle to confirm the chart
renders correctly before Supabase data is wired up.

---

## Notes for implementation

- Never hardcode colours — use `Colors` from `constants/theme.ts` except where
  a specific hex is specified above (`'#888780'` for grey, `'#1D9E75'` for green)
  because these are data encoding colours not theme colours
- The Anton font is not used in this component — it is a data visualisation,
  use the default font stack
- Do not install any date formatting library — implement day grouping and label
  formatting with vanilla JS
- If `react-native-gifted-charts` LineChart does not support `data2` in the
  installed version, use the `dataSet` array prop instead — check the installed
  version's API before writing chart code
- `useWindowDimensions` from react-native gives the screen width for spacing calc
