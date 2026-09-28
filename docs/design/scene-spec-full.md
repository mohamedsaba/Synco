# Hirearchy — full 8-scene spec (transcribed from reference)

Source of truth: `docs/design/references/hirearchy-website-direction-v1.png`
Actual dimensions: **1536x1024**, a tiled contact sheet of 8 page sections.

Tile grid (approximate, in source px):

| Scene | Tile                      | Eyebrow label              |
| ----- | ------------------------- | -------------------------- |
| 01    | x 0..970, y 0..497        | `REAL WORK`                |
| 02    | x 970..1536, y 0..270     | `THE PROBLEM`              |
| 03    | x 985..1500, y 280..495   | `THE APPROACH`             |
| 04    | x 35..915, y 520..810     | `PRODUCT EXPERIENCE`       |
| 05    | x 985..1500, y 520..810   | `REAL SCENARIOS`           |
| 06    | x 35..620, y 825..1000    | `FOR DIFFERENT TEAMS`      |
| 07    | x 650..1230, y 825..1000  | `A FAIRER, FASTER PROCESS` |
| 08    | x 1250..1500, y 825..1000 | `GET STARTED`              |

Shared visual rules:

- Mono micro-eyebrow: `NN` + 1px rule + LETTER-SPACED LABEL, ~8–9px, uppercase.
- Section headline: light/regular weight (~450–500), tight leading (~1.0–1.1), tight negative tracking.
- Body copy: regular ~9–12px, muted, short measure, 3–4 lines.
- Pill buttons: solid black + outline pair, ~31px tall, fully rounded.
- Ground: `#f7f7f4` light canvas; Scene 01 alone carries a dark evidence field.
- Cool steel/smoke planes, never warm cream/gold. No beige luxury editorial, no SaaS
  feature-card grids, no glassmorphism, no neon.

---

## SCENE 01 — HERO (`REAL WORK`)

Single screen, wide. Stage aspect ~1.95 (970x497). Desktop header ~44px, inside the fold.

Header (on light ground, full tile width):

- Logo glyph x 40..68, y 17..38; "Hirearchy" wordmark x 82..168, ~19px, medium.
- Nav ~13px: Product, Use cases, Resources, Company (baseline ~y 35).
- `Get started →` black pill x 812..922, y 14..44.

Copy column x 38..320:

- Eyebrow y 118: `01` ·—— `REAL WORK`
- H1 2 lines, ~64px, weight ~500, line-height 0.97, tracking -0.034em:
  `Real work.` / `In context.`
- Lead 4 lines, ~12px / 16px, max-width ~250px:
  `A new way to evaluate engineers.`
  `Candidates work in realistic scenarios.`
  `You get structured, evidence-based context.`
  `Make better decisions, faster.`
- Buttons y 361..392: `See how it works →` (solid) + `Watch video ▶` (outline).
- `SCROLL ⌄` mono micro-label, y 455..464.

Dark evidence field x ~340..970, full height, bleeding off top and right, SOFT left edge
(starts ~340 top, ~330 mid, ~300 bottom). Warm-white key glow x 550..700 y 200..350 plus a
floor spill x 480..700 y 380..497.

Inside the field:

- Repository panel x 480..560, y 200..390 — dark, rounded, file tree
  `src/ api/ services/ tests/ docker/ README.md`.
- Attempt workbench x 555..760, y 140..440 — dark, rounded, slightly rotated. Contains
  `Attempt` + search glyph, `00:14:27` timestamp, file path row, red/green diff lines.
- Connector spine: vertical line x ~795, y 145..410, 4 dots. Cards sit immediately right
  (x 800) so branches are near-zero-length and the dot lands on the card edge.
- 4 evidence cards, each ~100x57, light frosted, icon left + label + sublabel:
  - Investigation — `3 files` — y 148..205
  - Revision — `2 commits` — y 228..283
  - Verification — `4 tests` — y 300..355
  - Outcome — `Deployed locally` — y 375..430
- 70px of dark ground right of the cards.
- Planes: cool white/steel, receding, several crossing LEFT out of the dark field into the
  light zone (x 340..480).

Geometry as % of the full-bleed stage (measured, verified):

- copy `padding-top: clamp(56px, 13svh, 116px)`, `width: clamp(340px, 29vw, 420px)`
- ground `inset: 0 -6% 0 35%`, radius `30px 0 0 30px`, soft left edge via mask
- repository `left 49.5%; top 40.2%; width 8.2%`
- workbench `left 57.2%; top 28.2%; width 21.2%; height 60.3%`, `rotate(-1.3deg)`
- spine `left 74.6%; top 29.2%; width 14.8%; height 53.3%` (wide so the source filament
  resolves above 1px; its line is only 0.45% of the 887px source width)
- cards `left 82.5%; width 10.3%; aspect-ratio 1090/470`,
  tops `29.8% / 45.9% / 60.4% / 75.5%`

## SCENE 02 — THE PROBLEM

Compact horizontal band.

- Eyebrow: `02` ·—— `THE PROBLEM`
- H2 LEFT, 2 lines, ~24px, weight ~450:
  `Traditional hiring` / `misses the real picture.`
- Body RIGHT, ~9px, 4 lines:
  `Resumes, short interviews, and isolated coding tests don't show how engineers
actually work. Important context is lost, and good candidates are often overlooked.`
- 3 fragments in one flush row, each ~155x92, dark/desaturated, slight rounding, even gaps.
  Captions DIRECTLY beneath, ~8px, NO rule above captions.

## SCENE 03 — THE APPROACH

- Eyebrow: `03` ·—— `THE APPROACH`
- H2 LEFT, 2 lines: `Same work.` / `More context.`
- Body RIGHT: `Candidates solve realistic problems in a real environment. We capture the
work as it happens and structure it into clear, reviewable evidence.`
- 5 equal columns, each: rounded-square icon, bold label, 2-line sub-copy
  1. **Attempt** — `See what they try. In what order.`
  2. **Investigation** — `Explore how they find information.`
  3. **Revision** — `Understand how they improve.`
  4. **Verification** — `See how they validate.`
  5. **Outcome** — `Review the final state and decisions.`
- Light ground with a faint plane texture along the bottom.

## SCENE 04 — PRODUCT EXPERIENCE

- Eyebrow: `04` ·—— `PRODUCT EXPERIENCE`
- H2 LEFT: `Everything in one place.`
- Body LEFT: `A clear, structured view of the candidate's work, from initial exploration to
final outcome.`
- Left rail nav; active item in a BLACK pill: Overview, Timeline, Code, Environment,
  Evidence, Notes.
- Right: app window mockup.
  - Window bar: Hirearchy glyph + wordmark, breadcrumb `Candidates / Session 0427`,
    search glyph, `Share` button, overflow menu.
  - `Session timeline` — 5 nodes: Attempt 12 events, Investigation 6 events,
    Revision 6 events, Verification 4 events, Outcome 1 event.
  - `Key actions` — Explored repository structure `00:02:14`, Checked logs `00:08:27`,
    Modified order service `00:15:03`, Ran tests `00:22:10`, Fixed edge case `00:28:46`.
  - `Environment` — Repository `order-service`, Branch `fix/stock-race-condition`,
    Runtime `Docker (Node 20)`, Tests `12 passed / 0 failed`.

## SCENE 05 — REAL SCENARIOS

- Eyebrow: `05` ·—— `REAL SCENARIOS`
- H2 LEFT, 2 lines: `Evaluate what` / `actually matters.`
- Body RIGHT: `Use realistic, role-specific scenarios that reflect the kind of work
candidates will do on your team.`
- 4 flat white cards in a row, icon top-left, label + 2-line sub:
  1. **Backend** — `Debugging, system design, API development.`
  2. **Frontend** — `Real features, state management, UI logic.`
  3. **Full Stack** — `End-to-end scenarios across the stack.`
  4. **And more** — `Adaptable to different roles and domains.`

## SCENE 06 — FOR DIFFERENT TEAMS

- Eyebrow: `06` ·—— `FOR DIFFERENT TEAMS`
- H2, 2 lines: `One platform.` / `Multiple perspectives.`
- Body: `Engineers, recruiters, and hiring managers all look at the same evidence, from
their own perspective.`
- 3 DARK cards in perspective (rotated, receding), each with a glyph, label, sub:
  - **Engineer** — `Technical deep dive`
  - **Hiring Manager** — `Decision context`
  - **Recruiter** — `High-level progress`

## SCENE 07 — A FAIRER, FASTER PROCESS

- Eyebrow: `07` ·—— `A FAIRER, FASTER PROCESS`
- H2, 2 lines: `Spend less time guessing.` / `More time deciding.`
- 3 stat blocks: big glyph + big value + 2-line sub
  1. `↓` `70%` — `less time in initial screening`
  2. `↑` `Higher` — `quality hiring decisions`
  3. `◷` `Evaluate` — `more candidates in parallel`

## SCENE 08 — GET STARTED

- Eyebrow: `08` ·—— `GET STARTED`
- H2: `See it in action.`
- Body: `Explore a sample session and see how Hirearchy helps you make more informed
hiring decisions.`
- Buttons: `Try a sample session →` (solid) + `Talk to us` (outline).
- Right: architectural photograph panel carrying the Hirearchy logo lockup.
