# Phase 2 — Scout-Specific Features

Phase 2 targets the most engaged user type: **scouts**. These features serve their core workflow and make the platform indispensable.

> **Prerequisite:** Phase 1 must be complete before starting Phase 2.

---

## Feature 5: Scout Watchlists / Shortlists

**Status:** 🔴 Not started

Scouts need to save, tag, and organise players they are tracking — and share curated shortlists with clubs.

**New migration:** `supabase/migrations/010_watchlists.sql`

```sql
CREATE TABLE watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  list_name text NOT NULL DEFAULT 'Default',
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  UNIQUE(scout_id, player_id)
);
```

**UI Requirements:**
- Bookmark icon on `PlayerCard` — visible to agents/scouts only
- Bottom sheet to choose or create a named list
- **My Shortlists** section on profile — grouped by `list_name`
- Share button generates a read-only deep link (name, position, age — no contact details)

---

## Feature 6: Scout Interest Signal (Player-Facing)

**Status:** 🔴 Not started

The single highest-engagement driver for players — they can feel they are being noticed without knowing who is watching.

**New migration:** `supabase/migrations/011_profile_views.sql`

**UI Requirements:**
- *"Your profile was viewed X times this week"* on the player's profile screen
- Sparkline or bar chart — views per day over the last 7 days
- Positive trend indicator if views increased week-over-week
- **Never** expose `viewer_id` — anonymity is enforced by policy
- Push notification when a scout views a player's profile

---

## Feature 7: Freelance Scout Portfolio

**Status:** 🔴 Not started

Freelance scouts build credibility through placement history. This is their professional credibility layer.

**New migration:** `supabase/migrations/012_placements.sql`

**UI Requirements:**
- **Placements** section on the agent/scout profile screen
- Scouts add placements manually (player name, club, season, level — free text)
- Displayed as a timeline on their public profile
- `verified: false` by default — shown with a `'Self-reported'` label
