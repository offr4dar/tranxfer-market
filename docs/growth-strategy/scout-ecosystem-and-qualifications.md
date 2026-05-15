# Scout Ecosystem, Qualifications & FA Strategy

---

## The Landscape: What Currently Exists

Nobody builds what Tranxfer Market is building. Understanding who does what — and what each provider *doesn't* do — defines the opportunity clearly.

### The FA — Governing Body

The FA runs the Talent Identification pathway (Levels 1–5) and the Safeguarding Children course. It does **not** require any of this to operate as a scout — there is no FA scout registration system. Only agent registration exists formally. At grassroots level, safeguarding guidance for scouts amounts to: "challenge unidentified adults at matches."

The FA uses **First Advantage Europe Limited** as its DBS check partner. It does not have a centralised, live registry of who is scouting at grassroots level.

### The PFSA — Private Credentialing Body

The Professional Football Scouts Association (est. 2013) is not FA-recognised — it is self-accrediting. 25,000+ members. Partnerships with clubs from Championship to National League.

**What PFSA membership gives you:**
- A Digital Scout ID with QR code
- CPD-accredited courses (Levels 1–3)
- DBS check discounts via Personnel Checks
- Blue-tick verification on PFSA profiles
- Access to the PFSA Scouting Network (assignment-based report writing)

**What PFSA does not give you:**
- Independent DBS verification
- Aggregation of external credentials (FA courses, club IDs)
- Endorsements from players or behavioural reputation tracking
- A two-sided marketplace connecting scouts and players

The PFSA verifies that you are PFSA-certified. It is self-referential.

### InScout Network — Closest Competitor (Early Stage)

Credential-verified marketplace. Verifies FIFA agent licences and club email addresses at sign-up. Operates primarily through a LinkedIn hub; planning to move to an app.

**Gap vs Tranxfer Market:** Verification is a one-time manual gate — no ongoing behavioural data, no endorsement mechanics, no aggregation of external qualifications, no player-side profiles.

### Scout'd — Player Showcase

UK-based, player profiles for AI-powered discovery. Not about scout verification or the scout side of the marketplace.

### UEFA Elite Scout Programme

High-end programme (€7,900, 35 participants, 3-month commitment). A credential scouts may hold, not a competing platform.

---

## The Gap Tranxfer Market Fills

A scout currently carries their DBS certificate, FA Level 2, PFSA certification, and club ID card all separately — if they carry them at all. None of these credentials talk to each other. No platform:

1. Aggregates all credentials in one verified profile
2. Independently validates DBS status on an ongoing basis
3. Tracks behavioural reputation through real platform interactions
4. Creates a two-sided demand loop where players need verified scouts and scouts need to be where the players are

The PFSA could theoretically pivot toward this. InScout has marketplace architecture but lacks the endorsement growth mechanic. Nobody else is close.

---

## UK Scout Qualifications Reference

The following are the recognised credentials within UK football scouting. **None are mandatory** — the industry has no licensing requirement. This is the credentials layer Tranxfer Market will allow scouts to self-declare and display on their profile.

### FA Talent Identification Pathway

| Level | Name | Format | Prerequisites |
|---|---|---|---|
| Level 1 | Introduction to Talent Identification | Free, online | None |
| Level 2 | National Talent Identification & Scouting | 2-day course | FA Level 1 + valid FA Safeguarding certificate |
| Level 3 | Advanced Principles of Talent Identification | 12 days over 10 months | FA Level 2 + professional role |
| Level 4 | Talent Management, Strategy & Leadership | 19 days over 14 months | FA Level 3 + senior role |
| Level 5 | Technical Directors Programme | 25 days over 20 months | FA Level 4 + TD role |

### FA Safeguarding

| Course | Format | Notes |
|---|---|---|
| Safeguarding Children Workshop | Online or in-person | Required for FA Talent ID Level 2+ |
| Welfare Officer Workshop | In-person | For designated club welfare officers |

### PFSA (CPD-accredited, not FA-recognised)

| Level | Name |
|---|---|
| Level 1 | Talent Identification in Football |
| Level 2 | Talent Identification in Football |
| Level 2 | Opposition Analysis in Football |
| Level 3 | Advanced Reporting |
| Level 3 | Performance Analysis |
| — | Analysis & Recruitment in Women's Football |

### IPSO (CPD Group endorsed)

| Level | Name |
|---|---|
| Level 1 | Introduction to Football Scouting |
| Level 2 | Workshops 1–12 (position-specific modules) |
| Level 3 | Talent ID Youth Scouting |

### UEFA

| Programme | Format | Cost |
|---|---|---|
| Elite Scout Programme (ESP) | 3-month, 35 participants max | €7,900 |

### Other Relevant Credentials

| Credential | Issued By |
|---|---|
| Enhanced DBS (Update Service) | Disclosure and Barring Service |
| FA Coaching Badge (Level 1–5) | The FA via 1st4sport |

---

## Product Implication: Qualifications Section

Scouts will be able to add their qualifications to their Tranxfer Market profile. Key design decisions:

**Self-declared, not auto-verified at launch.** The platform displays qualifications but does not verify course completion programmatically. Certificate upload (image to Supabase Storage) is optional and serves as a future audit mechanism.

**Structured catalogue, not free text.** A `qualification_catalogue` table seeds known qualifications by provider. Scouts select from the catalogue rather than typing. Free-text "Other" option available for unlisted credentials.

**Provider badge system.** Each provider has a colour-coded badge (FA: royal blue, PFSA: amber-on-black, UEFA: navy, etc.) displayed on the scout profile. Visual differentiation without requiring logo licensing.

**Verification roadmap (post-MVP):**
- FA Talent ID levels: potentially readable via FA API (requires FA partnership)
- PFSA membership: PFSA API (requires PFSA partnership or manual import)
- DBS status: DBS Update Service API (planned as part of Step 3 of verification checklist)

---

## FA Partnership Strategy

### Phase 1: Pre-launch advisory (now)
Approach the FA Safeguarding team — not Talent ID — for an informal consultation. Frame: "We're building infrastructure that addresses the gap in scout verification at grassroots level. We want to ensure our safeguarding framework meets the standards you'd expect."

This is a consultation, not an endorsement ask. The FA Safeguarding team responds to platforms that take child safety seriously. The Talent ID team will see a tech startup and not know what category to put it in.

**What to demo:** The verification flow running end-to-end — how DBS is validated, how the FA course is confirmed, what the verified profile looks like, what audit data is captured.

### Phase 2: Post-traction (a few hundred verified scouts)
Convert the advisory relationship into a formal partnership. Pitch: "We've built something that aligns with your regulatory objectives at grassroots level. Let's talk interoperability."

Concrete ask: API access to FA Talent ID qualification status, removing the self-declaration step for FA-level qualifications. The FA gets a third-party platform doing grassroots verification work they currently don't do.

### Phase 3: Formal endorsement
FA-endorsed verification layer. "Verified by the FA" on scout profiles is a stronger trust signal than anything the platform can build independently.

---

## Decision Log

| Decision | Rationale |
|---|---|
| Qualifications are self-declared at launch | No API access to FA/PFSA systems; build the UX first, verify the data later |
| Structured catalogue, not free text | Prevents inconsistent data; enables filtering and search by qualification |
| Certificate upload optional | Low friction to add quals; optional evidence for future audit |
| FA Safeguarding team as entry point | Safeguarding opens the door; Talent ID sees a product pitch |
| Hard gate on verification (no partial access) | Simpler, safer from a safeguarding perspective; soft-gate is a post-MVP enhancement |
