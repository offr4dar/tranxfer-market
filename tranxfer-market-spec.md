# Tranxfer Market — Technical Development Specification

> Version 1.0 · April 2026 · Confidential

---

## 1. Overview

This document is a complete technical specification for AI-assisted code generation on the Tranxfer Market mobile application. It outlines every feature to be built, grouped into four phases by priority. Each section describes the purpose, data model changes, business logic, and component requirements in enough detail for an AI code generation tool (e.g. Claude, Cursor, GitHub Copilot) to produce working, production-ready code without additional context.

---

### 1.1 Technology Stack

All generated code must conform to the following stack. Do not introduce additional dependencies without explicit instruction.

| Layer | Technology / Version |
|---|---|
| Framework | Expo ~54 with Expo Router ~6 (file-based routing) |
| Language | TypeScript — strict mode |
| Auth | Clerk (`@clerk/clerk-expo` ^2) — email + OTP |
| Database | Supabase (`@supabase/supabase-js` ^2) — Postgres with RLS |
| Navigation | Expo Router Stack + custom `FloatingTabBar` |
| Animations | `react-native-reanimated` ~4, `expo-blur` |
| Styling | Vanilla React Native `StyleSheet` + `constants/theme.ts` design tokens |

---

### 1.2 What Has Already Been Built

The following are complete and should not be regenerated. Reference these when wiring up new features.

| Area | Detail | File(s) |
|---|---|---|
| Auth & Onboarding | Splash, welcome, sign-in, OTP verify, multi-step onboarding wizard (Player/Agent/Club), Supabase profile write on completion | `app/(auth)/*`, `app/splash.tsx` |
| Auth Guard | Redirects unauthenticated users; blocks signed-in users from auth screens | `app/_layout.tsx → AuthGuard` |
| Tab Screens | Feed, Search, Messages, Notifications, Profile, Conversation thread — all scaffolded | `app/(tabs)/*` |
| UI Components | ScreenBackground, ScreenHeader, FloatingTabBar, PlayerCard, FilterToggle, LoginOverlay, ConfirmCancelModal | `components/*` |
| Design Tokens | Colors (brand `#00FF87`, bg `#0A0F1E`), Spacing, Radius | `constants/theme.ts` |
| Database | 8 migrations applied: profiles, player_profiles, agent_profiles, club_profiles, messages, conversations, notifications, RLS policies | `supabase/migrations/*` |

---

### 1.3 Coding Conventions

All generated code must follow these conventions without exception:

- **TypeScript strict** — no implicit `any`, no non-null assertions without justification
- **Supabase queries via `lib/supabase.ts` singleton** — never instantiate a new client
- **RLS-aware** — all queries run as the authenticated user; never bypass RLS
- **Expo Router file-based routing** — new screens go in `app/(tabs)/` or `app/(modals)/`
- **Design tokens from `constants/theme.ts`** — never hardcode colours or spacing
- **Functional components with hooks only** — no class components
- **Error states and loading states required** on every data-fetching screen

---

## Phase 1 — Core Loop *(Do This First)*

Phase 1 makes the app functionally valuable. Nothing in later phases should be started until these four features are complete and tested. These are the minimum viable product.

---

### Feature 1: Feed → Real Data

The feed screen (`app/(tabs)/feed.tsx`) currently renders placeholder/stub data. It must be connected to live Supabase data.

#### Requirements

- Query the `profiles` table joined with `player_profiles`, `agent_profiles`, or `club_profiles` depending on the active filter
- Apply the role filter from `FilterToggle` — values: `'player' | 'agent' | 'club'`
- Implement cursor-based pagination: fetch 20 records per page, load more on scroll to bottom
- Each `PlayerCard` must display: name, role, position (if player), nationality, postcode district, `profile_picture_url`
- Show a loading skeleton while data is fetching
- Show an empty state with copy when no results match the filter
- Pull-to-refresh must trigger a fresh query

#### Supabase Query Shape

```sql
SELECT profiles.*, player_profiles.*
FROM profiles
LEFT JOIN player_profiles ON profiles.id = player_profiles.profile_id
WHERE profiles.role = :role
ORDER BY profiles.created_at DESC
LIMIT 20 OFFSET :cursor
```

#### State Shape (TypeScript)

```ts
{
  items: ProfileWithRole[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filter: 'player' | 'agent' | 'club';
  cursor: number;
}
```

---

### Feature 2: Profile Screen → Full & Editable

The profile screen (`app/(tabs)/profile.tsx`) currently only shows basic info and a sign-out button. It must become a complete, editable profile that reflects all onboarding data.

#### Requirements

- Display all role-specific fields from the relevant profile table
- Inline editing: tapping a field opens an edit modal or inline text input
- On save, update the relevant Supabase row (`profiles` + role-specific table)
- Profile picture: integrate `expo-image-picker` to allow upload to Supabase Storage bucket named `'avatars'`; store public URL in `profiles.profile_picture_url`
- Show a profile completion percentage bar (see Phase 3, Feature 9 for scoring logic — implement the bar now, wire the score later)
- Role-specific fields to display:
  - **Player:** full name, age, position, secondary position, nationality, postcode, preferred foot, height
  - **Agent/Scout:** full name, agency name, licence number (if applicable), regions covered, years experience

---

### Feature 3: Connections System

There is currently no way for users to connect. This is the social graph that underpins messaging, notifications, and scout interest signals.

#### Database Migration Required

Create `supabase/migrations/009_connections.sql`:

```sql
CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);
```

#### RLS Policies Required

- **SELECT:** user can see connections where they are `requester_id` OR `receiver_id`
- **INSERT:** authenticated user can only insert rows where `requester_id = auth.uid()`
- **UPDATE:** receiver can update status; requester cannot change status after sending
- **DELETE:** either party can delete (withdraw/remove connection)

#### UI Requirements

- Add a **Connect** button to `PlayerCard` — visible only when viewing another user's card
- Button states: `'Connect'` (default) | `'Pending'` (request sent) | `'Connected'` (accepted) | `'Declined'`
- Tapping Connect creates a `connections` row and triggers a notification to the receiver
- Connections screen or section in profile showing incoming requests (accept/decline) and existing connections

---

### Feature 4: Real-Time Messaging

The conversation screens exist but are not wired to Supabase. Messages must be real-time.

#### Requirements

- Wire `messages.tsx` to query the `conversations` table, joining `profiles` to show participant names and avatars
- Wire `conversation/[id].tsx` to query `messages WHERE conversation_id = :id ORDER BY created_at ASC`
- Subscribe to real-time changes using `supabase.channel().on('postgres_changes', ...)` on the `messages` table, filtered by `conversation_id`
- Sending a message inserts to `messages` table and updates `conversations.last_message_at`
- Messages must show: sender avatar, sender name, message body, timestamp, read receipt (boolean)
- Auto-scroll to bottom on new message
- Typing indicator: use Supabase Realtime presence to show `'X is typing...'`
- Only allow messaging between connected users (check `connections` table before rendering compose input)

---

## Phase 2 — Scout-Specific Features

Phase 2 targets your most engaged user type — scouts. These features serve their core workflow and make the platform indispensable to them. Build Phase 1 first.

---

### Feature 5: Scout Watchlists / Shortlists

Scouts need to save, tag, and organise players they are tracking — and share curated shortlists with clubs.

#### Database Migration Required

Create `supabase/migrations/010_watchlists.sql`:

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

#### UI Requirements

- Add a bookmark icon to `PlayerCard` — only visible to users with `role = 'agent'` or `'scout'`
- Tapping bookmark opens a bottom sheet: choose existing list or create a new named list
- New tab or profile sub-section: **My Shortlists** — grouped by `list_name`
- Each watchlist item shows player card with scout's private notes
- **Share button** on a shortlist: generates a read-only deep link (no auth required to view) showing player names, positions, and ages only — no contact details

---

### Feature 6: Scout Interest Signal (Player-Facing)

The single highest-engagement driver for players. They need to feel they are being noticed without knowing exactly who is watching.

#### Database Migration Required

Create `supabase/migrations/011_profile_views.sql`:

```sql
CREATE TABLE profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);
```

#### Logic Requirements

- Insert a `profile_views` row whenever a user views another user's full profile
- Deduplicate: only log one view per viewer per 24-hour window (use `viewed_at` to check)
- Do **NOT** log views of one's own profile

#### UI Requirements

- On the player's profile screen, show: *"Your profile was viewed X times this week"*
- Show a sparkline or simple bar showing views per day over the last 7 days
- Do **NOT** show who viewed — `viewer_id` must never be exposed in client queries for this feature
- If views increased week-over-week, show a positive trend indicator (*"Up 40% vs last week"*)
- Trigger a push notification when a scout views a player's profile (use Expo Push Notifications)

---

### Feature 7: Freelance Scout Portfolio

Freelance scouts build their reputation through successful placements. This feature is their professional credibility layer.

#### Database Migration Required

Create `supabase/migrations/012_placements.sql`:

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

#### UI Requirements

- Add a **Placements** section to the agent/scout profile screen
- Scouts can add a placement manually (player name, club, season, level — free text, not linked to profiles)
- Placements display as a timeline on their public profile, visible to all authenticated users
- `verified` field is `false` by default — future club-confirmation flow is out of scope for now
- Unverified placements show with a `'Self-reported'` label

---

## Phase 3 — Engagement & Retention

Phase 3 features drive repeat usage and create habitual return behaviour. Build on top of a solid Phase 1 and 2 foundation.

---

### Feature 8: Video Upload — Skills Feed

Players can upload short performance videos to their profile for scout discovery. This is the highest-effort item technically.

#### Infrastructure Requirements

- Create a Supabase Storage bucket named `'videos'` with public read access
- Create a Supabase Storage bucket named `'thumbnails'` with public read access

#### Database Migration Required

Create `supabase/migrations/013_videos.sql`:

```sql
CREATE TABLE player_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### UI Requirements

- Upload flow: use `expo-image-picker` with `mediaTypes: 'videos'`; enforce max duration 90 seconds and max file size 200MB client-side
- On upload: show progress bar; generate thumbnail via `expo-video-thumbnails`; upload video and thumbnail to Supabase Storage; insert `player_videos` row
- Video playback: use `expo-video` for inline playback on profile and feed
- Add a **Videos** tab to the player profile screen showing their uploaded videos in a grid
- Videos appear in a dedicated section of the main feed filterable by `'Videos'` toggle

---

### Feature 9: Profile Completion Gamification

A lightweight engagement mechanic that drives profile quality — which directly improves scout discovery.

#### Scoring Logic

Implement a pure TypeScript function `calculateCompletionScore(profile: ProfileWithRole): number` that returns 0–100 using the following weights:

| Field Completed | Points |
|---|---|
| Profile picture uploaded | 20 pts |
| Full name | 10 pts |
| Position set (player) | 10 pts |
| Nationality set | 10 pts |
| Postcode set | 10 pts |
| At least one video uploaded | 20 pts |
| Bio/description written | 10 pts |
| Height set (player) | 5 pts |
| Preferred foot set (player) | 5 pts |

#### UI Requirements

- Display completion percentage bar at top of profile screen (already scaffolded as a placeholder)
- Below the bar, show the single most impactful next action: e.g. *"Upload a video to earn 20 more points"*
- At 100%, replace the bar with a **Profile Complete** badge using brand colour

---

### Feature 10: Weekly Challenges

Recurring challenges give players a reason to upload content regularly and give scouts a curated discovery surface.

#### Database Migration Required

Create `supabase/migrations/014_challenges.sql`:

```sql
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

#### UI Requirements

- Show active challenge as a banner at the top of the feed (between `FilterToggle` and card list)
- Challenge banner shows: title, description, days remaining, submission count
- **Submit** CTA triggers the video upload flow with `challenge_id` pre-populated
- Challenge submissions viewable as a filtered feed: all videos tagged to the active challenge

---

### Feature 11: Push Notifications — Full Wiring

The `notifications` table exists. Wire up Expo Push Notifications for all meaningful triggers.

#### Setup Requirements

- Implement Expo Push Token registration on app load; store token in a `push_tokens` table

Create `supabase/migrations/015_push_tokens.sql`:

```sql
CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  created_at timestamptz DEFAULT now()
);
```

- Create a Supabase Edge Function `functions/send-push-notification` that accepts `{ profile_id, title, body, data }` and sends via Expo Push API

#### Trigger Events

| Trigger | Notification Copy |
|---|---|
| Profile viewed by scout | *Your profile is getting attention — X scouts viewed it this week* |
| Connection request received | *[Name] wants to connect with you* |
| Connection request accepted | *[Name] accepted your connection* |
| New message received | *[Name]: [message preview]* |
| New challenge posted | *New challenge: [title] — submit your video now* |

---

## Phase 4 — Fantasy / Gamification Layer

Phase 4 is the most complex feature set. It should only be started once Phases 1–3 are complete and the core platform has proven engagement. This is a differentiating feature, not a foundation one.

---

### Feature 12: Fantasy Draft — In-App Activity Scoring

A fantasy football mechanic using in-app activity as the scoring engine — replacing real match stats which don't exist at grassroots level.

#### Database Migrations Required

Create `supabase/migrations/016_fantasy.sql`:

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

#### Scoring Engine

Implement a Supabase Edge Function `functions/calculate-fantasy-scores` that runs on a weekly cron trigger using the following weights:

| Action | Points |
|---|---|
| Video uploaded | +10 pts |
| Profile viewed by a scout | +5 pts per unique scout |
| Connection accepted | +8 pts |
| Challenge submission | +12 pts |
| Endorsement received | +15 pts |
| Profile completion reached 100% | +20 pts *(one-time)* |

#### UI Requirements

- New screen: `app/(tabs)/fantasy.tsx` — add to `FloatingTabBar`
- **Draft screen:** browse players filterable by position, age, region; add up to 11 players to your team
- **My Team screen:** shows your drafted players, their weekly score, and total cumulative score
- **Leaderboard:** weekly and all-time, showing top fantasy teams by total score
- Player card in fantasy context shows their current fantasy score alongside their profile

---

## 2. Immediate Next Steps

The following four tasks should be executed in order this week. They are the minimum required to make the app functionally testable with real users.

| # | Task | File(s) to Create / Edit |
|---|---|---|
| 1 | Wire `feed.tsx` to live Supabase data with role filtering and cursor-based pagination | `app/(tabs)/feed.tsx`, `lib/queries/feed.ts` |
| 2 | Create connections table (migration 009) and add Connect CTA to `PlayerCard` with all button states | `supabase/migrations/009_connections.sql`, `components/PlayerCard.tsx`, `lib/queries/connections.ts` |
| 3 | Connect messaging screens to Supabase with real-time subscriptions via `supabase.channel()` | `app/(tabs)/messages.tsx`, `app/(tabs)/conversation/[id].tsx`, `lib/queries/messages.ts` |
| 4 | Add `profile_views` logging (migration 011) and surface anonymised view count on player profile screen | `supabase/migrations/011_profile_views.sql`, `app/(tabs)/profile.tsx`, `lib/queries/profile-views.ts` |

---

## 3. Instructions for AI Code Generation

When using this document as a prompt for an AI code generation tool (Claude, Cursor, Copilot, etc.), include the following context preamble with each request:

> I am building a React Native mobile app using Expo ~54, Expo Router ~6, TypeScript, Clerk for auth, and Supabase for database/storage. The app is a football recruitment platform with three user roles: player, agent (scout), and club. The `lib/supabase.ts` file exports a singleton Supabase client. Design tokens are in `constants/theme.ts`. Never hardcode colours. Always handle loading and error states. Follow React Native StyleSheet patterns. Do not use any web-only APIs.

Then reference the relevant section of this document for the specific feature you want generated. For example:

- *"Implement Phase 1, Feature 3 — Connections System as described in the spec"*
- *"Generate the Supabase migration for Phase 2, Feature 6 — Profile Views"*
- *"Build the UI for Phase 3, Feature 9 — Profile Completion Gamification"*

> **Important:** Always generate the Supabase migration SQL first, then the TypeScript query functions in `lib/queries/`, then the React Native screen/component. This order prevents type errors and ensures the data layer exists before the UI references it.
