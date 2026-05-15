# What Has Been Built

> Last verified against repo: May 2026. All findings are based on direct inspection of the source code.

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
| Scout Verification | `app/verify.tsx` | 🔲 Stub | Shell created; full checklist screen in development |

### Onboarding Wizard — Detail
A 4-step animated flow with parallax slide transitions and per-dot step indicator animations.

- **Step 1 — Role selection:** Player or Scout with custom SVG icons
- **Step 2 — About you:** Age picker (players only), scout sub-type radio (Club Scout / Freelance Scout), UK postcode autocomplete using `lib/uk-outcodes.ts` with chip selection
- **Step 3 — Name:** First and last name, with dynamic intro text based on role/scout type
- **Step 4 — Account:** Email + password, or OAuth final step (terms acceptance only)

The scout sub-type distinguishes between two types stored in `scout_profiles.scout_type`:
- `club_scout` — employed by a club, scouting on behalf of their organisation
- `freelance_scout` — independent scout, building their own watchlists and portfolio

OAuth (Google) is supported via `oauth=1` URL param — skips the account step and pre-fills name from the Google account. Token cache uses `expo-secure-store`. Fonts load before the native splash is dismissed.

---

## Main App — Tab Screens

| Tab | File | Status | Notes |
|---|---|---|---|
| Feed | `app/(tabs)/feed.tsx` | ✅ Wired | Queries live Supabase data |
| Search | `app/(tabs)/search.tsx` | 🔲 Scaffolded | No query logic |
| Profile | `app/(tabs)/profile.tsx` | ✅ Functional | Reads from DB; scout profile redesigned to Figma spec |
| Messages | `app/(tabs)/messages.tsx` | ✅ Wired | Uses `get_user_conversations` RPC; demo mode handled |
| Notifications | `app/(tabs)/notifications.tsx` | ✅ Scaffolded | Wired to DB; demo mode handled |
| Conversation | `app/(tabs)/conversation/[id].tsx` | ✅ Real-time | Full Supabase Realtime; undefined-id guard added |

### Feed — Detail
- Queries `player_profiles` directly with `is_searchable = true` filter
- Filter toggle: `ALL` vs `AVAILABLE` (contract status filter)
- No pagination — fetches all matching records (needs cursor-based pagination)
- Pull-to-refresh, empty state, loading skeleton: all implemented

### Profile — Detail (Updated May 2026)
- **Scout profile fully redesigned** to match Figma specification
- **Scout Pro badge:** gold metallic gradient (`#96895A` → `#D8C581`), brand X-mark icon in `#7C6F42`, positioned in edit row alongside Edit / Settings buttons
- **Dynamic info cards:** `club_scout` → shows "Club Name" card; `freelance_scout` → shows "Scouting Network" card
- **Verified hexagon badge** on scout hero section
- **VerifiedBanner** component rendered for scouts with DBS/safeguarding status
- Hero section border suppressed for scout profiles
- Unified `AttrList` component: labels `#868686`, values white, uppercase tracking
- Player profile: profile completion bar, stat cards (Apps/Goals/Assists/Clean Sheets), endorsement count, scout interest chart

### Messaging — Detail
- `messages.tsx` calls `supabase.rpc('get_user_conversations', { p_user_id: userId })`
- Unread count badge on tab icon: 30-second polling in `(tabs)/_layout.tsx`
- `conversation/[id].tsx`: real-time via `supabase.channel().on('postgres_changes', ...)`
- Read receipts on open, auto-scroll, send on return key all implemented
- **Demo mode:** both messages and notifications now exit loading state immediately with empty-state UI

---

## Demo & Test Mode

| Feature | Status | Notes |
|---|---|---|
| Demo select screen | ✅ Complete | `app/demo-select.tsx` — 3 role tiles |
| Demo roles | ✅ Complete | `player`, `scout_free`, `scout_subscribed` |
| `DevRoleProvider` | ✅ Complete | `lib/devRole.ts` — context for dev role + isDemoMode |
| Demo data | ✅ Complete | `lib/demoData.ts` — `DEMO_PLAYER_PROFILE`, `DEMO_SCOUT_FREE_PROFILE`, `DEMO_SCOUT_PRO_PROFILE`, `DEMO_ENDORSEMENTS`, `DEMO_FEED_PLAYERS` |
| Exit Demo button | ✅ Complete | Persistent across **all screens** — rendered at root layout level (`app/_layout.tsx`). Was previously only visible inside tabs |
| `scout_unverified` role | 🔲 Planned | To be added for full verify-screen testing (Step 2 active) |

### Navigation Guard (Fixed May 2026)
The `AuthGuard` in `app/_layout.tsx` had a critical bug: an `else if` branch matched every tab navigation and called `router.replace('/(tabs)/profile')`, effectively making all tab bar presses reload the profile screen. This has been removed — tab navigation is no longer intercepted by the auth guard.

---

## UI Components

| Component | Status | Notes |
|---|---|---|
| `ScreenBackground` | ✅ | Dark navy + tiled texture overlay |
| `ScreenHeader` | ✅ | Logo + action icons, shared across all tabs |
| `FloatingTabBar` | ✅ | Custom pill navigation |
| `LoginOverlay` | ✅ | Auth gate for incomplete profiles |
| `PlayerCard` | ✅ | Feed card; SHORTLIST button wired |
| `FilterToggle` | ✅ | Segmented filter used in feed |
| `PersistentFAB` | ✅ | Player: log activity FAB; Scout: shortlist FAB; hidden in demo mode |
| `GradientTitle` | ✅ | Reusable gradient text component for headings |
| `DbsInfoSheet` | ✅ | Slide-up panel with DBS guidance; uses `PerformanceLogSheet` animation pattern |
| `PerformanceLogSheet` | ✅ | Slide-up panel for logging player activity |
| `ScoutInterestChart` | ✅ | SVG sparkline for scout interest data |
| `PlayerLevelCard` | ✅ | Visual level/tier card for player profile |
| `EndorsementsSection` | ✅ | Scout endorsements display on player profile |
| `AttrList` | ✅ | Unified attribute row: label (#868686) + value (white) |
| `TabIcons` | ✅ | SVG icon set for tab bar including brand X-mark (FeedIcon) |
| `QualificationsSection` | 🔲 Planned | Scout qualifications display component |
| `AddQualificationSheet` | 🔲 Planned | Slide-up panel for adding qualifications |

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
| 009–019 | Various scout profile fields | ✅ | `scout_profiles` table; DBS fields; verification fields; gender |
| 020 | `020_scout_gender.sql` | ✅ | Scout gender field |
| 021 | Pending | 🔲 | `complycube_client_id` column for identity verification |
| 022 | Pending | 🔲 | `qualification_catalogue` and `scout_qualifications` tables |

> **RLS:** Migrations 008+ use `USING (true)` — permissive policies for development. Must be tightened to `user_id = requesting_user_id()` before production.

### Critical Schema Notes
- `user_id` fields everywhere are `TEXT` (Clerk IDs) — **not UUID**
- `conversations.participant_ids` is `TEXT[]` storing Clerk IDs
- `messages.sender_id` is `TEXT`
- `get_user_conversations` RPC is `SECURITY DEFINER`
- `user_display_names` is a VIEW joining both profile tables

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| RLS policies wide open (`USING (true)` everywhere) | 🔴 High | Open |
| Feed has no pagination | 🟡 Medium | Open |
| Search screen empty | 🟡 Medium | Open |
| `scout_unverified` demo role missing | 🟡 Medium | Planned |
| Scout verification checklist screen (`/verify`) incomplete | 🟡 Medium | In development |
| Typing indicator not implemented in messaging | 🟢 Low | Open |
| Qualifications section not yet built | 🟢 Low | Planned |

---

## Supabase Edge Functions (Planned)

| Function | Purpose | Status |
|---|---|---|
| `create-idv-session` | Create ComplyCube identity verification session for scout | 🔲 Planned |
| `update-idv-result` | Receive ComplyCube webhook; update `id_verified` on scout profile | 🔲 Planned |
