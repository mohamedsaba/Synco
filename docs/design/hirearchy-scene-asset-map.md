# Hirearchy Scene → Asset Map v1

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Deterministic mapping of approved assets, supporting kits, copy contracts, layout footprints, motion choreography, and forbidden asset prohibitions across all 8 website scenes.  
**Authority:** `docs/plans/active/099-hirearchy-website-experience-rebuild.md` Product Truth & Architecture Gate.

---

## SCENE 01 — MASTERBRAND HERO

### MUST USE (DESKTOP ANIMATED STACK):

Desktop Hero must be assembled from the approved standalone motion pieces structured in the 5-layer conceptual stack:

- **Z0 (STRATA Environment):** `docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png` (or transparent mineral glass backdrop)
- **Z1 (Repository / File-Tree Panel):** `docs/design/assets/approved/hero-motion/hirearchy-hero-repository-panel.png`
- **Z2 (Attempt / Workbench Panel):** Sanitized Attempt Workbench Panel (Static safe fallback / procedural sanitized panel; see Asset Gap 03)
- **Z3 (Evidence Connector Spine):** `docs/design/assets/approved/hero-motion/hirearchy-hero-evidence-spine.png`
- **Z4 (Evidence Cards):**
  - `docs/design/assets/approved/hero-motion/hirearchy-hero-card-investigation.png`
  - `docs/design/assets/approved/hero-motion/hirearchy-hero-card-revision.png`
  - `docs/design/assets/approved/hero-motion/hirearchy-hero-card-verification.png`
  - `docs/design/assets/approved/hero-motion/hirearchy-hero-card-outcome.png`

### STATIC RESOLVED REFERENCE / FALLBACK:

- `docs/design/assets/approved/hirearchy-hero-evidence-spatial-composition.png`
  - Serves strictly as the **visual target reference**, **static fallback**, and **reduced-motion fallback**.
  - Must **NOT** be treated as the primary animated object. Whole-raster PNG translation/orbit is strictly forbidden.

### SUPPORTING:

- `docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png` (for Z0 depth strata layering)
- `docs/design/assets/reference-only/hero-motion/hirearchy-hero-evidence-spine-alt.png` (reference alternate)

### COPY:

- **Kicker:** `01 — REAL WORK`
- **Display Headline:** `Real work. In context.`
- **Editorial Subhead:** `See how the work unfolded — what was tried, investigated, changed, and verified. Hirearchy puts that evidence in context for human evaluation.`
- **Primary CTA:** `Explore the evidence`
- **Secondary Action:** `Replay sequence`
- **Scroll Prompt:** `↓ Scroll to witness`

### LAYOUT ROLE:

- **Desktop (1440×900):**
  - Left Column (44%–46% viewport width): Headline, kicker, subhead, dual CTAs.
  - Right Motion Stack (54%–62% viewport width): Starts at `X: 44vw`, bleeds subtly past right edge. Vertically centered with headline. Assembled from Z0–Z4 standalone motion assets.
- **Laptop (1280×800):**
  - Left Column: 48% viewport width.
  - Right Motion Stack: 52%–58% viewport width, scaled proportionally.
- **Mobile (390×844):**
  - Resolved Hero composition (uses static resolved fallback `hirearchy-hero-evidence-spatial-composition.png` or clean vertical stack of cards).
  - Evidence cards accessible as a vertical or horizontal interactive set (tap to activate related state).
  - No perspective tilt, no heavy scroll pinning, no hover-only meaning.
- **Crop Behavior:** Zero internal clipping. Preserve full glass bounding box and outer glow fringes.

### MOTION:

- Discrete multi-layer choreography (0.00–1.00) replacing whole-PNG 3D orbit:
  - `0.00–0.18` (ARRIVAL / ATTEMPT): All major pieces form a stable composition. Repository visible, attempt primary, cards subdued. Page is visually complete before motion starts.
  - `0.18–0.36` (INVESTIGATION): Investigation card translates outward ~32–40px, active node lights with Hirearchy accent (`#F04A2F`), non-active cards soften to 60–70%.
  - `0.36–0.54` (REVISION): Investigation settles, Revision card emphasized, diff area in workbench focal, connector advances.
  - `0.54–0.72` (VERIFICATION): Verification card emphasized with semantic verification green, test region highlighted, previous cards remain readable.
  - `0.72–0.88` (OUTCOME): Final connector resolves, Outcome card emphasized, resembles approved resolved Hero reference.
  - `0.88–1.00` (HANDOFF): Settles, evidence emphasis normalizes, Scene 02 enters through layout continuity.
- **Reduced Motion:** Visual renders immediately in resolved `0.72–0.88` resting state without scroll-linked translation or parallax.

### DO NOT USE:

- `docs/design/assets/reference-only/hero-motion/hirearchy-hero-attempt-panel-unsafe.png` in production DOM (contains resume/github and confidence score violations).
- `docs/design/assets/rejected/hirearchy-evidence-code-revision-composition-rejected.png`.
- Whole-raster 3D rotation, camera-orbit, or Android card flip of `hirearchy-hero-evidence-spatial-composition.png`.
- Generic flat CSS cards replacing the mineral glass visual.

---

## SCENE 02 — THE FLAT PROJECTION (THE EPISTEMIC DILEMMA)

### MUST USE:

- `docs/design/assets/approved/hirearchy-impressions-fragment-set.png`

### SUPPORTING:

- None. (Native DOM cards wrap the 3 visual specimen plates).

### COPY:

- **Kicker:** `02 — IMPRESSIONS`
- **Headline:** `Traditional hiring misses the real picture.`
- **Support:** `Resumes summarize. Interviews sample. Coding tests often preserve the result. The context of how the work unfolded is easy to lose.`
- **Captions:**
  - `Resumes summarize.`
  - `Interviews sample.`
  - `Final answers hide the process.`

### LAYOUT ROLE:

- **Desktop (1440×900):**
  - Centered editorial container (`max-width: 1240px`).
  - Top headline and framing paragraph.
  - 3-column equal-width grid (`1fr 1fr 1fr`). Asset may be used as a full composition spanning columns or sliced cleanly into 3 vertical column plates.
- **Mobile (390×844):**
  - Vertical stack of 3 individual specimen cards, each containing its respective sliced illustration plate.

### MOTION:

- Quiet entrance. Plates enter with subtle isometric tilt (`rotateY: -8deg`).
- Horizontal redline datum in accent color (`#9E4328`) draws across the boundary where context was severed.
- Reduced motion: Static cards with zero rotation.

### DO NOT USE:

- Generic vector icons (resumes, microphones, code brackets).
- Fabricated candidate statistics or percentage claims.

---

## SCENE 03 — OBSERVABLE WORK (THE STRATIGRAPHY OF AN ATTEMPT)

### MUST USE:

- **ASSET GAP** (No pre-rendered raster asset approved. Implemented as native semantic DOM, SVG connecting rules, and canvas timeline).

### SUPPORTING:

- `docs/design/assets/reference-only/hirearchy-evidence-status-modules.png` (Row 1 / Row 4 cropped chips: `Attempt`, `Investigation`, `Revision`, `Verification`, `Outcome` may be used as tactile node badges).

### COPY:

- **Kicker:** `03 — OBSERVABLE REALITY`
- **Headline:** `Work is not an answer. Work is a trajectory.`
- **Timeline Range:** `[00:00:00]` to `[00:42:15]`
- **Event Categorical Spine:**
  1. `Attempt` — Candidate initiates a specific technical pathway.
  2. `Investigation` — Candidate navigates repository, checks logs, inspects dependencies.
  3. `Failure` — Compiler error, failed unit test, or runtime exception occurs.
  4. `Revision` — Candidate refactors logic based on observed feedback.
  5. `Verification` — Candidate executes test suites to confirm invariants.
  6. `Uncertainty` — Recorded pauses, discarded branches, or exploratory tests.

### LAYOUT ROLE:

- Full-width interactive horizontal timeline with sequential evidentiary nodes.
- High typographic density using monospace numerals and clinical uppercase category labels.

### MOTION:

- Scrubbed playback cursor linked to scroll position.
- Active node illuminates and expands detail drawer via spring physics.
- Reduced motion: Fully expanded static timeline with clickable tabs.

### DO NOT USE:

- Efficiency scores (e.g. `Efficiency: 88%`).
- Candidate ranking or completion percentages.

---

## SCENE 04 — STRATIFIED CONTEXT (SEQUENCE CREATES LEGIBILITY)

### MUST USE:

- **ASSET GAP** (Requires native DOM/SVG 3D layer stack; no standalone approved raster asset exists).

### SUPPORTING:

- `docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png` (Middle-right 3-layer horizontal planar substrates, Group 5).
- Visual Blueprint: `docs/design/assets/reference-only/hirearchy-evaluator-session-timeline.png` (reference for UI typography and data hierarchy).

### COPY:

- **Kicker:** `04 — STRUCTURED CONTEXT`
- **Headline:** `One event is partial. A sequence provides context.`
- **Stratum 1 (Base Substrate):** `SUPPORTED SOURCE EVIDENCE (Terminal I/O, file edits, test executions, AI events, diffs)`
- **Stratum 2 (Chronological Axis):** `CHRONOLOGICAL RECONSTRUCTION (Ordered event stream & verification records)`
- **Stratum 3 (Evaluator Aperture):** `HUMAN EVALUATOR LENS (Reviewable synthesis & evidence navigation)`

### LAYOUT ROLE:

- Centered 3D exploded isometric stack of three distinct structural planes (STRATA embodiment).
- Pinned scroll sequence (120vh–150vh).

### MOTION:

- `0%–30%`: Slabs tightly compressed.
- `30%–70%`: Slabs elevate vertically on Z-axis revealing interconnecting vertical SVG conduits.
- `70%–100%`: Vertical alignment laser lines project through all three layers.
- Reduced motion: Static exploded elevation diagram.

### DO NOT USE:

- Overclaiming capture capabilities: do not claim keystroke logging, video recording, or AST capture.

---

## SCENE 05 — PRODUCT REVEAL (THE INHABITED WORKBENCH)

### MUST USE:

- **ASSET GAP** (Mandated by 099 Product Truth & Architecture Gate to be a dedicated, accessible, native React Client Component `evidence-walkthrough.tsx` consuming a static frozen fixture from `scenario-001-cache-staleness`).

### SUPPORTING:

- Visual Blueprint: `docs/design/assets/reference-only/hirearchy-evaluator-session-timeline.png` (Authoritative visual design and typographic reference for the React component).

### COPY:

- **Kicker:** `05 — THE EVALUATION ENVIRONMENT`
- **Headline:** `Hirearchy Software`
- **Subhead:** `The authentic workbench. Built for human evaluators.`
- **Surface Label:** `Scripted evidence walkthrough`
- **Session Header:** `Candidate: C-8819 | Scenario: Distributed Cache Staleness | Time: 00:38:12`
- **Pane 1 Header:** `Chronological Spine`
- **Pane 2 Header:** `Code Diff Viewer`
- **Pane 3 Header:** `Verification Console`

### LAYOUT ROLE:

- Centered industrial workbench (`max-width: 1440px`).
- 3 synchronized columns: Left event tree (24%), Center diff viewer (48%), Right console output (28%).
- Mobile: Tabbed single-pane view with native segmented controls.

### MOTION:

- Assembly on entrance: Panes slide into alignment from subtle isometric offset.
- Scrubber progresses deterministically with scroll.
- User click unlocks manual tab and diff inspection.
- Reduced motion: Default static view at milestone 00:38:12 with clickable tabs.

### DO NOT USE:

- `docs/design/assets/reference-only/hirearchy-evaluator-session-timeline.png` as a flat raster screenshot embedded in DOM.
- Live backend API calls, active candidate session tokens, or simulated AI candidate scores.

---

## SCENE 06 — MULTI-PERSPECTIVE RECONSTRUCTION (THREE LENSES, ONE REALITY)

### MUST USE:

- **ASSET GAP** (Requires native HTML/CSS 3D perspective card deck representing the 4 supported evaluator disclosure roles).

### SUPPORTING:

- Visual Reference: `docs/design/assets/reference-only/hirearchy-evaluator-role-perspectives.png`.

### COPY:

- **Kicker:** `06 — ALIGNED UNDERSTANDING`
- **Headline:** `One single record of work. Distinct operational altitudes.`
- **Lens 1 (Engineering Lead):** `Technical Depth — Direct git diffs, test assertion logs, recorded terminal executions, and architectural tradeoffs.`
- **Lens 2 (Recruiter):** `Process Fidelity — High-level chronological pacing, persistence through failure, and verifiable submitted scope.`
- **Lens 3 (Hiring Manager):** `Risk & Decision Boundary — Verification rigor, edge case awareness, solution completeness, and human evaluator annotations.`

### LAYOUT ROLE:

- 3 staggered receding cards in isometric perspective. Clicking a card brings it to primary focus plane (`Z: 0`), pushing others into subtle depth blur.
- Mobile: Horizontal swipe card carousel with native role pill selector.

### MOTION:

- Cards advance sequentially into focal plane with scroll.
- Smooth spring transitions between active role states.

### DO NOT USE:

- `docs/design/assets/reference-only/hirearchy-evaluator-role-perspectives.png` directly in production (Hiring Manager card contains forbidden generic analytics bar chart).
- Role fit recommendations, competence ratings, or personality profiling.

---

## SCENE 07 — CAMPAIGN CLIMAX (EVIDENCE OVER IMPRESSIONS)

### MUST USE:

- **ASSET GAP** (Monumental typographic broadside executed in native semantic DOM typography with CSS/SVG strata rules).

### SUPPORTING:

- `docs/design/assets/approved/hirearchy-strata-brand-environment.png` (Primary use: brand/campaign environment backdrop or raking daylight architectural plate).
- `docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png` (subtle mineral glass backing plates).

### COPY:

- **Kicker:** `07 — THE MANIFESTO`
- **Monumental Statement:** `EVIDENCE OVER IMPRESSIONS.`
- **Manifesto Copy:** `Hiring is too important to be decided by keyword optimization, rehearsed answers, or algorithmic guesswork. Look at the real work.`
- **Definitive Boundary Seals:**
  - `[ NO CANDIDATE SCORES ]`
  - `[ NO AUTOMATED VERDICTS ]`
  - `[ HUMAN DECISION SOVEREIGNTY ]`

### LAYOUT ROLE:

- Full-viewport architectural typographic installation.
- Headline scale: `clamp(4.5rem, 10.5vw, 12.5rem)` set in display serif/grotesque with `-0.065em` tracking.
- Flanked by horizontal STRATA datum rules in signature accent.

### MOTION:

- Climax sequence: Opposing lateral entrance of words `EVIDENCE` and `IMPRESSIONS`.
- `IMPRESSIONS` (ghosted wireframe) dissolves and shatters; `EVIDENCE` locks into solid center datum with seismic weight.
- Directional raking daylight casts long shadows across letterforms.
- Reduced motion: Fully locked, high-contrast static typography.

### DO NOT USE:

- Unsupported velocity and outcome claims: `70% faster`, `Higher quality hiring decisions`, `Evaluate more candidates in parallel`.

---

## SCENE 08 — CLOSE & COLOPHON (THE HUMAN VERDICT)

### MUST USE:

- `docs/design/assets/approved/hirearchy-strata-brand-environment.png` (Approved architectural brand environment anchor for Scene 08 resolution; grounded physical glass strata).

### SUPPORTING:

- None. (Secondary editorial crop of brand environment or native colophon typography).

### COPY:

- **Kicker:** `08 — RESOLUTION`
- **Headline:** `Inspect the evidence. Decide for yourself.`
- **Lead Text:** `Explore a real Hirearchy Software engineering evaluation session. Inspect the code diffs, terminal replay, and chronological record.`
- **Primary CTA:** `Launch Interactive Session ->`
- **Secondary Action:** `Discuss Evaluation Architecture`
- **Colophon:** `Hirearchy Software — Observable evidence. Human decision.`

### LAYOUT ROLE:

- Split 50/50 architectural layout:
  - Left: Editorial call-to-action block and technical colophon.
  - Right: Architectural monolith image container.
- Mobile: Single column, image above or below CTA block.

### MOTION:

- Near-zero motion. Subtle 2-degree daylight angle drift simulating morning sunlight.

### DO NOT USE:

- `docs/design/assets/rejected/hirearchy-architectural-brand-monument-rejected.png` (reintroduces rejected real-estate / commercial architecture look).
- Unauthenticated active session launches.
