# Player Card & Endorsement System

> Feature 13 — Part of Phase 3, with endorsement infrastructure feeding into Phase 2 scout tools.

---

## Overview

A FIFA Ultimate Team-inspired player card generated from each player's profile. Portrait format, visually tiered, shareable to social media. Every shared card is a brand impression for Tranxfer Market.

---

## Stat Categories — Scouting Language (Option A)

Six attributes rated 1–99 by endorsing scouts:

| Attribute | What It Measures |
|---|---|
| Technical | First touch, passing weight, finishing, dribbling under pressure |
| Physical | Pace, acceleration, stamina, strength, aerial ability |
| Tactical | Movement off ball, shape understanding, pressing triggers, positioning |
| Mental | Coachability, resilience, leadership, attitude under pressure |
| Creativity | Decision-making speed, risk-taking, reading situations instinctively |
| Potential | Forward-looking ceiling judgment — where could this player be in 2–3 years |

These categories were chosen specifically because they match the language scouts use in professional assessments, rather than FIFA's consumer-friendly categories. This reinforces platform credibility with the scouting community.

---

## Overall Rating Formula

```ts
function calculateOverallRating(stats: PlayerStats): number {
  const weights = {
    technical: 0.22,
    physical: 0.18,
    tactical: 0.20,
    mental: 0.18,
    creativity: 0.12,
    potential: 0.10,
  };
  return Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + stats[key] * w, 0)
  );
}
```

This is also implemented as a Postgres generated column on `player_profiles` for consistency.

---

## Card Tiers

| Tier | Visual Style | Unlock Condition |
|---|---|---|
| Standard | Silver/grey, muted | Profile created |
| Rising Star | Gold, warm amber glow | Profile 80%+ complete + at least 1 video uploaded |
| Scout Pick | Black & brand green `#00FF87`, teal glow | Saved to at least one scout watchlist |
| Elite | Deep navy, holographic purple, shimmer animation | Drafted into a fantasy team |

`card_tier` is stored in `player_profiles` and recalculated on: profile update, video upload, watchlist save, fantasy draft.

---

## Database Migrations

### `017_player_card.sql`
```sql
ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS stat_technical integer CHECK (stat_technical BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS stat_physical integer CHECK (stat_physical BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS stat_tactical integer CHECK (stat_tactical BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS stat_mental integer CHECK (stat_mental BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS stat_creativity integer CHECK (stat_creativity BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS stat_potential integer CHECK (stat_potential BETWEEN 1 AND 99),
  ADD COLUMN IF NOT EXISTS card_tier text DEFAULT 'standard'
    CHECK (card_tier IN ('standard','rising','scout','elite')),
  ADD COLUMN IF NOT EXISTS overall_rating integer GENERATED ALWAYS AS (
    ROUND(
      stat_technical * 0.22 +
      stat_physical * 0.18 +
      stat_tactical * 0.20 +
      stat_mental * 0.18 +
      stat_creativity * 0.12 +
      stat_potential * 0.10
    )
  ) STORED;

CREATE TABLE scout_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stat_technical integer CHECK (stat_technical BETWEEN 1 AND 99),
  stat_physical integer CHECK (stat_physical BETWEEN 1 AND 99),
  stat_tactical integer CHECK (stat_tactical BETWEEN 1 AND 99),
  stat_mental integer CHECK (stat_mental BETWEEN 1 AND 99),
  stat_creativity integer CHECK (stat_creativity BETWEEN 1 AND 99),
  stat_potential integer CHECK (stat_potential BETWEEN 1 AND 99),
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')),
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(scout_id, player_id)
);

CREATE TABLE endorsement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scout_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz DEFAULT now()
);
```

---

## Endorsement Flow

### Player Side
1. Player taps **Request Endorsement** on their profile
2. Player searches for a scout by name or email
3. Player writes an optional personal message
4. `endorsement_requests` row inserted with `status = 'pending'`
5. Scout receives push notification: *"[Player name] has requested your endorsement"*

### Scout Side
1. Scout receives notification and sees request in notifications tab
2. Scout taps to view player profile and videos
3. Scout accepts or declines
4. If accepted: scout rates each of the 6 attributes (1–99 sliders)
5. `scout_endorsements` row inserted; `player_profiles` stat columns updated
6. Player receives notification: *"[Scout name] has endorsed your profile"*
7. Scout's name appears on the player card with **Scout Verified** badge

### Scout Controls
- Scout can revoke at any time — sets `status = 'revoked'`, removes name from card
- Scout can update ratings if they want to revise

### RLS Policies
- `scout_endorsements` SELECT: player sees their own; public sees accepted endorsements without stat breakdown
- `scout_endorsements` INSERT/UPDATE: only the endorsing scout can write their own rows
- `endorsement_requests` SELECT: player sees their sent requests; scout sees requests directed at them

---

## Sharing Mechanic

- `react-native-view-shot` captures the card component as a PNG
- `expo-sharing` opens the native share sheet
- Card image includes a Tranxfer Market wordmark watermark bottom-right
- Optional: QR code linking to player's in-app profile via `react-native-qrcode-svg`
- Share button location: player profile screen, below card preview

---

## UI Components Required

| Component | File | Purpose |
|---|---|---|
| `PlayerCard` | `components/PlayerCard.tsx` | Card visual — accepts player data and tier |
| `CardShareButton` | `components/CardShareButton.tsx` | Captures and shares card as image |
| `EndorsementRequestModal` | `components/EndorsementRequestModal.tsx` | Scout search + message compose |
| `EndorsementRatingForm` | `components/EndorsementRatingForm.tsx` | Scout-facing attribute sliders |
| `StatRing` | `components/StatRing.tsx` | Circular progress ring for each stat |
| Card preview | `app/(tabs)/profile.tsx` | Embed card preview at top of player profile |
