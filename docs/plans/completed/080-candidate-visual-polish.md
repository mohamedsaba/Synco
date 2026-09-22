# 080 — Candidate Visual Polish (C10)

## 1. Visual Direction

- Established a restrained, editorial, and technically credible visual language for Delimit's candidate evaluation experience.
- Replaced harsh brutalist blocks and neon styling with calm, warm neutral surfaces, subtle structural borders, and refined hierarchy.
- Eliminated all artificial exam/quiz/gamification metaphors, hacker-terminal green accents, and generic SaaS aesthetic tropes.
- Designed a calm, spacious engineering environment where candidate focus is centered entirely on code, requirements, commands, and integrated AI.

## 2. Token Decisions

Consolidated visual properties into pragmatic CSS custom properties on `:root`:

- **Paper & Surfaces**:
  - `--paper`: `#f4f2ea` (warm neutral page backdrop).
  - `--paper-subtle`: `#eeece3` (secondary neutral backdrop).
  - `--surface`: `#ffffff` (primary crisp light surface).
  - `--surface-subtle`: `#faf9f5` (secondary panel surface).
  - `--surface-note`: `#f1eee5` (context and informational banner surface).
  - `--surface-muted`: `#e7e4da` (inactive / de-emphasized elements).
- **Ink & Typography**:
  - `--ink`: `#171714` (deep warm graphite, primary text, high contrast).
  - `--ink-secondary`: `#383733` (secondary section titles and labels).
  - `--muted`: `#5c5a53` (supporting body copy, WCAG AA compliant >= 4.5:1).
  - `--muted-light`: `#7c7970` (labels and metadata).
- **Structural Lines**:
  - `--line`: `#d4d0c2` (subtle structural divider).
  - `--line-strong`: `#171714` (active navigation and emphasis border).
  - `--line-subtle`: `#e4e0d4` (internal container borders).
- **Restrained Technical Accent**:
  - `--accent`: `#244b5a` (deep slate/indigo, replacing neon green `#d8ff36`).
  - `--accent-light`: `#e8f0f4` (subtle accent wash).
  - `--accent-dark`: `#162f39` (accent text on light wash).
- **Focus System**:
  - `--focus-ring`: `#1d4ed8` (accessible cobalt, 2px solid with 2px offset).
- **Status & Notice Language**:
  - Success: `--status-success-bg: #ecfdf3`, `--status-success-text: #166534`, `--status-success-border: #bbf7d0`.
  - Warning: `--status-warning-bg: #fffbeb`, `--status-warning-text: #92400e`, `--status-warning-border: #fde68a`.
  - Danger: `--status-danger-bg: #fef2f2`, `--status-danger-text: #991b1b`, `--status-danger-border: #fecaca`.
  - Neutral Notice: `--notice-bg: #f8fafc`, `--notice-text: #334155`, `--notice-border: #cbd5e1`.
- **Radii & Shadows**:
  - `--radius-xs: 2px`, `--radius-sm: 4px`, `--radius-md: 6px`.
  - `--shadow-sm: 0 1px 2px rgba(23, 23, 20, 0.04)`.
  - `--shadow-card: 0 4px 16px rgba(23, 23, 20, 0.06), 0 1px 3px rgba(23, 23, 20, 0.04)`.

## 3. Typography Hierarchy

- **System UI Text (`--font-sans`)**: Clear, neutral system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`) applied to UI chrome, navigation, orientation cards, and instructions.
- **Editorial Headings (`--font-display`)**: Elegant serif stack (`'Iowan Old Style', Baskerville, 'Times New Roman', Georgia, serif`) applied to scenario titles and major page headings for authoritative editorial hierarchy.
- **Technical Monospace (`--font-mono`)**: Technical font stack (`'IBM Plex Mono', 'SF Mono', Menlo, Consolas, monospace`) applied strictly to file paths, editor code, terminal input/output, and diff lines.
- **Hierarchy Scale**:
  - Page Titles (h1): clamp(2.2rem, 5vw, 4.8rem), line-height 1.05.
  - Section Headings (h2): 0.85rem, uppercase, letter-spacing 0.04em, line-height 1.4.
  - Metadata / Eyebrows: 0.68rem, uppercase, font-weight 700, letter-spacing 0.12em.
  - Body Copy: line-height 1.6, readable line length.

## 4. Workspace Frame

- Refined workspace header (`.workspace-header`) with subtle structural border (`--line`) and clear baseline alignment.
- Balanced left-side context block (eyebrow, session ID) with right-side action block (timer, submit button, status pill).
- Submit Assessment button formatted as deliberate primary action with calm dark background, avoiding aggressive red warning styling.

## 5. Navigation

- Preserved native `<button>` markup with `aria-current="page"` and `aria-controls`.
- Clear contrast hierarchy:
  - Inactive destinations: neutral surface, subtle border, subtle hover wash.
  - Active destination: solid dark ink with white text and sharp border.
  - Clear keyboard focus treatment (`--focus-ring` with 2px offset).
  - Did not convert to ARIA tabs.

## 6. Scenario

- Scenario brief panel (`.brief-panel`) styled as an editorial specification document.
- Acceptance criteria list formatted with clear spacing, subtle separator lines, and high-contrast checkbox glyphs.
- Capture notice formatted as a subtle, muted architectural disclosure with slate accent border, not an alarming warning card.

## 7. Files

- Multi-file tabs (`.file-tab`) rendered as clean monospace file chips.
- Active file clearly indicated via solid ink background (`.file-tab-active`).
- Long file paths wrap cleanly with `overflow-wrap: anywhere`.

## 8. Editor

- Textarea code editing surface styled with crisp light background (`--code-surface`), dark graphite ink (`--code-text`), monospace font, line-height 1.65, and tab-size 2.
- Focus treatment: 2px cobalt ring with negative offset (`outline-offset: -1px`) ensuring zero layout shift.
- Save status badge (`.editor-persistence`):
  - Saved: understated green.
  - Unsaved: understated amber.
  - Saving: muted neutral.
  - Save failed: understated red.

## 9. Commands

- Removed all neon-green terminal styling and fake command-line chrome.
- Run button styled as a solid technical action (`--ink` with hover to `--accent`).
- History log (`.terminal-log`) styled on clean light technical background (`--code-background`).
- Chronological entries feature distinct, accessible status badges for exit codes, timeout, and execution errors.
- Distinct output presentation: standard output in dark graphite (`--terminal-output-text`), standard error in dark crimson (`--terminal-error-text`).

## 10. Mandatory C9 Terminal Focus Fix

- Resolved accepted C9 finding in `.terminal-input`.
- Replaced naked `outline: none` suppression with prominent `.terminal-form:focus-within` treatment:
  - `outline: 2px solid var(--focus-ring); outline-offset: -1px;`
  - High-contrast cobalt indicator on keyboard focus.
  - Zero layout shift.
  - Verified with automated test in `tests/unit/candidate-workspace-interaction.test.tsx`.

## 11. AI

- Integrated AI surface (`.candidate-ai-panel`) styled as a serious engineering reasoning tool rather than a consumer chat widget.
- Request and response entries formatted as structured technical cards with monospace code blocks.
- Included context clearly summarized with file reference pills and metadata explanation.
- Composer textarea provides clear focus ring, clean placeholder, and monospace character counter.

## 12. Timer

- Timer presentation (`.workspace-timer`) designed as calm, supportive guidance rather than an alarming central widget.
- States:
  - NORMAL: clean neutral border and surface.
  - ATTENTION: subtle amber wash and border, no animations or flashing.
  - URGENT: subtle red wash and border with clean text underline, no flashing.
  - EXPIRED: muted neutral tone.

## 13. Status System

- Standardized status language using text + weight + border + subtle surface wash, never color alone.
- Applied consistently across editor persistence, command execution, AI interactions, session state, and timer thresholds.

## 14. Submission Review

- Submission review modal card (`.submission-review`) centered with clear visual gravity, warm surface, and subtle shadow (`--shadow-card`).
- Emphasizes deliberate finality: clear editor persistence check ("Saved" vs "Unsaved"), secondary Back action, and primary Submit Assessment action.

## 15. FINALIZING

- Clean, centered status presentation communicating: "Delimit is completing the assessment. Submission has begun. No more changes can be accepted while finalization is underway."
- No fake progress percentages, spinners, or infrastructure implementation details.

## 16. Completion

- Preserved clear product distinction between manual submission ("Assessment submitted") and timeout finalization ("Assessment time ended").
- Calm, authoritative final state without celebratory confetti, trophies, scores, or pass/fail labels.

## 17. Responsive Refinements

- Preserved C9 breakpoint architecture:
  - Desktop: `> 72rem` (three-column grid).
  - Single-surface: `<= 72rem` (single panel active, header stacks, navigation scrolls horizontally).
  - Compact: `<= 34rem` (narrow mobile, full-width buttons, accessible tap targets).
- Audited zero page-level horizontal overflow.

## 18. Focus / Hover / Reduced Motion

- Coherent `:focus-visible` styling (`outline: 2px solid var(--focus-ring); outline-offset: 2px`).
- Subtle hover transitions (120ms ease-out) avoiding distracting movement.
- All non-essential animations respect `prefers-reduced-motion: reduce`.

## 19. Intentionally Deferred to Future Application-Wide Design System

- Global design system tokenization across Evaluator experiences.
- Global component library extractions.
- Custom typography/webfont downloads.
