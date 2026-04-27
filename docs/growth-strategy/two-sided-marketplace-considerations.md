# Two-Sided Marketplace Considerations

---

## Current Stance: Player and Scout-First

Tranxfer Market launches with two primary user types — players and scouts. The platform is not pursuing a full two-sided marketplace model at launch. This is a deliberate decision, not an oversight.

The reason: two-sided marketplaces require critical mass on both sides before either side gets value. Trying to build club supply and player supply simultaneously would split focus and likely result in insufficient depth on either side. The player-and-scout-first approach allows the platform to reach meaningful supply before opening the club side.

---

## The Chicken-and-Egg Problem

| Side | Without the other side |
|---|---|
| Players only | Scouts have nothing to discover; players get no signals of interest |
| Scouts only | No players to discover; platform has no content |
| Players + scouts | Core value exchange works; clubs can be added once there is something for them to find |

The platform solves this by making the player-scout exchange genuinely valuable on its own, independent of clubs.

---

## What Changes If Clubs Become a Primary User Type

If the platform goal shifts to include clubs actively using the platform (not just scouts using it on their behalf), several design decisions would need revisiting:

### UX Becomes Bidirectional
Currently the platform is essentially one-directional — scouts find players. A club-active model means clubs posting requirements, players (or scouts on their behalf) responding. This is a fundamentally different UX pattern, closer to a job board or a two-sided market like Hinge.

### The Player-Initiation Question Re-Opens
If clubs are active on the platform, the question of whether players can express interest in a club becomes live again. This was explicitly ruled out in the current design to respect the scout-led culture of football recruitment. A club-active model would need to navigate this carefully — likely by allowing scouts to express player interest on a player's behalf, rather than players applying directly.

### The Chicken-and-Egg Gets Harder
Adding clubs as a third active side creates two separate chicken-and-egg problems: player-scout and scout-club. The platform would need sufficient depth on all three sides before any side gets the full value proposition.

### Trial Window Mechanic Becomes Viable
With active clubs, a **Transfer Window** mechanic becomes possible — periodic windows where clubs post available trial spots by position, creating urgency and seasonal engagement spikes. This is a genuinely interesting engagement mechanic that cannot work without active club participation.

---

## Recommended Expansion Sequence

| Stage | Unlock Condition |
|---|---|
| Launch | Players + freelance scouts active, endorsement loop working |
| Early growth | Club-hired scouts joining; shortlist sharing creating passive club touchpoints |
| Expansion | Clubs invited as read-only users — they can view shortlists shared by scouts |
| Full two-sided | Clubs create profiles, post requirements, and are discoverable by players via scouts |

The key insight is that clubs can be introduced gradually — first as passive consumers of scout shortlists, then as increasingly active participants — rather than as a fully-featured third user type from day one.

---

## Decision Log

| Decision | Status | Rationale |
|---|---|---|
| Players applying to clubs | ❌ Dropped | Culturally off for football recruitment; scout-led model preserved |
| Clubs as active users at launch | ⏸ Deferred | Chicken-and-egg; player-scout first |
| Read-only club shortlist access | 🔄 Under consideration | Low friction entry point for clubs; no new UX required |
| Transfer Window mechanic | ⏸ Deferred | Requires active club base |
| Two-sided marketplace | 🗓 Phase 5+ | Revisit once player and scout sides are proven |
