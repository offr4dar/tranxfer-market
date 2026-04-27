# Phase 1 — Core Loop

Phase 1 makes the app functionally valuable to real users. **Nothing in later phases should be started until these four features are complete.**

This is the minimum viable product (MVP).

---

## Feature 1: Feed → Real Data

**Status:** 🔴 Not started

The feed screen currently renders stub data. Connect it to live Supabase data.

**Requirements:**
- Query `profiles` joined with the role-specific table based on `FilterToggle` selection
- Role filter: `'player'` | `'agent'` | `'club'`
- Cursor-based pagination: 20 records per page, load more on scroll
- Loading skeleton while fetching
- Empty state when no results match
- Pull-to-refresh

**Files to modify:** `app/(tabs)/feed.tsx`, `lib/queries/feed.ts` (new)

---

## Feature 2: Profile Screen — Full & Editable

**Status:** 🔴 Not started

The profile screen must show all onboarding data and allow inline editing.

**Requirements:**
- Display all role-specific fields from Supabase
- Inline editing via modal or inline input
- Profile picture upload to Supabase Storage (`avatars` bucket)
- Profile completion percentage bar (scoring logic in Phase 3 Feature 9; UI placeholder now)

**Files to modify:** `app/(tabs)/profile.tsx`, `lib/queries/profile.ts` (new)

---

## Feature 3: Connections System

**Status:** 🔴 Not started

There is currently no way for users to connect. This is the foundation of the social graph.

**Requirements:**
- New migration: `supabase/migrations/009_connections.sql`
- Connect button on `PlayerCard` with states: Connect / Pending / Connected / Declined
- Tapping Connect creates a `connections` row and sends a notification to the receiver
- Connections section in profile showing incoming requests (accept/decline)

**Files to create/modify:** `supabase/migrations/009_connections.sql`, `components/PlayerCard.tsx`, `lib/queries/connections.ts`

---

## Feature 4: Real-Time Messaging

**Status:** 🔴 Not started

The conversation screens exist but are not wired to Supabase.

**Requirements:**
- `messages.tsx` → query `conversations` joined with `profiles`
- `conversation/[id].tsx` → query `messages WHERE conversation_id = :id`
- Supabase Realtime subscription for new messages
- Auto-scroll to bottom on new message
- Typing indicator via Realtime Presence
- Messaging only allowed between connected users

**Files to modify:** `app/(tabs)/messages.tsx`, `app/(tabs)/conversation/[id].tsx`, `lib/queries/messages.ts` (new)

---

## Immediate Next Steps

| # | Task | Priority |
|---|---|---|
| 1 | Wire `feed.tsx` to live Supabase data | 🔴 First |
| 2 | Create connections table (migration 009) + Connect CTA on PlayerCard | 🔴 Second |
| 3 | Connect messaging screens to Supabase with real-time subscriptions | 🔴 Third |
| 4 | Full editable profile screen | 🟡 Fourth |
