# RLS Policies

All data access in Tranxfer Market is protected by **Row-Level Security (RLS)** in Supabase. RLS is enabled on every table. The mobile client connects with the anon key — policies determine what each user can see and do.

## Core Principle

> Users can only read and write data they own, or data that has been explicitly made accessible to them by a policy.

The Clerk user ID is mapped to a Supabase `profiles.id` via the `clerk_id` column. All `auth.uid()` references in policies correspond to the authenticated Supabase user, not the Clerk user directly.

## Applied Policies (Migrations 007 & 008)

### `profiles`

| Operation | Policy |
|---|---|
| SELECT | Any authenticated user can read all profiles |
| INSERT | Only the owner (`clerk_id = auth.uid()`) can create their own profile |
| UPDATE | Only the owner can update their own profile |

### `player_profiles`, `agent_profiles`, `club_profiles`

| Operation | Policy |
|---|---|
| SELECT | Any authenticated user can read all role profiles |
| INSERT | Authenticated user can insert if they own the parent `profiles` row |
| UPDATE | Authenticated user can update if they own the parent `profiles` row |

### `messages`

| Operation | Policy |
|---|---|
| SELECT | User can read messages in conversations where they are a participant |
| INSERT | User can insert messages in conversations where they are a participant |

### `conversations`

| Operation | Policy |
|---|---|
| SELECT | User can read conversations where their `profile_id` is in `participant_ids` |
| INSERT | Authenticated users can create new conversations |

### `notifications`

| Operation | Policy |
|---|---|
| SELECT | User can only read their own notifications (`profile_id = auth.uid()`) |
| UPDATE | User can mark their own notifications as read |

## Upcoming Policies

When migration 009 (`connections`) is applied:

- **SELECT:** User can see connections where they are `requester_id` OR `receiver_id`
- **INSERT:** Authenticated user can only insert rows where `requester_id = auth.uid()`
- **UPDATE:** Receiver can update connection status; requester cannot
- **DELETE:** Either party can delete (withdraw/remove connection)
