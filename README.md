# Tranxfer Market — Mobile App

A React Native (Expo) mobile marketplace for football transfers. Players, agents, and clubs can discover each other, send connection requests, and manage conversations — all behind an authenticated, role-based onboarding flow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / [Expo Router](https://expo.github.io/router) ~6 (file-based routing) |
| Language | TypeScript |
| Authentication | [Clerk](https://clerk.com) (`@clerk/clerk-expo` ^2) — email + OTP verification |
| Database | [Supabase](https://supabase.com) (`@supabase/supabase-js` ^2) — Postgres with RLS |
| Navigation | Expo Router Stack + custom `FloatingTabBar` pill |
| Animations | `react-native-reanimated` ~4, `expo-blur` |
| Fonts | Anton (via `@expo-google-fonts/anton`) |
| Styling | Vanilla React Native `StyleSheet` + centralised design tokens (`constants/theme.ts`) |

---

## What Has Been Built

### Authentication & Onboarding
- **Splash screen** (`app/splash.tsx`) — animated brand intro that auto-advances or can be tapped through.
- **Welcome screen** (`app/(auth)/welcome.tsx`) — entry point for unauthenticated users with "Get Started" / "Sign In" CTAs.
- **Sign-in screen** (`app/(auth)/sign-in.tsx`) — email + Clerk OTP flow.
- **Email verification** (`app/(auth)/verify-email.tsx`) — OTP code entry with resend support.
- **Multi-step onboarding wizard** (`app/(auth)/onboarding.tsx`) — role-selection (Player / Agent / Club) followed by role-specific profile fields (name, age, position, nationality, postcode autocomplete, etc.). Profile data is written to Supabase on completion.
- **Auth guard** (`app/_layout.tsx → AuthGuard`) — redirects unauthenticated users to `/(auth)/welcome` and signed-in users away from auth screens automatically.
- **Token cache** — Clerk tokens persisted via `expo-secure-store`.

### Main App (Tabs)
All tab screens share the `ScreenBackground` texture and `ScreenHeader` global header.

| Tab | File | Status |
|---|---|---|
| Feed | `app/(tabs)/feed.tsx` | ✅ Player cards with filter toggle |
| Search | `app/(tabs)/search.tsx` | ✅ Search interface |
| Messages | `app/(tabs)/messages.tsx` | ✅ Conversation list |
| Notifications | `app/(tabs)/notifications.tsx` | ✅ Notification list |
| Profile | `app/(tabs)/profile.tsx` | ✅ User profile + sign-out |
| Conversation detail | `app/(tabs)/conversation/[id].tsx` | ✅ Dynamic conversation thread |

### UI Components

| Component | Purpose |
|---|---|
| `ScreenBackground` | Full-screen dark background with tiled texture overlay, shared across all tab screens |
| `ScreenHeader` | Global top bar with logo + action icons, used on every tab |
| `FloatingTabBar` | Custom floating pill navigation replacing the default tab bar |
| `LoginOverlay` | Auth-gate overlay shown over tab screens if the profile is incomplete |
| `PlayerCard` | Card component for displaying a player/agent/club in the feed |
| `FilterToggle` | Segmented filter buttons (e.g. Player / Agent / Club) |
| `ConfirmCancelModal` | Reusable modal for destructive action confirmations |
| `components/icons/TabIcons.tsx` | SVG icon set for the floating tab bar |

### Design System (`constants/theme.ts`)
```ts
Colors.brand          = '#00FF87'   // Primary green accent
Colors.background     = '#0A0F1E'   // Deep navy background
Colors.surface        = '#0D1526'
Colors.surfaceElevated= '#111827'
```
Spacing and border-radius scales are also defined here (`Spacing`, `Radius`).

### Database (Supabase)

Eight migrations applied in order:

| # | File | Purpose |
|---|---|---|
| 001 | `initial_schema.sql` | Core tables: `profiles`, `player_profiles`, `agent_profiles`, `club_profiles` |
| 002 | `agent_profiles_enhance.sql` | Enhanced agent fields |
| 003 | `scout_fields_merged.sql` | Scout/agent field consolidation |
| 004 | `drop_agent_age.sql` | Removes deprecated `age` column from agent profiles |
| 005 | `messages.sql` | `messages` + `conversations` tables |
| 006 | `notifications.sql` | `notifications` table |
| 007 | `select_policies.sql` | Basic RLS SELECT policies |
| 008 | `mobile_rls_policies.sql` | Full anon-client read/write RLS for mobile |

### Utilities (`lib/`)

| File | Purpose |
|---|---|
| `supabase.ts` | Supabase client singleton |
| `pendingProfile.ts` | In-memory store that carries onboarding wizard state across steps before committing to Supabase |
| `uk-outcodes.ts` | Lookup table for UK postcode outward codes (used in postcode autocomplete during onboarding) |

---

## Folder Structure

```
tranxfer-market/
├── app/
│   ├── _layout.tsx                  # Root layout — ClerkProvider, AuthGuard, Stack navigator
│   ├── index.tsx                    # Entry redirect (→ splash or tabs)
│   ├── splash.tsx                   # Animated splash / brand intro screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx              # Welcome / landing screen
│   │   ├── sign-in.tsx              # Email sign-in + OTP request
│   │   ├── verify-email.tsx         # OTP code verification
│   │   └── onboarding.tsx           # Multi-step role-based onboarding wizard
│   └── (tabs)/
│       ├── _layout.tsx              # Tab navigator layout
│       ├── feed.tsx                 # Main player/agent/club feed
│       ├── search.tsx               # Search screen
│       ├── messages.tsx             # Conversations list
│       ├── notifications.tsx        # Notifications
│       ├── profile.tsx              # User profile
│       └── conversation/
│           └── [id].tsx             # Dynamic conversation thread
│
├── components/
│   ├── ScreenBackground.tsx         # Shared dark + texture background
│   ├── ScreenHeader.tsx             # Global header bar (logo + icons)
│   ├── FloatingTabBar.tsx           # Custom floating pill tab navigator
│   ├── LoginOverlay.tsx             # Auth-gate overlay for incomplete profiles
│   ├── PlayerCard.tsx               # Feed card for a player/agent/club
│   ├── FilterToggle.tsx             # Segmented role-filter buttons
│   ├── ConfirmCancelModal.tsx       # Reusable confirmation modal
│   ├── icons/
│   │   └── TabIcons.tsx             # SVG icons for the tab bar
│   └── shared/                      # (reserved for future shared components)
│
├── constants/
│   └── theme.ts                     # Colours, spacing, and radius tokens
│
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── pendingProfile.ts            # Onboarding in-memory state store
│   └── uk-outcodes.ts               # UK postcode outward-code lookup
│
├── types/
│   └── index.ts                     # Shared TypeScript types
│
├── assets/
│   ├── icon.png / adaptive-icon.png / splash-icon.png / favicon.png
│   ├── splash-bg.png                # Full-screen splash background
│   ├── bg_onboarding.jpg            # Onboarding background image
│   ├── Frame 44.jpg                 # Background texture (used in ScreenBackground)
│   ├── player_svg.svg
│   ├── agent_svg.svg
│   └── club_svg.svg
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_agent_profiles_enhance.sql
│       ├── 003_scout_fields_merged.sql
│       ├── 004_drop_agent_age.sql
│       ├── 005_messages.sql
│       ├── 006_notifications.sql
│       ├── 007_select_policies.sql
│       └── 008_mobile_rls_policies.sql
│
├── scripts/                         # Utility / maintenance scripts
├── stubs/                           # Dev stubs / seed data
├── schema.sql                       # Full DB schema snapshot
├── app.json                         # Expo app config
├── metro.config.js                  # Metro bundler config
├── tsconfig.json
├── package.json
└── .env.local                       # Local env vars (not committed)
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Clerk publishable key
EXPO_PUBLIC_SUPABASE_URL=            # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anon key
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

Requires [Expo CLI](https://docs.expo.dev/get-started/installation/) and [Expo Go](https://expo.dev/go) (or a native build via EAS).
