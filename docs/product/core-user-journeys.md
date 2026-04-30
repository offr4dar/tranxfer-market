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

## Scout Journey

Both club-hired and freelance scouts share the same core journey on the platform. The difference is in what they do with what they find.

### 1. Discovery & Sign Up
A scout is invited to the platform by a player requesting their endorsement, or discovers it independently. They sign up and complete onboarding as a Scout, providing their name, scout type (club-hired or freelance), agency or club affiliation (if applicable), regions covered, and years of experience.

### 2. Browsing the Feed
The scout browses the player feed — a chronological, filterable stream of player profiles. They filter by position, age group, and region to surface relevant talent. The feed shows only players; scouts are not surfaced here.

### 3. Viewing Player Profiles
The scout taps into a player's full profile to view their video clips, self-reported attributes, completion score, and any existing scout endorsements. Viewing a profile is logged anonymously and signals interest to the player.

### 4. Building Watchlists
The scout saves players they want to track to named watchlists with private notes and tags. They can create multiple lists (e.g. "U18 Strikers", "Left Backs — North West"). Club-hired scouts use these to prepare shortlists for their club. Freelance scouts use them as a working pipeline of talent they are tracking.

### 5. Endorsing a Player
The scout receives a push notification with a player's endorsement request, or proactively endorses a player they believe in. They view the player's profile, watch their videos, and decide whether to accept or decline. If accepted, they rate the player across six attributes (Technical, Physical, Tactical, Mental, Creativity, Potential) using sliders. Their name appears on the player's card permanently unless they revoke it.

### 6. Sharing Shortlists *(club-hired focus)*
When presenting to a club, the scout generates a shareable read-only link for a watchlist. The link shows player names, positions, and ages — no contact details — allowing clubs to browse the shortlist without requiring them to be on the platform.

### 7. Building a Portfolio *(freelance focus)*
The freelance scout logs successful placements — players they have recommended who went on to sign with clubs. These appear as a timeline on their public profile, building their credibility on the platform and making them more attractive to players seeking endorsement.

### 8. Ongoing Engagement
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
