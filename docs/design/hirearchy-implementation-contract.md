# Hirearchy Implementation Contract v1

**Status:** NON-NEGOTIABLE ARCHITECTURAL CONTRACT  
**Scope:** Binding rules for all future implementation agents, pair programmers, and frontend engineers working on the Hirearchy website experience.

---

You are not designing this website. The design is already defined.

Your sole responsibility is to translate the supplied visual assets, brand tokens, layout geometry, copy contract, and motion specifications into high-craft, accessible, deterministic production code without creative deviation.

---

## The 14 Non-Negotiable Implementation Rules

### Rule 1: Use Supplied Approved Assets Directly

You must import and render the assets located in `docs/design/assets/approved/` directly. For approved assets marked `MANDATORY`, direct utilization in the production DOM is required.

### Rule 1.1: Assemble Hero from Standalone Motion Assets (Rule 15)

The previous whole-raster Hero animation (`hirearchy-hero-evidence-spatial-composition.png` camera orbit/tilt) is **EXPLICITLY REJECTED**.
Future implementation MUST compose the Hero from the standalone motion assets (`docs/design/assets/approved/hero-motion/`) across the 5 conceptual strata layers (Z0–Z4) when those assets are available.
The resolved Hero PNG (`hirearchy-hero-evidence-spatial-composition.png`) may ONLY be used as:

- A **visual target reference** for alignment and spatial validation.
- A **static fallback** for non-supporting viewports/browsers.
- A **reduced-motion fallback** (`prefers-reduced-motion: reduce`).
  It may **NOT** be the primary animated object. Whole-raster 3D rotation, camera-orbit, or monolithic translateZ are strictly prohibited.

### Rule 2: No Ad-Hoc CSS Substitutions

Do not replace approved imagery with CSS approximations unless specifically authorized in the specification. You are strictly forbidden from substituting the glass strata Hero visual with random Tailwind cards, CSS box gradients, or generic SVG shapes.

### Rule 3: Do Not Generate New Visual Assets

Do not prompt AI image generation tools, do not create speculative placeholder graphics, and do not synthesize new image files. All authorized imagery is already classified in the asset manifest.

### Rule 4: Do Not Inherit the Old D1B Visual System

The legacy D1B palette, exploratory CSS variables, and superseded layout experiments in `apps/web` are obsolete. Implement exclusively using the new token specification defined in `docs/design/hirearchy-brand-tokens-vnext.md`.

### Rule 5: Do Not Invent Marketing Copy

You are strictly forbidden from writing or synthesizing marketing slogans, feature descriptions, button text, or section headers. Use only the confirmed strings in `docs/design/hirearchy-approved-copy.md`. If copy is missing for an edge state, mark it as `COPY GAP`.

### Rule 6: Do Not Introduce New Sections

The website structure consists strictly of the 8 approved scenes detailed in `099-hirearchy-website-experience-rebuild.md` and `docs/design/hirearchy-scene-asset-map.md`. Do not add generic SaaS pricing tables, logo walls, customer testimonials, blog grids, or newsletter footers.

### Rule 7: Do Not Change Hirearchy Masterbrand Architecture

The three-layer ascending stepped mark (STRATA) is the permanent masterbrand identity. Do not alter its proportions, stroke angles (22°), or layer hierarchy.

### Rule 8: Hirearchy Is the Masterbrand

The masterbrand name is **Hirearchy**. It is the parent entity representing the philosophy of stratigraphic engineering evaluation.

### Rule 9: Hirearchy Software Is the Product Expression

**Hirearchy Software** is the current engineering evaluation workbench and product expression, not the entire brand. Keep masterbrand statements (`Real work. In context.`, `Evidence over impressions.`) distinct from product software chrome. Hirearchy Software and Hirearchy are internal engineering repository codenames and must never appear in public UI.

### Rule 10: Prohibition on Rejected Assets

Under no circumstances may any asset located in `docs/design/assets/rejected/` be imported, referenced, or rendered in any production surface:

- ❌ NEVER use `hirearchy-evidence-code-revision-composition-rejected.png` (contains resume screening and confidence score violations).
- ❌ NEVER use `hirearchy-architectural-brand-monument-rejected.png` (reintroduces rejected real-estate aesthetic).

### Rule 11: Restrictions on Reference-Only Assets

Assets located in `docs/design/assets/reference-only/` are internal engineering specifications or unapproved full images. They cannot appear in production DOM without explicit human authorization:

- `hirearchy-hero-motion-storyboard.png` is an internal motion guide.
- `hirearchy-evaluator-session-timeline.png` is a visual reference for coding React components, not a static image screenshot.
- `hirearchy-evaluator-role-perspectives.png` contains unapproved generic analytics charts.
- `hirearchy-evidence-status-modules.png` contains forbidden "Confidence High" text and may only be used if cropped to safe regions.

### Rule 12: Absolute Product Truth Compliance

You must strictly obey the Product Truth & Architecture Gate in `099-hirearchy-website-experience-rebuild.md`. The following concepts are strictly forbidden across all code, text, badges, and attributes:

- Candidate scores, percentages, or leaderboards.
- Role fit recommendations (`Strong fit`, `Good fit`, `Pass/Reject`).
- Inferred intent, personality diagnosis, or behavioral profiling.
- AI hiring decisions or automated verdicts.
- Unsupported velocity or bias reduction claims (`70% faster`, `better hires`).

### Rule 13: Match Provided Target Compositions First

Your implementation must match the layout proportions, whitespace density, typographic tracking, and visual contrast established in `docs/design/references/hirearchy-website-direction-v1.png` and `docs/design/hirearchy-layout-spec.md` before applying any personal adjustments.

### Rule 14: Escalate Blockers Transparently

If an approved asset, layout relationship, or motion transition is technically challenging or blocked by browser constraints:
**REPORT THE BLOCKER CLEARLY.**
Do not silently downgrade the design, cut corners, replace complex assets with trivial divs, or alter product truth rules to make your task easier.
