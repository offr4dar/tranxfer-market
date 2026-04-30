# Tech Stack & Conventions

> Verified against repo source. All details reflect what is actually in the codebase.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo + Expo Router (file-based routing) | ~54 / ~6 |
| Language | TypeScript | Strict mode |
| Authentication | Clerk (`@clerk/clerk-expo`) | ^2 |
| Database | Supabase (`@supabase/supabase-js`) | ^2 |
| Navigation | Expo Router Stack + custom `FloatingTabBar` | — |
| Animations | `react-native-reanimated` | ~4 |
| Blur | `expo-blur` | — |
| Fonts | `@expo-google-fonts/anton` (Anton_400Regular) | — |
| Styling | Vanilla React Native `StyleSheet` + `constants/theme.ts` | — |
| SVG | `react-native-svg` + `react-native-svg-transformer` | — |
| Safe Area | `react-native-safe-area-context` | — |
| Gradients | `expo-linear-gradient` | — |
| Masked Views | `@react-native-masked-view/masked-view` | — |
| Secure Storage | `expo-secure-store` | — |

---

## Environment Variables

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

---

## Key Architecture Decisions

### Clerk User IDs as TEXT
Supabase stores Clerk user IDs as `TEXT` in all `user_id` columns — not as UUID. This means `auth.uid()` in RLS policies does not map to these IDs. All user-scoped queries pass the Clerk `userId` from `useAuth()` as a query parameter.

### Anon Key on Mobile
The mobile app uses the Supabase anon key. There is no JWT bridging between Clerk and Supabase auth yet. RLS policies currently use `USING (true)` as a workaround — this is acceptable for development but must be addressed before production.

### No Supabase Auth
Users authenticate via Clerk only. Supabase is used purely as a data store, not as an auth provider. The `user_display_names` view and `get_user_conversations` RPC use `SECURITY DEFINER` to bypass RLS where needed.

### Font Loading
`Anton_400Regular` is loaded in `app/_layout.tsx` via `useFonts`. The native splash screen is held open until fonts load or fail. Always use `fontFamily: 'Anton_400Regular'` — never `'Anton'`.

---

## Coding Conventions

All code — generated or hand-written — must follow these conventions:

- **TypeScript strict** — no implicit `any`, no non-null assertions without justification
- **Supabase singleton** — always `import { supabase } from '@/lib/supabase'`; never create a new client
- **Design tokens** — always use `constants/theme.ts`; never hardcode colours or spacing
- **File-based routing** — new screens in `app/(tabs)/` or `app/(modals)/`
- **Functional components + hooks only** — no class components
- **Loading and error states required** — every data-fetching screen must handle both
- **user_id is TEXT** — never cast Clerk user IDs to UUID in queries

---

## Design Tokens (`constants/theme.ts`)

```ts
Colors.brand           = '#00FF87'
Colors.brandDark       = '#00CC6A'
Colors.background      = '#0A0F1E'
Colors.surface         = '#0D1526'
Colors.surfaceElevated = '#111827'
Colors.border          = 'rgba(255,255,255,0.08)'
Colors.text            = '#FFFFFF'
Colors.textSecondary   = 'rgba(255,255,255,0.5)'
Colors.textMuted       = 'rgba(255,255,255,0.25)'
Colors.error           = '#FF4444'
Colors.success         = '#00FF87'

Spacing = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 }
Radius  = { sm:8, md:12, lg:16, xl:24, full:999 }
```

> Note: some older files (e.g. `PlayerCard.tsx`, `feed.tsx`) still hardcode `'#00FF87'` and `'#111810'`. Do not replicate this — always use the token.

---

## AI Code Generation Preamble

Include this with every prompt to Claude, Cursor, or Copilot:

```
I am building a React Native mobile app called Tranxfer Market using Expo ~54, 
Expo Router ~6, TypeScript, Clerk for auth (@clerk/clerk-expo ^2), and Supabase 
for database/storage (@supabase/supabase-js ^2).

The app is a football recruitment platform with two active user roles: player and 
scout (with sub-types: club_scout and freelance_scout). The lib/supabase.ts 
file exports a singleton Supabase client. Design tokens are in constants/theme.ts.

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
```

**Generation order:** Always generate in this sequence to prevent type errors:
1. Supabase migration SQL
2. TypeScript query functions in `lib/queries/`
3. React Native screen or component
