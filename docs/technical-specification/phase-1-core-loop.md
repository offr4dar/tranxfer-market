# Phase 1 — Core Loop

> **Priority: Do this first.** Nothing in later phases should be started until all four features here are complete and tested. These are the minimum viable product.

---

## Feature 1: Feed → Real Data

The feed screen (`app/(tabs)/feed.tsx`) renders stub data. It must connect to live Supabase data.

### Requirements
- Query `profiles` joined with `player_profiles` or `club_profiles` based on the active filter
- Apply role filter from `FilterToggle` — values: `'player' | 'club'`
- Cursor-based pagination: 20 records per page, load more on scroll to bottom
- Each `PlayerCard` must display: name, role, position (if player), nationality, postcode district, `profile_picture_url`
- Loading skeleton while fetching
- Empty state when no results match
- Pull-to-refresh triggers a fresh query

### Query Shape
```sql
SELECT profiles.*, player_profiles.*
FROM profiles
LEFT JOIN player_profiles ON profiles.id = player_profiles.profile_id
WHERE profiles.role = :role
ORDER BY profiles.created_at DESC
LIMIT 20 OFFSET :cursor
```

### State Shape
```ts
{
  items: ProfileWithRole[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filter: 'player' | 'club';
  cursor: number;
}
```

---

## Feature 2: Profile Screen → Full & Editable

`app/(tabs)/profile.tsx` must display all onboarding data and allow editing.

### Requirements
- Display all role-specific fields from the relevant profile table
- Inline editing: tapping a field opens an edit modal or inline input
- On save, update `profiles` + the relevant role-specific table
- Profile picture: `expo-image-picker` → Supabase Storage bucket `'avatars'` → store URL in `profiles.profile_picture_url`
- Profile completion percentage bar (bar now, score wired in Phase 3)

### Role-Specific Fields
**Player:** full name, age, position, secondary position, nationality, postcode, preferred foot, height

**Scout:** full name, scout type (club-hired or freelance), club or agency affiliation (if applicable), licence number (if applicable), regions covered, years experience

---

## Feature 3: Connections System

No social graph currently exists. This underpins messaging, notifications, and scout interest signals.

### Migration: `009_connections.sql`
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

### RLS Policies
- **SELECT:** user sees connections where they are `requester_id` OR `receiver_id`
- **INSERT:** authenticated user can only insert where `requester_id = auth.uid()`
- **UPDATE:** receiver can update status; requester cannot change after sending
- **DELETE:** either party can delete

### UI Requirements
- Connect button on `PlayerCard` — visible only when viewing another user's card
- Button states: `Connect` → `Pending` → `Connected` / `Declined`
- Tapping Connect creates a `connections` row and triggers a notification to the receiver
- Connections section in profile: incoming requests (accept/decline) + existing connections

---

## Feature 4: Real-Time Messaging

Conversation screens are scaffolded but not wired to Supabase.

### Requirements
- `messages.tsx` queries `conversations` table joined with `profiles` for participant names and avatars
- `conversation/[id].tsx` queries `messages WHERE conversation_id = :id ORDER BY created_at ASC`
- Real-time via `supabase.channel().on('postgres_changes', ...)` filtered by `conversation_id`
- Sending a message inserts to `messages` and updates `conversations.last_message_at`
- Each message shows: sender avatar, name, body, timestamp, read receipt (boolean)
- Auto-scroll to bottom on new message
- Typing indicator via Supabase Realtime presence: `'X is typing...'`
- Messaging only available between connected users — check `connections` table before rendering compose input

---

## Immediate Next Steps (This Week)

| # | Task | Files |
|---|---|---|
| 1 | Wire `feed.tsx` to live Supabase data with role filtering and pagination | `app/(tabs)/feed.tsx`, `lib/queries/feed.ts` |
| 2 | Create connections table + Connect CTA on `PlayerCard` with all states | `supabase/migrations/009_connections.sql`, `components/PlayerCard.tsx`, `lib/queries/connections.ts` |
| 3 | Connect messaging to Supabase with real-time subscriptions | `app/(tabs)/messages.tsx`, `app/(tabs)/conversation/[id].tsx`, `lib/queries/messages.ts` |
| 4 | Add `profile_views` logging + surface anonymised count on profile screen | `supabase/migrations/011_profile_views.sql`, `app/(tabs)/profile.tsx`, `lib/queries/profile-views.ts` |
