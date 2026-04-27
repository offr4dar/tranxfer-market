# Migrations

All database schema changes are managed as sequential SQL migration files in `supabase/migrations/`. Migrations must be applied in order.

## Applied Migrations

| # | File | Purpose |
|---|---|---|
| 001 | `001_initial_schema.sql` | Core tables: `profiles`, `player_profiles`, `agent_profiles`, `club_profiles` |
| 002 | `002_agent_profiles_enhance.sql` | Enhanced agent/scout fields (regions covered, years experience) |
| 003 | `003_scout_fields_merged.sql` | Scout and agent field consolidation into a single table |
| 004 | `004_drop_agent_age.sql` | Removes deprecated `age` column from `agent_profiles` |
| 005 | `005_messages.sql` | `messages` and `conversations` tables |
| 006 | `006_notifications.sql` | `notifications` table |
| 007 | `007_select_policies.sql` | Basic RLS SELECT policies for all tables |
| 008 | `008_mobile_rls_policies.sql` | Full anon-client read/write RLS for the mobile app |

## Upcoming Migrations

| # | File | Purpose | Phase |
|---|---|---|---|
| 009 | `009_connections.sql` | `connections` table — social graph | Phase 1 |
| 010 | `010_watchlists.sql` | `watchlist_items` — scout shortlists | Phase 2 |
| 011 | `011_profile_views.sql` | `profile_views` — anonymous view tracking | Phase 2 |
| 012 | `012_placements.sql` | `placements` — scout placement portfolio | Phase 2 |
| 013 | `013_videos.sql` | `player_videos` — skills video upload | Phase 3 |
| 014 | `014_challenges.sql` | `challenges` — weekly video challenges | Phase 3 |
| 015 | `015_push_tokens.sql` | `push_tokens` — Expo Push Notification tokens | Phase 3 |
| 016 | `016_fantasy.sql` | Fantasy draft tables | Phase 4 |

## How to Apply Migrations

1. Log into your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste and run each migration file in order

Alternatively, if you have the Supabase CLI configured:

```bash
supabase db push
```
