# Hirearchy Implementation Acceptance Checklist v1

**Status:** APPROVED ARCHITECTURAL GATING SPECIFICATION  
**Scope:** Mandatory acceptance criteria for any implementation pull request or agent execution slice.  
**Mandate:** An implementation agent cannot declare **DONE** until all checks below are verified and passing.

---

## 1. Visual Verification & Craftsmanship

- [ ] **Approved Hero Asset Used:** `docs/design/assets/approved/hirearchy-hero-evidence-spatial-composition.png` is imported and rendered directly in Scene 01.
- [ ] **Target Composition Reproduced:** Proportional layout matches `docs/design/references/hirearchy-website-direction-v1.png` and `docs/design/hirearchy-layout-spec.md` (e.g. left column 44vw, right visual 58vw bleeding right).
- [ ] **Expected Visual Density:** Typographic tracking (`-0.055em` display headlines, tabular mono numerals) and whitespace rhythm align with the masterboard reference.
- [ ] **Expected Spatial Scale:** STRATA 3D oblique tilt (22°), layer depth separation, and mineral glass transparency are physically expressed.
- [ ] **No Old D1B Palette:** Legacy custom CSS variables and obsolete color values have been completely purged; only `docs/design/hirearchy-brand-tokens-vnext.md` tokens are active.
- [ ] **No Generic Substitute Cards:** Hero visual and Scene 02 specimen plates use authorized assets, not generic Tailwind/ShadCN flat card approximations.
- [ ] **No Rejected Imagery:** Verified that neither `hirearchy-evidence-code-revision-composition-rejected.png` nor `hirearchy-architectural-brand-monument-rejected.png` is referenced anywhere in the repository.
- [ ] **Masterbrand Identity Correct:** STRATA three-tier ascending mark rendered faithfully; wordmark typography strictly uses approved lockups.

---

## 2. Product Truth & Architectural Integrity

- [ ] **Zero Candidate Scores:** No numbers resembling `"Score: 94%"`, `"8.5/10"`, or `"99% match"` appear anywhere in UI or copy.
- [ ] **Zero Candidate Rankings:** No leaderboards, percentiles, or comparative sorting across candidates.
- [ ] **Zero Fit Labels:** No `"Strong Fit"`, `"Good Fit"`, `"Recommended for Hire"`, or green thumbs-up badges.
- [ ] **Zero AI Hiring Decisions:** No algorithmic judgments, personality profiling, or intent inferences.
- [ ] **Zero Unsupported Claims:** No claims of `"70% faster"`, `"better hires"`, `"reduced bias by X%"`, or `"100% observable reality"`.
- [ ] **Safe Technical Vocabulary:** Terminology conforms strictly to `docs/design/hirearchy-approved-copy.md` (`Attempt`, `Investigation`, `Revision`, `Verification`, `Failure`, `Outcome`, `Uncertainty`).

---

## 3. Responsive Breakpoint Validation

- [ ] **Desktop (1440 × 900):**
  - Left editorial column 44vw; right hero visual 58vw with subtle right-edge bleed.
  - Full navigation chrome and CTAs aligned with page gutters (`48px`–`64px`).
  - Scene 02 3-column specimen grid aligned (`max-width: 1240px`).
- [ ] **Laptop (1280 × 800):**
  - Proportional scaling maintained without horizontal layout break or premature wrapping.
  - Gutter padding snaps to `40px`.
- [ ] **Mobile (390 × 844):**
  - Strict single-column vertical flow. Editorial copy leads; Hero visual is stacked cleanly underneath.
  - Zero horizontal page scroll or viewport breakout (`overflow-x: clip`).
  - Mobile hamburger drawer replaces desktop navigation links.
  - Touch targets maintain minimum `44 × 44px` physical tap area.

---

## 4. Motion & Animation Choreography

- [ ] **Storyboard States Followed:** Scene 01 adheres deterministically to the 4 phases in `docs/design/hirearchy-motion-spec.md` (`0.00–0.18` Compressed, `0.18–0.42` Separation, `0.42–0.72` Context Formation, `0.72–1.00` Handoff).
- [ ] **Native Scroll Progression:** Motion scrubs smoothly against native window scroll; zero scroll hijacking or wheel interception.
- [ ] **Deliberate Reduced-Motion State:** Under `prefers-reduced-motion: reduce`, all 3D rotations, parallax shifts, and scroll pins are disabled; the hero renders immediately in its fully resolved, static composition (`p = 0.72`).
- [ ] **Performance Budget:** Render loops throttled when offscreen; zero jank or dropped frames during scroll scrubbing.

---

## 5. Accessibility & Semantic Architecture

- [ ] **Semantic DOM Hierarchy:** Proper document outline (`h1` for masterbrand headline, `h2` for scene sections, ordered lists for chronological telemetry).
- [ ] **Assistive Technology Protection:** Decorative background glass planes, WebGL canvases, and datum lines marked `aria-hidden="true"`.
- [ ] **Keyboard Navigation:** Every interactive button, tab, and disclosure element reachable and operable via `Tab`, `Enter`, and `Space`.
- [ ] **Visible Focus Indicators:** High-contrast focus rings (`2px solid var(--hirearchy-accent)`) present on all active interactive controls.
- [ ] **Contrast Compliance:** All text content achieves minimum `4.5:1` contrast for large text and `7:1` for body copy against its respective background (WCAG 2.2 AA gate satisfied).
- [ ] **Semantic Equivalence:** Information conveyed visually in graphics has accessible text equivalents in DOM.

---

## 6. Verification Evidence Required for Sign-Off

- [ ] **Automated Tests:** Verification test suite passes cleanly (`npm run test` or Playwright suite).
- [ ] **Visual Diff Screenshots:** Captured and stored in `docs/design/screenshots/` across 1440×900, 1280×800, and 390×844 breakpoints.
- [ ] **Reference Side-by-Side Comparison:** Direct visual comparison against `docs/design/references/hirearchy-website-direction-v1.png` confirming fidelity.
- [ ] **Code Audit:** Git status verified; no unrelated dirty files touched; no unauthorized dependencies added.
