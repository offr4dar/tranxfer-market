# Authentication Overview

Tranxfer Market uses **Clerk** for all authentication. The flow is email-based with OTP (one-time password) verification — no passwords required.

## Auth Stack

| Component | Technology |
|---|---|
| Auth provider | [Clerk](https://clerk.com) (`@clerk/clerk-expo` ^2) |
| Token storage | `expo-secure-store` (encrypted on-device) |
| Session management | Clerk's built-in session tokens |

## Auth Screens

| Screen | File | Purpose |
|---|---|---|
| Welcome | `app/(auth)/welcome.tsx` | Landing screen for unauthenticated users — "Get Started" and "Sign In" CTAs |
| Sign In | `app/(auth)/sign-in.tsx` | Email entry, triggers OTP send via Clerk |
| Verify Email | `app/(auth)/verify-email.tsx` | 6-digit OTP entry with resend support |
| Onboarding | `app/(auth)/onboarding.tsx` | Role-based profile wizard — runs once after first sign-in |

## Auth Flow Diagram

```
App opens
    │
    ▼
AuthGuard checks Clerk session
    │
    ├─── No session ──────▶ (auth)/welcome
    │                              │
    │                         "Get Started"
    │                              │
    │                         sign-in.tsx
    │                              │
    │                         Clerk OTP sent
    │                              │
    │                         verify-email.tsx
    │                              │
    │                    Session created in Clerk
    │                              │
    │                    Check Supabase profiles table
    │                              │
    │               ┌─── Profile exists & complete ──▶ (tabs)/feed
    │               │
    │               └─── No profile ──▶ onboarding.tsx
    │                                         │
    │                               Profile written to Supabase
    │                                         │
    │                                    (tabs)/feed
    │
    └─── Session exists ──▶ (tabs)/feed
```

## Related Pages

- [Sign-In Flow](sign-in-flow.md) — technical breakdown of the OTP flow
- [Onboarding Wizard](onboarding-wizard.md) — multi-step wizard details
- [Auth Guard](auth-guard.md) — how route protection works
