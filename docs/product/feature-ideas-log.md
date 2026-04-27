# Feature Ideas Log

A running log of feature ideas discussed, their status, and key decisions made. Updated as the product evolves.

---

## Confirmed Features (In Spec)

### Player Profile & Gamification
- **Profile completion scoring** — weighted percentage bar driving players to fill out their profile fully
- **Profile views signal** — anonymised weekly view count shown to players; who viewed is never revealed
- **Video upload (skills feed)** — players upload performance videos to their profile and the main feed
- **Weekly challenges** — recurring video submission prompts giving players a reason to post regularly

### Scout Tools
- **Watchlists / Shortlists** — scouts save and tag players into named lists with private notes
- **Shareable shortlists** — read-only deep links for presenting shortlists to clubs (no contact details)
- **Freelance scout portfolio** — placement track record displayed as a timeline on the scout's public profile

### Player Card System
- **FIFA-style player card** — portrait card showing overall rating, position, six scouting stats, nationality, card tier
- **Card tiers** — Standard (silver), Rising Star (gold), Scout Pick (brand green), Elite (holographic purple)
- **Shareable card** — PNG export via `react-native-view-shot`, shared through native share sheet
- **Scout Verified badge** — displayed on card when at least one endorsed rating exists

### Endorsement System
- **Request endorsement flow** — player sends request to a named scout with optional message
- **Scout endorsement form** — scout rates player on six attributes (1–99 sliders) after accepting request
- **Scout revocation** — scout can revoke or update endorsement at any time
- **Endorser attribution** — scout's name and profile link appears on endorsed player cards

### Connections & Messaging
- **Connection requests** — connect/pending/accepted/declined states on player cards
- **Real-time messaging** — Supabase Realtime subscriptions, typing indicators, read receipts
- **Messaging gated to connections** — players can only message users they are connected with

### Fantasy Layer
- **Fantasy draft** — users pick 11 players into a team; scored on in-app activity weekly
- **Activity-based scoring** — proxies real match stats with platform actions (video uploads, profile views, connections, etc.)
- **Leaderboards** — weekly and all-time fantasy team rankings

### Notifications
- **Push notifications** — Expo Push for all key triggers: profile views, connection requests, messages, endorsements, new challenges

---

## Ideas Under Consideration

### Transfer Window Mechanic
A periodic window during which clubs can post available trial spots by position, and players can express interest. Creates urgency and seasonal engagement spikes. Depends on club user base reaching critical mass — deferred until clubs are a primary focus.

### Club Discovery (Two-Sided)
If the app goal expands to "both equally" (players finding clubs, clubs finding players), the UX shifts significantly toward a two-sided marketplace. The current launch strategy is player and scout-first. Club-side features would be a Phase 5 consideration.

### Endorsement Verification
Currently endorsements are self-reported by scouts as unverified. A future flow could allow clubs to confirm a scout's placement ("Yes, this player signed with us") — adding a verified layer to the portfolio system. Out of scope for launch.

### Coach / Manager User Type
Coaches could endorse players for specific attributes (leadership, attitude, work rate) in a lighter version of the scout endorsement flow. This would expand the endorsement ecosystem beyond scouts and give coaches a reason to be on the platform. Expands the addressable user base naturally.

---

## Ideas Considered & Dropped

### Player-Initiated Club Applications
**Decision: Dropped.** Football recruitment is scout-led, not player-initiated. Allowing players to directly apply to clubs feels culturally off for the sport and risks undermining the platform's credibility with the scouting community. Players build their presence and are discovered — they do not apply.

### News Feed
**Decision: Dropped.** A traditional news feed does not work at grassroots level — there is no press coverage, match reports, or performance data to populate it. The video skills feed and weekly challenges replace this function more appropriately.

### Real Match Statistics
**Decision: Not viable.** Real match statistics do not exist at grassroots level. Any feature requiring performance data must be proxied through in-app activity or self-reported/scout-endorsed attributes. The fantasy scoring system uses this proxy model.
