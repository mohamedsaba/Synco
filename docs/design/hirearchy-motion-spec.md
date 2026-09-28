# Hirearchy Hero Motion Specification v2

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Deterministic scroll-linked choreography, standalone motion asset state machine, pointer/keyboard interaction rules, and mobile interaction contracts for Scene 01 (Masterbrand Hero).  
**Authority:** `docs/plans/active/099-hirearchy-website-experience-rebuild.md` Product Truth & Architecture Gate.

---

## 1. Core Motion Architecture & Philosophy

The previous camera-orbit and whole-raster PNG Hero animation is **EXPLICITLY REJECTED**.

### 1.1 Forbidden Motion Anti-Patterns

Implementation agents and frontend engineers are strictly prohibited from implementing:

- ❌ **Rotating the entire Hero composition in 3D** (no global tilt, orbit, or pitch of the unified canvas).
- ❌ **Android-style card movement** (no springy flips, material elevations, bouncy easing curves).
- ❌ **Generic parallax tilt** (no violent pointer tracking that destabilizes reading legibility).
- ❌ **Whole-composition translateZ as primary effect** (depth must be internal between layers, not pushing the whole stage back and forth).
- ❌ **Moving the raster Hero as a single object** (the hero is composed of discrete architectural layers).

### 1.2 Conceptual Layer Stack (Z-Order)

The animated desktop Hero is assembled from standalone motion assets structured as:

- **Z0:** STRATA / glass environment (`docs/design/assets/approved/hirearchy-strata-spatial-plane-kit.png` or pure transparent glass backdrop)
- **Z1:** Repository / file-tree panel (`docs/design/assets/approved/hero-motion/hirearchy-hero-repository-panel.png`)
- **Z2:** Attempt / workbench panel (sanitized workbench plate; code editor and terminal context)
- **Z3:** Evidence connector spine (`docs/design/assets/approved/hero-motion/hirearchy-hero-evidence-spine.png`)
- **Z4:** Evidence Cards (foreground interactive layer):
  - Investigation card (`docs/design/assets/approved/hero-motion/hirearchy-hero-card-investigation.png`)
  - Revision card (`docs/design/assets/approved/hero-motion/hirearchy-hero-card-revision.png`)
  - Verification card (`docs/design/assets/approved/hero-motion/hirearchy-hero-card-verification.png`)
  - Outcome card (`docs/design/assets/approved/hero-motion/hirearchy-hero-card-outcome.png`)

Static fallback: `docs/design/assets/approved/hirearchy-hero-evidence-spatial-composition.png` is retained strictly as the **STATIC RESOLVED REFERENCE / FALLBACK** for reduced-motion and non-WebGL/CSS-3D environments.

---

## 2. Deterministic Scroll Phase Specifications (0.00 – 1.00)

```
SCROLL PROGRESS (0.00 -> 1.00)
|----- 0.18 -----|----- 0.36 -----|----- 0.54 -----|----- 0.72 -----|----- 0.88 -----|----- 1.00 -----|
  PHASE 1           PHASE 2          PHASE 3          PHASE 4          PHASE 5          PHASE 6
 [ARRIVAL/ATTEMPT] [INVESTIGATION]   [REVISION]     [VERIFICATION]     [OUTCOME]       [HANDOFF]
 Stable layout     Card 1 active    Card 2 active    Card 3 active    Card 4 active    Continuous
 Already complete  ~32-40px out     Diff focused     Pass green       Chain resolves   entry into Sc 02
```

---

### Phase 1: ARRIVAL / ATTEMPT (`0.00 ≤ p < 0.18`)

- **Semantic Meaning:** The page is already visually complete before motion starts. Problem-solving reality is grounded.
- **Visual State:**
  - All major pieces already form a beautiful, balanced composition.
  - No dramatic or jarring entrance animation.
  - Repository panel (Z1) visible and legible.
  - Attempt panel (Z2) primary and grounded.
  - Evidence cards (Z4) present but visually subdued (`opacity: 0.75`, resting position).
  - Evidence spine (Z3) low-emphasis (`opacity: 0.50`, dormant nodes).
  - No cards flying in from offscreen.
- **Editorial Column:** Headline (`Real work. / In context.`), kicker (`01 — REAL WORK`), and CTAs static and 100% crisp.

---

### Phase 2: INVESTIGATION (`0.18 ≤ p < 0.36`)

- **Semantic Meaning:** The candidate begins exploring the codebase; investigation becomes active.
- **Choreography:**
  - Investigation card translates outward only `~32px – 40px` along the X/Z axis (`translateX: 36px`, `translateZ: 12px`).
  - Active node on evidence spine illuminates using the Hirearchy signature accent (`#F04A2F`).
  - Corresponding investigation relationship becomes visible (highlighting repository file tree inspection in Z1/Z2).
  - Non-active evidence cards (Revision, Verification, Outcome) reduce slightly in visual emphasis to `60%–70% opacity`.
  - Repository panel and workbench remain spatially stable (zero jitter, zero drift).
  - **Dynamics:** No springy motion. No bounce. Crisp, mechanical linear/ease-out translation.

---

### Phase 3: REVISION (`0.36 ≤ p < 0.54`)

- **Semantic Meaning:** The candidate modifies code to address the problem; revision becomes active.
- **Choreography:**
  - Investigation card settles back toward resting state (`translateX: 12px`, `opacity: 0.85`).
  - Revision card receives active emphasis, translating outward `~32px – 40px` (`translateX: 36px`, `translateZ: 14px`, `opacity: 1.00`).
  - Relevant diff/revision area in Attempt workbench (Z2) becomes visually focal.
  - Connector spine advances its active illumination datum to the Revision node (node 2).
  - Other evidence cards remain present and readable (`opacity: 0.65–0.70`).

---

### Phase 4: VERIFICATION (`0.54 ≤ p < 0.72`)

- **Semantic Meaning:** Candidate executes tests to verify behavior; verification becomes active.
- **Choreography:**
  - Verification card emphasized, translating outward `~32px – 40px` (`translateX: 36px`, `translateZ: 16px`, `opacity: 1.00`).
  - Semantic verification green (`#2A694B` / `#34C759` pass indicator) is **allowed only here** on the verification badge/region.
  - Test/verification console region in Attempt workbench receives visual focus.
  - Evidence spine node 3 illuminates with green verification tint.
  - Previous cards remain readable (`opacity: 0.70`).

---

### Phase 5: OUTCOME (`0.72 ≤ p < 0.88`)

- **Semantic Meaning:** Work completes and deploys; final outcome resolves.
- **Choreography:**
  - Final connector node (node 4) resolves on the evidence spine.
  - Outcome card is emphasized (`translateX: 36px`, `opacity: 1.00`).
  - All previous relationships remain visible.
  - Composition now resembles the approved resolved Hero reference (`hirearchy-hero-evidence-spatial-composition.png`).
  - Full evidentiary provenance chain is established across all 4 cards and workbench.

---

### Phase 6: HANDOFF (`0.88 ≤ p ≤ 1.00`)

- **Semantic Meaning:** Continuous narrative handoff into Scene 02 ("Traditional hiring misses the real picture.").
- **Choreography:**
  - **No giant fade.**
  - **No whole-Hero 3D rotation.**
  - Scene 01 composition settles.
  - Evidence card emphasis normalizes across all 4 cards (`opacity: 0.90`).
  - Scene 02 begins entering through layout continuity from below.
  - Scene 01 may soften slightly (`opacity: 0.70`), but remains structurally present during handoff to anchor the contrast between observable work and flat impressions.

---

## 3. Pointer & Keyboard Interaction Contract

The Hero evidence cards are interactive navigational and inspection objects.

### 3.1 Desktop Hover / Focus Rules

When a user hovers over or keyboards-focuses any of the 4 evidence cards (`Investigation`, `Revision`, `Verification`, `Outcome`):

1. **Emphasize Selected Card:**
   - Translates outward `+12px` to `+16px` relative to its current scroll position.
   - Scale: `scale(1.02)`.
   - Opacity: `1.00`.
   - Subtle high-clarity drop shadow activates (`0 12px 32px rgba(0,0,0,0.12)`).
2. **Emphasize Selected Connector Node:**
   - Corresponding node on the evidence spine (Z3) illuminates with Hirearchy accent (`#F04A2F`) or semantic green (`#2A694B` for verification).
   - Radial glow radius expands from `8px` to `16px`.
3. **Emphasize Corresponding Workbench Region:**
   - Investigation: Highlights file-tree item (`user-verification.ts`).
   - Revision: Highlights diff insertion block in workbench.
   - Verification: Highlights `4 tests passed` execution line.
   - Outcome: Highlights deployment exit status badge.
4. **Attenuate Non-Selected Elements:**
   - Non-selected evidence cards drop to roughly `60%–70% opacity`.
   - Non-selected spine segments drop to `40% opacity`.
5. **No Card Scattering:**
   - Implementation agents must **NOT physically scatter cards** across the screen on hover. Card positions are fixed in vertical rhythm.
6. **Keyboard Focus Equivalence:**
   - Cards must be focusable via `Tab` (`tabIndex={0}`, `role="button"` or `role="region"`).
   - Keyboard focus must trigger the identical visual and semantic emphasis as pointer hover, along with a high-contrast focus ring (`outline: 2px solid var(--hirearchy-accent)`).

---

## 4. Mobile Interaction Contract (`viewport < 768px`)

Mobile devices must **NOT** use desktop scroll choreography scaled down.

1. **Resolved Hero Composition:**
   - Renders the resolved Hero composition directly (using the static resolved fallback or cleanly stacked standalone plates).
   - Zero perspective tilt (`transform: none`).
   - Zero heavy scroll pinning (no `150vh` pin on small mobile screens).
2. **Interactive Card Set:**
   - Evidence cards are accessible as a clean vertical or horizontal interactive set below the headline.
   - Tap a card to activate its related state and show detailed evidence snippet.
   - Touch active states provide instantaneous tactile feedback (`transform: scale(0.98)` on active press).
3. **No Hover-Only Meaning:**
   - All information, state transitions, and file contexts must be accessible via direct tap or default visual presentation. No tooltip or critical information may depend on hover.

---

## 5. Reduced-Motion Implementation Specification

When `prefers-reduced-motion: reduce` is detected:

- Section height unpins to natural content height (`min-height: 100vh`).
- All 4 cards render in resolved, readable state simultaneously (`opacity: 1.00`).
- Scroll-driven translations, rotations, and expansions are completely disabled.
- Interactive hover and keyboard focus remain fully functional (preserving semantic highlighting without spatial displacement).
