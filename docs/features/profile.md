# Profile

**File:** `app/(tabs)/profile.tsx`

The Profile screen shows the authenticated user's own profile data and provides a sign-out option.

## Current State

The profile screen renders basic user information and a sign-out button. **Full editable profile functionality is [Phase 1, Feature 2](../roadmap/phase-1.md).**

## Planned Behaviour

### Display
Show all role-specific fields from the relevant Supabase table:

**Player:** full name, age, position, secondary position, nationality, postcode, preferred foot, height

**Agent / Scout:** full name, agency name, licence number (if applicable), regions covered, years experience

### Profile Picture
- Integrate `expo-image-picker` for photo selection
- Upload to Supabase Storage bucket `'avatars'`
- Store public URL in `profiles.profile_picture_url`

### Inline Editing
- Tapping a field opens an inline text input or edit modal
- Save writes to `profiles` and the role-specific table

### Profile Completion Bar
A progress bar showing the user's profile completion percentage (0–100%). The scoring logic is defined in [Phase 3, Feature 9](../roadmap/phase-3.md), but the bar UI will be present from Phase 1.

### Sign Out
The sign-out button calls Clerk's `signOut()` and clears the Supabase session. A `ConfirmCancelModal` is shown before the destructive action is taken.
