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

## 8. Motion Identity Principles (Placeholder for D1B.ID2)

- Motion is functional choreography, not decoration.
- Each section owns one distinct semantic verb:
  1. Hero: `organize`
  2. Impressions: `reframe`
  3. Evidence Narrative: `unfold`
  4. Clarity: `prioritize`
  5. Product Family: `adapt`
  6. Hirearchy Software: `enter`
  7. Campaign: `contrast`
  8. Final CTA: `settle`
- Static Completeness: When `prefers-reduced-motion: reduce` is active, the entire visual hierarchy, layout, contrast, and legible meaning remain 100% complete and legible with zero animation dependency.

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
