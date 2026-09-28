# Hirearchy Asset Gap Report v1

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Exhaustive audit of missing visual assets, technical implementation mediums, and generation specifications for upcoming asset creation cycles.  
**Mandate:** Identifies what the design and art direction team must produce next. Implementation agents must **NOT** invent speculative replacements for these gaps.

---

## 1. Summary of Asset Gaps

| Scene        | Required Asset Description                  | Missing Capability / Defect in Current Pool                       | Medium                         | Priority |
| :----------- | :------------------------------------------ | :---------------------------------------------------------------- | :----------------------------- | :------- |
| **Scene 01** | Hero Attempt / Workbench Panel (Sanitized)  | Candidate PNGs have baked resume/github/confidence text           | **STATIC IMAGE / NATIVE DOM**  | Critical |
| **Scene 03** | Chronological Telemetry Spine               | No connected 00:00–42:15 timeline asset exists                    | **SVG + NATIVE DOM**           | High     |
| **Scene 04** | 3D Exploded Stratum Layer Stack             | Plane kit has fragments; lacks unified 3-slab stack with conduits | **STATIC IMAGE / CSS 3D**      | High     |
| **Scene 05** | Workbench Static Fallback                   | Existing PNG is full mock; needs clean responsive fallback        | **PRODUCT UI / SVG**           | Critical |
| **Scene 06** | 4-Role Perspective Depth Stack              | Existing PNG has forbidden charts and lacks 4th role              | **CSS/DOM / STATIC IMAGE**     | Medium   |
| **Scene 07** | Tectonic Slate Displacement Texture         | Needed for carved monumental letterforms                          | **STATIC IMAGE (Texture Map)** | Medium   |
| **Scene 08** | Grounded Concrete Tablet with Debossed Mark | Previous asset rejected for corporate real-estate look            | **STATIC IMAGE (WebP/AVIF)**   | Critical |

---

## 2. Detailed Gap Specifications

### GAP 00: Scene 01 — Hero Attempt / Workbench Panel (Sanitized)

- **Scene:** Scene 01 — Masterbrand Hero (`Real work. In context.`)
- **Required Asset:** Standalone Sanitized Attempt / Code Editor Workbench Panel (Z2 Layer).
- **Why Existing Assets Cannot Fulfill It:** Both newly generated attempt panel candidate images (`Codex Image Sep 26, 2026, 03_30_36 PM.png` and `8a882a42-371c-41e7-8e2a-b29325de6846.png`) contain severe product truth violations in their baked code diff:
  - Line 49: `sources: ['resume', 'github', 'work-history']` (unsupported resume/GitHub screening proxies).
  - Line 53: `confidence: result.confidence` (automated evaluation / algorithmic confidence score).
    Per product truth, these assets are classified **REFERENCE_ONLY_UNSAFE**. Production implementation must either render a sanitized code editor panel via native DOM or await a sanitized re-render.
- **Exact Aspect Ratio:** `4:5` (`1122 × 1402px`).
- **Required Composition:**
  - Dark carbon slate workbench plate with mineral glass bevel edge.
  - Header: `Attempt` with timestamp (`00:14:27`) and `Revision: 2 commits`.
  - Code diff showing authentic engineering logic (e.g. distributed cache staleness, retry loops, or test assertions) with ZERO resume/github or confidence score mentions.
  - Isolated on transparent alpha channel.
- **Target Implementation Medium:** **STATIC IMAGE** (Sanitized render) or **NATIVE DOM / CSS 3D Component**.

---

### GAP 01: Scene 03 — Chronological Telemetry Spine

- **Scene:** Scene 03 — Observable Work (`Work is not an answer. Work is a trajectory.`)
- **Required Asset:** Interactive Chronological Telemetry Spine / Execution Trajectory Visualizer.
- **Why Existing Assets Cannot Fulfill It:** Existing assets provide isolated chips (`hirearchy-evidence-status-modules.png`), but zero connected chronological trajectory assets. A static raster image cannot provide the interactive timeline scrubber, milestone pulse indicators, or expandable code drawer required by the 099 specification.
- **Exact Aspect Ratio:** Fluid `16:5` to `24:7` desktop horizontal strip (`1200 × 380px` nominal).
- **Required Composition:**
  - Continuous calibrated horizontal time axis marked from `00:00:00` to `00:42:15`.
  - 6 discrete factual milestone nodes: `Attempt`, `Investigation`, `Failure`, `Revision`, `Verification`, `Uncertainty`.
  - Interactive playback cursor linked to scroll scrubbing.
  - Expandable SVG laser datums connecting nodes to terminal transcript excerpts.
- **Target Implementation Medium:** **SVG + NATIVE DOM** (Semantic ordered list `<ol>` styled with CSS Grid and dynamic SVG connecting rules).

---

### GAP 02: Scene 04 — 3D Exploded Stratum Layer Stack

- **Scene:** Scene 04 — Stratified Context (`One event is partial. A sequence provides context.`)
- **Required Asset:** Unified 3-Layer Exploded STRATA Stack with Vertical Alignment Conduits.
- **Why Existing Assets Cannot Fulfill It:** `hirearchy-strata-spatial-plane-kit.png` contains uncomposed plane fragments. We lack a unified, pre-composed isometric render of the 3 constitutional strata:
  - Stratum 1 (Carbon Substrate): Raw terminal logs and sandbox exit codes.
  - Stratum 2 (Chronological Axis): Grouped sequence events and diff references.
  - Stratum 3 (Evaluator Aperture): Reviewable human synthesis view.
- **Exact Aspect Ratio:** `4:3` or `16:10` (`1448 × 1086px`).
- **Required Composition:**
  - Three distinct mineral glass and carbon slabs elevated along the vertical Z-axis.
  - Semi-transparent transmission showing lower layers through upper layers.
  - Vertical alignment rays / laser datums in signature accent (`#F04A2F`) piercing through all 3 slabs to illustrate evidentiary provenance.
  - Isolated on transparent alpha channel.
- **Target Implementation Medium:** **STATIC IMAGE** (Rendered 3D asset with alpha transparency) or **CSS 3D / WebGL Hybrid**.

---

### GAP 03: Scene 05 — Scripted Workbench Static Fallback

- **Scene:** Scene 05 — Product Reveal (`The Inhabited Workbench`)
- **Required Asset:** Responsive Static Fallback Plate for Scripted Evidence Walkthrough.
- **Why Existing Assets Cannot Fulfill It:** `hirearchy-evaluator-session-timeline.png` is an uneditable desktop screenshot. Per 099 architecture, the production workbench is a native React Client Component (`evidence-walkthrough.tsx`). However, for mobile breakpoints (`< 768px`), print stylesheets, and no-JS / WebGL failure states, a clean, high-contrast, non-blurry static snapshot of the cache-staleness walkthrough is needed.
- **Exact Aspect Ratio:** `16:10` (`1440 × 900px`).
- **Required Composition:**
  - 3-pane workbench displaying:
    1. Left: Chronological event tree.
    2. Center: Syntax-highlighted code patch for cache staleness.
    3. Right: Terminal test execution log showing `PASS tests/cache.spec.ts`.
  - Clearly labeled with status badge: `Scripted evidence walkthrough`.
  - Zero synthetic scores or fit badges.
- **Target Implementation Medium:** **PRODUCT UI** (Native React/Next.js Component) primary; **SVG / Static WebP** fallback.

---

### GAP 04: Scene 06 — 4-Role Perspective Depth Stack

- **Scene:** Scene 06 — Multi-Perspective Reconstruction (`Three Lenses, One Reality`)
- **Required Asset:** 4-Card Perspective Stack (Clean Factual Records, Zero Analytics Charts).
- **Why Existing Assets Cannot Fulfill It:** Existing `hirearchy-evaluator-role-perspectives.png` was rejected for production use because:
  1. The Hiring Manager card displays a generic analytics bar chart and trend line (violating product truth against SaaS analytics).
  2. It shows only 3 cards, whereas product truth supports 4 distinct disclosure roles:
     - `GENERALIST_RECRUITER`
     - `TECHNICAL_RECRUITER`
     - `ENGINEER`
     - `ENGINEERING_MANAGER`
- **Exact Aspect Ratio:** `4:3` (`1448 × 1086px`) or 4 individual `3:4` card assets (`420 × 560px` each).
- **Required Composition:**
  - 4 receding cards tilted at `15°` oblique isometric perspective.
  - Card 1: Factual milestones & verified submission scope.
  - Card 2: Timeline pacing & tool usage chronology.
  - Card 3: Syntax diffs, test assertion logs, terminal commands.
  - Card 4: Architecture tradeoffs, edge case notes, evaluator annotations.
  - Pure typography and code lines; zero generic bar charts or percentage meters.
- **Target Implementation Medium:** **CSS/DOM 3D Card Stack** (preferred for accessible text) or **STATIC IMAGE** (isolated transparent PNG).

---

### GAP 05: Scene 07 — Tectonic Slate Displacement Texture

- **Scene:** Scene 07 — Campaign Climax (`EVIDENCE OVER IMPRESSIONS.`)
- **Required Asset:** High-Resolution Poured Concrete / Honed Slate Normal and Displacement Maps.
- **Why Existing Assets Cannot Fulfill It:** Scene 07 requires the monumental typography statement to feel carved into physical stone or heavyweight mineral paper under raking directional daylight. Using plain system fonts with CSS flat color lacks the tactile weight of the creative direction.
- **Exact Aspect Ratio:** `16:9` (`1920 × 1080px`).
- **Required Composition:**
  - Grayscale 16-bit displacement map and tangent-space normal map of honed mineral slate with fine aggregate grain.
  - Directional raking shadow mask at 45° angle.
- **Target Implementation Medium:** **STATIC IMAGE (Texture Maps)** applied via SVG displacement filter or WebGL text shader.

---

### GAP 06: Scene 08 — Grounded Brutalist Monolith

- **Scene:** Scene 08 — Close & Colophon (`The Human Verdict`)
- **Required Asset:** Brutalist Concrete Stele / Tablet with Debossed STRATA Mark.
- **Why Existing Assets Cannot Fulfill It:** `hirearchy-architectural-brand-monument-rejected.png` was classified REJECTED because it resembled a commercial office tower / corporate real-estate monument against a bright sky. Scene 08 requires a grounded, quiet, close-up architectural still: a physical cast-concrete stela resting in natural earth, with the STRATA three-tier mark deeply engraved/debossed, casting physical morning shadows.
- **Exact Aspect Ratio:** `4:5` vertical or `1:1` square (`1200 × 1500px` or `1400 × 1400px`).
- **Required Composition:**
  - Close-up tactile study of unbleached architectural concrete.
  - Clean intaglio/debossed engraving of the three ascending STRATA bars.
  - Raking low-angle morning sunlight casting a crisp shadow.
  - Grounded in earth/gravel or set against warm paper drafting surface.
  - Zero glass office buildings, zero commercial skyline, zero AI plastic sheen.
- **Target Implementation Medium:** **STATIC IMAGE** (Photorealistic high-resolution WebP/AVIF still).
