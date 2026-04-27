# Core User Journeys

---

## Player Journey

### 1. Discovery & Sign Up
A player hears about Tranxfer Market — likely through a friend, a coach, or a shared player card on social media. They download the app, sign up with their email, and complete OTP verification via Clerk.

### 2. Onboarding
The multi-step onboarding wizard collects their role (Player), then role-specific information: name, age, position, nationality, postcode, preferred foot, and height. This data is written to Supabase on completion.

### 3. Profile Completion
The player is shown their profile with a completion percentage bar. They are prompted to upload a profile photo and at least one skills video to increase their score. Higher completion scores improve their visibility in scout search results and unlock higher card tiers.

### 4. Player Card
The player can view their generated player card — a FIFA-style card displaying their rating, position, stats, and card tier. Initially this will be a Standard (silver) card. They can share the card to social media or messaging apps directly from the app.

### 5. Requesting Endorsement
The player can request a scout endorsement from a scout they know in the real world. They search for the scout by name or email and send a request with an optional message. If the scout accepts and rates their attributes, the card updates to show Scout Verified status and the scout's name appears on the card.

### 6. Passive Discovery
The player's profile becomes discoverable in the scout feed. When scouts view their profile, the player receives an anonymised view count signal on their profile screen. They receive a push notification when their profile is viewed. This drives habitual return visits.

### 7. Ongoing Engagement
The player uploads videos in response to weekly challenges, improves their profile to increase their completion score, and checks their scout interest signals regularly. If drafted into a fantasy team, their card upgrades to Elite tier.

---

## Freelance Scout Journey

### 1. Discovery & Sign Up
A scout is invited to the platform by a player requesting their endorsement, or discovers it independently. They sign up and complete onboarding as an Agent/Scout, providing their name, agency (if applicable), regions covered, and years of experience.

### 2. Endorsing a Player
The scout receives a push notification with a player's endorsement request. They view the player's profile, watch their videos, and decide whether to accept or decline. If accepted, they rate the player across six attributes (Technical, Physical, Tactical, Mental, Creativity, Potential) using sliders. Their name appears on the player's card permanently unless they revoke it.

### 3. Discovery & Watchlists
The scout browses the player feed, filters by position, age group, and region, and saves players they want to track to named watchlists. They add private notes to each player. They can create multiple lists (e.g. "U18 Strikers", "Left Backs — North West").

### 4. Building a Portfolio
The scout logs successful placements — players they have recommended who went on to sign with clubs. These appear as a timeline on their public profile, building their credibility on the platform.

### 5. Sharing Shortlists
When presenting to a club, the scout generates a shareable read-only link for a watchlist. The link shows player names, positions, and ages — no contact details — allowing clubs to browse the shortlist without requiring them to be on the platform.

### 6. Ongoing Engagement
The scout receives alerts when tracked players upload new videos, gain endorsements, or update their profiles. They use the platform as an ongoing discovery and management tool.

---

## The Endorsement Handshake

The most important cross-user journey on the platform:

```
Player wants Scout Pick card tier
→ Needs scout endorsement
→ Player contacts real-world scout and asks them to join Tranxfer Market
→ Scout joins, views player profile, accepts endorsement request
→ Scout rates player across six attributes
→ Player card updates: Scout Verified badge, scout's name displayed
→ Scout discovers platform value independently
→ Scout begins using watchlists and discovery tools
→ Scout brings additional players to their attention on the platform
→ Platform grows on both sides
```

This journey is the primary organic growth mechanism and should be treated as a first-class product flow.
