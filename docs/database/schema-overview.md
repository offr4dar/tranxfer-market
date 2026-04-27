# Schema Overview

Tranxfer Market uses **Supabase (Postgres)** as its database. All data access from the mobile client runs under Row-Level Security (RLS) — the anon key cannot bypass policies.

## Core Tables

### `profiles`
The central user record. One row per user, keyed to their Clerk user ID.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `clerk_id` | text | Clerk user ID — used to link auth to data |
| `role` | text | `'player'` \| `'agent'` \| `'club'` |
| `full_name` | text | Display name |
| `nationality` | text | Country |
| `postcode` | text | UK outward code (e.g. `SW1A`) |
| `profile_picture_url` | text | Public URL from Supabase Storage |
| `created_at` | timestamptz | Row creation timestamp |

### `player_profiles`
Role-specific fields for players. Linked to `profiles` via `profile_id`.

| Column | Type | Description |
|---|---|---|
| `profile_id` | uuid | FK → `profiles.id` |
| `position` | text | Primary position |
| `secondary_position` | text | Optional secondary position |
| `preferred_foot` | text | `'left'` \| `'right'` \| `'both'` |
| `height` | integer | Height in cm |
| `age` | integer | Player age |

### `agent_profiles`
Role-specific fields for agents and scouts.

| Column | Type | Description |
|---|---|---|
| `profile_id` | uuid | FK → `profiles.id` |
| `agency_name` | text | Agency or employer name |
| `licence_number` | text | Optional FIFA/FA licence number |
| `regions_covered` | text[] | Array of regions covered |
| `years_experience` | integer | Years in the industry |

### `club_profiles`
Role-specific fields for clubs.

| Column | Type | Description |
|---|---|---|
| `profile_id` | uuid | FK → `profiles.id` |
| `club_name` | text | Official club name |
| `league` | text | Current league / level |
| `location` | text | Town or postcode |
| `contact_name` | text | Primary contact person |

### `conversations`
One row per conversation thread between two users.

| Column | Type |
|---|---|
| `id` | uuid |
| `participant_ids` | uuid[] |
| `last_message_at` | timestamptz |
| `created_at` | timestamptz |

### `messages`
Individual messages within a conversation.

| Column | Type |
|---|---|
| `id` | uuid |
| `conversation_id` | uuid (FK) |
| `sender_id` | uuid (FK → profiles) |
| `body` | text |
| `read` | boolean |
| `created_at` | timestamptz |

### `notifications`
In-app notification records for each user.

| Column | Type |
|---|---|
| `id` | uuid |
| `profile_id` | uuid (FK → profiles) — recipient |
| `type` | text |
| `title` | text |
| `body` | text |
| `read` | boolean |
| `created_at` | timestamptz |

## Full Schema

The complete schema snapshot is available in the repository root at `schema.sql`.
