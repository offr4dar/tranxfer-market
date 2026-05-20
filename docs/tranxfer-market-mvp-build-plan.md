# Tranxfer Market — MVP Build Plan (Phase 1: Players Only)

## Overview

This document contains sequenced build tasks for the MVP release of Tranxfer Market. The MVP is **players only** — they can create accounts, build profiles, upload media (photos + videos), log performance data, and browse a feed. Scouts/Agents are visible during onboarding but **not available** ("Coming Soon").

All tasks are designed to be executed via **Claude Code** in the repo. Each task includes a context preamble, the prompt to paste, files affected, and a verification step.

---

## Services Required for MVP

| Service | Purpose | Tier |
|---------|---------|------|
| **Clerk** | Authentication, user management | Free |
| **Supabase** | Database, RLS, Realtime | Free |
| **Mux** | Video upload, transcoding, CDN delivery, thumbnails | Pay-as-you-go ($20 free credit) |
| **Supabase Storage** | Profile photos (PFP) | Included with Supabase free tier |

---

## Context Preamble (include with every Claude Code prompt)

```
I am building a React Native mobile app called Tranxfer Market using Expo ~54,
Expo Router ~6, TypeScript, Clerk for auth (@clerk/clerk-expo ^2), and Supabase
for database/storage (@supabase/supabase-js ^2).

The app is a football recruitment platform. The MVP is players-only. Scouts and
agents are deferred to Phase 2. The scout/agent option is visible during
onboarding but disabled with a "Coming Soon" label.

Video hosting uses Mux (API-first video platform). Videos upload directly from
the device to Mux via signed upload URLs. Supabase stores only the Mux asset ID,
playback ID, and metadata. Mux handles transcoding, storage, and CDN delivery.
Profile photos use Supabase Storage.

The lib/supabase.ts file exports a singleton Supabase client.
Design tokens are in constants/theme.ts.

Key conventions:
- Never hardcode colours or spacing — always use constants/theme.ts tokens
- Always handle loading and error states on every data-fetching screen
- Follow React Native StyleSheet patterns — no inline styles
- Functional components with hooks only
- TypeScript strict — no implicit any
- All Supabase queries use the singleton from lib/supabase.ts
- The Anton_400Regular font is loaded globally for display text
- All other text uses default RN font stack

User IDs come from Clerk (useAuth().userId) and are TEXT type in Supabase — not UUID.

Note: The existing codebase references agent_profiles and agent_type in some
places. These are being migrated to scout_profiles and scout_type. Treat any
reference to agent_profiles as scout_profiles and agent_type as scout_type.

Existing player_profiles table columns:
id (UUID PK), user_id (TEXT), first_name, last_name, date_of_birth (DATE),
nationality, preferred_foot, primary_position, secondary_positions (TEXT[]),
current_club, league_level, contract_status, available_from, height_cm,
weight_kg, appearances, goals, assists, clean_sheets, bio, profile_photo_url,
highlight_reel_url, is_verified, is_featured, is_searchable,
profile_completion_score, created_at, updated_at

Existing migrations: 001 (initial schema) through 008 (mobile RLS policies).
All RLS policies currently use USING(true) as a dev workaround.
```

---

## Task Sequence

### Pre-flight: Tasks 0–2 (Foundation fixes from previous spec)
### Core MVP: Tasks 3–10 (New functionality)

---

## Task 0 — Migrate agent_profiles to scout_profiles

**Why first:** The existing schema uses `agent_profiles` and `agent_type` with values including `independent_agent` and `scouting_network`. The product direction is confirmed: two roles only (player and scout), with scout sub-types `club_scout` and `freelance_scout`. Plus we're now adding `agent` (no scouting) and `agent_scout` (hybrid) for Phase 2.

**Prompt:**

```
Using the context preamble above, create a Supabase SQL migration file called
009_rename_agent_to_scout.sql that:

1. Renames the agent_profiles table to scout_profiles
2. Renames the agent_type column to scout_type
3. Updates the scout_type CHECK constraint to allow: 'scout', 'agent',
   'agent_scout' (removing 'independent_agent' and 'scouting_network')
4. Updates any views that reference agent_profiles (specifically
   user_display_names) to reference scout_profiles instead
5. Updates any RLS policies referencing agent_profiles to reference scout_profiles
6. Renames any indexes or triggers that reference agent_profiles

Also update all application code:
- Search the entire codebase for 'agent_profiles' and replace with 'scout_profiles'
- Search for 'agent_type' and replace with 'scout_type'
- Update types/index.ts if it references agent types

Where to put the file: supabase/migrations/009_rename_agent_to_scout.sql
```

**Files affected:** `supabase/migrations/009_rename_agent_to_scout.sql`, `types/index.ts`, any `.tsx` files referencing agent_profiles

**Verify:** Run migration in Supabase SQL Editor. Confirm no errors. Run `npx tsc --noEmit`.

---

## Task 1 — Fix PlayerProfile Type Mismatch

**Why:** `PlayerCard.tsx` defines a local `PlayerProfile` type with `first_name`/`last_name`. `types/index.ts` uses `full_name`. The actual schema uses `first_name`/`last_name`. Types must match reality.

**Prompt:**

```
Using the context preamble above, update types/index.ts to fix the PlayerProfile
interface so it matches the actual Supabase schema.

The ContractStatus type should be:
'available_now' | 'available_eot' | 'under_contract' | 'trial' | null | undefined

Update types/index.ts with the corrected PlayerProfile interface. Then update
components/PlayerCard.tsx to import PlayerProfile from types/index.ts instead
of defining it locally. Remove the local type definition from PlayerCard.tsx.

Do not change any component logic — only types and imports.
```

**Files affected:** `types/index.ts`, `components/PlayerCard.tsx`

**Verify:** `npx tsc --noEmit` — zero type errors.

---

## Task 2 — Onboarding: Disable Scout/Agent Option with "Coming Soon"

**Why:** The MVP is players-only. Scouts and agents can see their option exists but cannot proceed. This signals something is coming for them.

**Prompt:**

```
Using the context preamble above, update the onboarding role selection screen
(check app/(auth)/onboarding.tsx or similar) so that:

1. The "Player" option works as normal — tapping it proceeds to player onboarding
2. The "Scout" / "Agent" option (or whatever the non-player option is called)
   is visually present but DISABLED:
   - Greyed out / reduced opacity (0.5)
   - Shows a "Coming Soon" badge overlaid on the option
   - Tapping it does nothing (or shows a brief toast: "Scout & Agent profiles
     are coming soon!")
   - The badge should use the brand green from theme.ts with black text,
     small pill shape, positioned at the top-right corner of the option card

The goal is that scouts/agents who download the app can see their role is
planned, even though they can't create a profile yet.

Do not remove any existing scout/agent code paths — just gate the entry point.
```

**Files affected:** `app/(auth)/onboarding.tsx` or equivalent role selection screen

**Verify:** Open app → onboarding → confirm player works, scout/agent shows "Coming Soon" and is not tappable.

---

## Task 3 — Mux Integration: Backend Setup

**Why:** Video is core to the player profile. We need a backend endpoint that generates Mux signed upload URLs, and a webhook handler for when Mux finishes processing.

**Prompt:**

```
Using the context preamble above, set up the Mux video integration backend.

We need two Supabase Edge Functions (or if the project doesn't use Edge Functions,
create a lightweight API route pattern — check what already exists):

1. **generate-upload-url**
   - Accepts: POST with { user_id: string, type: 'feed' | 'featured' }
   - Uses the Mux Node SDK (@mux/mux-node) to create a direct upload URL
   - new_asset_settings should include:
     - playback_policies: ['public']
     - video_quality: 'basic' (cheapest tier, fine for football clips)
     - max_resolution_tier: '1080p'
   - Returns: { uploadUrl: string, uploadId: string }
   - Store MUX_TOKEN_ID and MUX_TOKEN_SECRET as environment variables

2. **mux-webhook**
   - Listens for Mux webhook events
   - On 'video.asset.ready':
     - Extract asset_id, playback_id, duration, and thumbnail URL
     - Update the corresponding record in a new `player_media` table (see below)
     - Set status to 'ready'
   - On 'video.asset.errored':
     - Update status to 'failed'
   - Verify webhook signature using Mux's signing secret

3. **New migration: 010_player_media.sql**
   Create a `player_media` table:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id: TEXT NOT NULL (Clerk ID)
   - media_type: TEXT NOT NULL CHECK (media_type IN ('video', 'photo'))
   - mux_asset_id: TEXT (null for photos)
   - mux_playback_id: TEXT (null for photos)
   - mux_upload_id: TEXT (null for photos)
   - storage_path: TEXT (null for videos — used for Supabase Storage photos)
   - thumbnail_url: TEXT
   - duration_seconds: NUMERIC
   - status: TEXT NOT NULL DEFAULT 'processing'
     CHECK (status IN ('processing', 'ready', 'failed'))
   - is_featured: BOOLEAN DEFAULT false
   - caption: TEXT
   - created_at: TIMESTAMPTZ DEFAULT now()
   - updated_at: TIMESTAMPTZ DEFAULT now()
   - CONSTRAINT one_featured_per_user UNIQUE (user_id, is_featured)
     WHERE (is_featured = true) — partial unique index

   Add the updated_at trigger (reuse handle_updated_at from migration 001).
   Add RLS: SELECT USING (true), INSERT WITH CHECK (true),
   UPDATE USING (true), DELETE — not permitted.
   Add index on user_id for feed queries.

Also add TypeScript types for PlayerMedia to types/index.ts.

IMPORTANT: If Supabase Edge Functions aren't already set up in this project,
create a simple Expo API route or document that these need to be deployed
as Supabase Edge Functions separately. Include the full function code either way.
```

**Files affected:** New migration, new edge functions or API routes, `types/index.ts`

**Verify:** Migration runs cleanly. Edge function deploys and returns an upload URL when called with a test POST.

---

## Task 4 — Video Upload Component

**Why:** Players need to upload videos from their device. This is the core content creation flow.

**Prompt:**

```
Using the context preamble above, create a video upload component and hook.

1. **hooks/useVideoUpload.ts**
   - Uses expo-image-picker to select video from library
   - Calls the generate-upload-url endpoint to get a Mux signed URL
   - Uploads the video file directly to Mux using expo-file-system
   - Shows upload progress (0-100%)
   - Handles errors with retry logic (max 3 retries for network errors)
   - Creates a record in player_media table with status 'processing'
   - Returns: { selectAndUpload, uploading, progress, error, reset }
   - Accept a config param: { type: 'feed' | 'featured', caption?: string }

2. **components/VideoUploadButton.tsx**
   - A pressable button that triggers the upload flow
   - Shows progress bar during upload
   - Shows processing spinner after upload completes (waiting for Mux)
   - Shows error state with retry option
   - Uses theme.ts tokens for all styling
   - Props: { onUploadComplete: (mediaId: string) => void, type: 'feed' | 'featured' }

3. **components/VideoPlayer.tsx**
   - Wrapper around expo-video's useVideoPlayer and VideoView
   - Accepts a Mux playback ID
   - Constructs the HLS URL: https://stream.mux.com/{playbackId}.m3u8
   - Handles loading, error, and playback states
   - Shows Mux thumbnail as poster image while loading
   - Props: { playbackId: string, style?: ViewStyle, autoPlay?: boolean }

Make sure the upload flow works on both iOS and Android. Use
ImagePicker.MediaTypeOptions.Videos for the picker. Set quality to 1 (highest)
since Mux handles transcoding anyway.
```

**Files affected:** `hooks/useVideoUpload.ts`, `components/VideoUploadButton.tsx`, `components/VideoPlayer.tsx`

**Verify:** Can select a video, see progress bar, upload completes. Video appears in Mux dashboard.

---

## Task 5 — Profile Photo Upload (Supabase Storage)

**Why:** Players need a profile photo. This uses Supabase Storage (not Mux — photos don't need transcoding).

**Prompt:**

```
Using the context preamble above, create a profile photo upload flow.

1. **hooks/usePhotoUpload.ts**
   - Uses expo-image-picker to select image from library or camera
   - Compresses/resizes to max 800x800px before upload (use expo-image-manipulator)
   - Uploads to Supabase Storage bucket 'profile-photos' at path: {user_id}/avatar.jpg
   - Updates player_profiles.profile_photo_url with the public URL
   - Returns: { selectAndUpload, uploading, error }

2. **components/ProfilePhotoUpload.tsx**
   - Displays current profile photo in a circle (or initials fallback)
   - Camera icon overlay indicating it's tappable
   - On press: shows action sheet — "Take Photo" / "Choose from Library" / "Cancel"
   - Shows loading spinner during upload
   - Props: { currentPhotoUrl?: string, userId: string, initials: string }

Make sure the Supabase Storage bucket 'profile-photos' is referenced.
Note: The bucket itself needs to be created in the Supabase dashboard with
public access enabled. Include a comment noting this.

Also create a migration 011_storage_bucket_policy.sql that adds an RLS policy
for the storage bucket if needed, or add a comment explaining that storage
bucket policies are managed in the Supabase dashboard.
```

**Files affected:** `hooks/usePhotoUpload.ts`, `components/ProfilePhotoUpload.tsx`, possibly new migration

**Verify:** Can select photo, upload completes, profile photo URL updates in player_profiles.

---

## Task 6 — Player Feed (Video + Photo Grid)

**Why:** Each player has a feed showing all their uploads. This replaces the current feed which shows player cards. The player card feed remains as the discovery feed; this is the player's personal media feed on their profile.

**Prompt:**

```
Using the context preamble above, build the player's personal media feed.

This is NOT the main discovery feed (which shows PlayerCards). This is a
media grid on the player's profile screen showing all their uploads.

1. **components/PlayerMediaFeed.tsx**
   - Fetches all player_media records for a given user_id, ordered by
     created_at DESC
   - Displays as a 3-column grid (like Instagram)
   - Each cell shows:
     - For videos: Mux thumbnail (https://image.mux.com/{playbackId}/thumbnail.jpg)
       with a small play icon overlay and duration badge
     - For photos: the Supabase Storage URL
   - The featured video has a star/pin icon overlay to distinguish it
   - Tapping a cell opens a full-screen modal:
     - Videos: VideoPlayer component (from Task 4) with caption below
     - Photos: zoomable image view with caption below
   - Pull-to-refresh support
   - "No uploads yet" empty state with upload CTA
   - Props: { userId: string, isOwnProfile: boolean }

2. **components/FeaturedVideo.tsx**
   - Displays the player's featured video prominently at the top of their profile
   - Larger than grid cells, with caption and a "Featured" badge
   - If no featured video is set, show a placeholder: "Select a featured video
     from your uploads"
   - Tapping plays inline (not modal)
   - Props: { userId: string, isOwnProfile: boolean }

3. **Add upload FAB (Floating Action Button) to the profile screen**
   - Only visible when viewing own profile (isOwnProfile: true)
   - "+" button in bottom-right
   - On press: action sheet — "Upload Video" / "Upload Photo" / "Cancel"
   - After successful upload, refresh the media feed
   - Use the VideoUploadButton flow for videos
   - For photos: use expo-image-picker → upload to Supabase Storage →
     create player_media record with media_type 'photo'

The featured video selection flow:
- When viewing own profile, each video in the grid has a "..." menu
- Menu options: "Set as Featured" / "Delete"
- "Set as Featured" updates is_featured on the selected video and
  removes is_featured from any previously featured video
- This is a single Supabase transaction (update old, update new)
```

**Files affected:** `components/PlayerMediaFeed.tsx`, `components/FeaturedVideo.tsx`, profile screen updates

**Verify:** Upload a video, see it in the grid. Set as featured, see it at the top. Upload a photo, see it in the grid.

---

## Task 7 — Performance Log

**Why:** Players log match performance data. This is a key differentiator — structured performance tracking that scouts can review later.

**Prompt:**

```
Using the context preamble above, build the performance logging system.

1. **New migration: 012_performance_logs.sql**
   Create a `performance_logs` table:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id: TEXT NOT NULL (Clerk ID)
   - match_date: DATE NOT NULL
   - opponent: TEXT
   - competition: TEXT (e.g. "U18 Premier League", "County Cup")
   - result: TEXT CHECK (result IN ('win', 'draw', 'loss'))
   - minutes_played: INTEGER
   - goals: INTEGER DEFAULT 0
   - assists: INTEGER DEFAULT 0
   - clean_sheets: INTEGER DEFAULT 0 (relevant for GK/defenders)
   - rating: NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 10) — self-rating
   - notes: TEXT (free text, e.g. "Scored from free kick, felt sharp")
   - position_played: TEXT (might differ from primary position)
   - created_at: TIMESTAMPTZ DEFAULT now()
   - updated_at: TIMESTAMPTZ DEFAULT now()

   Add updated_at trigger.
   Add RLS: SELECT USING (true), INSERT WITH CHECK (true),
   UPDATE USING (true), DELETE USING (true) — players can delete their own logs.
   Add index on (user_id, match_date DESC).

2. **screens or components for performance logging:**

   a. **PerformanceLogForm.tsx** — modal or screen for adding/editing a log entry
      - Date picker (default to today)
      - Opponent text input
      - Competition text input
      - Result selector (Win / Draw / Loss) — segmented control
      - Minutes played (number input, max 120)
      - Stats row: Goals / Assists / Clean Sheets — number steppers (+/-)
      - Self-rating: slider or star selector (1-10, 0.5 increments)
      - Notes: multiline text input
      - Position played: dropdown defaulting to their primary_position
      - Save button

   b. **PerformanceLogList.tsx** — list view of all entries for a player
      - Ordered by match_date DESC
      - Each row shows: date, opponent, result badge (green/grey/red),
        key stats (goals, assists), rating
      - Tapping opens the entry for editing
      - Swipe to delete with confirmation
      - Props: { userId: string, isOwnProfile: boolean }
      - If not own profile, editing/deleting/adding is hidden

   c. **PerformanceStats.tsx** — summary stats card for the profile
      - Total appearances (count of logs)
      - Total goals, assists, clean sheets
      - Average rating
      - Win/draw/loss record
      - This appears on the player profile alongside the media feed
      - Props: { userId: string }

3. **Add a "Performance" tab or section to the player profile screen**
   - Could be a tab alongside the media grid, or a section below
   - Shows PerformanceStats summary at top
   - PerformanceLogList below
   - "Add Match" button (only if own profile)

Also add TypeScript types for PerformanceLog to types/index.ts.
```

**Files affected:** New migration, new components, `types/index.ts`, profile screen

**Verify:** Can add a performance log, see it in the list, see summary stats update. Can edit and delete.

---

## Task 8 — Parental Lock (U16 Messaging Gate)

**Why:** Players under 16 must have a parent-set 4-digit PIN before they can access messaging. This is a safeguarding requirement.

**Prompt:**

```
Using the context preamble above, implement the parental lock system for U16 players.

The rule: if a player's date_of_birth indicates they are under 16, they CANNOT
access the messaging inbox unless a parental PIN has been set and entered.

1. **New migration: 013_parental_controls.sql**
   Create a `parental_controls` table:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id: TEXT NOT NULL UNIQUE (Clerk ID)
   - pin_hash: TEXT NOT NULL (store hashed, never plain text)
   - is_session_unlocked: BOOLEAN DEFAULT false
   - pin_set_at: TIMESTAMPTZ DEFAULT now()
   - last_unlocked_at: TIMESTAMPTZ
   - created_at: TIMESTAMPTZ DEFAULT now()

   RLS: All operations require matching user_id context.
   For now with USING(true) pattern, but add comments noting this must
   be tightened when JWT bridging is implemented.

2. **hooks/useParentalLock.ts**
   - Checks if the current user is under 16 based on date_of_birth in player_profiles
   - Checks if a PIN has been set (record exists in parental_controls)
   - Checks if the current session is unlocked
   - Returns: { isUnder16, hasPinSet, isUnlocked, requiresSetup, requiresUnlock }
   - Also provides: { setPin, verifyPin, lockSession }
   - PIN should be hashed client-side before storing (use a simple hash —
     this isn't banking-grade security, it's a parental gate)
   - Session unlock persists for the app session only (resets on app restart)

3. **components/ParentalPinSetup.tsx**
   - Full-screen modal shown when an U16 player first tries to access messaging
   - Title: "Parental Approval Required"
   - Subtitle: "A parent or guardian must set a 4-digit PIN to enable messaging"
   - 4-digit PIN input (numeric keypad style, like a phone lock screen)
   - "Confirm PIN" step (enter it twice)
   - On success: stores hashed PIN in parental_controls, unlocks session
   - Styled with theme.ts tokens, feels secure but not scary

4. **components/ParentalPinEntry.tsx**
   - Shown when an U16 player with a PIN set tries to access messaging
   - Title: "Enter Parental PIN"
   - Subtitle: "A parent or guardian must enter the PIN to unlock messaging"
   - Same 4-digit numeric keypad input
   - On success: unlocks session
   - On failure: shake animation, "Incorrect PIN" message
   - After 5 failed attempts: lock out for 5 minutes with countdown

5. **Gate the messaging tab**
   - In the messages tab (app/(tabs)/messages.tsx or similar):
     - If user is under 16 AND no PIN set → show ParentalPinSetup
     - If user is under 16 AND PIN set AND session locked → show ParentalPinEntry
     - If user is under 16 AND PIN set AND session unlocked → show inbox normally
     - If user is 16 or over → show inbox normally (no gate)
   - The tab icon should show a small lock icon overlay when the inbox is locked

IMPORTANT: The parental lock gates ONLY the messaging inbox for now.
Profile browsing, feed, and other features remain accessible without the PIN.
The PIN is entered by the PARENT, not the player. The UX should make this clear.
Age calculation uses date_of_birth from player_profiles. If date_of_birth is null,
treat as over 16 (don't block them — they may not have entered it yet).
```

**Files affected:** New migration, new hook, new components, messages tab screen

**Verify:** Set a test player's DOB to make them U15. Open messages tab → PIN setup appears. Set PIN. Close app. Reopen → PIN entry appears. Enter correct PIN → inbox shows. Enter wrong PIN 5 times → locked out.

---

## Task 9 — Profile Completion Score & Onboarding Polish

**Why:** Players need guidance on what to fill in. A completion score motivates them to build a full profile.

**Prompt:**

```
Using the context preamble above, implement the profile completion score system
and polish the player onboarding flow.

1. **Profile Completion Score Calculator**
   Create a utility: lib/profileCompletion.ts

   The score is calculated from player_profiles fields and related data.
   Each field has a weight. Total = 100%.

   Weights:
   - first_name + last_name: 10% (both required)
   - date_of_birth: 5%
   - profile_photo_url: 15% (photo uploaded)
   - primary_position: 10%
   - nationality: 5%
   - current_club: 5%
   - bio: 10% (min 50 characters)
   - height_cm + weight_kg: 5%
   - preferred_foot: 5%
   - At least 1 video uploaded (player_media with type 'video', status 'ready'): 15%
   - Featured video set (player_media with is_featured true): 10%
   - At least 1 performance log: 5%

   Function: calculateProfileCompletion(profile, mediaCount, hasFeatured, logCount) => {
     score: number (0-100),
     missing: string[] (list of incomplete items with friendly labels)
   }

   Update player_profiles.profile_completion_score whenever profile is saved.

2. **components/ProfileCompletionCard.tsx**
   - Shows on the player's own profile when score < 100%
   - Circular progress indicator with percentage
   - List of missing items as actionable suggestions
   - Each suggestion is tappable and navigates to the relevant section
   - e.g. "Add a profile photo" → opens photo upload
   - e.g. "Upload your first video" → opens upload flow
   - Collapses/hides when score reaches 100%
   - Celebratory state at 100%: "Profile complete! You're ready to be discovered"

3. **Polish the onboarding flow for players**
   - After role selection (player), the onboarding should collect minimum viable
     fields in a multi-step flow:
     Step 1: First name, Last name, Date of birth
     Step 2: Primary position (use the existing position selector component),
             Preferred foot
     Step 3: Profile photo upload (optional but encouraged)
     Step 4: Current club, Nationality
   - Each step has a progress bar at the top
   - "Skip" option on optional fields (photo, club)
   - On completion: create the player_profiles record, navigate to the main app
   - The ProfileCompletionCard on their profile shows what they still need to do

Keep the onboarding quick — 4 steps max. Everything else can be done from
the profile screen later. The goal is to get them into the app fast.
```

**Files affected:** `lib/profileCompletion.ts`, `components/ProfileCompletionCard.tsx`, onboarding screens

**Verify:** Complete onboarding with minimal fields. See completion card on profile. Fill in missing items. Score increases. At 100%, card shows celebration.

---

## Task 10 — Discovery Feed Polish

**Why:** The main feed (showing PlayerCards) needs to work well for MVP. Players can browse other players even though scouts aren't on the platform yet.

**Prompt:**

```
Using the context preamble above, polish the discovery feed for MVP.

The discovery feed (app/(tabs)/feed.tsx) currently shows PlayerCards filtered
by contract status. This is correct. Polish it for launch:

1. **Pagination**
   - Currently loads all players at once. Add cursor-based pagination.
   - Load 20 players at a time
   - Infinite scroll: load more when user scrolls near bottom
   - Use Supabase .range() for pagination

2. **Pull to refresh**
   - RefreshControl on the FlatList
   - Resets to first page on pull

3. **Filter persistence**
   - The contract status filter (FilterToggle component) should remember
     the last selected filter across app sessions
   - Use AsyncStorage to persist the selected filter

4. **Empty states**
   - "No players found" when the filter returns no results
   - "No players yet" when the platform is empty (early days message)

5. **PlayerCard updates**
   - Wire the SHORTLIST button with a placeholder action:
     - On press: show a toast "Shortlisting coming soon for scouts!"
     - For the MVP (players-only), the shortlist button serves as a preview
       of what scouts will be able to do
   - If the PlayerCard represents the current user, hide the SHORTLIST button
   - Add a tap handler on the card itself that navigates to the player's
     full profile screen (if one exists, or create a basic one)

6. **Search screen**
   - The search tab currently shows an empty screen
   - Add a basic text search that queries player_profiles by:
     - first_name / last_name (ILIKE)
     - current_club (ILIKE)
     - primary_position (exact match)
   - Results show as PlayerCards
   - Search input with debounce (300ms)

Keep the existing FilterToggle contract status filter. Just add pagination,
refresh, and the search functionality.
```

**Files affected:** `app/(tabs)/feed.tsx`, `app/(tabs)/search.tsx`, `components/PlayerCard.tsx`

**Verify:** Feed loads 20 at a time, scrolls to load more. Pull to refresh works. Search finds players by name/club. Filter persists across sessions.

---

## Deployment Checklist (Pre-Launch)

After all tasks are complete, before submitting to app stores:

- [ ] Create Mux account, get API credentials, configure webhook URL
- [ ] Set Mux environment variables in Supabase Edge Functions (or wherever backend runs)
- [ ] Create Supabase Storage bucket `profile-photos` with public access
- [ ] Run all migrations (009–013) on production Supabase
- [ ] Verify Clerk free tier limits are sufficient for launch
- [ ] Test full flow: signup → onboarding → upload photo → upload video → add performance log → browse feed → search
- [ ] Test parental lock flow with U16 DOB
- [ ] Test on both iOS and Android physical devices
- [ ] Review RLS policies — all still use USING(true), acceptable for MVP but document the risk
- [ ] Set up error monitoring (Sentry or similar — can be a follow-up task)

---

## Phase 2 Preview (Post-MVP)

Once the player base is growing:

- Scout/Agent profile creation (three types: scout, agent, agent_scout)
- Endorsement system (scout endorsements → player card tier upgrades)
- Messaging between players and scouts (with parental lock for U16)
- Shortlisting (scouts can save players to lists)
- Notification system wiring
- RLS policy tightening (Clerk → Supabase JWT bridging)
- Video compression settings optimization based on real usage data
