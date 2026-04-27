# Search

**File:** `app/(tabs)/search.tsx`

The Search screen allows users to find specific players, agents, or clubs by name or attribute. It is currently scaffolded.

## Current State

The search interface is in place — the UI shell exists with a search input and results area. **Full Supabase query integration is pending** as part of the Phase 1 roadmap.

## Planned Behaviour

- Full-text search against `profiles.full_name`
- Filter results by role (Player / Agent / Club)
- Filter by position, nationality, and postcode district
- Results display using the same `PlayerCard` component as the Feed
- Debounced input — query fires 300ms after the user stops typing
- Empty state with helpful copy when no results are found
