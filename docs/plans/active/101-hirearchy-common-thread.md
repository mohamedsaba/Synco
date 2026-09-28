# Hirearchy Common Thread implementation

## Authority and scope

User request, 2026-09-27: replace the entire public marketing site in the D1B worktree. Original `03-common-thread.png` is visual authority, not the altered motion walkthrough. No further Figma work. Build Home, Products, Software, Our thinking, About and Contact with shared navigation. Contact uses a form. IT and Marketing remain future directions. Supersedes the public visual direction in 099/100, not the product architecture or evaluation rules.

Existing dirty marketing files are explicitly superseded by this request and backed up to `/tmp/hirearchy-before-common-thread-20260927.tar.gz`; preflight status saved beside it. Unrelated dirty configuration, historical design documentation and product interfaces are preserved. Old runtime artwork is removed; historical design evidence remains documentation.

## Implementation

- Match original composition, proportions, palette, rounded paths, grotesk typography and headline copy. Source is a generated raster, so exact font metadata is unavailable; use locally hosted DM Sans, matching its visible letterforms. No image-as-page implementation.
- Native SVG paths and CSS reveal motion; normal scroll. Family continuation travels through the IT/Marketing gap, below the editorial column and into the next section. Semantic content remains complete without JavaScript and under reduced motion.
- Preserve evidence/human-decision boundaries. Replace unsupported generated supporting claims with factual copy. No fake testimonials, metrics or product availability.
- Contact delivery destination is pending user input. Never display success without actual delivery. Legal routes must identify missing approved copy rather than fabricate policy.
- No changes to candidate/evaluator APIs, domain, sessions, database or workspace CSS.

## Verification

Implemented the six public pages plus explicit unpublished Privacy/Terms layouts. The original image is preserved at `docs/design/assets/common-thread/03-common-thread-reference.png`. All old runtime home components and the previous served lockup have been replaced. Candidate/Evaluator code, workspace styling and existing dirty configuration remain unchanged.

- Initial complete verification passed: 650 tests passed, 6 skipped, plus formatting, lint, typecheck and production build. The first sandboxed integration attempt was blocked by Docker permissions; the authorized run passed.
- Browser layouts: all eight routes at 1440×900 and 390×844 with reduced motion; homepage additionally at 1280×800 and 390×844 with motion. All 18 combinations had zero axe WCAG A/AA violations, no horizontal overflow and no page errors. Screenshots and machine-readable results: `docs/design/screenshots/common-thread/`.
- Visual comparison against the original raster corrected headline size, label wrapping, section boundary joins, family path routing and future-product color. Typography is DM Sans, self-hosted with the official OFL license; the raster contains no authoritative font metadata, so exact font identity cannot be certified.
- Browser testing exposed Next's internal request URL differing from the external Host. Contact Origin validation now compares the browser Origin with the external Host and rejects cross-site requests. A regression test covers the internal-URL case. Final `npm run verify` passed after this correction: 651 tests passed, 6 skipped; formatting, lint, typecheck and production build passed. Contact browser checks passed for required/email validation, preselected topic, genuine 503 error with input retention and focus, stubbed success/reset, keyboard skip link and JavaScript-disabled content. The browser success response was stubbed; no actual delivery was claimed or performed.
- Full implementation motion recording: `hirearchy-implemented-motion.mp4` in the task visualization output folder. Native SVG/CSS/IntersectionObserver; no added application dependency.

## Remaining launch inputs

Contact delivery destination/provider is still unanswered. The form validates input and keeps user input on failure; the server returns 503 and never claims delivery. No message is stored or sent. The success state is tested only with a stubbed browser response. Actual delivery, abuse protection appropriate to the chosen provider and production configuration must be completed once the destination is supplied.

Privacy/Terms contain clearly labelled, noindex publication placeholders, not invented legal policy. Approved legal text is required before launch. No commit, push or deployment was requested or performed. This plan stays active for those remaining inputs.
