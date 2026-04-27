# Feed

**File:** `app/(tabs)/feed.tsx`

The Feed is the primary discovery surface of the app. It displays cards for players, agents, and clubs that match the currently selected role filter.

## Current State

The feed screen is scaffolded and renders the `PlayerCard` component. **It is currently connected to stub/mock data** — connecting it to live Supabase data is the first priority in [Phase 1 of the roadmap](../roadmap/phase-1.md).

## Components Used

| Component | Purpose |
|---|---|
| `ScreenBackground` | Dark background with tiled texture |
| `ScreenHeader` | Logo + action icons at the top |
| `FilterToggle` | Segmented toggle: Player / Agent / Club |
| `PlayerCard` | Individual card for each profile in the feed |
| `FloatingTabBar` | Custom bottom nav pill |

## Planned Behaviour (Phase 1)

Once wired to Supabase, the feed will:

- Query the `profiles` table joined with the role-specific table (`player_profiles`, `agent_profiles`, or `club_profiles`)
- Filter by the role selected in `FilterToggle`
- Use **cursor-based pagination** — 20 records per page, load more on scroll to bottom
- Support **pull-to-refresh**
- Show a **loading skeleton** while data is fetching
- Show an **empty state** when no results match the current filter

## PlayerCard Data Shape

Each card will display:
- Full name
- Role badge
- Position (players only)
- Nationality
- Postcode district
- Profile picture (from `profiles.profile_picture_url`)
