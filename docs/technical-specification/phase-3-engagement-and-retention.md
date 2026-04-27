# Phase 3 — Engagement & Retention

> Build on top of a solid Phase 1 and 2 foundation. These features drive habitual return behaviour and give both players and scouts reasons to keep coming back.

---

## Feature 8: Video Upload — Skills Feed

Players upload short performance videos to their profile for scout discovery. This is the highest-effort feature technically.

### Infrastructure
- Supabase Storage bucket: `'videos'` — public read
- Supabase Storage bucket: `'thumbnails'` — public read

### Migration: `013_videos.sql`
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

### UI Requirements
- Upload via `expo-image-picker` with `mediaTypes: 'videos'`
- Enforce: max 90 seconds duration, max 200MB file size — client-side
- On upload: progress bar → thumbnail via `expo-video-thumbnails` → upload to Storage → insert row
- Playback via `expo-video` — inline on profile and feed
- Videos tab on player profile: grid layout
- Videos filterable in main feed via `'Videos'` toggle

---

## Feature 9: Profile Completion Gamification

Drives profile quality, which directly improves scout discovery.

### Scoring Function
```ts
function calculateCompletionScore(profile: ProfileWithRole): number
// Returns 0–100
```

| Field | Points |
|---|---|
| Profile picture uploaded | 20 |
| Full name | 10 |
| Position set (player) | 10 |
| Nationality set | 10 |
| Postcode set | 10 |
| At least one video uploaded | 20 |
| Bio / description written | 10 |
| Height set (player) | 5 |
| Preferred foot set (player) | 5 |

### UI Requirements
- Completion bar at top of profile (bar already scaffolded — wire the score now)
- Below bar: single most impactful next action — *"Upload a video to earn 20 more points"*
- At 100%: replace bar with **Profile Complete** badge in brand colour

---

## Feature 10: Weekly Challenges

Recurring prompts give players a reason to upload content regularly and give scouts a curated discovery surface.

### Migration: `014_challenges.sql`
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

### UI Requirements
- Active challenge banner at top of feed — between `FilterToggle` and card list
- Banner shows: title, description, days remaining, submission count
- Submit CTA triggers video upload flow with `challenge_id` pre-populated
- Challenge submissions viewable as a filtered feed

---

## Feature 11: Push Notifications — Full Wiring

The `notifications` table exists. Wire Expo Push Notifications for all key triggers.

### Migration: `015_push_tokens.sql`
```sql
CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  created_at timestamptz DEFAULT now()
);
```

Create a Supabase Edge Function `functions/send-push-notification` accepting `{ profile_id, title, body, data }`.

### Notification Triggers

| Event | Copy |
|---|---|
| Profile viewed by scout | *Your profile is getting attention — X scouts viewed it this week* |
| Connection request received | *[Name] wants to connect with you* |
| Connection request accepted | *[Name] accepted your connection* |
| New message received | *[Name]: [message preview]* |
| New challenge posted | *New challenge: [title] — submit your video now* |
| Endorsement request received (scout) | *[Player name] has requested your endorsement* |
| Endorsement accepted (player) | *[Scout name] has endorsed your profile* |
