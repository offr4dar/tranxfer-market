# Tech Stack

Tranxfer Market is a mobile-first application. Every technology choice was made to optimise for rapid iteration while maintaining production-grade quality.

## Core Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [Expo](https://expo.dev) | ~54 |
| Routing | [Expo Router](https://expo.github.io/router) | ~6 (file-based) |
| Language | TypeScript | ~5.9 (strict mode) |
| Authentication | [Clerk](https://clerk.com) (`@clerk/clerk-expo`) | ^2 |
| Database | [Supabase](https://supabase.com) (`@supabase/supabase-js`) | ^2 |
| Animations | `react-native-reanimated` | ~4 |
| Blur effects | `expo-blur` | ~15 |
| Fonts | Anton via `@expo-google-fonts/anton` | — |
| Styling | Vanilla React Native `StyleSheet` + design tokens | — |

## Why These Choices?

### Expo
Expo provides a managed workflow that abstracts iOS/Android build complexity. Expo Router gives file-based routing (similar to Next.js) which makes screen organisation and deep linking trivial.

### Clerk
Clerk was chosen for its out-of-the-box OTP (one-time password) email flow, which is ideal for a mobile audience that may not want passwords. It also provides session management and token storage through `expo-secure-store`.

### Supabase
Supabase provides a Postgres database with real-time subscriptions and Row-Level Security (RLS). The anon key can be safely bundled in the app because all data access is gated by RLS policies — users can only see and modify data they own or that has been explicitly shared with them.

### TypeScript Strict Mode
All code uses `strict: true`. No implicit `any`, no non-null assertions without justification. This prevents entire classes of runtime errors that are common in dynamic typed JavaScript.
