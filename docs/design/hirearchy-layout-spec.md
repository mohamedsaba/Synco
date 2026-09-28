# Hirearchy Layout Specification v1

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Scope:** Deterministic spatial, proportional, and responsive layout geometry for the Hirearchy website experience.  
**Authority:** Direct visual extraction from `docs/design/references/hirearchy-website-direction-v1.png`.

---

## 1. Core Layout Philosophy

The Hirearchy website experience rejects generic SaaS card-grids, cookie-cutter component libraries, and centered template containers. It is structured as an **architectural broadside** combining:

1. **Disciplined Left-Hand Editorial Columns:** Monumental display typography counterweighted with clinical metadata.
2. **Dynamic Right-Hand Spatial Bleed:** Physical strata planes and evidence artifacts that penetrate and bleed past the right viewport edge.
3. **Warm Daylight / Carbon Workbench Contrast:** A balanced 70/30 daylight-to-carbon ratio across the overall page, anchoring technical density within an airy architectural atmosphere.

---

## 2. Desktop Specification — 1440 × 900 (Authoritative Base)

```
0px                       640px (44vw)                      1440px (100vw)   +Bleed (~1520px)
+------------------------------------------------------------------------------------+  - 0px
| [≡ HIREARCHY]               Product   Use cases   Resources       [ Get started ->] |  | ~72-80px Header
+------------------------------------------------------------------------------------+  -
| <--- Outer Gutter (48-64px)                                                         |
|                                                                                    |
| 01 --- Kicker                                     +------------------------------+ |
|                                                   |                              | |
| REAL WORK.                                        |    STRATA HERO VISUAL        | |
|                                                   |    (56vw - 64vw wide)        | |  ~750px
| IN CONTEXT.                                       |    Center Y: 48vh            | |  Hero Section
|                                                   |    Right Bleed: +2vw to 6vw  | |
| See how the work unfolded — what was tried,        |                              | |
| investigated, changed, and verified. Hirearchy     +------------------------------+ |
| puts evidence in context for human evaluation.                                     |
|                                                                                    |
| [ Explore the evidence ]  [ Replay sequence ]                                      |
|                                                                                    |
| SCROLL v                                                                           |
+------------------------------------------------------------------------------------+  - 900px
```

### 2.1 Navigation Chrome

- **Header Height:** `72px` to `80px` (`8.0%`–`8.9%` of viewport height).
- **Outer Page Gutters:** `48px` to `64px` (`3.3%`–`4.4%` of viewport width).
- **Brand Lockup Position:** Left gutter aligned; mark cap-height `22px` to `24px`; wordmark baseline aligned.
- **Navigation Cluster:** Centered horizontally or right-aligned relative to editorial column; item gap `32px` to `40px`; text `0.90rem` functional sans.
- **Header Action CTA:** Pinned to right gutter; dark ink pill; height `38px` to `42px`; padding `0 20px`.

### 2.2 Scene 01 — Masterbrand Hero

- **Left Editorial Column Width:** `42vw` to `48vw` (`600px` to `690px` at 1440px).
- **Top Offset from Header:** `72px` to `96px`.
- **Kicker Rule & Typography:** Kicker `01 — REAL WORK` with horizontal hairline rule (`32px` long, `1px` stroke, `#F04A2F` accent); tracking `+0.12em`; `0.80rem`.
- **Headline Width & Scale:**
  - Direction: Modern Sans-serif direction (editorial serif rejected).
  - Width: `100%` of left column (`max-width: 640px`).
  - Scale: Large scale `clamp(5.5rem, 7.5vw, 6.5rem)` (approx. `88px – 104px` desktop) on 2 compact lines (`"Real work. / In context."`).
  - Line-height: `0.91` to `0.95`.
  - Tracking: near `-0.05em`.
  - Weight: Strong weight (`700`–`800`).
- **Editorial Subhead:**
  - Width: `38ch` to `44ch` (`max-width: 460px`).
  - Scale: `1.05rem` to `1.15rem` (`line-height: 1.55`).
  - Color: Carbon Muted Ink (`#5C5950`).
- **CTA Cluster:**
  - Start offset: `32px` below editorial paragraph.
  - Primary button: Solid deep ink (`#1C1B17`), white text, height `46px` to `50px`, padding `0 24px`, radius `9999px`.
  - Secondary button: Architectural bordered ghost (`1px solid #D6D0C2`), height `46px` to `50px`, padding `0 20px`, radius `9999px`.
  - Cluster gap: `16px`.
- **Hero Visual (`hirearchy-hero-evidence-spatial-composition.png`):**
  - Start position: `X: 42vw` to `46vw`.
  - Width: `56vw` to `64vw` (`800px` to `920px`).
  - Height: Proportional to `1448 × 1086` aspect ratio (`~600px` to `690px`).
  - Right-side bleed: Extends `2vw` to `6vw` past right viewport edge.
  - Vertical center: `Y: 48vh` to `52vh` (vertically balanced against left text mass).
  - Crop behavior: Zero internal crop. Outer glow and alpha fringe preserved.
- **Scroll Prompt:** Placed at bottom left gutter, `36px` from viewport bottom; `0.75rem` tracking `+0.15em`.
- **Dark/Light Visual Balance:**
  - Canvas surface: 68% daylight warm paper (`#F4F1EA`).
  - Visual element: 32% carbon slate and mineral glass refraction.

---

## 3. Laptop Specification — 1280 × 800

```
0px                   560px (44vw)                                1280px (100vw)
+--------------------------------------------------------------------+
| [≡ HIREARCHY]         Product   Use cases         [ Get started ->]|  ~68px Header
+--------------------------------------------------------------------+
| <--- Gutter (40px)                                                 |
| 01 ---                                                             |
| REAL WORK.                               +-----------------------+ |
| IN CONTEXT.                              |  STRATA HERO VISUAL   | |
| A human evaluation substrate.            |  (54vw - 60vw wide)   | |
| [ Read the Evidence ] [ Replay ]         |  Right Bleed: +2vw    | |
|                                          +-----------------------+ |
+--------------------------------------------------------------------+
```

- **Header Height:** `68px`.
- **Outer Page Gutters:** `40px` (`3.1%` of viewport width).
- **Left Editorial Column Width:** `44vw` to `48vw` (`560px` to `615px`).
- **Headline Scale:** `clamp(3.2rem, 5.2vw, 4.4rem)`.
- **Hero Visual Start Position:** `X: 44vw` to `48vw`.
- **Hero Visual Width:** `54vw` to `60vw` (`690px` to `770px`).
- **Hero Visual Bleed:** Extends `1vw` to `3vw` past right viewport edge.
- **CTA Size:** Height `44px`, padding `0 20px`, font `0.92rem`.

---

## 4. Mobile Specification — 390 × 844 (Vertical Compression)

```
0px                                                             390px
+---------------------------------------------------------------+
| [≡ HIREARCHY]                                          [ = ]  |  ~60px Header
+---------------------------------------------------------------+
| <- Gutter (20px)                                 Gutter (20px)-> |
|                                                               |
| 01 --- REAL WORK                                              |
|                                                               |
| REAL WORK.                                                    |
| IN CONTEXT.                                                   |
|                                                               |
| See how the work unfolded — what was tried, investigated,     |
| changed, and verified. Hirearchy puts that evidence in        |
| context for human evaluation.                                 |
|                                                               |
| [ Explore the evidence ]                                      |
| [ Replay sequence ]                                           |
|                                                               |
| +-----------------------------------------------------------+ |
| |                                                           | |
| |              STRATA HERO VISUAL (MANDATORY)               | |  Hero Visual
| |              Width: 90vw - 94vw                           | |  Stacked Under
| |              Aspect Ratio: 1448 / 1086                    | |  Copy
| |                                                           | |
| +-----------------------------------------------------------+ |
|                                                               |
+---------------------------------------------------------------+
```

- **Header Height:** `60px`.
- **Outer Page Gutters:** `20px` (`5.1%` of viewport width).
- **Navigation Chrome:** Mobile drawer trigger (`[ = ]`) replaces desktop nav links; brand mark scaled to `19px` cap-height.
- **Layout Architecture:** Strict vertical single-column stack. Editorial copy leads; Hero visual follows directly beneath.
- **Headline Scale:** `clamp(2.5rem, 11vw, 3.4rem)` on 2 lines; line-height `1.02`; tracking `-0.045em`.
- **Editorial Subhead:** `0.98rem`, line-height `1.5`, width `100%`.
- **CTA Cluster:** Full-width or stacked vertical buttons:
  - Primary button: `width: 100%`, height `48px`, font `0.95rem`.
  - Secondary button: `width: 100%`, height `46px`, font `0.92rem`.
  - Vertical gap: `10px`.
- **Hero Visual (`hirearchy-hero-evidence-spatial-composition.png`):**
  - Position: Stacked below CTAs with `28px` top margin.
  - Width: `90vw` to `94vw` (`350px` to `366px`).
  - Alignment: Centered horizontally (`margin: 0 auto`).
  - Bleed: Zero right-bleed on mobile (fully bounded to prevent horizontal scroll overflow).
  - Crop behavior: Full asset visible without cropping; natural transparent background dissolves seamlessly into canvas.

---

## 5. Proportional Layout Matrix Across Scenes

| Scene                   | Desktop (1440×900) Footprint              | Laptop (1280×800) Footprint        | Mobile (390×844) Footprint          |
| :---------------------- | :---------------------------------------- | :--------------------------------- | :---------------------------------- |
| **Scene 01: Hero**      | Split 44vw / 58vw (Right bleed)           | Split 46vw / 56vw (Right bleed)    | Stacked 100% width (`92vw` visual)  |
| **Scene 02: Dilemma**   | 3 columns (`1fr 1fr 1fr`, max 1240px)     | 3 columns (gap 20px, max 1120px)   | 1 column stacked (3 specimen cards) |
| **Scene 03: Work**      | Horizontal timeline (100vw, padded)       | Horizontal timeline (100vw)        | Vertically stacked sequence cards   |
| **Scene 04: Context**   | 3D stack (max-width 1180px, pinned)       | 3D stack (max-width 1040px)        | 2D exploded elevation stack         |
| **Scene 05: Workbench** | 3-pane workbench (max 1440px, centered)   | 3-pane workbench (max 1240px)      | Segmented 1-pane tabbed view        |
| **Scene 06: Lenses**    | 3 staggered 3D cards (`Z: 0` to `-120px`) | 3 staggered cards (reduced offset) | 1-card horizontal swipe carousel    |
| **Scene 07: Climax**    | Full-bleed installation (`92vw` text)     | Full-bleed installation (`90vw`)   | Monumental multi-line stack         |
| **Scene 08: Close**     | 50/50 split (CTA left / Monolith right)   | 50/50 split (reduced margins)      | Stacked (CTA top / Image bottom)    |

---

## 6. Implementation Guardrails

1. **No Absolute Pixel Traps:** Never write fixed widths like `width: 914px` for fluid hero containers. Use fluid CSS clamp: `width: min(64vw, 920px)`.
2. **Prevent Viewport Horizontal Overflow:** Right-bleeding visual elements must reside within a parent container with `overflow-x: clip` or `overflow-x: hidden` on the section wrapper to preserve page scroll ergonomics.
3. **Vertical Rhythm Unit:** All vertical spacing must snap to a `8px` spatial grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, `128px`).
