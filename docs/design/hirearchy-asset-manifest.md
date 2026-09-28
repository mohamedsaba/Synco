# Hirearchy Website Asset Manifest v1

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Canonical visual asset inventory, safety classifications, transformation boundaries, and consumption mandates for the Hirearchy website experience.  
**Authority:** Hirearchy / Hirearchy Software / Hirearchy Engineering Evaluation Prototype — `docs/plans/active/099-hirearchy-website-experience-rebuild.md` Product Truth & Architecture Gate.

---

## 1. Governance & Consumption Mandate

> ### NON-NEGOTIABLE ASSET CONSUMPTION RULE
>
> For an **APPROVED** asset marked **MANDATORY**:
> Future implementation agents **MUST USE THE ASSET DIRECTLY**.
> Implementation agents are strictly prohibited from inspecting the asset and attempting to reconstruct an ad-hoc visual approximation using generic CSS shapes, arbitrary Tailwind cards, SVG primitives, or AI-generated divs.
> The approved visual assets embody specific physical materiality, optical transmission, and architectural strata depth established in the creative direction.

---

## 2. Global Asset Summary

| Semantic Filename                                                              | Dimensions          | Original Filename                           | Classification                           | Mandate                                         | Primary Scene              |
| :----------------------------------------------------------------------------- | :------------------ | :------------------------------------------ | :--------------------------------------- | :---------------------------------------------- | :------------------------- |
| Semantic Filename                                                              | Dimensions          | Original Filename                           | Classification                           | Mandate                                         | Primary Scene              |
| :---                                                                           | :---                | :---                                        | :---                                     | :---                                            | :---                       |
| `hirearchy-hero-evidence-spatial-composition.png`                              | 1448 × 1086         | `452cea65-9520-46f5-a04f-624e36dcf999.png`  | **STATIC RESOLVED REFERENCE / FALLBACK** | **FALLBACK_ONLY** (Not Primary Animated Object) | Scene 01                   |
| `approved/hero-motion/hirearchy-hero-repository-panel.png`                     | 1122 × 1402         | `Codex Image Sep 26, 2026, 03_30_44 PM.png` | **APPROVED**                             | **MANDATORY** (Z1 Motion Layer)                 | Scene 01 Motion            |
| `approved/hero-motion/hirearchy-hero-evidence-spine.png`                       | 887 × 1774          | `3719262f-7eb2-4838-b999-f1ccefa07f5b.png`  | **APPROVED**                             | **MANDATORY** (Z3 Motion Layer)                 | Scene 01 Motion            |
| `approved/hero-motion/hirearchy-hero-card-investigation.png`                   | 1448 × 1086         | `Codex Image Sep 26, 2026, 03_31_14 PM.png` | **APPROVED**                             | **MANDATORY** (Z4 Motion Layer)                 | Scene 01 Motion            |
| `approved/hero-motion/hirearchy-hero-card-revision.png`                        | 1448 × 1086         | `Codex Image Sep 26, 2026, 03_31_07 PM.png` | **APPROVED**                             | **MANDATORY** (Z4 Motion Layer)                 | Scene 01 Motion            |
| `approved/hero-motion/hirearchy-hero-card-verification.png`                    | 1448 × 1086         | `Codex Image Sep 26, 2026, 03_31_01 PM.png` | **APPROVED**                             | **MANDATORY** (Z4 Motion Layer)                 | Scene 01 Motion            |
| `approved/hero-motion/hirearchy-hero-card-outcome.png`                         | 1448 × 1086         | `Codex Image Sep 26, 2026, 03_30_54 PM.png` | **APPROVED**                             | **MANDATORY** (Z4 Motion Layer)                 | Scene 01 Motion            |
| `reference-only/hero-motion/hirearchy-hero-attempt-panel-unsafe.png`           | 1122 × 1402         | `Codex Image Sep 26, 2026, 03_30_36 PM.png` | **REFERENCE_ONLY_UNSAFE**                | **DO_NOT_USE** (In DOM)                         | Scene 01 Reference         |
| `reference-only/hero-motion/hirearchy-hero-attempt-panel-duplicate-unsafe.png` | 1122 × 1402         | `8a882a42-371c-41e7-8e2a-b29325de6846.png`  | **REFERENCE_ONLY_UNSAFE**                | **DO_NOT_USE** (In DOM)                         | Scene 01 Reference         |
| `reference-only/hero-motion/hirearchy-hero-evidence-spine-alt.png`             | 724 × 2172          | `e6966e10-65ba-4664-bef3-ba9f19720c9a.png`  | **REFERENCE_ONLY**                       | **OPTIONAL_ALT**                                | Scene 01 Alternate         |
| `reference-only/hero-motion/hirearchy-lockup-horizontal-raster.png`            | 2172 × 724          | `b937a479-aa5f-4ba0-9871-8713df69d4ba.png`  | **REFERENCE_ONLY**                       | **DO_NOT_USE** (Use SVG)                        | Logo Reference             |
| `reference-only/hero-motion/hirearchy-mark-raster.png`                         | 1254 × 1254         | `Codex Image Sep 26, 2026, 03_38_06 PM.png` | **REFERENCE_ONLY**                       | **DO_NOT_USE** (Use SVG)                        | Logo Reference             |
| `hirearchy-strata-spatial-plane-kit.png`                                       | 1448 × 1086         | `242f8c60-3d3b-4492-adb4-4f7a1b55b4e4.png`  | **APPROVED**                             | **OPTIONAL**                                    | Scene 01 / Scene 04        |
| `hirearchy-impressions-fragment-set.png`                                       | 1448 × 1086         | `96234bb3-16a8-42d0-9e38-f36270ee7382.png`  | **APPROVED**                             | **MANDATORY**                                   | Scene 02                   |
| `hirearchy-strata-brand-environment.png`                                       | 1672 × 941          | `Codex Image Sep 25, 2026, 09_11_40 PM.png` | **APPROVED**                             | **MANDATORY**                                   | Scene 07 / Scene 08        |
| `hirearchy-mark.svg`                                                           | 183 × 148 (viewBox) | Vector extraction                           | **APPROVED**                             | **MANDATORY** (Masterbrand Symbol)              | Global / Nav / Chrome      |
| `hirearchy-lockup-horizontal.svg`                                              | 600 × 148 (viewBox) | Vector extraction                           | **APPROVED**                             | **MANDATORY** (Primary Lockup)                  | Navigation / Headers       |
| `hirearchy-wordmark.svg`                                                       | 280 × 68 (viewBox)  | Typography extraction                       | **APPROVED**                             | **OPTIONAL** (Text-Only)                        | Editorial Mastheads        |
| `hirearchy-software-lockup.svg`                                                | 520 × 148 (viewBox) | Vector extraction                           | **APPROVED**                             | **MANDATORY** (Product Lockup)                  | Scene 05 / Software        |
| `hirearchy-hero-motion-storyboard.png`                                         | 1448 × 1086         | `dbba7f97-d44e-4eb8-870b-ad015691241d.png`  | **REFERENCE_ONLY**                       | **DO_NOT_USE** (In DOM)                         | Scene 01 Motion            |
| `hirearchy-evaluator-session-timeline.png`                                     | 1448 × 1086         | `c7fa6e6b-b0cc-4350-828d-884e56734f72.png`  | **REFERENCE_ONLY**                       | **DO_NOT_USE** (In DOM)                         | Scene 04 / Scene 05 UI     |
| `hirearchy-evaluator-role-perspectives.png`                                    | 1448 × 1086         | `eb3a1be4-f841-4060-bee5-333ff524ce4e.png`  | **REFERENCE_ONLY**                       | **DO_NOT_USE** (In DOM)                         | Scene 06 Reference         |
| `hirearchy-evidence-status-modules.png`                                        | 1448 × 1086         | `c11d97a5-8aeb-4f75-8ee0-d61ec9455dbe.png`  | **REFERENCE_ONLY**                       | **OPTIONAL** (Cropped)                          | Evidence UI Chips          |
| `hirearchy-website-direction-v1-duplicate.png`                                 | 1536 × 1024         | `Codex Image Sep 25, 2026, 07_53_17 PM.png` | **REFERENCE_ONLY**                       | **DO_NOT_USE**                                  | Whole-page North Star      |
| `hirearchy-logo-usage-sheet.png`                                               | 1536 × 1024         | `Codex Image Sep 25, 2026, 08_48_12 PM.png` | **REFERENCE_ONLY**                       | **DO_NOT_USE** (In DOM)                         | Logo Usage Specification   |
| `hirearchy-evidence-code-revision-composition-rejected.png`                    | 1448 × 1086         | `ffbf5cac-385d-46b3-80c2-160d82016b65.png`  | **REJECTED**                             | **DO_NOT_USE**                                  | Rejected Candidate Code    |
| `hirearchy-architectural-brand-monument-rejected.png`                          | 1448 × 1086         | `61a16d18-7add-4a98-9db8-0519c310907a.png`  | **REJECTED**                             | **DO_NOT_USE**                                  | Rejected Real Estate Stela |

_Visual North Star Reference:_ `docs/design/references/hirearchy-website-direction-v1.png` (1536 × 1024 RGB) is preserved separately as the unedited masterboard reference.

---

## 3. Detailed Asset Specifications

### Asset 01: `hirearchy-hero-evidence-spatial-composition.png`

- **Filename:** `docs/design/assets/approved/hirearchy-hero-evidence-spatial-composition.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **STATIC RESOLVED REFERENCE / FALLBACK** (Superseded as primary animated element by standalone Hero motion assets)
- **Purpose:** Visual target, static fallback, and reduced-motion fallback for Scene 01 (Masterbrand Hero). Establishes the resolved spatial relationship of the animated pieces. Must NOT be animated as a single monolithic raster layer or 3D camera-orbit object.
- **Visual contents:**
  - Three ascending, semi-transparent mineral glass strata tilted at oblique isometric perspective.
  - Left translucent file tree buffer displaying authentic engineering directory structure (`src/`, `api/`, `services/`, `tests/`, `docker/`, `README.md`).
  - Dark carbon center terminal panel titled `Attempt` (`00:14:27`) executing `DeterminantSandbox.run` with 9 sequential run steps (Initialize environment, Install dependencies, Run unit tests, Lint code, Type checking, Build project, Run integration tests, Validate results, Generate summary) with duration bars and exact timestamps (`00:00` to `04:27`).
  - Right floating translucent evidence chips: `Investigation (3 files)`, `Revision (2 commits)`, `Verification (4 tests)`, `Outcome (Deployed locally)`.
- **Primary scene:** Scene 01 — Masterbrand Hero (`Real work. In context.`).
- **Role:** Visual target reference and static / reduced-motion fallback.
- **Mandate:** **FALLBACK_ONLY** for Scene 01 (when standalone motion assets are available, desktop Hero MUST be assembled from the standalone motion assets).
- **Desktop treatment:** Static fallback when WebGL/CSS 3D layers are unavailable or when user selects `prefers-reduced-motion: reduce`. Positioned on the right 54%–62% of viewport (1440×900).
- **Mobile treatment:** Centered below headline copy (390×844) as a static resolved plate (`max-width: 92vw`, `aspect-ratio: 1448/1086`).
- **Allowed transformations:**
  - Proportional scaling (`width`, `height`, `max-width`).
  - Linear opacity adjustment (fade in/out during scroll).
  - Clean spatial masking / gradient feathering at edges.
- **Forbidden transformations:**
  - ❌ Rotating the entire composition in 3D / camera orbit.
  - ❌ Moving the raster Hero as a single primary animated object.
  - ❌ Whole-composition translateZ as primary effect.
  - ❌ Recolor, tint shifts, or hue rotation.
- **Baked text:**
  - File tree: `src/`, `api/`, `services/`, `tests/`, `docker/`, `README.md`.
  - Header: `Attempt`, `00:14:27`.
  - Terminal: `Run tests...`, `DeterminantSandbox.run`, 9 test execution steps with durations.
  - Right cards: `Investigation 3 files`, `Revision 2 commits`, `Verification 4 tests`, `Outcome Deployed locally`.
- **Product-truth status:** **SAFE FACTUAL REPRESENTATION**. All baked text describes observable repository files, execution steps of a sandbox run, and discrete factual counts. Contains zero candidate scores, zero fit recommendations, and zero inferred traits.
- **Reason for classification:** Retained as the visual target and static resolved fallback. The standalone motion layers allow discrete, non-rigid animation of each layer.

---

### Asset 02: `hirearchy-strata-spatial-plane-kit.png`

- **Filename:** `docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Purpose:** Spatial substrate and modular plane kit. Provides pure architectural material planes (frosted mineral glass, carbon slate slabs, tilted horizontal substrates) without baked UI text.
- **Visual contents:**
  - 8 distinct groupings of neutral spatial planes:
    1. Top-left: Multi-tier isometric glass pavilion with carbon core slab.
    2. Top-right: Dual-wing oblique mineral glass reflectors.
    3. Mid-left: 3-layer floating rounded glass specimen plates.
    4. Mid-center-left: 3-layer vertical glass separators with dark backplate.
    5. Mid-center-right: 3-layer horizontal stacked planar substrates (the pure STRATA motif).
    6. Mid-right: 4-layer receding vertical glass dividers.
    7. Bottom-left: 4 standalone upright planar cards (glass and slate).
    8. Bottom-center/right: 4 tilted isometric ground-plane slabs and shadows.
- **Primary scene:** Supporting layer across Scene 01 (Hero depth augmentation) and Scene 04 (Stratified Context 3-layer stack).
- **Secondary use:** CSS background slices, responsive card backdrops, depth strata visual accents.
- **Mandate:** **OPTIONAL**. May be used as a source for individual sliced plane elements or layered substrates.
- **Desktop treatment:** Cropped or sliced into individual sprite elements for CSS 3D perspective layers or canvas backdrops.
- **Mobile treatment:** Used as individual static plate backdrops behind text callouts.
- **Allowed transformations:**
  - Slicing / cropping into sub-assets (individual planes/slabs).
  - Alpha blending, opacity modulation.
  - CSS 3D matrix transforms and perspective rotation.
  - Scaling and repositioning.
- **Forbidden transformations:**
  - ❌ Color inversion or neon tinting.
  - ❌ Distorting bevels or blurring natural frosted texture.
- **Baked text:** None. 100% clean material surfaces.
- **Product-truth status:** **SAFE**. Pure architectural material geometry.
- **Reason for classification:** Provides clean, text-free architectural building blocks that faithfully match the physical glass/carbon materiality of the masterboard reference.

---

### Asset 03: `hirearchy-impressions-fragment-set.png`

- **Filename:** `docs/design/assets/approved/hirearchy-impressions-fragment-set.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Purpose:** Primary visual illustration for Scene 02 (The Limitation / The Epistemic Dilemma: _"Traditional hiring misses the real picture."_). Demonstrates how conventional proxy artifacts flatten complex human problem-solving into 1D shadows.
- **Visual contents:**
  - Three distinct specimen plates tilted in isometric perspective:
    1. Left: "Resumes miss context" — Layered paper/glass resume sheets showing candidate silhouette and abstract resume bullet lines.
    2. Center: "Interviews are limited" — Translucent card showing candidate profile and prominent question mark `?` with question bullet lines.
    3. Right: "Coding tests show only the final result" — Dark terminal window with macOS-style dots, numbered lines 1 to 10, and synthetic syntax bars.
- **Primary scene:** Scene 02 — The Flat Projection.
- **Secondary use:** Column illustrations in a 3-part responsive card grid.
- **Mandate:** **MANDATORY** for Scene 02.
- **Desktop treatment:** Displayed across the 3 columns of Scene 02 (either as the unified 3-plate composition spanning 70%–85% viewport width, or sliced into 3 individual column plates).
- **Mobile treatment:** Sliced into 3 separate column illustrations stacked vertically, each paired with its respective narrative block: 1. Resumes, 2. Interviews, 3. Coding tests.
- **Allowed transformations:**
  - Slicing into 3 individual plate assets along vertical column lines.
  - Proportional scaling.
  - Hover tilt / subtle CSS elevation (`translateY(-4px)`).
  - Masking and soft edge feathering.
- **Forbidden transformations:**
  - ❌ Adding synthetic scores or checkmarks onto the plates.
  - ❌ Redrawing with generic Lucide or FontAwesome icons.
- **Baked text:** No readable words. Contains only abstract text lines, line numbers `1`–`10`, and a question mark symbol `?`.
- **Product-truth status:** **SAFE FACTUAL REPRESENTATION**. Symbolizes the systemic limitations of traditional hiring proxies without fabricating false data.
- **Reason for classification:** Exact, high-fidelity isolated render of the 3 specimen plates from Panel 02 of the masterboard reference.

---

### Asset 04: `hirearchy-hero-motion-storyboard.png`

- **Filename:** `docs/design/assets/reference-only/hirearchy-hero-motion-storyboard.png`
- **Dimensions:** 1448 × 1086 px (RGB)
- **Status:** **REFERENCE_ONLY**
- **Purpose:** Authoritative motion design specification and visual guide for the Hero scroll progression. Guides the animation engineering of Scene 01.
- **Visual contents:**
  - Header: `Hierarchy | HERO MOTION STORYBOARD | FROM FRAGMENTS TO REAL-WORLD CONTEXT | MOTION GUIDE`.
  - 4 numbered storyboard phases:
    1. **Frame 1 (Compressed fragment state):** Tight unified cluster of layered elements representing unstructured data.
    2. **Frame 2 (Separated layers):** Expansion into distinct Z-planes. Code, actions, and evidence emerge from core.
    3. **Frame 3 (Contextualized evidence relationships):** Data conduits link evidence cards to code diff.
    4. **Frame 4 (Resolved handoff into next scene):** Composition translates forward/right, layers align, light increases for smooth handoff into Scene 02.
- **Primary scene:** Scene 01 Motion Choreography.
- **Secondary use:** Visual reference for QA validation and developer documentation.
- **Mandate:** **DO_NOT_USE in DOM / production bundle**. Strictly an internal design spec asset.
- **Desktop treatment:** Not rendered on website. Used by developers to code scroll-linked transitions.
- **Mobile treatment:** Not rendered on website.
- **Allowed transformations:** None (internal reference document).
- **Forbidden transformations:** None.
- **Baked text:** Extensive storyboard annotations, motion notes, frame numbers, and descriptions.
- **Product-truth status:** **REFERENCE DOCUMENTATION**. Safe as internal engineering guidance.
- **Reason for classification:** It is an internal multi-frame guide with explanatory labels, not an end-user UI asset.

---

### Asset 05: `hirearchy-evaluator-session-timeline.png`

- **Filename:** `docs/design/assets/reference-only/hirearchy-evaluator-session-timeline.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY**
- **Purpose:** Authoritative UI visual specification for Scene 04 / Scene 05 (The Evaluator Experience / Inhabited Workbench). Serves as the pixel reference for the native interactive React component (`evidence-walkthrough.tsx`).
- **Visual contents:**
  - Complete Hirearchy Software Evaluator interface (`Candidates > Session 0427`):
    - Top nav with search, share, options.
    - Left sidebar: Overview, Timeline, Code, Environment, Evidence, Notes.
    - Top center: Chronological session timeline (Attempt: 12 events, Investigation: 8 events, Revision: 5 events, Verification: 4 events, Outcome: 1 event).
    - Bottom left: Session events stream (`Explored repository structure 00:02:14`, `Checked logs 00:08:27`, `Modified order service 00:15:03`, `Ran tests 00:22:10`, `Fixed edge case 00:28:46`, `Documented approach 00:34:12`).
    - Bottom right: Evidence details with file tree and syntax-highlighted code editor displaying `src/api/order-controller.ts`.
- **Primary scene:** Visual blueprint for Scene 04 / Scene 05.
- **Secondary use:** Visual QA reference for testing the React workbench component.
- **Mandate:** **DO_NOT_USE as a flat raster image in production DOM**. The 099 architecture gate requires Scene 05 to be an accessible, keyboard-navigable native React component with semantic DOM and dynamic tabs.
- **Desktop treatment:** Reference specification only.
- **Mobile treatment:** Reference specification only.
- **Allowed transformations:** Internal inspection only.
- **Forbidden transformations:** Do not embed as a static screenshot where an interactive component is mandated.
- **Baked text:** UI chrome, navigation items, session metadata, event descriptions, and TypeScript code.
- **Product-truth status:** **SAFE FACTUAL RECORD**. All displayed metadata represents objective events and code without evaluative scoring or fit claims.
- **Reason for classification:** Scene 05 must be implemented as a native interactive React component per 099; a static raster image cannot provide keyboard accessibility, accessible DOM text, or interactive tab switching.

---

### Asset 06: `hirearchy-evaluator-role-perspectives.png`

- **Filename:** `docs/design/assets/reference-only/hirearchy-evaluator-role-perspectives.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY**
- **Purpose:** Visual reference for Scene 06 (Three Lenses, One Reality / Multi-perspective Reconstruction). Illustrates 3D staggered card perspective.
- **Visual contents:**
  - Three receding isometric cards stacked in depth:
    1. Front card: `Recruiter / High-level progress` with 4 progress tracks and status pips.
    2. Middle card: `Engineer / Technical deep dive` with code structure and syntax lines.
    3. Back card: `Hiring Manager / Decision context` displaying a bar chart, trend line, and metric dots.
- **Primary scene:** Scene 06 reference.
- **Secondary use:** Layout and perspective reference.
- **Mandate:** **DO_NOT_USE in production DOM without modification**.
- **Desktop treatment:** Reference only. Production implementation uses native semantic HTML/CSS cards.
- **Mobile treatment:** Reference only.
- **Allowed transformations:** None for production DOM.
- **Forbidden transformations:** Direct embedding of the unedited asset in production.
- **Baked text:** `Recruiter / High-level progress`, `Engineer / Technical deep dive`, `Hiring Manager / Decision context`.
- **Product-truth status:** **UNSAFE CONCEPTS IN IMAGE**. The Hiring Manager card depicts a generic SaaS analytics bar chart and trend line. Product Truth Gate explicitly establishes: Hirearchy does _not_ produce generic aggregate analytics, scores, or trend summaries. The evaluator experience is a chronological reconstruction, not an analytics dashboard. Furthermore, 099 specifies 4 supported disclosure roles (`GENERALIST_RECRUITER`, `TECHNICAL_RECRUITER`, `ENGINEER`, `ENGINEERING_MANAGER`).
- **Reason for classification:** Contains unsupported generic analytics charts on the Hiring Manager card that violate the product truth gate.

---

### Asset 07: `hirearchy-evidence-status-modules.png`

- **Filename:** `docs/design/assets/reference-only/hirearchy-evidence-status-modules.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY** (Full Asset) / **APPROVED WITH MANDATORY CROP** (Row 1 & Row 4 only)
- **Purpose:** Sprite sheet of frosted glass evidence cards and action pill modules.
- **Visual contents:**
  - 16 rounded glass cards and 4 pill chips in a 5-row grid:
    - **Row 1:** `Investigation (3 files)`, `Revision (2 commits)`, `Verification (4 tests)`, `Outcome (Deployed locally)`.
    - **Row 2:** `Source (Repository files)`, `Evidence (12 data points)`, `Analysis (Structured results)`, `Timeline (6 events)`.
    - **Row 3:** `Candidates (5 evaluated)`, `Context (Real environment)`, `Insights (Actionable findings)`, `Confidence (High)`.
    - **Row 4 (Pills):** `Checked logs`, `Reviewed code`, `Validated tests`, `Cross-referenced`.
    - **Row 5:** `Reproduction (Recreated locally)`, `Data (From real sources)`, `Findings (Evidence-based)`, `Decision (Clear next steps)`.
- **Primary scene:** Supporting evidence badges in Scene 01, Scene 03, Scene 05.
- **Secondary use:** Floating evidence modules.
- **Mandate:** **DO_NOT_USE in full**. **OPTIONAL** if cropped strictly to safe regions.
- **Desktop treatment:** If cropped, individual chips from Row 1 or Row 4 may be embedded as visual accents.
- **Mobile treatment:** Sliced into individual compact badges.
- **Allowed transformations:**
  - **MANDATORY CROP:** Only Row 1 (bounding box: `y: 0` to `y: 250px`) and Row 4 pills (bounding box: `y: 650px` to `y: 780px`) are permitted.
- **Forbidden transformations:**
  - ❌ **STRICTLY FORBIDDEN:** Displaying Row 3 (`Confidence High`, `Insights Actionable findings`, `Candidates 5 evaluated`) or Row 5 (`Decision Clear next steps`).
- **Baked text:** Contains safe tags (`Investigation`, `Revision`, `Verification`, `Outcome`, `Source`, `Evidence`) AND strictly forbidden tags (`Confidence High`, `Insights`, `Decision`).
- **Product-truth status:** **PARTIALLY UNSAFE**. Row 3 explicitly contains `Confidence High` (forbidden confidence score) and `Insights Actionable findings` (forbidden AI behavioral diagnosis). Row 5 contains `Decision Clear next steps` (forbidden automated decisioning).
- **Reason for classification:** Classified as `REFERENCE_ONLY` in its raw form to prevent accidental rendering of the forbidden Row 3 and Row 5 modules.

---

### Asset 08: `hirearchy-website-direction-v1-duplicate.png`

- **Filename:** `docs/design/assets/reference-only/hirearchy-website-direction-v1-duplicate.png`
- **Dimensions:** 1536 × 1024 px (RGB)
- **Status:** **REFERENCE_ONLY**
- **Purpose:** Bitwise duplicate of the masterboard reference sheet (`Codex Image Sep 25, 2026, 07_53_17 PM.png`).
- **Visual contents:** Complete 8-panel visual direction storyboard sheet. Identical sha256 checksum to `docs/design/references/hirearchy-website-direction-v1.png`.
- **Primary scene:** Masterbrand reference.
- **Secondary use:** None.
- **Mandate:** **DO_NOT_USE in production DOM**.
- **Desktop treatment:** None.
- **Mobile treatment:** None.
- **Allowed transformations:** None.
- **Forbidden transformations:** None.
- **Baked text:** All masterboard panel copy.
- **Product-truth status:** Reference sheet.
- **Reason for classification:** Identical byte duplicate of the preserved north star reference.

---

### Asset 09: `hirearchy-evidence-code-revision-composition-rejected.png`

- **Filename:** `docs/design/assets/rejected/hirearchy-evidence-code-revision-composition-rejected.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **REJECTED**
- **Purpose:** Code diff spatial composition.
- **Visual contents:**
  - Glass strata perspective scene similar to Hero.
  - Center code editor displaying `src/services/user-verification.ts` with lines 42–56:
    ```typescript
    export async function verifyCandidate(candidateId: string): Promise<VerificationResult> {
      - const result = await checkDocument(candidateId);
      + const result = await validateDocuments({
      +   candidateId,
      +   sources: ['resume', 'github', 'work-history'],
      +   strict: true,
      + });
      return {
        verified: result.passed,
        confidence: result.confidence,
        evidence: result.evidence,
      };
    }
    ```
- **Primary scene:** None.
- **Secondary use:** None.
- **Mandate:** **DO_NOT_USE. STRICTLY FORBIDDEN IN ALL PRODUCTION SURFACES.**
- **Desktop treatment:** None.
- **Mobile treatment:** None.
- **Allowed transformations:** None.
- **Forbidden transformations:** All.
- **Baked text:** `verifyCandidate`, `sources: ['resume', 'github', 'work-history']`, `confidence: result.confidence`.
- **Product-truth status:** **FATAL PRODUCT-TRUTH VIOLATION**.
  1. The code explicitly implements resume and work-history document parsing (`'resume', 'github', 'work-history'`), which directly contradicts Hirearchy's foundational thesis (_"Resumes are flat projections... Look at the real work"_).
  2. The code returns `confidence: result.confidence`, which is an explicit violation of the non-negotiable rule forbidding confidence scores and algorithmic certainty metrics.
- **Reason for classification:** Fatal semantic violation of product truth and core evaluation thesis. Must never appear in any client-facing code or build.

---

### Asset 10: `hirearchy-architectural-brand-monument-rejected.png`

- **Filename:** `docs/design/assets/rejected/hirearchy-architectural-brand-monument-rejected.png`
- **Dimensions:** 1448 × 1086 px (RGB)
- **Status:** **REJECTED**
- **Purpose:** Monolithic architectural concrete structure with engraved "Hierarchy" brand mark against a sky backdrop.
- **Visual contents:** A brutalist poured-concrete monument with the 3-step mark and logotype debossed on the facade, flanked by glass slabs under an open daylight sky with puffy clouds.
- **Primary scene:** None.
- **Secondary use:** Historical creative exploration reference only.
- **Mandate:** **DO_NOT_USE. STRICTLY FORBIDDEN FOR WEBSITE PRODUCTION.**
- **Desktop treatment:** None.
- **Mobile treatment:** None.
- **Allowed transformations:** None.
- **Forbidden transformations:** All.
- **Baked text:** `Hierarchy` (debossed into concrete).
- **Product-truth status:** **REJECTED BRAND DIRECTION**.
- **Reason for classification:** Per explicit instructions in project governance, this concrete monument reintroduces the previously rejected real-estate / civil architecture aesthetic. Hirearchy is a rigorous, objective software engineering evaluation substrate, not a commercial property developer.

---

### Asset 11: `hirearchy-strata-brand-environment.png`

- **Filename:** `docs/design/assets/approved/hirearchy-strata-brand-environment.png`
- **Dimensions:** 1672 × 941 px (RGB)
- **Status:** **APPROVED**
- **Purpose:** Brand and campaign environment visual for Scene 07 (Campaign Climax) and Scene 08 (Close & Colophon). Depicts the architectural glass STRATA environment under crisp daylight raking illumination.
- **Primary scene:** Scene 07 / Scene 08 brand/campaign environment backdrop.
- **Secondary use:** Brand transition or editorial crop.
- **Mandate:** **MANDATORY** for Scene 07 / Scene 08 brand environment anchor. **DO NOT use as the main Scene 01 Hero visual** (Scene 01 primary remains `hirearchy-hero-evidence-spatial-composition.png`).
- **Desktop treatment:** Background environment plate or right-column architectural anchor in Scene 08.
- **Mobile treatment:** Responsive centered banner with natural aspect-ratio preservation.
- **Allowed transformations:** Proportional scaling, subtle alpha blending, editorial cropping.
- **Forbidden transformations:** ❌ Overwriting Scene 01 hero, hue rotation, synthetic neon grading.
- **Baked text:** `Hierarchy` (on primary glass plane).
- **Product-truth status:** **SAFE ARCHITECTURAL BRAND ENVIRONMENT**.
- **Reason for classification:** Approved high-resolution architectural glass study providing authentic environmental depth for the campaign climax and closing resolution scenes without commercial real-estate concrete tropes.

---

### Asset 12: `hirearchy-mark.svg`

- **Filename:** `docs/design/assets/approved/hirearchy-mark.svg`
- **Dimensions:** Normalized `viewBox="0 0 183 148"` (SVG vector)
- **Status:** **APPROVED**
- **Purpose:** Standalone STRATA symbol. Canonical masterbrand mark representing three ascending, stepped stratigraphic layers of evidence.
- **Primary scene:** Global navigation, mobile header, favicons, loading state, compact brand anchors.
- **Mandate:** **MANDATORY masterbrand symbol**.
- **Visual contents:** Three separated ascending STRATA layers rendered as clean vector polygons.
- **Styling:** Single semantic fill color via `currentColor`. Transparent background. Zero raster masks, filters, or dependencies.
- **Product-truth status:** **AUTHORITATIVE MASTERBRAND GEOMETRY**.

---

### Asset 13: `hirearchy-lockup-horizontal.svg`

- **Filename:** `docs/design/assets/approved/hirearchy-lockup-horizontal.svg`
- **Dimensions:** Normalized `viewBox="0 0 600 148"` (SVG vector)
- **Status:** **APPROVED**
- **Purpose:** Primary horizontal masterbrand lockup combining the STRATA mark with the Hirearchy wordmark.
- **Primary scene:** Primary site header navigation, desktop mastheads, marketing header.
- **Mandate:** **MANDATORY primary masterbrand lockup**.
- **Visual contents:** STRATA mark on the left, `Hirearchy` wordmark on the right.
- **Styling:** `currentColor` fill, transparent background, balanced optical baseline alignment matching approved usage sheet. Typography rendered via semantic SVG `<text>` utilizing documented brand sans stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`).
- **Product-truth status:** **AUTHORITATIVE MASTERBRAND LOCKUP**.

---

### Asset 14: `hirearchy-wordmark.svg`

- **Filename:** `docs/design/assets/approved/hirearchy-wordmark.svg`
- **Dimensions:** Normalized `viewBox="0 0 280 68"` (SVG vector)
- **Status:** **APPROVED**
- **Purpose:** Standalone text-only brand wordmark for text-only contexts and inline editorial citations.
- **Primary scene:** Editorial mastheads, inline typographic citations, colophon notes.
- **Mandate:** **OPTIONAL text-only use**.
- **Visual contents:** `Hirearchy` set in clean SVG `<text>`.
- **Styling:** `currentColor` fill, transparent background.
- **Technical note:** Typography-dependent asset. No frozen font outline source exists in repository; uses documented brand sans stack with `-0.03em` tracking and `font-weight: 600`.
- **Product-truth status:** **TYPOGRAPHY-DEPENDENT APPROVED WORDMARK**.

---

### Asset 15: `hirearchy-software-lockup.svg`

- **Filename:** `docs/design/assets/approved/hirearchy-software-lockup.svg`
- **Dimensions:** Normalized `viewBox="0 0 520 148"` (SVG vector)
- **Status:** **APPROVED**
- **Purpose:** Dedicated product lockup for Hirearchy Software. Must not replace masterbrand lockup.
- **Primary scene:** Scene 05 (The Inhabited Workbench / Product Reveal) and product chrome headers.
- **Mandate:** **MANDATORY only when explicitly representing Hirearchy Software**.
- **Visual contents:** STRATA mark on the left; two-line stack on the right: `Hirearchy` on line 1, `SOFTWARE` on line 2 with restrained tracking (`0.32em`) and secondary opacity (`fill-opacity="0.6"`).
- **Styling:** `currentColor` fill, transparent background.
- **Product-truth status:** **AUTHORITATIVE PRODUCT LOCKUP**.

---

### Asset 16: `hirearchy-hero-repository-panel.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-repository-panel.png`
- **Dimensions:** 1122 × 1402 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone repository / file-tree panel (Conceptual Stack Z1). Anchors the workspace file tree hierarchy on the left of the Hero composition.
- **Whether baked text exists:** Yes (`src/`, `api/`, `services/`, `user-verification.ts`, `tests/`, `docker/`, `README.md`).
- **Truth status:** **SAFE FACTUAL REPRESENTATION**. Strictly represents observable code repository paths. Zero evaluative claims.
- **Desktop use:** Pinned / stable left-of-center backdrop layer (Z1) in Scene 01 Hero motion composition. Spatially stable across all phases.
- **Mobile use:** Secondary visual element or omitted in favor of simplified vertical evidence stack.
- **Allowed transforms:** Subtle depth translation along Z-axis (`translateZ(-10px to 0px)`), opacity transitions, proportional scaling.
- **Forbidden transforms:** 3D tumbling/rotation, warping, color-shifting, arbitrary translation away from workbench.
- **Z-order relationship:** **Z1** (positioned directly above Z0 strata environment and behind Z2 attempt/workbench panel).
- **Interaction relationship:** Passive architectural context; highlights corresponding active file branch when related evidence card is hovered/focused.

---

### Asset 17: `hirearchy-hero-evidence-spine.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-evidence-spine.png`
- **Dimensions:** 887 × 1774 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone evidence connector spine (Conceptual Stack Z3). Connects attempt/workbench events with discrete evidence cards.
- **Whether baked text exists:** No. Pure luminous glass rod with 4 connection nodes / datums.
- **Truth status:** **SAFE**. Mechanical connector geometry without claims.
- **Desktop use:** Positioned between Attempt panel (Z2) and Evidence Cards (Z4) along Z3. Node illumination progresses synchronously with active phase.
- **Mobile use:** Vertical continuous connector rule linking stacked evidence cards.
- **Allowed transforms:** Vertical alignment, node glow opacity scrub, gentle scale matching evidence cards spacing.
- **Forbidden transforms:** Severe angle tilting, bouncing, disconnect from cards.
- **Z-order relationship:** **Z3** (positioned in front of Z2 workbench and directly behind Z4 evidence cards).
- **Interaction relationship:** Node illuminates with Hirearchy accent (`#F04A2F`) or semantic verification color when its paired card is hovered or focused.

---

### Asset 18: `hirearchy-hero-card-investigation.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-card-investigation.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone Investigation evidence card (Conceptual Stack Z4). Represents exploratory inspection events.
- **Whether baked text exists:** Yes (`Investigation`, `3 files`, search magnifying glass glyph).
- **Truth status:** **SAFE FACTUAL REPRESENTATION**. Observable factual count (3 files inspected). No candidate score or fit inference.
- **Desktop use:** Top card in Z4 evidence stack. Translates outward ~32–40px during Phase 2 (0.18–0.36) and highlights active node.
- **Mobile use:** Interactive tap card in vertical/horizontal evidence card set.
- **Allowed transforms:** Outward translation (~32–40px), opacity reduction (to 60–70%) when inactive, scale(1.02) on hover/focus.
- **Forbidden transforms:** Flying across screen, 3D flips, bouncy springs, non-uniform stretch.
- **Z-order relationship:** **Z4** (foreground interactive layer, sits above Z3 spine).
- **Interaction relationship:** Hover/focus elevates card, illuminates spine node 1 with Hirearchy accent, highlights file inspection in repository/workbench, softens non-selected cards to 60–70%.

---

### Asset 19: `hirearchy-hero-card-revision.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-card-revision.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone Revision evidence card (Conceptual Stack Z4). Represents code change / commit events.
- **Whether baked text exists:** Yes (`Revision`, `2 commits`, git branch glyph).
- **Truth status:** **SAFE FACTUAL REPRESENTATION**. Observable factual count (2 commits authored). Zero evaluation labels.
- **Desktop use:** Second card in Z4 evidence stack. Activates during Phase 3 (0.36–0.54) as connector relationship advances to Revision.
- **Mobile use:** Interactive tap card in evidence card set.
- **Allowed transforms:** Outward translation (~32–40px), opacity adjustment (60–70% when inactive, 100% when active).
- **Forbidden transforms:** Flying in, spring bounce, 3D tumbling.
- **Z-order relationship:** **Z4** (foreground interactive layer).
- **Interaction relationship:** Hover/focus emphasizes card, illuminates spine node 2, highlights diff area in workbench, reduces non-selected cards to 60–70%.

---

### Asset 20: `hirearchy-hero-card-verification.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-card-verification.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone Verification evidence card (Conceptual Stack Z4). Represents test execution events.
- **Whether baked text exists:** Yes (`Verification`, `4 tests`, checkmark glyph in semantic verification container).
- **Truth status:** **SAFE FACTUAL REPRESENTATION**. Observable factual count (4 tests run). Semantic green allowed here only for factual test outcome.
- **Desktop use:** Third card in Z4 evidence stack. Activates during Phase 4 (0.54–0.72); connector spine illuminates to verification node.
- **Mobile use:** Interactive tap card in evidence card set.
- **Allowed transforms:** Outward translation (~32–40px), subtle elevation, opacity transitions.
- **Forbidden transforms:** Flying in, celebratory bounce, whole-screen flash.
- **Z-order relationship:** **Z4** (foreground interactive layer).
- **Interaction relationship:** Hover/focus highlights card and node 3, focuses test/verification region in workbench, reduces non-selected cards to 60–70%.

---

### Asset 21: `hirearchy-hero-card-outcome.png`

- **Filename:** `docs/design/assets/approved/hero-motion/hirearchy-hero-card-outcome.png`
- **Dimensions:** 1448 × 1086 px (RGBA, transparent background)
- **Status:** **APPROVED**
- **Semantic role:** Standalone Outcome evidence card (Conceptual Stack Z4). Represents milestone deployment / run completion.
- **Whether baked text exists:** Yes (`Outcome`, `Deployed locally`, cube icon).
- **Truth status:** **SAFE FACTUAL REPRESENTATION**. Factual deployment event. Zero candidate ranking or score.
- **Desktop use:** Bottom card in Z4 evidence stack. Activates during Phase 5 (0.72–0.88), completing the resolved hero composition.
- **Mobile use:** Interactive tap card in evidence card set.
- **Allowed transforms:** Outward translation (~32–40px), opacity transitions, subtle scale elevation.
- **Forbidden transforms:** Flying in, spring bounce, 3D tumbling.
- **Z-order relationship:** **Z4** (foreground interactive layer).
- **Interaction relationship:** Hover/focus highlights card and node 4, resolves full provenance chain, reduces non-selected cards to 60–70%.

---

### Asset 22: `hirearchy-hero-attempt-panel-unsafe.png`

- **Filename:** `docs/design/assets/reference-only/hero-motion/hirearchy-hero-attempt-panel-unsafe.png`
- **Dimensions:** 1122 × 1402 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY_UNSAFE**
- **Semantic role:** Workbench attempt panel candidate (Z2 layer).
- **Whether baked text exists:** Yes (`Attempt`, `00:14:27`, diff code snippet).
- **Truth status:** **UNSAFE — PRODUCT TRUTH VIOLATIONS**.
  - Baked code diff explicitly contains:
    - Line 49: `sources: ['resume', 'github', 'work-history']` (unsupported resume/GitHub screening semantics).
    - Line 53: `confidence: result.confidence` (automated hiring judgment / confidence scoring violation).
- **Desktop use:** **DO NOT USE IN PRODUCTION DOM**. Reference only for visual styling (glass bevel, timestamp badge, terminal layout).
- **Mobile use:** **DO NOT USE**.
- **Allowed transforms:** N/A (Internal reference only).
- **Forbidden transforms:** Any rendering in production client.
- **Z-order relationship:** Conceptual Z2.
- **Interaction relationship:** None. Requires sanitized replacement before production use.

---

### Asset 23: `hirearchy-hero-attempt-panel-duplicate-unsafe.png`

- **Filename:** `docs/design/assets/reference-only/hero-motion/hirearchy-hero-attempt-panel-duplicate-unsafe.png`
- **Dimensions:** 1122 × 1402 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY_UNSAFE**
- **Semantic role:** Duplicate of Asset 22 (`8a882a42-371c-41e7-8e2a-b29325de6846.png`).
- **Whether baked text exists:** Yes (identical to Asset 22).
- **Truth status:** **UNSAFE — PRODUCT TRUTH VIOLATIONS** (same resume/github/confidence baked text).
- **Desktop use:** **DO NOT USE**.
- **Mobile use:** **DO NOT USE**.
- **Allowed/Forbidden transforms:** N/A.

---

### Asset 24: `hirearchy-hero-evidence-spine-alt.png`

- **Filename:** `docs/design/assets/reference-only/hero-motion/hirearchy-hero-evidence-spine-alt.png`
- **Dimensions:** 724 × 2172 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY**
- **Semantic role:** Alternate connector spine asset (`e6966e10-65ba-4664-bef3-ba9f19720c9a.png`).
- **Whether baked text exists:** No.
- **Truth status:** Safe visually, but secondary to primary spine `hirearchy-hero-evidence-spine.png` which has warmer, balanced node spacing.
- **Desktop/Mobile use:** Reference alternate. Do not duplicate in primary production bundle.

---

### Asset 25: `hirearchy-lockup-horizontal-raster.png`

- **Filename:** `docs/design/assets/reference-only/hero-motion/hirearchy-lockup-horizontal-raster.png`
- **Dimensions:** 2172 × 724 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY**
- **Semantic role:** Raster standalone lockup (`b937a479-aa5f-4ba0-9871-8713df69d4ba.png`).
- **Whether baked text exists:** Yes (`Hirearchy` with STRATA mark).
- **Truth status:** Safe, but **REDUNDANT** with existing SVG vector production lockup `docs/design/assets/approved/hirearchy-lockup-horizontal.svg`.
- **Desktop/Mobile use:** Reference only. Production code MUST use SVG vector sources to maintain resolution independence.

---

### Asset 26: `hirearchy-mark-raster.png`

- **Filename:** `docs/design/assets/reference-only/hero-motion/hirearchy-mark-raster.png`
- **Dimensions:** 1254 × 1254 px (RGBA, transparent background)
- **Status:** **REFERENCE_ONLY**
- **Semantic role:** Raster standalone STRATA mark (`Codex Image Sep 26, 2026, 03_38_06 PM.png`).
- **Whether baked text exists:** No.
- **Truth status:** Safe, but **REDUNDANT** with existing SVG vector production mark `docs/design/assets/approved/hirearchy-mark.svg`.
- **Desktop/Mobile use:** Reference only. Production code MUST use SVG vector source.

---

## 4. Verification Checkpoint

```bash
# Verify asset counts by folder
test $(find docs/design/assets/approved -maxdepth 1 -type f -name "*.png" | wc -l) -eq 4
test $(find docs/design/assets/approved/hero-motion -type f -name "*.png" | wc -l) -eq 6
test $(find docs/design/assets/approved -maxdepth 1 -type f -name "*.svg" | wc -l) -eq 4
test $(find docs/design/assets/reference-only -maxdepth 1 -type f -name "*.png" | wc -l) -eq 6
test $(find docs/design/assets/reference-only/hero-motion -type f -name "*.png" | wc -l) -eq 5
test $(find docs/design/assets/rejected -type f -name "*.png" | wc -l) -eq 2
test -f docs/design/references/hirearchy-website-direction-v1.png
```
