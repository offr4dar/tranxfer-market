# Tranxfer Market — Database Schema

> Two-sided football marketplace: Players ↔ Clubs/Scouts/Agents  
> Stack: PostgreSQL (Supabase) · Auth: Clerk · Payments: Stripe

---

## Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TRANXFER MARKET — ERD                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                ┌──────────────┐
                                │    USERS     │ ← synced from Clerk
                                │──────────────│
                                │ id (PK)      │
                                │ clerk_user_id│
                                │ email        │
                                │ account_type │ ← player|club|scout|agent
                                │ is_active    │
                                └──────┬───────┘
                                       │ 1
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
                    │ 0..1             │ 0..1              │ many
                    ▼                  ▼                   ▼
          ┌──────────────────┐  ┌──────────────┐  ┌────────────────────┐
          │  PLAYER_PROFILES │  │SUBSCRIPTIONS │  │ORGANISATION_MEMBERS│
          │──────────────────│  │──────────────│  │────────────────────│
          │ id (PK)          │  │ id (PK)      │  │ user_id (FK)       │
          │ user_id (FK)     │  │ user_id (FK) │  │ organisation_id(FK)│
          │ display_name     │  │ org_id (FK)  │  │ role               │
          │ primary_position │  │ tier         │  └────────┬───────────┘
          │ contract_status  │  │ status       │           │
          │ is_featured      │  │ stripe_sub_id│           │ many
          │ profile_comp_%   │  └──────────────┘           ▼
          └────────┬─────────┘                   ┌─────────────────────┐
                   │                             │   ORGANISATIONS     │
          ┌────────┼────────────────────────┐    │─────────────────────│
          │        │                        │    │ id (PK)             │
          │ 1..n   │ 1..n         1..n      │    │ name                │
          ▼        ▼              ▼         │    │ org_type            │
  ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │ verified_status     │
  │  MEDIA   │ │CAREER    │ │PROFILE   │   │    │ stripe_customer_id  │
  │──────────│ │HISTORY   │ │VIEWS     │   │    └─────────────────────┘
  │ id (PK)  │ │──────────│ │──────────│   │
  │ player_id│ │ player_id│ │ player_id│   │
  │ media_type│ │ club_name│ │ viewer_  │   │
  │ url      │ │ league   │ │ user_id  │   │
  └──────────┘ │ goals    │ │ viewed_at│   │
               │ assists  │ └──────────┘   │
               └──────────┘                │
                                           │
         ┌─────────────────────────────────┘
         │
         │  Clubs contact players (gated by subscription)
         ▼
┌─────────────────┐       ┌──────────────────┐
│    CONTACTS     │──────▶│  CONVERSATIONS   │
│─────────────────│       │──────────────────│
│ initiator_user  │       │ player_user_id   │
│ initiator_org   │       │ club_user_id     │
│ player_id (FK)  │       │ last_message_at  │
│ status          │       └────────┬─────────┘
└─────────────────┘                │ 1..n
                                   ▼
                          ┌────────────────┐
                          │    MESSAGES    │
                          │────────────────│
                          │ conversation_id│
                          │ sender_id      │
                          │ body           │
                          │ status         │
                          └────────────────┘

┌──────────────┐       ┌───────────────────┐
│  SHORTLISTS  │──────▶│ SHORTLIST_PLAYERS │
│──────────────│       │───────────────────│
│ owner_user_id│       │ shortlist_id (FK) │
│ owner_org_id │       │ player_id (FK)    │
│ name         │       │ notes (private)   │
│ is_private   │       │ rating (1-5)      │
└──────────────┘       └───────────────────┘

┌──────────────────┐    ┌──────────────┐
│  PLAYER_BOOSTS   │    │  AUDIT_LOG   │
│──────────────────│    │──────────────│
│ player_id (FK)   │    │ actor_id     │
│ boost_type       │    │ action       │
│ ends_at          │    │ target_type  │
│ stripe_payment_id│    │ old/new vals │
└──────────────────┘    └──────────────┘
```

---

## Table Summary

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `users` | Clerk-synced user base | Medium |
| `player_profiles` | Player football identity | Medium |
| `player_career_history` | Structured career records | High |
| `organisations` | Clubs, agencies, scout networks | Low |
| `organisation_members` | User → org membership | Low |
| `media` | Videos, photos, documents | High |
| `subscriptions` | Stripe subscription tracking | Low |
| `player_boosts` | Paid visibility boosts | Low |
| `contacts` | Club → player contact requests | Medium |
| `shortlists` | Named player shortlists | Low |
| `shortlist_players` | Players within shortlists | Medium |
| `profile_views` | View analytics events | Very High |
| `conversations` | Message threads | Medium |
| `messages` | Individual messages | High |
| `notifications` | In-app notifications | High |
| `audit_log` | Admin audit trail | High |

---

## Setup Instructions

### 1. Prerequisites
- Supabase project (PostgreSQL 15+)
- Clerk account with webhook configured
- Stripe account

### 2. Run the Schema

In Supabase SQL Editor or via `psql`:

```bash
psql "$DATABASE_URL" -f schema.sql
```

Or paste directly into **Supabase Studio → SQL Editor → New Query**.

### 3. Configure Supabase Auth with Clerk

Supabase uses JWTs — configure Clerk as the JWT provider:

1. In Clerk Dashboard → **JWT Templates** → create a new Supabase template
2. Set the signing key to your Supabase JWT secret
3. Add claim: `"sub"` = `"{{user.id}}"` (Clerk user ID)
4. In Supabase: **Settings → Auth → JWT Secret** — paste your Clerk signing key

The `auth_user_id()` SQL function maps `auth.jwt() ->> 'sub'` → internal `users.id`.

### 4. Configure Clerk Webhook

1. Clerk Dashboard → **Webhooks** → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/clerk`
3. Events to subscribe:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
4. Copy the **Signing Secret** → set as `CLERK_WEBHOOK_SECRET` env var

### 5. Configure Stripe Webhook

1. Stripe Dashboard → **Webhooks** → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 6. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs (map to tiers)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
STRIPE_PRICE_PLAYER_BOOST=price_...
```

### 7. Supabase Storage Buckets

Create these buckets in **Supabase Storage**:

```
player-photos      → Public, 5MB limit, image/* only
highlight-reels    → Public, 500MB limit, video/* only
match-clips        → Public, 200MB limit, video/* only
verification-docs  → Private, 10MB limit, PDF/image
org-logos          → Public, 2MB limit, image/* only
```

Set CORS policies to allow your domain.

### 8. Realtime Subscriptions (optional)

Enable Realtime for these tables in Supabase Dashboard:

- `messages` — live chat
- `notifications` — live notification badge
- `contacts` — live contact request updates

---

## Key Design Decisions

### 1. Clerk User ID as the Bridge
We store `clerk_user_id` (e.g. `user_2abc...`) in the `users` table and sync via webhooks. The `auth_user_id()` SQL function maps the JWT `sub` claim back to our internal UUID. This keeps auth fully Clerk-managed while giving us relational integrity.

### 2. Private Data Protection
Sensitive fields (`agent_contact`, `current_weekly_wage_gbp`) live in `player_profiles` but are **only returned** via conditional SQL (`CASE WHEN has_active_subscription() THEN ... ELSE NULL END`). RLS policies and API-layer guards provide double protection.

### 3. Subscription Gating via SQL Functions
`has_active_subscription()` is a `SECURITY DEFINER` function that checks subscription status. This can be called inside RLS policies or API queries, keeping business logic in one place.

### 4. Profile Views Deduplication
The `UNIQUE NULLS NOT DISTINCT` constraint on `profile_views` prevents the same user from logging more than one view per player per hour. This keeps analytics meaningful without requiring application-layer dedup.

### 5. Featured Players via Trigger
When a `player_boost` record is inserted/updated, a trigger automatically syncs `is_featured` and `featured_until` on `player_profiles`. Search queries can simply `ORDER BY is_featured DESC` without joining to boosts.

### 6. Denormalised Counters
`profile_views_count` on `player_profiles` is maintained by a trigger for O(1) display. Raw events still exist in `profile_views` for analytics. Same pattern used for `video_highlights_count`.

### 7. JSONB for Flexible Data
`previous_clubs` uses JSONB for flexibility (different data exists for different clubs). Structured career data lives in `player_career_history`. Both are indexed.

### 8. GIN Indexes for Array Search
`secondary_positions football_position[]` uses a GIN index enabling fast `'ST' = ANY(secondary_positions)` queries without full table scans.

---

## Subscription Tier Capabilities

| Feature | Free (Player) | Boosted (Player) | Free (Club) | Starter | Pro | Elite |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Create profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Appear in search | ✅ | ✅ | — | — | — | — |
| View profile analytics | ❌ | ✅ | — | — | — | — |
| Featured in search | ❌ | ✅ | — | — | — | — |
| Search players | — | — | ✅ | ✅ | ✅ | ✅ |
| Contact players | — | — | ❌ | ✅ | ✅ | ✅ |
| View agent details | — | — | ❌ | ✅ | ✅ | ✅ |
| Shortlists | — | — | 1 | 3 | 10 | Unlimited |
| Messaging | — | — | ❌ | ✅ | ✅ | ✅ |

---

## Recommended Supabase Features

1. **Supabase Storage** — Player videos and photos. Use signed URLs for private docs.
2. **Supabase Realtime** — Live messaging and notification badges via Postgres CDC.
3. **Supabase Edge Functions** — Run Stripe webhook handler close to the database.
4. **pg_cron** — Nightly job to expire `player_boosts` and sync `is_featured = FALSE`.
5. **Supabase Vault** — Store Stripe keys and webhook secrets securely.
6. **Database Webhooks** — Trigger Resend/Postmark emails on `contacts` status changes.
7. **Point-in-Time Recovery** — Enable for production; player profiles are critical data.
8. **Connection Pooling (PgBouncer)** — Enable transaction mode for serverless Next.js.

---

## Indexes Reference

### Player Search (most common)
```sql
-- Primary position search
idx_players_primary_pos

-- Secondary position array search (GIN)
idx_players_secondary_pos

-- Composite search index
idx_players_search_composite (position, nationality, contract_status, is_searchable, is_featured)

-- Age range (DOB)
idx_players_dob

-- Name fuzzy search (trigram)
idx_players_name_trgm
```

### Analytics
```sql
idx_views_player_date   -- Profile views by player + time
idx_views_viewed_at     -- Global views timeline
```

### Messaging
```sql
idx_messages_convo_id   -- Messages in a thread
idx_messages_unread     -- Unread count queries
idx_convos_last_msg     -- Inbox ordered by last message
```

---

*Schema version: 1.0 | Last updated: 2026-04*
