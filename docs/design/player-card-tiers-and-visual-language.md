# Player Card — Tiers & Visual Language

The player card is one of the most important design elements in Tranxfer Market. It is the player's identity on the platform, the thing they share with friends, and the visual representation of their credibility. Getting the visual language right matters.

---

## Card Anatomy

A portrait-format card with the following elements from top to bottom:

```
┌─────────────────────────────┐
│  [Rating]    [Flag] [Tier]  │
│  [Position]                 │
│                             │
│         [Photo/Initials]    │
│                             │
│         PLAYER NAME         │
│       AGE · CLUB/TM         │
│  ─────────────────────────  │
│  [Tech] [Phys] [Tact]       │
│  [Ment] [Crea] [Pote]       │
│                             │
│  ● SCOUT VERIFIED · J.Smith │
└─────────────────────────────┘
```

---

## Tier Visual Specifications

### Standard
- **Target:** Profile created
- **Background:** `linear-gradient(145deg, #2a2a2a, #1a1a1a, #2e2e2e)`
- **Accent:** `#a0a0a0` (silver)
- **Rating colour:** `#c8c8c8`
- **Border:** `rgba(180,180,180,0.3)`
- **Feel:** Muted, entry-level, clean

### Rising Star
- **Target:** Profile 80%+ complete + at least 1 video uploaded
- **Background:** `linear-gradient(145deg, #3a2800, #1a1200, #3d2c00)`
- **Accent:** `#f0c040` (gold)
- **Rating colour:** `#f0c040`
- **Border:** `rgba(240,192,64,0.4)`
- **Feel:** Warm, aspirational, golden

### Scout Pick
- **Target:** Saved to at least one scout watchlist
- **Background:** `linear-gradient(145deg, #001a1a, #000d0d, #001f1f)`
- **Accent:** `#00FF87` (brand green)
- **Rating colour:** `#00FF87`
- **Border:** `rgba(0,255,135,0.4)`
- **Feel:** Premium, professional, Tranxfer Market brand identity at full strength

### Elite
- **Target:** Drafted into a fantasy team
- **Background:** `linear-gradient(145deg, #0a0020, #050010, #0d0025)`
- **Accent:** `#bf80ff` (holographic purple)
- **Rating colour:** `#e0b0ff`
- **Border:** `rgba(191,128,255,0.5)`
- **Special effect:** Animated shimmer overlay cycling at 3s interval
- **Feel:** Rare, collectible, the most desirable card on the platform

---

## Scout Verified Badge

Displayed at the bottom of the card when `scout_endorsements.status = 'accepted'` exists for the player.

- Green dot indicator with glow effect in accent colour
- Text: `SCOUT VERIFIED · [Scout surname initial. Surname]` — e.g. `SCOUT VERIFIED · J. Hargreaves`
- Background: semi-transparent accent tint with accent border
- Tapping the badge links to the endorsing scout's public profile (authenticity mechanic)

If multiple scouts have endorsed the player, display the most recent endorser's name with a `+N` indicator for additional endorsers.

---

## Stat Rings

Each of the six attributes is displayed as a circular progress ring:

- Outer ring: `rgba(255,255,255,0.08)` — always full
- Inner progress arc: accent colour, proportional to value (0–99)
- Glow: `drop-shadow` filter in accent colour
- Centre number: attribute value in accent colour, bold condensed font
- Label below ring: attribute name in small uppercase, muted white

---

## Sharing Considerations

When captured as a PNG for sharing:

- Card must look identical to the in-app version — no sharing-specific styling
- Tranxfer Market wordmark watermark bottom-right: small, brand green, semi-transparent
- No background bleed — the card is a self-contained portrait element on whatever background the user's share destination provides
- Recommended card dimensions for sharing: 440 × 640px at 2x density

---

## Design Decisions Log

| Decision | Rationale |
|---|---|
| Scouting language over FIFA categories | More credible to the professional scouting audience; educational for players |
| Four tiers rather than continuous rating | Creates clear aspiration milestones; more shareable (people share milestones, not marginal improvements) |
| Scout's name on the card | Accountability drives selectivity; selectivity drives credibility |
| Initials as photo fallback | Avoids blank silhouettes; works for users who haven't uploaded a photo yet |
| Overall rating as weighted average | Simple, familiar from football games; weighting can be tuned as platform matures |
