# Phase 4 — Fantasy / Gamification Layer

Phase 4 is the most complex and differentiated feature set. It should only be started once Phases 1–3 are complete and the core platform has proven engagement.

> **This is a differentiating feature, not a foundation one.**

---

## Feature 12: Fantasy Draft — In-App Activity Scoring

A fantasy football mechanic that uses **in-app activity** as the scoring engine — replacing real match stats, which don't exist at grassroots level.

**New migration:** `supabase/migrations/016_fantasy.sql`

### Tables

```sql
CREATE TABLE fantasy_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  season text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE fantasy_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  picked_at timestamptz DEFAULT now(),
  dropped_at timestamptz
);

CREATE TABLE fantasy_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week integer NOT NULL,
  score integer DEFAULT 0,
  breakdown jsonb,
  calculated_at timestamptz DEFAULT now()
);
```

### Scoring Engine

A Supabase Edge Function `functions/calculate-fantasy-scores` runs on a weekly cron trigger:

| Action | Points |
|---|---|
| Video uploaded | +10 pts |
| Profile viewed by a scout | +5 pts per unique scout |
| Connection accepted | +8 pts |
| Challenge submission | +12 pts |
| Endorsement received | +15 pts |
| Profile completion reached 100% | +20 pts *(one-time)* |

### UI Requirements

- New screen: `app/(tabs)/fantasy.tsx` — add to `FloatingTabBar`
- **Draft screen:** browse players by position, age, region; add up to 11 to your team
- **My Team screen:** drafted players with weekly and cumulative scores
- **Leaderboard:** weekly and all-time, ranked by total score
- Fantasy player cards show the player's current fantasy score alongside their profile
