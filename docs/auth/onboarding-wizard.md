# Onboarding Wizard

The onboarding wizard runs **once**, immediately after a user's first sign-in. It collects role-specific profile data and writes it to Supabase before the user can access the main app.

## Purpose

Rather than asking users to fill in a profile later, the wizard front-loads the minimum required data. This ensures the feed always has meaningful content (roles, positions, etc.) from day one.

## Wizard Steps

### Step 1: Role Selection

The user selects one of three roles:

| Role | Description |
|---|---|
| **Player** | A footballer looking to be discovered |
| **Agent / Scout** | A representative looking to discover players |
| **Club** | A club looking to recruit players |

Each role has a distinct SVG illustration on the selection card (`assets/player_svg.svg`, etc.).

### Step 2: Role-Specific Fields

The fields shown depend on the role selected in Step 1.

**Player fields:**
- Full name
- Age
- Position (primary)
- Secondary position (optional)
- Nationality
- Postcode (outward code only — e.g. `SW1A`)
- Preferred foot
- Height

**Agent / Scout fields:**
- Full name
- Agency name
- Licence number (optional)
- Regions covered
- Years of experience

**Club fields:**
- Club name
- League / level
- Location (postcode)
- Contact name

### Step 3: Completion

On submit, the wizard writes to two Supabase tables:
1. `profiles` — core data: `clerk_id`, `role`, `full_name`, `nationality`, `postcode`, `profile_picture_url`
2. Role-specific table — `player_profiles`, `agent_profiles`, or `club_profiles`

After a successful write, the user is redirected to `/(tabs)/feed`.

## State Management

Wizard state is managed in-memory using `lib/pendingProfile.ts`. This is a simple module-level store — not Redux or Context — that accumulates data across steps before a single Supabase commit at the end.

```ts
// lib/pendingProfile.ts
let pending: Partial<ProfileData> = {};

export function setPendingProfile(data: Partial<ProfileData>) {
  pending = { ...pending, ...data };
}

export function getPendingProfile(): Partial<ProfileData> {
  return pending;
}

export function clearPendingProfile() {
  pending = {};
}
```

## Postcode Autocomplete

The postcode field uses a local lookup table (`lib/uk-outcodes.ts`) of all valid UK outward codes. As the user types, matching codes are shown as selectable chips. No external API is required.
