# Notifications

**File:** `app/(tabs)/notifications.tsx`

The Notifications screen lists in-app activity notifications for the authenticated user.

## Current State

The screen is scaffolded. The `notifications` table exists in Supabase (migration 006). **Full wiring is planned in [Phase 3, Feature 11](../roadmap/phase-3.md).**

## Database Table

```sql
-- Created by migration 006_notifications.sql
notifications (
  id uuid,
  profile_id uuid,   -- recipient
  type text,         -- 'connection_request' | 'message' | 'profile_view' | etc.
  title text,
  body text,
  read boolean DEFAULT false,
  created_at timestamptz
)
```

## Planned Triggers

| Event | Notification Type |
|---|---|
| Someone views your profile | `profile_view` |
| Connection request received | `connection_request` |
| Connection request accepted | `connection_accepted` |
| New message received | `new_message` |
| New weekly challenge posted | `new_challenge` |

## Push Notifications

In Phase 3, Expo Push Notifications will be wired up alongside in-app notifications. Push tokens will be stored in a `push_tokens` table and a Supabase Edge Function will handle delivery.
