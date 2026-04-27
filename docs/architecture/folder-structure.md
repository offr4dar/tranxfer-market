# Folder Structure

The project follows Expo Router's file-based routing conventions. Every file in `app/` maps directly to a screen or layout.

```
tranxfer-market/
│
├── app/                         # All screens and layouts (Expo Router)
│   ├── _layout.tsx              # Root layout — ClerkProvider, AuthGuard, Stack navigator
│   ├── index.tsx                # Entry redirect (→ splash or tabs)
│   ├── splash.tsx               # Animated splash / brand intro screen
│   │
│   ├── (auth)/                  # Auth route group — unauthenticated screens
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx          # Welcome / landing screen
│   │   ├── sign-in.tsx          # Email sign-in + OTP request
│   │   ├── verify-email.tsx     # OTP code verification
│   │   └── onboarding.tsx       # Multi-step role-based onboarding wizard
│   │
│   └── (tabs)/                  # Tab route group — authenticated screens
│       ├── _layout.tsx          # Tab navigator + FloatingTabBar
│       ├── feed.tsx             # Main player/agent/club feed
│       ├── search.tsx           # Search screen
│       ├── messages.tsx         # Conversations list
│       ├── notifications.tsx    # Notifications
│       ├── profile.tsx          # User profile
│       └── conversation/
│           └── [id].tsx         # Dynamic conversation thread
│
├── components/                  # Reusable UI components
│   ├── ScreenBackground.tsx     # Shared dark + texture background
│   ├── ScreenHeader.tsx         # Global header bar (logo + icons)
│   ├── FloatingTabBar.tsx       # Custom floating pill tab navigator
│   ├── LoginOverlay.tsx         # Auth-gate overlay for incomplete profiles
│   ├── PlayerCard.tsx           # Feed card for a player/agent/club
│   ├── FilterToggle.tsx         # Segmented role-filter buttons
│   ├── ConfirmCancelModal.tsx   # Reusable confirmation modal
│   ├── icons/
│   │   └── TabIcons.tsx         # SVG icons for the tab bar
│   └── shared/                  # Reserved for future shared components
│
├── constants/
│   └── theme.ts                 # Colours, spacing, and radius design tokens
│
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   ├── pendingProfile.ts        # Onboarding in-memory state store
│   └── uk-outcodes.ts           # UK postcode outward-code lookup
│
├── types/
│   └── index.ts                 # Shared TypeScript types
│
├── assets/                      # Static assets (images, SVGs, fonts)
│
├── supabase/
│   └── migrations/              # SQL migration files (001–008)
│
├── scripts/                     # Utility / maintenance scripts
├── stubs/                       # Dev stubs / seed data
├── docs/                        # GitBook documentation (this folder)
├── schema.sql                   # Full DB schema snapshot
├── app.json                     # Expo app config
├── metro.config.js              # Metro bundler config
├── tsconfig.json
├── package.json
└── .env.local                   # Local env vars (not committed)
```

## Key Conventions

- **Route groups** (`(auth)`, `(tabs)`) group screens logically without affecting the URL/path.
- **Dynamic segments** (`[id]`) create parameterised routes — e.g. `/conversation/abc-123`.
- **`_layout.tsx`** files define wrapping layouts for their group — navigation, providers, etc.
- All components use `constants/theme.ts` tokens — **never hardcode colours or spacing**.
- The `lib/supabase.ts` singleton must always be used — never instantiate a new Supabase client.
