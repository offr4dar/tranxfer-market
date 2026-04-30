# What Has Been Built

> Last verified against repo: April 2026. All findings are based on direct inspection of the source code.

---

## Authentication & Onboarding

| Screen | File | Status | Notes |
|---|---|---|---|
| Splash | `app/splash.tsx` | ✅ Complete | Animated brand intro, auto-advances |
| Welcome | `app/(auth)/welcome.tsx` | ✅ Complete | Get Started / Sign In CTAs |
| Sign In | `app/(auth)/sign-in.tsx` | ✅ Complete | Email + Clerk OTP flow |
| Email Verification | `app/(auth)/verify-email.tsx` | ✅ Complete | OTP code entry with resend |
| Onboarding Wizard | `app/(auth)/onboarding.tsx` | ✅ Complete | See detail below |
| Auth Guard | `app/_layout.tsx` | ✅ Complete | Redirects correctly in all cases |

### Onboarding Wizard — Detail
A 4-step animated flow with parallax slide transitions and per-dot step indicator animations.

- **Step 1 — Role selection:** Player or Scout with custom SVG icons
- **Step 2 — About you:** Age picker (players only), scout sub-type radio (Club Scout / Freelance Scout), UK postcode autocomplete using `lib/uk-outcodes.ts` with chip selection
- **Step 3 — Name:** First and last name, with dynamic intro text based on role/scout type
- **Step 4 — Account:** Email + password, or OAuth final step (terms acceptance only)

The scout sub-type distinguishes between two types stored in `scout_profiles.scout_type`:
- `club_scout` — employed by a club, scouting on behalf of their organisation
- `freelance_scout` — independent scout, building their own watchlists and portfolio

> **Note:** The existing codebase uses `agent_profiles` and `agent_type` in the database schema and references `independent_agent` and `scouting_network` as sub-types. These must be migrated to `scout_profiles` and `scout_type` with values `club_scout` and `freelance_scout`. The `independent_agent` sub-type (FIFA licensed agent) is removed — agents are out of scope for this product.

OAuth (Google) is supported via `oauth=1` URL param — skips the account step and pre-fills name from the Google account. Token cache uses `expo-secure-store`. Fonts load before the native splash is dismissed.

---

## Main App — Tab Screens

| Tab | File | Status | Notes |
|---|---|---|---|
| Feed | `app/(tabs)/feed.tsx` | ✅ Wired | Queries live Supabase data |
| Search | `app/(tabs)/search.tsx` | 🔲 Scaffolded | No query logic |
| Profile | `app/(tabs)/profile.tsx` | ✅ Functional | Reads from DB, completion bar live |
| Messages | `app/(tabs)/messages.tsx` | ✅ Wired | Uses `get_user_conversations` RPC |
| Notifications | `app/(tabs)/notifications.tsx` | 🔲 Scaffolded | No query logic |
| Conversation | `app/(tabs)/conversation/[id].tsx` | ✅ Real-time | Full Supabase Realtime |

### Feed — Detail
- Queries `player_profiles` directly with `is_searchable = true` filter
- Filter toggle: `ALL` vs `AVAILABLE` (contract status filter) — **not** a role filter
- No pagination — fetches all matching records (needs cursor-based pagination)
- Pull-to-refresh, empty state, loading skeleton: all implemented
- `SHORTLIST` button on each card: renders but has **no `onPress` handler**

### Profile — Detail
- Fetches player or scout profile by Clerk `userId` via `maybeSingle()`
- Profile completion bar: live — reads `profile_completion_score` from DB
- Player stats: Apps, Goals, Assists, Clean Sheets from DB
- Completion hint: shows up to 2 missing field names
- Menu items (Edit profile, Upload, Analytics, etc.): visual only — no navigation wired

### Messaging — Detail
- `messages.tsx` calls `supabase.rpc('get_user_conversations', { p_user_id: userId })`
- RPC defined in migration 005 — **must be verified as deployed to live DB**
- Unread count badge on tab icon: 30-second polling in `(tabs)/_layout.tsx`
- `conversation/[id].tsx`: real-time via `supabase.channel().on('postgres_changes', ...)`
- Read receipts on open, auto-scroll, send on return key all implemented
- Typing indicator: **not implemented**

---

## UI Components

| Component | Status | Notes |
|---|---|---|
| `ScreenBackground` | ✅ | Dark navy + tiled texture overlay |
| `ScreenHeader` | ✅ | Logo + action icons, shared across all tabs |
| `FloatingTabBar` | ✅ | Custom pill navigation |
| `LoginOverlay` | ✅ | Auth gate for incomplete profiles |
| `PlayerCard` | ⚠️ | SHORTLIST button not wired; local type conflicts with `types/index.ts` |
| `FilterToggle` | ✅ | Segmented filter used in feed |
| `ConfirmCancelModal` | ✅ | Used in onboarding cancel flow |
| `TabIcons` | ✅ | SVG icon set for tab bar |

### PlayerCard — Detail
Renders: initials avatar with verified tick, Anton font name (first name small / last name large), contract status badge (colour-coded), current club, position/age/nationality meta row, SHORTLIST text button.

Contract status badge colours:
- `available_now` → brand green, black text
- `available_eot` → gold, black text
- `under_contract` → transparent, muted text
- `trial` → blue-tinted, light blue text

**Type issue:** `PlayerCard` defines its own local `PlayerProfile` type using `first_name`/`last_name`. `types/index.ts` defines `PlayerProfile` with `full_name`. These conflict — `types/index.ts` must be updated to match the actual schema.

---

## Database — Migrations

| # | File | Status | Key Changes |
|---|---|---|---|
| 001 | `initial_schema.sql` | ✅ | `player_profiles`, `agent_profiles`, `handle_updated_at` trigger |
| 002 | `agent_profiles_enhance.sql` | ✅ | Enhanced agent fields |
| 003 | `scout_fields_merged.sql` | ✅ | Scout/agent field consolidation |
| 004 | `drop_agent_age.sql` | ✅ | Removes deprecated `age` from `agent_profiles` |
| 005 | `messages.sql` | ✅ | `conversations`, `messages`, `user_display_names` view, `get_user_conversations` RPC |
| 006 | `notifications.sql` | ✅ | `notifications` table, types: `profile_view`, `message`, `shortlist`, `system` |
| 007 | `select_policies.sql` | ✅ | Public SELECT policies |
| 008 | `mobile_rls_policies.sql` | ⚠️ | All policies use `USING (true)` — must tighten before production |

> **Schema migration required:** Migrations 001–004 reference `agent_profiles` and `agent_type`. A new migration (`009_rename_agent_to_scout.sql`) must rename `agent_profiles` → `scout_profiles`, update `agent_type` → `scout_type`, remove the `independent_agent` value, and ensure `user_display_names` view references the renamed table. All application code referencing `agent_profiles` must be updated to `scout_profiles`.

### Critical Schema Notes
- `user_id` fields everywhere are `TEXT` (Clerk IDs) — **not UUID**
- `conversations.participant_ids` is `TEXT[]` storing Clerk IDs
- `messages.sender_id` is `TEXT`
- `get_user_conversations` RPC is `SECURITY DEFINER`
- `user_display_names` is a VIEW joining both profile tables

---

## Known Issues

| Issue | Severity |
|---|---|
| SHORTLIST button has no `onPress` | 🔴 High |
| `PlayerProfile` type mismatch between `PlayerCard` and `types/index.ts` | 🔴 High |
| RLS policies wide open (`USING (true)` everywhere) | 🔴 High |
| `agent_profiles` must be migrated to `scout_profiles` | 🔴 High |
| Feed has no pagination | 🟡 Medium |
| Feed filter is contract status, not user role | 🟡 Medium |
| Search screen empty | 🟡 Medium |
| Notifications screen empty | 🟡 Medium |
| Profile menu items have no navigation | 🟢 Low |
| Typing indicator not implemented | 🟢 Low |
| `get_user_conversations` RPC deployment unverified | ❓ Unknown |
