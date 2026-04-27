# Phase 4 — Fantasy Layer

> This is the most complex feature set and should only be started once Phases 1–3 are complete and core engagement is proven. This is a differentiating feature, not a foundation one.

---

## Feature 12: Fantasy Draft — In-App Activity Scoring

A fantasy football mechanic using in-app activity as the scoring engine, replacing real match stats which do not exist at grassroots level.

---

### The Grassroots Stats Problem

Traditional fantasy football relies on real match data — goals, assists, clean sheets, passing accuracy. None of this exists at grassroots level. Tranxfer Market's fantasy layer instead uses **in-app activity as a scoring proxy**:

- Players who are active on the platform score more points
- This creates a self-reinforcing loop: more activity → higher fantasy score → more desirable to draft → more motivation to stay active

---

### Migrations: `016_fantasy.sql`

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

---

### Scoring Engine

Implement as a Supabase Edge Function `functions/calculate-fantasy-scores` on a weekly cron trigger.

| Action | Points |
|---|---|
| Video uploaded | +10 |
| Profile viewed by a unique scout | +5 per scout |
| Connection accepted | +8 |
| Challenge submission | +12 |
| Endorsement received | +15 |
| Profile completion reached 100% | +20 (one-time) |

Score breakdown is stored in `fantasy_scores.breakdown` as JSONB for transparency.

---

### UI Requirements

- New screen: `app/(tabs)/fantasy.tsx` — add to `FloatingTabBar`
- **Draft screen:** browse players filterable by position, age, region; select up to 11 into your team
- **My Team screen:** drafted players with weekly score and cumulative total
- **Leaderboard:** weekly and all-time, top fantasy teams by total score
- Player card in fantasy context shows their current fantasy score alongside profile

---

### Card Tier Connection

Being drafted into a fantasy team unlocks the **Elite** card tier for the player. This creates aspiration — players want to be drafted, scouts and fans want to discover unnoticed talent early. The Elite card's holographic visual treatment makes it visibly desirable and worth sharing.
