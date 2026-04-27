# Phase 3 — Engagement & Retention

Phase 3 features drive repeat usage and create habitual return behaviour.

> **Prerequisite:** Phases 1 and 2 must be complete before starting Phase 3.

---

## Feature 8: Video Upload — Skills Feed

**Status:** 🔴 Not started

Players can upload short performance videos to their profile for scout discovery.

**New Supabase Storage buckets:** `videos` (public read), `thumbnails` (public read)

**New migration:** `supabase/migrations/013_videos.sql`

**UI Requirements:**
- Upload via `expo-image-picker` — max 90 seconds, max 200MB
- Progress bar during upload
- Thumbnail generated via `expo-video-thumbnails`
- **Videos** tab on the player profile screen (grid layout)
- Videos section in the main feed with a `'Videos'` filter toggle

---

## Feature 9: Profile Completion Gamification

**Status:** 🔴 Not started (UI placeholder exists)

A lightweight mechanic that drives profile quality.

**Scoring function: `calculateCompletionScore(profile)`**

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
| **Total** | **100 pts** |

**UI:**
- Completion bar at top of profile
- Next best action below the bar: *"Upload a video to earn 20 more points"*
- At 100%: **Profile Complete** badge in brand colour

---

## Feature 10: Weekly Challenges

**Status:** 🔴 Not started

Recurring challenges give players a reason to upload content regularly.

**New migration:** `supabase/migrations/014_challenges.sql`

**UI Requirements:**
- Challenge banner at top of feed (between `FilterToggle` and card list)
- Banner shows: title, description, days remaining, submission count
- Submit CTA triggers the video upload flow with `challenge_id` pre-populated
- Filtered feed view for challenge submissions

---

## Feature 11: Push Notifications — Full Wiring

**Status:** 🔴 Not started

Wire Expo Push Notifications to all meaningful app triggers.

**New migration:** `supabase/migrations/015_push_tokens.sql`

**New Supabase Edge Function:** `functions/send-push-notification`

| Trigger | Notification Copy |
|---|---|
| Profile viewed by scout | *Your profile is getting attention — X scouts viewed it this week* |
| Connection request received | *[Name] wants to connect with you* |
| Connection request accepted | *[Name] accepted your connection* |
| New message received | *[Name]: [message preview]* |
| New challenge posted | *New challenge: [title] — submit your video now* |
