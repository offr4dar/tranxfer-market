# Tranxfer Market — Dev Bot Instructions
## Immediate Action Items

> Paste this document into your AI code generation tool (Claude, Cursor, Copilot) along with the context preamble below. Work through each task in order — do not start a later task until the previous one is complete and tested.

---

## Context Preamble (include with every prompt)

```
I am building a React Native mobile app called Tranxfer Market using Expo ~54, 
Expo Router ~6, TypeScript, Clerk for auth (@clerk/clerk-expo ^2), and Supabase 
for database/storage (@supabase/supabase-js ^2). 

The app is a football recruitment platform with two user roles: player and scout. 
Scouts have a sub-type stored in scout_profiles.scout_type: 'club_scout' or 
'freelance_scout'. The lib/supabase.ts file exports a singleton Supabase client. 
Design tokens are in constants/theme.ts. 

Key conventions:
- Never hardcode colours or spacing — always use constants/theme.ts tokens
- Always handle loading and error states on every data-fetching screen
- Follow React Native StyleSheet patterns — no inline styles
- Functional components with hooks only
- TypeScript strict — no implicit any
- All Supabase queries use the singleton from lib/supabase.ts

The Anton_400Regular font is loaded globally. Use fontFamily: 'Anton_400Regular' 
for display text. All other text uses default RN font stack.

User IDs come from Clerk (useAuth().userId) and are TEXT type in Supabase — not UUID.

Note: The existing codebase references agent_profiles and agent_type in some 
places. These are being migrated to scout_profiles and scout_type. Treat any 
reference to agent_profiles as scout_profiles and agent_type as scout_type.
```

---

## Task 0 — Migrate agent_profiles to scout_profiles

**Why first:** The existing schema uses `agent_profiles` and `agent_type` with three sub-types including `independent_agent`. The product direction has been confirmed: agents are out of scope. The two roles are player and scout, with scout sub-types of `club_scout` and `freelance_scout`. This migration must happen before any other tasks.

**Prompt to use:**

```
Using the context preamble above, create a Supabase SQL migration file called 
009_rename_agent_to_scout.sql that:

1. Renames the agent_profiles table to scout_profiles
2. Renames the agent_type column to scout_type
3. Updates the scout_type CHECK constraint to only allow: 'club_scout', 'freelance_scout'
   (removing 'independent_agent' and 'scouting_network')
4. Updates any views that reference agent_profiles (specifically user_display_names) 
   to reference scout_profiles instead
5. Updates any RLS policies referencing agent_profiles to reference scout_profiles
6. Updates the profiles.role CHECK constraint to allow 'player' | 'scout' | 'club'
   (removing 'agent')

After the SQL migration, update all TypeScript references:
- Search the entire codebase for 'agent_profiles' and replace with 'scout_profiles'
- Search for 'agent_type' and replace with 'scout_type'
- Search for role === 'agent' and replace with role === 'scout'
- Update types/index.ts ScoutProfile type accordingly
- Update onboarding.tsx Step 1 role selection to show 'Scout' not 'Agent/Scout'
- Update onboarding.tsx Step 2 sub-type options to show 
  'Club Scout' (value: 'club_scout') and 'Freelance Scout' (value: 'freelance_scout')
  removing the 'Independent Agent' option entirely
```

**Files to edit:** `supabase/migrations/009_rename_agent_to_scout.sql`, `types/index.ts`, `app/(auth)/onboarding.tsx`, any file referencing `agent_profiles` or `role === 'agent'`

**Test:** Run `npx tsc --noEmit`. Confirm zero type errors. Verify in Supabase Dashboard that `scout_profiles` table exists and `agent_profiles` does not.

---

## Task 1 — Tighten RLS Policies

**Why:** The current RLS policies in migration 008 use `USING (true)` everywhere, meaning any user can read and write any row. Before adding connections, endorsements, or anything sensitive, this needs to be scoped properly.

**Prompt to use:**

```
Using the context preamble above, create a new Supabase SQL migration file called 
010_rls_tighten.sql that replaces the open RLS policies from migration 008 with 
properly scoped ones.

The Supabase project uses Clerk for auth. The user_id columns in player_profiles 
and scout_profiles store Clerk user IDs as TEXT (not UUID). There is no 
auth.uid() mapping to these — the app passes userId from Clerk via the anon key.

Because the mobile app uses the anon key (not a JWT that Supabase can validate 
against auth.uid()), RLS policies cannot use auth.uid() directly. The correct 
approach is:

1. For player_profiles and scout_profiles:
   - SELECT: USING (true) — profiles are semi-public (it's a marketplace)
   - INSERT: WITH CHECK (true) — client passes their own user_id; acceptable for now
   - UPDATE: USING (true) — acceptable for now; add user_id check when JWT auth is wired
   - DELETE: not permitted (no delete policy)

2. For messages:
   - SELECT: USING (true) — participants need to read
   - INSERT: WITH CHECK (true) — sender_id is set by client
   - UPDATE: allow marking read — USING (true)
   - DELETE: not permitted

3. For conversations:
   - SELECT: USING (true)
   - INSERT: WITH CHECK (true)
   - UPDATE: USING (true) — needed for last_message_at updates
   - DELETE: not permitted

4. For notifications:
   - SELECT: USING (true)
   - UPDATE: USING (true) — needed for marking read
   - INSERT: not permitted from client (server only)
   - DELETE: not permitted

Drop all existing policies from migration 008 before creating new ones. 
Include comments explaining each policy decision.
```

**Where to put the file:** `supabase/migrations/010_rls_tighten.sql`

**Test:** Run in Supabase Dashboard → SQL Editor. Confirm no errors and that the app still loads feed and profile data correctly.

---

## Task 2 — Fix PlayerProfile Type Mismatch

**Why:** `components/PlayerCard.tsx` defines its own local `PlayerProfile` type with `first_name` / `last_name` split fields. `types/index.ts` uses `full_name` as a single field. The `feed.tsx` query also selects `first_name` and `last_name` separately. The `types/index.ts` definition needs to match reality.

**Prompt to use:**

```
Using the context preamble above, update types/index.ts to fix the PlayerProfile 
interface so it matches the actual Supabase schema and what is queried in 
app/(tabs)/feed.tsx and components/PlayerCard.tsx.

The actual player_profiles table columns are:
id, user_id (TEXT), first_name, last_name, age, nationality, preferred_foot, 
primary_position, secondary_positions (TEXT[]), current_club, league_level, 
contract_status, available_from, height_cm, weight_kg, appearances, goals, 
assists, clean_sheets, bio, profile_photo_url, highlight_reel_url, is_verified, 
is_featured, is_searchable, profile_completion_score, created_at, updated_at

The PlayerCard component uses: id, user_id, first_name, last_name, primary_position, 
secondary_positions, age, current_club, contract_status, nationality, is_verified, 
is_featured, appearances, goals, assists

The ContractStatus type in types/index.ts should match the one already defined 
in components/PlayerCard.tsx:
'available_now' | 'available_eot' | 'under_contract' | 'trial' | null | undefined

Update types/index.ts with the corrected PlayerProfile interface. Do not change 
any other types. Do not change components/PlayerCard.tsx — it already works correctly.
After updating types/index.ts, update the import in components/PlayerCard.tsx to 
import PlayerProfile from types/index.ts instead of defining it locally.
```

**Files to edit:** `types/index.ts`, `components/PlayerCard.tsx`

**Test:** Run `npx tsc --noEmit` — confirm zero type errors.

---

## Task 3 — Wire the SHORTLIST Button

**Why:** The SHORTLIST button in `PlayerCard` has no `onPress` handler. This is the most visible dead end in the UI. Before building the full watchlist system (Phase 2), we need a placeholder flow that at minimum creates a watchlist record in Supabase.

**Step 3a — Create the migration first:**

```
Using the context preamble above, create a Supabase SQL migration file called 
011_watchlists.sql that creates the following table:

CREATE TABLE watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id TEXT NOT NULL,  -- Clerk user_id of the scout
  player_id uuid REFERENCES player_profiles(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL DEFAULT 'My Shortlist',
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scout_id, player_id)
);

Add RLS policies:
- SELECT: USING (true) — scouts can read all shortlist items for now
- INSERT: WITH CHECK (true)
- DELETE: USING (true)
- UPDATE: USING (true)

Enable RLS on the table.
```

**Step 3b — Wire the button:**

```
Using the context preamble above, update components/PlayerCard.tsx to wire up 
the SHORTLIST button.

Current state: the SHORTLIST TouchableOpacity has no onPress handler.

Required behaviour:
- The SHORTLIST button should only be visible when scoutId prop is provided
  (i.e. the viewing user is a scout)
- Tapping SHORTLIST should insert a row into the watchlist_items table with:
  - scout_id: the current Clerk userId (pass this as a prop: scoutId?: string)
  - player_id: the player's id
  - list_name: 'My Shortlist' (default)
- If the insert succeeds, change the button text to 'SHORTLISTED' and change its 
  colour to Colors.brand
- If the row already exists (UNIQUE constraint violation), also show 'SHORTLISTED'
- Handle the loading state — disable the button while the insert is in progress
- If scoutId is not provided (undefined), hide the SHORTLIST button entirely

Add scoutId as an optional prop to the PlayerCard component:
  interface Props {
    player: PlayerProfile
    onPress?: () => void
    scoutId?: string
  }

Update feed.tsx to pass the current userId as scoutId to each PlayerCard, 
but only when the current user's role is 'scout'.
```

**Files to edit:** `supabase/migrations/011_watchlists.sql`, `components/PlayerCard.tsx`, `app/(tabs)/feed.tsx`

---

## Task 4 — Connections System

**Why:** Players and scouts currently have no way to connect. This is the social graph that gates messaging and unlocks the endorsement request flow.

**Step 4a — Migration:**

```
Using the context preamble above, create a Supabase SQL migration file called 
012_connections.sql with the following:

CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,   -- Clerk user_id
  receiver_id TEXT NOT NULL,    -- Clerk user_id
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

CREATE INDEX idx_connections_receiver ON connections(receiver_id, status);
CREATE INDEX idx_connections_requester ON connections(requester_id, status);

RLS policies:
- SELECT: USING (true) — both parties need to see the connection
- INSERT: WITH CHECK (true)
- UPDATE: USING (true) — receiver updates status
- DELETE: USING (true) — either party can remove

Add an updated_at trigger using the existing handle_updated_at() function.
```

**Step 4b — Connect button on PlayerCard:**

```
Using the context preamble above, add a Connect button to components/PlayerCard.tsx.

The Connect button should:
- Appear below the SHORTLIST button area
- Only show when viewerUserId prop is provided AND viewerUserId !== player.user_id
  (never show on your own card)
- Query the connections table on mount to check existing connection status between 
  viewerUserId and player.user_id
- Show one of four states:
  - 'CONNECT' — no connection exists (default, white outlined button)
  - 'PENDING' — connection request sent, awaiting response (muted, disabled)
  - 'CONNECTED' — connection accepted (brand green, disabled)
  - 'DECLINED' — request was declined (muted, disabled)
- Tapping CONNECT inserts a connections row with:
  - requester_id: viewerUserId
  - receiver_id: player.user_id
  - status: 'pending'
- After insert, update button state to 'PENDING'
- Disable the button during the insert operation

Add viewerUserId as an optional prop to PlayerCard:
  interface Props {
    player: PlayerProfile
    onPress?: () => void
    scoutId?: string
    viewerUserId?: string
  }

Update feed.tsx to pass userId as viewerUserId to each PlayerCard.
```

**Files to create/edit:** `supabase/migrations/012_connections.sql`, `components/PlayerCard.tsx`, `app/(tabs)/feed.tsx`

---

## Task 5 — Profile Views Logging

**Why:** This is the highest single-impact engagement feature for players. When a scout views their profile, the player sees an anonymised count. It drives habitual return visits.

**Step 5a — Migration:**

```
Using the context preamble above, create a Supabase SQL migration file called 
013_profile_views.sql:

CREATE TABLE profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id TEXT NOT NULL,          -- Clerk user_id of person viewing
  viewed_profile_id uuid NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_views_player ON profile_views(viewed_profile_id, viewed_at DESC);

RLS:
- SELECT: USING (true)
- INSERT: WITH CHECK (true)
- No UPDATE or DELETE from client
```

**Step 5b — Log views and surface count:**

```
Using the context preamble above, make two changes:

CHANGE 1 — Log profile views
Create a new file lib/queries/profile-views.ts that exports:

async function logProfileView(viewerId: string, playerProfileId: string): Promise<void>

This function should:
- Check if a view already exists from this viewer for this player in the last 24 hours
  by querying profile_views WHERE viewer_id = viewerId AND viewed_profile_id = playerProfileId 
  AND viewed_at > NOW() - INTERVAL '24 hours'
- If no recent view exists, insert a new profile_views row
- Never throw — wrap in try/catch and fail silently
- Never log a view if viewerId matches the player's own user_id

CHANGE 2 — Surface view count on profile screen
Update app/(tabs)/profile.tsx to show the player's weekly profile view count.

For players only, below the profile completion section, add a new section showing:
- Title: "SCOUT INTEREST" in the same sectionLabel style
- Count: number of profile_views rows for this player's id in the last 7 days
- Display as: "Viewed [N] time[s] this week"
- If 0 views: "No views yet — complete your profile to appear in more searches"
- Do NOT show who viewed — only the count
- Query: SELECT COUNT(*) FROM profile_views 
  WHERE viewed_profile_id = [player profile id] 
  AND viewed_at > NOW() - INTERVAL '7 days'

Also update the notifications type CHECK constraint in migration 006 to include 
'connection_request' and 'endorsement_request' as valid notification types — 
create a new migration 014_notification_types.sql for this.
```

**Files to create/edit:** `supabase/migrations/013_profile_views.sql`, `lib/queries/profile-views.ts`, `app/(tabs)/profile.tsx`, `supabase/migrations/014_notification_types.sql`

---

## Task 6 — get_user_conversations RPC Verification

**Why:** `messages.tsx` calls `supabase.rpc('get_user_conversations')`. This RPC is defined in migration 005, but verify it exists and works before assuming messages work end to end.

**Prompt to use:**

```
The Supabase database should have a function called get_user_conversations 
defined in migration 005_messages.sql. 

Please verify the function exists by running this in Supabase SQL Editor:
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_name = 'get_user_conversations';

If it does not exist, re-run the function definition from migration 005.

Also confirm the user_display_names view exists:
  SELECT table_name FROM information_schema.views 
  WHERE table_name = 'user_display_names';

If the view does not exist, re-run the view definition from migration 005.
Note: if you have just run migration 009 (rename agent_profiles to scout_profiles), 
the user_display_names view will need to be recreated to reference scout_profiles.

These are manual verification steps — no code changes needed unless the 
objects are missing from the database.
```

**This is a Supabase Dashboard task, not a code task.**

---

## Order of Execution

| # | Task | Type | Blocks |
|---|---|---|---|
| 0 | Migrate agent_profiles → scout_profiles | SQL + TypeScript | Everything — do first |
| 1 | Tighten RLS policies | SQL migration | Nothing else blocked, but do early |
| 2 | Fix type mismatch | TypeScript | Type safety for all future work |
| 3 | Wire SHORTLIST button | SQL + component | Scout watchlist feature |
| 4 | Connections system | SQL + component | Messaging gate, endorsements |
| 5 | Profile views logging | SQL + query + UI | Player engagement loop |
| 6 | Verify get_user_conversations RPC | Dashboard check | Messaging works end to end |

---

## Notes for the Dev Bot

- Always run `npx tsc --noEmit` after TypeScript changes to verify no type errors
- Run each SQL migration in Supabase Dashboard → SQL Editor individually — do not batch them
- After each migration, verify the table exists in Supabase Dashboard → Table Editor before writing app code that references it
- The `user_id` fields in all tables are `TEXT` (Clerk IDs), not `UUID` — do not cast them
- The Anton font is `Anton_400Regular` — this is the only custom font loaded
- Hardcoded colours like `'#00FF87'` exist in some older files — do not replicate this pattern; always use `Colors.brand` from `constants/theme.ts`
- There are no agents on this platform. If you see role === 'agent' anywhere, it should be role === 'scout'
