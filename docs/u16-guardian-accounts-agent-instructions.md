# Under-16 Guardian Accounts — AI Agent Instructions

## Context Preamble (include with every prompt)

```
I am building a React Native mobile app called Tranxfer Market using Expo ~54, 
Expo Router ~6, TypeScript, Clerk for auth (@clerk/clerk-expo ^2), and Supabase 
for database/storage (@supabase/supabase-js ^2). 

The app is a football recruitment platform with two user roles: player and scout. 
Scouts have a sub-type stored in scout_profiles.scout_type: 'club_scout' or 
'freelance_scout'. The lib/supabase.ts file exports a singleton Supabase client. 
Design tokens are in constants/theme.ts.

Key conventions:
- Never hardcode colours or spacing — always use constants/theme.ts tokens
- Always handle loading and error states on every data-fetching screen
- Follow React Native StyleSheet patterns — no inline styles
- Functional components with hooks only
- TypeScript strict — no implicit any
- All Supabase queries use the singleton from lib/supabase.ts
- user_id fields are TEXT (Clerk IDs), NOT UUID
- Internal PKs are UUID with gen_random_uuid()
- All timestamps are TIMESTAMPTZ with DEFAULT now()
- The Anton_400Regular font is loaded globally for display text
- App is mobile-only — no hover states, no desktop affordances
```

---

## Feature Overview

Under-16 players need guardian-managed accounts. The parent creates and owns the account, builds the player profile as a child entity under their Clerk session, and the player accesses a scoped "player mode" on the same device. No separate credentials, no child email required.

### Key Principles

1. **Parent is the Clerk user** — the child never authenticates independently
2. **Single device at launch** — parent and player share the same phone/tablet
3. **PIN-protected guardian mode** — a 4-digit PIN separates guardian settings from player view
4. **Contact gating** — scouts cannot message under-16 players unless the guardian permits it
5. **Endorsement loop is unaffected** — scouts can still endorse under-16 players without guardian approval (endorsements are non-contact actions)
6. **Consent is auditable** — every consent event is logged immutably with timestamp, IP, and consent text version

---

## Migration 009: Guardian Accounts

> **Run this first before any other task.** Apply to Supabase, then verify all tables, columns, indexes, and constraints.

```sql
-- 009_guardian_accounts.sql
-- Under-16 Guardian Accounts

-- 1. Add guardian columns to player_profiles
ALTER TABLE player_profiles ADD COLUMN guardian_user_id TEXT;
ALTER TABLE player_profiles ADD COLUMN is_minor BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE player_profiles ADD COLUMN guardian_pin_hash TEXT;
ALTER TABLE player_profiles ADD COLUMN contact_permission TEXT NOT NULL DEFAULT 'none' 
  CHECK (contact_permission IN ('none', 'endorsed_only', 'all_verified'));
ALTER TABLE player_profiles ADD COLUMN guardian_consent_active BOOLEAN NOT NULL DEFAULT false;

-- 2. Create guardian_profiles
CREATE TABLE guardian_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'legal_guardian')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_guardian_profiles_updated_at 
  BEFORE UPDATE ON guardian_profiles 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE guardian_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_profiles_select" ON guardian_profiles FOR SELECT USING (true);
CREATE POLICY "guardian_profiles_insert" ON guardian_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "guardian_profiles_update" ON guardian_profiles FOR UPDATE USING (true);

-- 3. Create parental_consents (immutable audit log — no UPDATE/DELETE policies)
CREATE TABLE parental_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_user_id TEXT NOT NULL REFERENCES guardian_profiles(user_id),
  player_profile_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('granted', 'withdrawn', 'updated')),
  consent_version TEXT NOT NULL,
  consent_text_snapshot TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parental_consents_select" ON parental_consents FOR SELECT USING (true);
CREATE POLICY "parental_consents_insert" ON parental_consents FOR INSERT WITH CHECK (true);

-- 4. Create guardian_contact_approvals
CREATE TABLE guardian_contact_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_user_id TEXT NOT NULL,
  player_profile_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  scout_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_profile_id, scout_user_id)
);

ALTER TABLE guardian_contact_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_contact_approvals_select" ON guardian_contact_approvals FOR SELECT USING (true);
CREATE POLICY "guardian_contact_approvals_insert" ON guardian_contact_approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "guardian_contact_approvals_update" ON guardian_contact_approvals FOR UPDATE USING (true);

-- 5. Indexes
CREATE INDEX idx_player_profiles_guardian ON player_profiles(guardian_user_id) WHERE guardian_user_id IS NOT NULL;
CREATE INDEX idx_parental_consents_guardian ON parental_consents(guardian_user_id);
CREATE INDEX idx_guardian_contact_approvals_player ON guardian_contact_approvals(player_profile_id);
```

**Verification checklist after running:**
- [ ] `player_profiles` has 5 new columns: `guardian_user_id`, `is_minor`, `guardian_pin_hash`, `contact_permission`, `guardian_consent_active`
- [ ] `guardian_profiles` table exists with RLS enabled
- [ ] `parental_consents` table exists with RLS enabled (SELECT + INSERT only — no UPDATE/DELETE)
- [ ] `guardian_contact_approvals` table exists with RLS enabled
- [ ] All 3 indexes created
- [ ] `handle_updated_at` trigger attached to `guardian_profiles`
- [ ] UNIQUE constraint on `(player_profile_id, scout_user_id)` in `guardian_contact_approvals`

> **Note on RLS:** All policies use `USING(true)` to match the current dev workaround (migration 008). These will be tightened alongside all existing policies when Clerk–Supabase JWT bridging is resolved.

---

## TypeScript Types

Add these to `types/index.ts`:

```typescript
export interface GuardianProfile {
  id: string;
  user_id: string;
  full_name: string;
  relationship: 'parent' | 'legal_guardian';
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ParentalConsent {
  id: string;
  guardian_user_id: string;
  player_profile_id: string;
  consent_type: 'granted' | 'withdrawn' | 'updated';
  consent_version: string;
  consent_text_snapshot: string;
  ip_address: string | null;
  user_agent: string | null;
  consented_at: string;
}

export interface GuardianContactApproval {
  id: string;
  guardian_user_id: string;
  player_profile_id: string;
  scout_user_id: string;
  status: 'approved' | 'blocked';
  created_at: string;
}

// Add to existing PlayerProfile type:
// guardian_user_id: string | null;
// is_minor: boolean;
// guardian_pin_hash: string | null;
// contact_permission: 'none' | 'endorsed_only' | 'all_verified';
// guardian_consent_active: boolean;
```

---

## Task Sequence

Work through these in order. Do not start a later task until the previous one is complete and tested.

---

### Task 1 — Run Migration

**Prompt:**
```
Run the SQL migration in this document (009_guardian_accounts.sql) against the 
Supabase database. After running, verify every item on the verification checklist. 
Report back with the results of each check.
```

---

### Task 2 — Add TypeScript Types

**Prompt:**
```
Add the GuardianProfile, ParentalConsent, and GuardianContactApproval interfaces 
to types/index.ts. Also add the 5 new guardian fields to the existing PlayerProfile 
interface: guardian_user_id (string | null), is_minor (boolean), guardian_pin_hash 
(string | null), contact_permission ('none' | 'endorsed_only' | 'all_verified'), 
and guardian_consent_active (boolean).
```

---

### Task 3 — Guardian Onboarding Screens

**Prompt:**
```
Create the guardian onboarding flow as new screens in the (auth) route group. 
This flow is entered after Clerk authentication when the user selects 
"I'm registering a player under 16" on the account type selection screen.

Create these screens in order:

1. app/(auth)/guardian-details.tsx
   - Full name text input (the guardian's name, not the player's)
   - Relationship selector: two large tappable cards — "Parent" and "Legal Guardian"
   - "Continue" button at bottom, disabled until both fields are filled
   - On submit: store values in local state / context (not DB yet)
   - Navigate to → guardian-consent

2. app/(auth)/guardian-consent.tsx
   - Display the consent text in a scrollable container:
     "By continuing, you confirm you are the parent or legal guardian of the 
     player you are about to register. You consent to Tranxfer Market processing 
     their personal data for the purpose of football recruitment visibility. You 
     can withdraw consent or delete all data at any time from Settings."
   - Below the text: a single green button "I Consent & Continue"
   - NO checkbox — the button IS the affirmative action
   - This is consent version 'v1.0' — store this string for the consent record
   - On tap: navigate to → guardian-pin

3. app/(auth)/guardian-pin.tsx
   - 4-digit PIN entry using 4 individual digit inputs (auto-advance on each digit)
   - Confirm PIN (enter twice, match check)
   - Explanatory text: "This PIN protects guardian settings. Don't share it with your child."
   - On confirm: hash the PIN with bcrypt (use expo-crypto or a JS bcrypt lib)
   - Navigate to → the existing player profile onboarding screen

All three screens must:
- Use ScreenBackground component for consistent dark navy background
- Use constants/theme.ts for all colours and spacing
- Use Anton_400Regular for headings, default font for body text
- Handle loading states on the continue/submit buttons
- Be mobile-only — no hover states

The guardian data (name, relationship, consent, PIN hash) should be stored in a 
React context or passed via route params so it's available when the player profile 
is created in the next step.
```

---

### Task 4 — Modify Account Type Selection

**Prompt:**
```
Modify the existing account type selection screen (the screen shown after Clerk 
auth where users choose "I'm a Player" or "I'm a Scout") to add a third option:

"I'm registering a player under 16"

This should be a third tappable card, visually consistent with the existing two 
options. Use a shield/guardian icon or similar from the existing icon set.

When tapped, navigate to app/(auth)/guardian-details.tsx (the first guardian 
onboarding screen from Task 3).

Do not change the existing Player or Scout flows.
```

---

### Task 5 — Player Profile Creation (Guardian Path)

**Prompt:**
```
Modify the player profile creation step (the existing onboarding screen where 
players enter their name, DOB, position, club, contract status) so that when it 
is reached via the guardian onboarding flow, it also:

1. Creates a row in guardian_profiles with the guardian's name, relationship, 
   and email (get email from Clerk user session)
2. Creates the player_profiles row with these additional fields set:
   - guardian_user_id = the Clerk user ID of the guardian (the authenticated user)
   - is_minor = true
   - guardian_pin_hash = the bcrypt hash from the PIN step
   - contact_permission = 'none' (default — most restrictive)
   - guardian_consent_active = true
3. Creates a row in parental_consents with:
   - guardian_user_id = the Clerk user ID
   - player_profile_id = the ID of the just-created player profile
   - consent_type = 'granted'
   - consent_version = 'v1.0'
   - consent_text_snapshot = the exact consent text shown on the consent screen
   - ip_address = null (we can't reliably get this client-side — fine for now)
   - user_agent = null (same reason)

All three inserts should happen in sequence. If any fails, show an error and 
do not proceed. On success, navigate to the main app in player mode.

The existing player onboarding flow (for adult players) must remain unchanged — 
only add the guardian fields when the guardian context/params are present.
```

---

### Task 6 — Guardian Mode Toggle + PIN Entry

**Prompt:**
```
Add a guardian mode toggle to the Settings screen.

1. In the Settings/profile screen, add a new menu item: "Switch to Guardian View"
   - Only visible when the current player profile has is_minor = true AND 
     guardian_user_id matches the current Clerk user ID
   - Tapping it opens a PIN entry modal

2. Create a PIN entry modal (components/GuardianPinModal.tsx):
   - 4-digit input, same style as the onboarding PIN screen
   - On submit: hash the entered PIN with bcrypt and compare against 
     player_profiles.guardian_pin_hash
   - On match: navigate to the guardian dashboard
   - On failure: show "Incorrect PIN" with shake animation, allow retry
   - 3 failed attempts: lock for 30 seconds with countdown

3. Create a "Back to Player View" button in the guardian dashboard header that 
   returns to the normal app without needing a PIN (going from guardian → player 
   is fine, it's player → guardian that needs the PIN gate).

Use the existing ScreenHeader component patterns. The guardian dashboard itself 
is built in the next task — for now, just navigate to a placeholder screen 
at app/(guardian)/dashboard.tsx that shows "Guardian Dashboard" with the 
back-to-player button.
```

---

### Task 7 — Guardian Dashboard

**Prompt:**
```
Build the guardian dashboard at app/(guardian)/dashboard.tsx with the following 
sections. The dashboard is a scrollable screen with section cards.

The guardian dashboard should first query player_profiles to get the managed 
player(s) — query WHERE guardian_user_id = current Clerk user ID AND is_minor = true.
If the guardian manages multiple players, show a horizontal player switcher at the 
top (pill tabs with player first names).

Sections:

1. OVERVIEW CARD
   - Player name, current card tier (Standard/Rising Star/Scout Pick/Elite)
   - Total profile views in last 30 days (count from a future profile_views table — 
     for now show "Coming soon" placeholder)
   - Pending contact requests count (query notifications WHERE type = 'contact_request' 
     AND read = false for this player)

2. CONTACT REQUESTS
   - List of scouts who have requested contact
   - Each row: scout name, affiliation (from scout_profiles), date requested
   - Two action buttons per row: "Approve" (green) and "Block" (red)
   - Approve: insert into guardian_contact_approvals with status = 'approved'
   - Block: insert with status = 'blocked'
   - Mark the notification as read after action

3. APPROVED CONTACTS
   - List from guardian_contact_approvals WHERE status = 'approved' for this player
   - Each row: scout name, affiliation, date approved
   - "Revoke" button per row (updates status to 'blocked')

4. CONTACT SETTINGS
   - Three tappable options showing the current contact_permission value:
     a) "No contact" (none) — scouts cannot message this player
     b) "Endorsed scouts only" (endorsed_only) — only approved scouts can message
     c) "All verified scouts" (all_verified) — any scout with a complete profile
   - Each option has a description line explaining what it means
   - Selecting an option updates player_profiles.contact_permission
   - Show current selection with a green checkmark

5. DATA & PRIVACY
   - "Export Player Data" button — for now show a toast "Export coming soon"
   - "Delete Player Profile" button (red, requires confirmation modal):
     - "Are you sure? This will permanently delete [player name]'s profile and 
       all associated data. This cannot be undone."
     - On confirm: delete the player_profiles row (CASCADE handles related data)
     - Navigate back to a "Profile Deleted" confirmation screen, then to app root
   - "Withdraw Consent" button (orange, requires confirmation modal):
     - "Withdrawing consent will deactivate [player name]'s profile. It will be 
       hidden from all scouts and messaging will be disabled. After 30 days, all 
       data will be permanently deleted. You can re-grant consent within 30 days 
       to reactivate."
     - On confirm: insert parental_consents row with consent_type = 'withdrawn', 
       set guardian_consent_active = false on player_profiles
     - Navigate to a confirmation screen showing the 30-day timeline

All sections must:
- Use ScreenBackground for consistent dark navy background
- Use theme.ts tokens for all colours and spacing
- Handle loading and error states
- Show empty states where appropriate ("No contact requests", "No approved contacts")
```

---

### Task 8 — Message Gating

**Prompt:**
```
Modify the messaging flow so that when a scout tries to message an under-16 player, 
the app checks the player's contact permissions before allowing it.

The check should happen when a scout taps the message/contact button on a player's 
card or profile. The logic:

1. Query the player_profiles row for the target player
2. If is_minor = false → normal messaging, no gate
3. If is_minor = true:
   a. If guardian_consent_active = false → show message: 
      "This profile is no longer active." Do not allow messaging.
   b. If contact_permission = 'none' → show message: 
      "This player's guardian has not enabled messaging. You can send a contact 
      request for the guardian to review."
      Show a "Request Contact" button. On tap:
      - Create a notification with type = 'contact_request' for the player's 
        guardian_user_id (create this as a new notification type — add to the 
        existing notification_type CHECK constraint if needed via ALTER TABLE)
      - Show confirmation: "Contact request sent. The guardian will be notified."
   c. If contact_permission = 'endorsed_only' → query guardian_contact_approvals 
      for this scout + player combination:
      - If status = 'approved' → allow messaging (normal flow)
      - If status = 'blocked' → show "Contact not available for this player."
      - If no row exists → same as 'none' above (show request button)
   d. If contact_permission = 'all_verified' → check the scout has a complete 
      scout_profiles row (full_name is not null). If yes, allow messaging. 
      If no, show "Complete your scout profile to contact players."

Create a reusable function/hook for this check: useContactPermission(playerId) 
that returns { canMessage: boolean, reason: string, canRequest: boolean }.

Also add a visual indicator on the PlayerCard component for under-16 players: 
a small shield icon next to the player's name (subtle, not prominent — we don't 
want to stigmatise younger players, but scouts should know contact may be gated).

Important: The endorsement flow is NOT affected. Scouts can still endorse under-16 
players without any guardian check. Only direct messaging is gated.
```

---

## Data Flow Summary

```
SIGN-UP (Guardian Path)
═══════════════════════
Clerk Auth → Type Selection → Guardian Details → Consent → PIN Setup → Player Profile
                                                                            │
                                                            Creates 3 rows:
                                                            ├─ guardian_profiles
                                                            ├─ player_profiles (with guardian fields)
                                                            └─ parental_consents (type: 'granted')


DAY-TO-DAY
══════════
┌─────────────────────────────────────────────────────┐
│  PLAYER MODE (default)                              │
│  - Views own card, feed, endorsements               │
│  - Can edit profile content (bio, media, position)  │
│  - CANNOT change contact settings                   │
│  - CANNOT delete account                            │
│  - CANNOT access guardian dashboard                 │
└────────────────────────┬────────────────────────────┘
                         │ Settings → "Switch to Guardian View" → PIN
┌────────────────────────▼────────────────────────────┐
│  GUARDIAN MODE                                      │
│  - Overview (views, requests, tier)                 │
│  - Contact requests (approve / block)               │
│  - Approved contacts (revoke)                       │
│  - Contact settings (none / endorsed / all)         │
│  - Data & privacy (export / delete / withdraw)      │
└─────────────────────────────────────────────────────┘


MESSAGING (Scout → Under-16 Player)
════════════════════════════════════
Scout taps message → is_minor check
  ├─ false → normal messaging
  └─ true → consent active?
       ├─ no → "Profile no longer active"
       └─ yes → contact_permission?
            ├─ 'none' → "Not enabled" + Request Contact button
            ├─ 'endorsed_only' → check guardian_contact_approvals
            │    ├─ approved → allow message
            │    ├─ blocked → "Not available"
            │    └─ no row → "Not enabled" + Request Contact button
            └─ 'all_verified' → scout profile complete?
                 ├─ yes → allow message
                 └─ no → "Complete your profile"
```

---

## Edge Cases to Handle

| Scenario | Behaviour |
|----------|-----------|
| Player turns 16 | Guardian relationship remains. App sends notification to guardian: "Your player is now 16. You can review guardian settings." No automatic removal of controls. |
| Guardian manages multiple players | Supported. Guardian dashboard shows player switcher. One guardian_profiles row, multiple player_profiles with same guardian_user_id. |
| Scout sends contact request, then guardian changes setting to 'all_verified' | Existing contact request notifications remain but are now redundant. Scout can message directly. No cleanup needed. |
| Guardian withdraws consent | Profile deactivated immediately (hidden from feed, messaging disabled). 30-day grace period before hard delete. Re-granting consent within 30 days reactivates. |
| Guardian deletes profile | Immediate hard delete. CASCADE handles parental_consents and guardian_contact_approvals. Player profile gone. |
| Scout tries to message after consent withdrawn | "This profile is no longer active." |

---

## Notification Type Addition

The existing notifications table uses a CHECK constraint for notification types. Add `'contact_request'` to the allowed values:

```sql
-- Run this as part of Task 8 or as a separate mini-migration
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('profile_view', 'message', 'shortlist', 'system', 'contact_request'));
```

---

## Files Created / Modified

| File | Action | Task |
|------|--------|------|
| `types/index.ts` | Modified — add guardian types + extend PlayerProfile | 2 |
| `app/(auth)/guardian-details.tsx` | New | 3 |
| `app/(auth)/guardian-consent.tsx` | New | 3 |
| `app/(auth)/guardian-pin.tsx` | New | 3 |
| Account type selection screen | Modified — add third option | 4 |
| Player profile onboarding screen | Modified — conditional guardian fields | 5 |
| `app/(guardian)/dashboard.tsx` | New | 6–7 |
| `components/GuardianPinModal.tsx` | New | 6 |
| Settings screen | Modified — add guardian toggle | 6 |
| `hooks/useContactPermission.ts` | New | 8 |
| Messaging flow | Modified — add contact gate | 8 |
| `components/PlayerCard.tsx` | Modified — shield icon for minors | 8 |

---

## Consent Text (Version v1.0)

Store this exact string in `parental_consents.consent_text_snapshot`:

```
By continuing, you confirm you are the parent or legal guardian of the player 
you are about to register. You consent to Tranxfer Market processing their 
personal data for the purpose of football recruitment visibility. You can 
withdraw consent or delete all data at any time from Settings.
```

When this text changes in a future version, bump `consent_version` to `'v1.1'` etc. Old consent records retain their original text — the table is an immutable audit log.
