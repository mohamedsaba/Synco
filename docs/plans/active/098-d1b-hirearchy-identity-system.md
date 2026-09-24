# D1B.ID1 — Hirearchy Brand Identity System

## Status

Authoritative identity system locked for D1B and all subsequent frontend craft slices.

---

## 1. Core Brand Thesis & Model

Hirearchy exists to help humans make better hiring decisions from real evidence of work.

```
REAL WORK
  → OBSERVABLE EVIDENCE
  → STRUCTURED CONTEXT
  → CLEARER UNDERSTANDING
  → HUMAN DECISION
```

### Visual Idea: Progressive Clarity

- **Not:** wrong vs. right, bad vs. good, winner vs. loser, score vs. verdict, AI vs. human.
- **Instead:** isolated information → contextual relationships → legible structure.

### Personality & Balance

- **Traits:** Precise, Calm, Curious, Respectful, Assured.
- **Expressive Balance:** 70% disciplined/professional, 30% bold/expressive.
- **Identity Mechanism:** The brand is recognizable through **system behavior and structural grammar**, not surface decoration.

---

## 2. Locked Color System

Hirearchy is a unified masterbrand, not a collection of arbitrary color-coded verticals.

### Masterbrand Palette

| Token                    | Exact Value               | Role & Semantic Purpose                                                                                                 |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--brand-paper`          | `#f2eee4`                 | Primary canvas base. Warm ivory / unbleached document paper tone. Material reality of physical work substrate.          |
| `--brand-surface`        | `#ede8dd`                 | Primary structured container surface. Bounded environments, card interiors, and frames.                                 |
| `--brand-surface-subtle` | `#ebe5d8`                 | Secondary container surface. Conduit streams, future product wings, subtle grouping.                                    |
| `--brand-ink`            | `#1c1b17`                 | Near-black carbon ink. Primary text, primary structural boundaries, high-contrast active tags, wordmark.                |
| `--brand-muted`          | `#645f55`                 | Warm neutral secondary text. Metadata, secondary copy, inactive step numbers, axis references.                          |
| `--brand-line`           | `#bdb4a4`                 | Warm neutral structural rule. Boundaries, grid datums, inactive container edges.                                        |
| `--brand-line-subtle`    | `#d8d1c5`                 | Subtle internal division rule. Light table divisions, secondary ticks.                                                  |
| `--brand-accent`         | `#9e4328`                 | **Single signature oxide / terracotta rust accent.** Reserved for active context, apertures, focus, editorial fulcrums. |
| `--brand-accent-soft`    | `rgba(158, 67, 40, 0.08)` | Subtle tinted background for active items or focus callouts.                                                            |

### Color Rationale & Invariants

1. **The Signature Accent (`#9e4328`):**
   - Exists exclusively for active context, apertures, focus points, editorial fulcrums, and selective structural kickers.
   - **STRICT PROHIBITION:** It does NOT signify "error", "failure", "warning", "wrong", or "negative candidate verdict".
   - **NEVER** introduce semantic red/green candidate evaluation colors. The evaluator owns human judgment; the system never colors a candidate's outcome.

2. **Hirearchy Software Color Inheritance:**
   - Hirearchy Software **strictly inherits** the masterbrand palette.
   - **REMOVAL:** The unexplained lime/chartreuse product highlight (`#d9c94e`) is completely removed.
   - Product differentiation is achieved through **information density, multi-pane workbench layout, domain content, and observable event behavior**, NOT an arbitrary product color.

3. **Future Products Rule:**
   - Hirearchy IT and Hirearchy Marketing remain conceptual roadmap directions.
   - **DO NOT** assign permanent blue, green, pink, or other vertical colors.
   - Future products use neutral provisional line grids (`var(--brand-line)`) and may only receive secondary accents when their authentic product identity is designed.

---

## 3. Logo System — Wordmark First

Hirearchy uses a **wordmark-first identity** paired with an architectural signature mark: the **Context Aperture**.

### Absolute Banned Logo Forms

- No generic letter "H" in a square or circle
- No hexagons, shields, or crests
- No AI sparks, magic wands, or sparkles
- No infinity loops or abstract nodes
- No gradient or glow logos
- No clever optical monogram puzzles

### Logo Components

1. **The Primary Wordmark:**
   - Typography: `Bitstream Charter`, `Iowan Old Style`, `Palatino Linotype`, Georgia, serif.
   - Weight: 700 (bold). Letter spacing: `-0.035em` (tight, controlled optical tracking).
   - Tone: Bookish, authoritative, disciplined, physical. Avoids luxury-fashion high contrast and startup rounded sans geometry.

2. **The Context Aperture Signature Mark:**
   - An open structural frame derived directly from the homepage spatial grammar.
   - Geometry (`20x20` coordinate grid):
     - Left structural spine (`M 3 3.5 V 16.5`) in `--brand-ink`.
     - Bottom baseline datum (`H 16.5`) in `--brand-ink`.
     - Partial right boundary (`V 9.5`) in `--brand-ink`.
     - Top aperture threshold (`M 3 3.5 H 11`) in `--brand-accent` (`#9e4328`).
     - Internal alignment datum (`M 3 10 H 9.5`) in `--brand-line`.
   - The top-right quadrant remains **open**—an aperture through which context enters the structural field.
   - Remains crisp down to `16x16` favicon scale.
   - Works in full color or monochrome (`currentColor`).

### Logo Lockups

| Lockup Variant | Composition                                    | Primary Usage Context                                     |
| -------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `primary`      | Context Aperture + Wordmark                    | Site header, primary brand anchors, colophon footers      |
| `compact`      | Context Aperture alone (with accessible text)  | Favicon, app launcher, compact mobile header              |
| `wordmark`     | Wordmark alone                                 | Editorial mastheads, inline typographic citations         |
| `software`     | Context Aperture + `Hirearchy Software` lockup | Inhabited product environment substrate bar, product hero |

---

## 4. Visual Primitives: Context Aperture & Datum

### Signature Primitive: Context Aperture

- **Behavior:** Opens, receives information, establishes relationships, shifts boundaries, focuses without enclosing, resolves context.
- **Grammar:** Uses incomplete boundaries rather than closed rectangular cards.
- **Application:**
  - **Logo:** Open structural corner with accent threshold.
  - **Hero:** Controlled frame with `.frame-aperture` oxide top bar and open right boundary.
  - **Product Family:** Open root frame adapting to active product environment.
  - **Software Environment:** Structural workbench substrate with context header and evidentiary conduit.
  - **Campaign Broadside:** Accent aperture rule opening the monumental typographic contrast.

### Secondary Primitive: Datum

- **Definition:** A restrained alignment rule or baseline that allows multiple pieces of evidence to gain relationship.
- **Forms:**
  - Horizontal baseline (e.g. `.brand-datum--horizontal`, `.campaign__axis-rule`).
  - Vertical structural axis (e.g. `.frame-axis--vertical`, `.hero-transition__axis`).
  - Alignment reference points connecting observed moments to their chronological context.
- **Invariant:** Never draw random, decorative lines. A datum must always align, anchor, or connect meaningful evidence.

---

## 5. Typographic Identity System

| Role                        | Font Family     | Weight      | Size / Scale                   | Tracking        | Line Height | Case / Style      |
| --------------------------- | --------------- | ----------- | ------------------------------ | --------------- | ----------- | ----------------- |
| **Wordmark**                | Display Serif   | 700         | 1.35rem–1.45rem                | `-0.035em`      | 1.0         | Titlecase         |
| **Monumental Display**      | Display Serif   | 500         | clamp(4.5rem, 8.8vw, 8.8rem)   | `-0.07em`       | 0.84        | Titlecase         |
| **Editorial Headings (H2)** | Display Serif   | 500         | clamp(2.2rem, 3.8vw, 3.8rem)   | `-0.045em`      | 0.98–1.05   | Sentence case     |
| **Section Kickers**         | Functional Sans | 800         | 0.68rem                        | `0.13em`        | 1.0         | UPPERCASE         |
| **Body / Explanatory**      | Functional Sans | 400         | clamp(0.95rem, 1.2vw, 1.15rem) | Normal          | 1.55        | Sentence case     |
| **Micro-labels / Datums**   | Functional Sans | 700         | 0.65rem–0.72rem                | `0.08em–0.14em` | 1.2         | UPPERCASE         |
| **Editorial Emphasis**      | Display Serif   | 500 italic  | Scales with heading            | `-0.04em`       | Inherit     | Italic            |
| **Provisional Outline**     | Display Serif   | 500 outline | Campaign scale                 | `-0.05em`       | 0.88        | Lowercase outline |

### Typographic Invariants

1. **Outline Typography:** Outline text is **NOT** a general-purpose brand style. It is reserved strictly for provisional/impression states (such as "impressions." in the Campaign contrast).
2. **Italic Accents:** Italics represent deliberate editorial tension and reframing (e.g. _"Work has context."_, _"over"_), not casual styling.
3. **Measure & Legibility:** Body copy measure is capped at `27rem`–`36rem` (45–65 characters) for sustained reading comfort.
4. **Sans / Display Relationship:** Sans-serif handles functional architecture, metadata, and controls; Serif handles brand voice, editorial reflection, and evidence narratives.

---

## 6. Product-Family & Software Inheritance

- **Masterbrand Ownership:** Hirearchy owns the core philosophy ("Evidence over impressions"), the warm ivory/ink/oxide palette, the Context Aperture, and the progressive clarity narrative.
- **Hirearchy Software:**
  - Direct inheritance of masterbrand tokens.
  - Expressed through functional density: controlled candidate scenario, three-stage evidentiary conduit, and structured evaluator reconstruction.
  - Zero arbitrary vertical colors.
- **Future Verticals:**
  - Retain provisional status with neutral hairline rules (`var(--brand-line)`).
  - Explicitly forbidden from preemptively claiming vertical brand colors.

---

## 7. Forbidden Visual Behaviors

1. ❌ No AI tropes: purple/blue gradients, glowing neon nodes, telemetry HUDs, circular radar graphics.
2. ❌ No arbitrary vertical color coding (e.g. blue IT, green marketing, purple HR).
3. ❌ No semantic red/green candidate evaluation or automatic pass/fail grading.
4. ❌ No floating connection lines that lack structural alignment purpose.
5. ❌ No outline typography used as general decorative heading text.
6. ❌ No legacy identifiers ("Synco", "Delimit") in user-facing views.

---

## 8. Motion Identity System (D1B.ID2 Locked)

### Core Motion Principle: Context Resolution

Hirearchy's motion identity is **Context Resolution**:

- **Not:** chaos → correct answer, bad → good, or flash-in-the-pan animation demo.
- **Instead:** less context → more context. Information begins partially isolated, misregistered, or unresolved in space; structural relationships establish; the Context Aperture and Datum create a coherent context; and the result settles into a crisp, legible composition.

### Three Signature Motion Peaks

Hirearchy focuses visual attention into exactly three memorable signature moments, while keeping the rest of the page restrained:

1. **Peak 1 — Hero Signature (`organize`):**
   - **First-Viewport First-Impression Resolution:** Plays in the first 2.4 seconds on page load.
   - **7-Stage Architectural Sequence:**
     1. _Restrained initial stillness_ (0.0s–0.2s hold)
     2. _Context Aperture establishes itself_ (0.2s–0.75s, top oxide threshold bar draws open with `scaleX`)
     3. _Isolated evidence fragments occupy independent positions_ (0.35s–1.0s, Attempt, Verification, Revision, Context displaced across coordinates)
     4. _Datum relationships resolve_ (0.5s–1.35s, vertical and horizontal axes intersect to create the coordinate frame)
     5. _Fragments align into contextual relationship against datums_ (0.8s–1.8s, docking into exact cells with `cubic-bezier(0.16, 1, 0.3, 1)`)
     6. _Wordmark / tagline gains final visual authority_ (1.1s–2.0s, title and brand line solidify in dark carbon ink)
     7. _Composition settles_ (2.0s–2.4s, quiet transition cues appear)
   - On mobile viewports (`max-width: 44rem`), resolves vertically with staggered upward alignment into the stack.

2. **Peak 2 — Product Family → Software Structural Transformation (`adapt` → `enter`):**
   - **Mid-Page Structural Transformation:** Shared masterbrand architecture adapts; Software branch becomes selected spatial context; resolves into functional inhabited workbench environment.
   - **Choreography:**
     - In Product Family (`adapt`), the active Software vertical expands column proportion (`1.55fr : 0.85fr`), border deepens to ink, and the 3 inhabited layers resolve in sequence while provisional wings soften.
     - In Software (`enter`), the Context Aperture boundary resolves from a thin line to full workbench enclosure (`enter-environment`), the top substrate bar locks into position from the aperture (`enter-substrate`), the central evidentiary conduit establishes the vertical transmission spine (`enter-conduit`), and candidate workspace and evaluator reconstruction chambers deploy outward to left and right (`enter-candidate`, `enter-evaluator`).

3. **Peak 3 — Campaign Expressive Peak (`contrast`):**
   - **Highest Expressive Peak:** "Evidence over impressions." monumental typography broadside.
   - **Choreography:**
     - Top oxide aperture draws open (`campaign-aperture`).
     - Symmetrical fulcrum datum rules expand outward from the center terracotta italic "over" pivot (`campaign-axis-left`, `campaign-axis-right`, `campaign-over-fulcrum`).
     - **Material Presence & Scale Shift:** "Evidence" surges with massive physical authority, solid carbon ink, rising into monumental scale (`strengthen-evidence`). "impressions." settles on the lower tier as an airy architectural wireframe outline (`soften-impressions`), maintaining legibility without deletion, glitches, or character explosions.
     - Colophon datum locks the axiom: _"The observable record precedes interpretation."_
     - The resolved state functions as an authoritative static poster.

### Motion Energy Curve

Attention requires contrast. Every section is tuned to an intentional energy curve:

| Section                | Energy Level | Semantic Role & Motion Behavior                                              |
| ---------------------- | ------------ | ---------------------------------------------------------------------------- |
| **Hero**               | HIGH         | Signature impact: on-load Context Resolution sequence + exit datum guide     |
| **Impressions**        | MEDIUM       | Editorial tension: subtle reframe of moments and context emergence           |
| **Evidence Narrative** | MEDIUM       | Controlled unfold: connecting path drawing across 6 chronological events     |
| **Clarity**            | LOW          | Calm focus: subtle layer focus hairline highlight as scroll passes           |
| **Product Family**     | BUILD        | Adapt frame: active Software branch claims spatial dominance                 |
| **Software entry**     | HIGH         | Structural transformation: substrate lock, conduit spine deployment chambers |
| **Software body**      | LOW          | Grounded: candidate fixtures and evaluator records stay stable and readable  |
| **Campaign**           | HIGHEST      | Expressive peak: monumental contrast, fulcrum expansion, material shift      |
| **Final CTA**          | VERY LOW     | Settle: subtle rule settle, quiet finality                                   |

### Timing & Easing Rules

- **No Uniform Slowness:** Premium does not mean lethargic. Movement is decisive and crisp.
- **Intentional Holds:** Readable intermediate states allow the eye to perceive context formation.
- **Easing Contract:** Snappy architectural ease-out `cubic-bezier(0.16, 1, 0.3, 1)` for entrances and settling; `linear` for scroll-linked view timelines.
- **No Elastic Bounce:** Absolutely no rubbery spring physics or playful wobble.

### Forbidden Motion Behaviors

1. ❌ No particles, floating sparkles, dust, or glowing energy nodes.
2. ❌ No random flying or drifting text.
3. ❌ No cursor followers, magnetic buttons, or 3D tilt cards.
4. ❌ No character animation, kinetic typography gymnastics, text explosion, or glitch effects.
5. ❌ Never delete, strike through, or cross out "impressions."; authority shifts via scale and material presence.
6. ❌ Never force touch interactions to simulate desktop hover states.

### Reduced Motion Contract

- When `prefers-reduced-motion: reduce` is detected:
  - All animations and transitions are nullified (`animation: none !important; transition: none !important;`).
  - `transform: none !important; opacity: 1 !important;`
  - Every signature moment immediately presents its 100% complete, fully resolved static state.
  - Zero semantic information, visual contrast, or layout completeness depends on motion.

---

## 9. Correct vs. Incorrect Usage

| Domain                | Correct Usage                                                                 | Incorrect Usage                                                                       |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Palette**           | Warm ivory (`#f2eee4`), near-black ink (`#1c1b17`), oxide accent (`#9e4328`). | Pure white background, pure `#000000`, neon lime or bright blue.                      |
| **Accent Role**       | Aperture thresholds, active focus points, editorial fulcrum ("over").         | Red error tags, green success badges, candidate scores.                               |
| **Software Identity** | Inhabited workbench substrate, multi-pane density, masterbrand palette.       | Bright yellow/lime status tags, separate standalone branding.                         |
| **Logo**              | Deliberate wordmark + Context Aperture structural mark.                       | Generic "H" icon, geometric hexagon, AI sparkle icon.                                 |
| **Framing**           | Open apertures with incomplete corners and datum alignment guides.            | Closed rectangular cards with heavy drop shadows.                                     |
| **Typography**        | Robust display serif paired with disciplined functional sans.                 | Rounded geometric sans, thin high-contrast fashion serifs, outline text on body copy. |
