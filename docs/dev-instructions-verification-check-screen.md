# Task: Scout Verification Checklist Screen

## Overview

A dedicated full-screen checklist that every new scout sees immediately after account creation. It shows the four verification steps required to become a verified scout on Tranxfer Market, with clear cost breakdowns and sequential gating. The identity check (step 2) is triggered in-app via the ComplyCube React Native SDK. The screen blocks access to the rest of the app until all steps are complete — or allows limited access with a persistent banner prompting the scout to finish.

---

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

The Anton_400Regular font is loaded globally. Use fontFamily: 'Anton_400Regular' 
for display text. All other text uses default RN font stack.

User IDs come from Clerk (useAuth().userId) and are TEXT type in Supabase — not UUID.

The existing slide-up panel pattern is in components/PerformanceLogSheet.tsx — 
use the same animation, PanResponder, and styling approach for any info sheets.
```

---

## Route & Navigation

Create `app/verify.tsx` as a new top-level route (not inside `(tabs)`).

After a scout completes sign-up (Clerk auth + scout type selection), the app checks `scout_profiles.layer1_verified`. If `false`, redirect to `/verify` instead of the tab navigator. The scout cannot navigate away from this screen via the tab bar — the tab bar is not rendered on this route.

In `app/_layout.tsx`, add routing logic:

```
if (user is authenticated AND account_type === 'scout' AND layer1_verified === false):
  redirect to /verify
else:
  render normal (tabs) layout
```

Once all three checks are passed (`layer1_verified` flips to `true` via the generated column), the scout is redirected to the main app.

---

## Screen Structure

The screen is a single ScrollView with the following sections, top to bottom:

### Header

```
← Back (only if scout came from settings, not from initial sign-up)

GET VERIFIED                          (Anton_400Regular, 20px, uppercase)
Complete these steps to appear as a   (14px, Colors.textSecondary)
verified scout on Tranxfer Market.
```

### Step 1 — Create account

```
State: ALWAYS COMPLETE (scout has already signed up to reach this screen)

[✓ green circle]  Create account                    Done
                   Sign up and choose your scout type.
```

This step is purely confirmatory. It shows the scout they've already made progress, which reduces the psychological friction of seeing a checklist with remaining work.

### Step 2 — Verify your identity

```
State: ACTIVE (if step 1 done and id_verified === false)
        COMPLETE (if id_verified === true)
        
[2 blue circle]   Verify your identity               Next
                   Scan your ID and take a selfie. 
                   Takes ~2 minutes. We cover the cost.
                   
                   ┌─ What happens ──────────────────┐
                   │ You'll be asked to photograph    │
                   │ your passport or driving licence,│
                   │ then take a live selfie. Our     │
                   │ provider checks they match.      │
                   └─────────────────────────────────┘
                   
                   FREE — paid by Tranxfer Market
```

The blue info box ("What happens") only renders when this step is the active step. Once complete, it collapses to a single completed row.

### Step 3 — DBS check

```
State: LOCKED (if id_verified === false)
        ACTIVE (if id_verified === true and dbs_verified === false)
        COMPLETE (if dbs_verified === true)
        
[3 dim circle]    DBS check                    ℹ️    Locked
                   Enhanced DBS with Children's
                   Barred List. Required for 
                   safeguarding.
                   
                   £55–£96 — you pay (one-off)
                   
                   Already on DBS Update Service?
                   Just enter your certificate number.
```

The (i) icon opens the `DbsInfoSheet` slide-up panel (created in the previous task's Step 4). When this step becomes active, it expands to show the DBS certificate number input field, the Update Service toggle, and a submit button — inline, not on a separate screen.

### Step 4 — FA Safeguarding course

```
State: LOCKED (if dbs_verified === false)
        ACTIVE (if dbs_verified === true and safeguarding_certified === false)
        COMPLETE (if safeguarding_certified === true)
        
[4 dim circle]    FA Safeguarding course             Locked
                   Complete The FA's online 
                   safeguarding course (~2 hours).
                   
                   FREE — via The FA's learning platform
```

When active, this step shows:
- A link/button to open The FA's safeguarding course (external URL: `https://learn.englandfootball.com`)
- A confirmation toggle: "I have completed the FA Safeguarding Children course"
- A certificate reference field (optional, for future verification)

### Cost summary

Rendered below all four steps, always visible regardless of progress:

```
┌─ Cost summary ──────────────────────────────────────┐
│                                                      │
│  Identity check                    Free (we pay)     │
│  DBS check (new applicants)        £55–£96           │
│  DBS check (existing + Update)     £0                │
│  FA Safeguarding course            Free              │
│  ───────────────────────────────────────────────      │
│  Ongoing (DBS Update Service)      £16/year          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Styling: muted background, compact rows, green for free items, amber/orange for paid items.

### Primary CTA button

The button label changes based on the current active step:

| Active step | Button label | Action |
|-------------|-------------|--------|
| Step 2 | VERIFY MY IDENTITY | Launches ComplyCube SDK |
| Step 3 | SUBMIT DBS DETAILS | Validates and saves DBS fields |
| Step 4 | CONFIRM SAFEGUARDING | Saves safeguarding declaration |
| All done | CONTINUE TO APP | Navigates to (tabs) |

Below the button, a muted line: "Step X of 4 — [brief description of what happens next]"

---

## Step 2: ComplyCube SDK Integration

This is the most technically involved step. Here is the complete integration architecture.

### Package

```
npm install @complycube/react-native
```

iOS requires CocoaPods:

```ruby
# ios/Podfile
pod 'ComplyCubeMobileSDK'
```

Android requires Maven Central:

```gradle
// android/build.gradle
repositories {
    mavenCentral()
}
```

### Architecture

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────┐
│  React Native │────▶│  Supabase Edge Fn  │────▶│  ComplyCube  │
│  (app/verify) │     │  create-idv-session │     │  API         │
│               │◀────│                    │◀────│              │
│  SDK launches │     │  Webhook receiver  │     │  Webhook     │
│  natively     │     │  update-idv-result  │     │  on complete │
└──────────────┘     └────────────────────┘     └──────────────┘
```

### Flow

1. Scout taps "VERIFY MY IDENTITY"
2. App calls a Supabase Edge Function (`create-idv-session`):
   - Edge Function calls ComplyCube API to create a client: `POST /v1/clients`
   - Edge Function creates an SDK token: `POST /v1/tokens`
   - Returns `{ clientId, sdkToken }` to the app
3. App initialises the ComplyCube SDK:

```typescript
import ComplyCube from '@complycube/react-native'

const result = await ComplyCube.mount({
  clientId: session.clientId,
  token: session.sdkToken,
  stages: [
    { name: 'intro', heading: 'Verify your identity' },
    { name: 'documentCapture', options: {
      documentTypes: {
        passport: true,
        driving_licence: true,
      },
      liveCapture: true,
    }},
    { name: 'faceCapture', options: {
      mode: 'photo',  // passive liveness — no video challenge needed
    }},
    { name: 'completion', heading: 'Verification submitted' },
  ],
  // Match Tranxfer Market's dark theme
  appearance: {
    primaryColor: '#FFFFFF',      // CTA button colour
    backgroundColor: '#111111',   // Match app background
    textColor: '#FFFFFF',
  },
  onSuccess: (data) => {
    // data.documentId and data.livePhotoId available
    // Backend handles the actual check via webhook
    setIdCheckSubmitted(true)
  },
  onError: (error) => {
    setIdCheckError(error.message)
  },
  onCancel: () => {
    // Scout dismissed the SDK — do nothing, they can retry
  },
})
```

4. ComplyCube runs the document check and identity check server-side
5. ComplyCube sends a webhook to Supabase Edge Function (`update-idv-result`):

```typescript
// Edge Function: update-idv-result
// Triggered by ComplyCube webhook (check.completed event)

const { clientId, checkId, result } = parseWebhook(request)

if (result.outcome === 'clear') {
  await supabase
    .from('scout_profiles')
    .update({
      id_verified: true,
      id_verified_at: new Date().toISOString(),
      id_verification_ref: checkId,
    })
    .eq('complycube_client_id', clientId)
}
```

6. App polls `scout_profiles.id_verified` every 5 seconds after SDK closes (or use Supabase Realtime subscription on the column). When `true`, checklist updates — step 2 shows complete, step 3 unlocks.

### Additional database column

Add to migration `021_scout_verification_fields.sql`:

```sql
ALTER TABLE public.scout_profiles
  ADD COLUMN IF NOT EXISTS complycube_client_id TEXT;

COMMENT ON COLUMN public.scout_profiles.complycube_client_id
  IS 'PRIVATE — ComplyCube client ID for webhook matching. Never exposed in public queries.';
```

### Environment variables

```
COMPLYCUBE_API_KEY=<your-api-key>        # Server-side only (Edge Function)
COMPLYCUBE_WEBHOOK_SECRET=<your-secret>  # For webhook signature verification
```

These are stored in Supabase Edge Function secrets, never in the client app.

### ID check method summary

| Component | Method | Detail |
|-----------|--------|--------|
| Document capture | Photo of passport or UK driving licence | Automatic OCR extracts name, DOB, document number |
| Liveness detection | Passive selfie (PAD Level 2 certified) | Single photo, no video challenge — low friction |
| Face matching | Compares selfie to document photo | Returns confidence score 0-100% |
| Result | Pass / Fail | Webhook fires with outcome |
| Fallback | Manual review queue | If automated check is inconclusive, ComplyCube's human reviewers assess |
| Time to complete | ~90 seconds (scout side) | Backend check completes within 3-10 seconds after submission |

### Why passive liveness over active liveness

Active liveness (video with head-turn / smile challenges) provides marginally higher assurance but adds significant friction — it takes 20+ seconds longer and has higher failure rates on lower-end devices. For Tranxfer Market's use case (identity confirmation, not financial KYC), passive liveness with PAD Level 2 certification is the right balance. If the platform later moves into financial transactions (e.g., agent fee processing), upgrading to active liveness would be appropriate at that point.

---

## Step 3: DBS Check — Inline Form

When step 3 becomes active (after identity is verified), the checklist item expands to show an inline form. This is not a separate screen — it renders within the step's card area.

### Form fields

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Which situation are you in?                         │
│                                                      │
│  ○  I have an Enhanced DBS and I'm on the           │
│     Update Service                                   │
│                                                      │
│  ○  I need to apply for a new Enhanced DBS          │
│     (or my existing one isn't on the Update Service) │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**If "I have an Enhanced DBS and I'm on the Update Service":**

```
DBS certificate number
┌───────────────────────────────────────┐
│ Enter 12-digit number                 │
└───────────────────────────────────────┘
Found on your DBS certificate.

[SUBMIT DBS DETAILS]
```

On submit:
- Validate exactly 12 digits
- Write to `scout_profiles`: `dbs_certificate_number`, `dbs_on_update_service: true`
- Set `dbs_verified: false` (platform verifies via DBS Update Service check — future integration)
- Show status: "⏳ We'll verify your certificate via the DBS Update Service. This usually takes a few minutes."

For MVP: manually mark `dbs_verified = true` after admin review. Future: automate via DBS Update Service API.

**If "I need to apply for a new Enhanced DBS":**

```
┌─ What to do ───────────────────────────────────────┐
│                                                     │
│  1. Apply for an Enhanced DBS check through our     │
│     partner or any DBS provider.                    │
│                                                     │
│  2. Register for the DBS Update Service             │
│     immediately — within 30 days of your            │
│     certificate being issued.                       │
│                                                     │
│  3. Once you have your certificate, come back       │
│     and enter your 12-digit number here.            │
│                                                     │
│  [APPLY FOR DBS CHECK →]  (opens external link)     │
│                                                     │
│  Typical cost: £55–£96 (you pay)                    │
│  Processing time: 5–10 working days                 │
│                                                     │
└─────────────────────────────────────────────────────┘

I already have my certificate number:
┌───────────────────────────────────────┐
│ Enter 12-digit number                 │
└───────────────────────────────────────┘

Are you on the DBS Update Service?
  ○ Yes    ○ No

[SUBMIT DBS DETAILS]
```

If scout selects "No" for Update Service, show a warning:

```
⚠ You must be registered on the DBS Update Service for us to 
verify your certificate. If your certificate was issued within 
the last 30 days, you can still register at gov.uk/dbs-update-service. 
If it's older than 30 days, you'll need a new DBS check. Tap ℹ️ 
for full details.
```

### (i) info icon behaviour

The (i) icon next to "DBS check" opens the `DbsInfoSheet` component (the slide-up panel defined in the previous task). Same component, same content, same animation. Import and render it on this screen with:

```typescript
const [dbsInfoVisible, setDbsInfoVisible] = useState(false)

// In the step 3 header row:
<TouchableOpacity onPress={() => setDbsInfoVisible(true)}>
  <InfoCircleIcon />  // Inline SVG, same pattern as existing icons
</TouchableOpacity>

// At the bottom of the component:
<DbsInfoSheet visible={dbsInfoVisible} onClose={() => setDbsInfoVisible(false)} />
```

---

## Step 4: FA Safeguarding — Inline Confirmation

When step 4 becomes active:

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  The FA Safeguarding Children course is free and     │
│  takes approximately 2 hours online.                 │
│                                                      │
│  [GO TO FA LEARNING →]                               │
│  Opens learn.englandfootball.com                     │
│                                                      │
│  ─────────────────────────────────────────────       │
│                                                      │
│  □  I have completed the FA Safeguarding             │
│     Children course                                  │
│                                                      │
│  Certificate reference (optional)                    │
│  ┌──────────────────────────────────────┐            │
│  │ e.g. FAL-12345                       │            │
│  └──────────────────────────────────────┘            │
│                                                      │
│  [CONFIRM SAFEGUARDING]                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

On submit:
- Write to `scout_profiles`: `safeguarding_certified: true`, `safeguarding_certified_at: now()`, `safeguarding_expiry: now + 2 years`
- Step 4 shows complete
- `layer1_verified` generated column flips to `true`
- CTA button changes to "CONTINUE TO APP"

---

## Step States & Visual Treatment

Each step has four possible states:

| State | Number circle | Title colour | Badge | Expandable |
|-------|--------------|-------------|-------|------------|
| Complete | Green bg, white ✓ | Full white | "Done" (muted bg) | No — collapsed to single row |
| Active | Blue bg, white number | Full white | "Next" (blue bg) | Yes — shows detail + form |
| Locked | Dark bg, muted number | 50% white | "Locked" (dark bg) | No — shows summary only |
| Error | Red bg, white ! | Full white | "Issue" (red bg) | Yes — shows error + retry |

Transitions between states should animate: use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` before updating step state to get smooth expand/collapse.

---

## Returning Scouts (Partial Progress)

If a scout leaves the app mid-verification and returns later:

1. App checks `scout_profiles` on load
2. Determines which step is current based on field states:
   - `id_verified === false` → step 2 is active
   - `id_verified === true && dbs_verified === false` → step 3 is active
   - `id_verified === true && dbs_verified === true && safeguarding_certified === false` → step 4 is active
   - `layer1_verified === true` → skip this screen entirely, go to (tabs)
3. Checklist renders with correct states — completed steps show as done, current step expanded

---

## Persistent Reminder Banner (Optional — Post-MVP)

For scouts who are allowed limited app access before completing verification (e.g., they can browse the feed but can't endorse or message), show a persistent banner at the top of every tab screen:

```
┌──────────────────────────────────────────────────────┐
│  ⚡ Complete verification to unlock all features      │
│     Step 3 of 4 remaining  →  [CONTINUE]             │
└──────────────────────────────────────────────────────┘
```

Tapping "CONTINUE" navigates back to `/verify`. This is a post-MVP enhancement — for launch, the hard gate (can't access tabs until verified) is simpler and safer from a safeguarding perspective.

---

## File Checklist

| File | Action |
|------|--------|
| `app/verify.tsx` | Create — the verification checklist screen |
| `app/_layout.tsx` | Edit — add redirect logic for unverified scouts |
| `components/DbsInfoSheet.tsx` | Reuse — already created in previous task |
| `supabase/migrations/021_scout_verification_fields.sql` | Edit — add `complycube_client_id` column |
| `supabase/functions/create-idv-session/index.ts` | Create — Edge Function to create ComplyCube session |
| `supabase/functions/update-idv-result/index.ts` | Create — Edge Function to receive ComplyCube webhook |
| `types/index.ts` | Edit — add `complycube_client_id` to ScoutProfile |
| `lib/demoData.ts` | Edit — add verification step states to demo profiles |
| `package.json` | Edit — add `@complycube/react-native` dependency |

---

## Testing Checklist

### Checklist screen

- [ ] New scout redirected to `/verify` after sign-up
- [ ] Step 1 always shows as complete
- [ ] Steps 3 and 4 show as locked initially
- [ ] Cost summary renders correctly at all step states
- [ ] CTA button label changes per active step
- [ ] Step descriptions match the mockup content
- [ ] (i) icon on step 3 opens DbsInfoSheet slide-up panel

### Step 2 — Identity check

- [ ] Tapping "VERIFY MY IDENTITY" calls `create-idv-session` Edge Function
- [ ] ComplyCube SDK launches natively inside the app
- [ ] Scout can scan passport or driving licence
- [ ] Scout can take selfie
- [ ] SDK closes on completion — app shows "submitted" state
- [ ] On webhook success: `id_verified` flips to true, step 2 shows complete
- [ ] On webhook failure: step 2 shows error state with retry option
- [ ] Scout can dismiss SDK and retry later

### Step 3 — DBS check

- [ ] Step 3 unlocks only after step 2 is complete
- [ ] Radio selection shows correct form for each path
- [ ] Certificate number field validates exactly 12 digits
- [ ] "No" on Update Service shows warning message
- [ ] Submit writes correct fields to `scout_profiles`
- [ ] Pending state shows "we'll verify" message

### Step 4 — FA Safeguarding

- [ ] Step 4 unlocks only after step 3 is complete
- [ ] External link opens FA learning platform
- [ ] Checkbox + submit writes correct fields
- [ ] Safeguarding expiry calculated as +2 years
- [ ] On completion: CTA changes to "CONTINUE TO APP"
- [ ] Tapping "CONTINUE TO APP" navigates to (tabs)

### Returning scouts

- [ ] Scout who left at step 2 returns to step 2 active
- [ ] Scout who left at step 3 returns to step 3 active
- [ ] Scout who completed all steps bypasses `/verify` entirely
- [ ] Demo mode: `scout_free` shows partial progress, `scout_subscribed` shows all complete

### Edge cases

- [ ] Network failure during ComplyCube SDK — shows retry option
- [ ] Webhook delayed — polling catches up within 30 seconds
- [ ] Scout switches between DBS radio options — form resets correctly
- [ ] Back navigation: scout from settings can go back; scout from sign-up cannot
