# Phase 2 — Scout Tools

> Build Phase 1 fully before starting here. These features target your most engaged user type — freelance scouts — and make the platform indispensable to their workflow.

---

## Feature 5: Scout Watchlists / Shortlists

Scouts need to save, tag, and organise players, and share curated shortlists with clubs.

### Migration: `010_watchlists.sql`
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

### UI Requirements
- Bookmark icon on `PlayerCard` — visible only to users with `role = 'agent'`
- Tapping bookmark opens a bottom sheet: choose existing list or create a new named list
- New profile sub-section: **My Shortlists** — grouped by `list_name`
- Each watchlist item shows player card with scout's private notes
- Share button on a shortlist generates a read-only deep link showing player names, positions, and ages only — no contact details

---

## Feature 6: Scout Interest Signal (Player-Facing)

The single highest-engagement driver for players. They feel noticed without knowing who is watching.

### Migration: `011_profile_views.sql`
```sql
CREATE TABLE profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);
```

### Logic Requirements
- Insert a `profile_views` row whenever a user views another user's full profile
- Deduplicate: one view per viewer per 24-hour window
- Never log self-views

### UI Requirements
- Player profile shows: *"Your profile was viewed X times this week"*
- Sparkline or bar showing views per day over the last 7 days
- `viewer_id` must never be exposed in client queries — who viewed is always anonymous
- Positive trend indicator if views increased week-over-week: *"Up 40% vs last week"*
- Push notification when a scout views a player's profile

---

## Feature 7: Freelance Scout Portfolio

Freelance scouts need to demonstrate their track record. This is their professional credibility layer.

### Migration: `012_placements.sql`
```sql
CREATE TABLE placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  club_name text NOT NULL,
  season text,
  level text,
  notes text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### UI Requirements
- Placements section on agent/scout profile screen
- Scouts add placements manually — free text, not linked to profiles
- Displayed as a timeline on their public profile, visible to all authenticated users
- `verified = false` by default — shown with `Self-reported` label
- Future: club-confirmation flow to verify placements (out of scope for launch)
