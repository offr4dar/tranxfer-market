# Scout Verification & Trust

Safeguarding is non-negotiable in grassroots football. Any adult with systematic access to under-18 players — which is precisely what a scouting platform provides — must be verifiable. This is not a feature. It is the foundation of the product's licence to operate in this space.

---

## Why Verification Matters Here

Tranxfer Market connects adults (scouts) with young players, many of them minors. Without a verification layer, the platform becomes a mechanism for unverified adults to access children's profiles, locations (implied by postcode), and direct communication. No responsible platform builder should ship this without controls in place.

Beyond safety: verification is also a **competitive differentiator**. The current landscape — PFSA, InScout, LinkedIn groups — has no mandatory, independent verification of the people calling themselves scouts. A verified badge on Tranxfer Market means something. An unverified platform doesn't.

---

## The Four-Step Verification Model

Every scout must complete all four steps before accessing the full platform. There is no partial access model at launch — the hard gate is intentional.

### Step 1 — Account Creation
*Always complete by the time the scout reaches the checklist.*

Clerk authentication with email OTP. The scout has chosen their sub-type (club or freelance) during onboarding.

**Fields set:** `user_id`, `scout_type`, `first_name`, `last_name`

---

### Step 2 — Identity Verification
*Automated. Handled via ComplyCube React Native SDK.*

The scout scans a government-issued ID document (passport or UK driving licence) and takes a passive selfie. ComplyCube cross-references the two and returns a pass/fail outcome via webhook.

**Why passive liveness (not active):** Active liveness (video + head-turn challenges) adds 20+ seconds of friction and has a higher failure rate on lower-end devices. For identity confirmation — not financial KYC — passive liveness at PAD Level 2 is the correct balance. This decision can be revisited if the platform introduces financial transactions.

**Cost:** Paid by Tranxfer Market. Positioned as such in the UI — scouts see this as a trust-building gesture, not a barrier.

**Fields set:** `id_verified: true`, `id_verified_at`, `id_verification_ref`, `complycube_client_id`

**Architecture:**
```
Scout taps "Verify Identity"
  → Supabase Edge Function: create-idv-session
  → ComplyCube API: create client + SDK token
  → SDK launches natively (document capture + selfie)
  → ComplyCube processes check server-side
  → Webhook fires to: update-idv-result Edge Function
  → scout_profiles.id_verified flips to true
  → App polls / Realtime subscription updates checklist
```

---

### Step 3 — DBS Check
*Semi-automated. MVP: admin-reviewed. Future: DBS Update Service API.*

Enhanced DBS with Children's Barred List. There are two paths:

**Path A — Existing DBS on Update Service:**
Scout enters their 12-digit certificate number. Platform marks as pending. Admin verifies via the DBS Update Service portal. Once confirmed, `dbs_verified` flips to true.

**Path B — New DBS application:**
Scout is directed to apply through a DBS provider (link to Personnel Checks or similar). Once issued, they return and enter their number — which must be registered on the Update Service within 30 days of issue. The platform then follows Path A.

**Why Update Service is mandatory:** A one-off DBS check is a snapshot. The Update Service provides ongoing status — if a scout's status changes (e.g., a conviction after the check was issued), the platform can detect this. This is the responsible approach for any safeguarding-critical platform.

**Cost:** £55–£96 for new applicants (paid by scout). £16/year for Update Service (paid by scout). Free for scouts already on the Update Service.

**Fields set:** `dbs_certificate_number`, `dbs_on_update_service`, `dbs_verified`

---

### Step 4 — FA Safeguarding Course
*Self-declared. MVP: honour system. Future: certificate reference validation.*

The FA Safeguarding Children course (~2 hours, free, online via `learn.englandfootball.com`) is a prerequisite for FA Talent ID Level 2. The platform requires it as a baseline for all scouts, independent of whether they hold FA qualifications.

The scout confirms completion via checkbox and optional certificate reference. At MVP this is self-declared — the platform cannot automatically verify FA course completion. A certificate reference field is collected for future audit use.

**Fields set:** `safeguarding_certified: true`, `safeguarding_certified_at`, `safeguarding_expiry` (+2 years), `safeguarding_certificate_ref`

---

### Completion — `layer1_verified`

`scout_profiles.layer1_verified` is a **generated column** that evaluates to `true` when:
- `id_verified = true`
- `dbs_verified = true`
- `safeguarding_certified = true`

When this flips to `true`, the scout is redirected from `/verify` to the main tab navigator. The verification checklist is never shown again.

---

## Screen Architecture

`app/verify.tsx` is a top-level route, not inside `(tabs)`. The tab bar is not rendered on this route — scouts cannot navigate away from verification.

The `AuthGuard` in `app/_layout.tsx` enforces this gate:

```
if (isAuthenticated && isScout && !layer1_verified):
  redirect to /verify
else:
  render (tabs) navigator
```

Returning scouts who left mid-flow resume at the correct step — the checklist reads field states from `scout_profiles` on mount and determines which step is active.

---

## Test Environment Behaviour

In demo mode, no real SDK calls or DB writes occur. The Exit Demo button is visible on the `/verify` screen (and all other screens) so testers can escape the gate at any time.

| Demo Role | Verification State | `/verify` behaviour |
|---|---|---|
| `scout_unverified` | Step 2 active (id_verified: false) | Full flow from identity check |
| `scout_free` | Step 3 active (id_verified: true, dbs_verified: false) | DBS inline form active |
| `scout_subscribed` | All steps complete | Bypasses `/verify` entirely → tabs |

In demo mode, CTA buttons simulate progression locally (no Supabase writes). A 1.5-second mock delay mimics the ComplyCube SDK experience.

---

## FA Partnership Pathway

The verification model positions Tranxfer Market to approach the FA as a safeguarding infrastructure partner — not as a tech product looking for endorsement.

**Entry point:** FA Safeguarding team (not Talent ID). Safeguarding is the conversation that opens doors.

**Framing:** "We've built infrastructure that addresses the gap in scout verification at grassroots level. We want to ensure our safeguarding framework meets the standards you'd expect."

**Timing:** Approach after the verification flow is live end-to-end with real scouts. The demo will show: DBS validation, identity verification, FA course confirmation, and what the verified profile looks like. Data from even a few hundred verified scouts makes the conversation meaningful.

**Future:** FA interoperability — potentially reading Talent ID qualification status directly from FA systems, removing the self-declaration step for FA-level qualifications.
