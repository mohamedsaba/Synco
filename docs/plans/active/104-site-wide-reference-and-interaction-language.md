# Plan 104 — Site-Wide Dimensional Reference, Brand Interaction Language, Context-Aware Navigator

**Status:** ACTIVE
**Scope:** Make the landing page the single dimensional reference for every route; make one major section occupy exactly one viewport by composition rather than by force; introduce a brand-level hover colour, a reusable painted-hover primitive, a matching arrow interaction, and a deterministic context-aware theme for the bottom-right navigator with animated transitions.
**Authority:** `docs/design/README.md`, `docs/design/hirearchy-brand-tokens-vnext.md`, plans `101`–`103`.

---

## 1. Evidence Gathered Before Editing

### 1.1 The navbar is defined in two different scales

`apps/web/app/home.css` sets the header twice:

| Where          | Selector              | Scale                                                                                 |
| -------------- | --------------------- | ------------------------------------------------------------------------------------- |
| line 69–112    | `.ct-header`          | `height: 7.3cqw`, wordmark `2.65cqw`, nav `1.13cqw`, start `1.02cqw` — **pure `cqw`** |
| line 1925–1937 | `.ct-home .ct-header` | `min(7.3cqw, 10.2svh)`, `clamp(22px, min(2.65cqw, 3.7svh), 46px)`, … — **dual-axis**  |

Only `.ct-home` gets the dual-axis values, so every interior route silently uses the pure-`cqw` scale. Measured header height at 1920×1080: landing `110.16px`, every interior route `140.16px` — a uniform 1.27× divergence that tracks width only.

### 1.2 Sections under-fill the viewport, and the next section bleeds

Measured with `/tmp/opencode/section-fit.mjs`. At 1920×1080, `/products` `ct-page-hero` is `786px` inside a `940px` available height (`shortBy=154`) and the following section starts at `y=926`, so it is already on screen. Every interior route bleeds its first section at every size tested. The landing hero is exactly `1080px` (`shortBy=0`) because it is `height: 100svh`; the landing page's other sections under-fill by 111–359px.

### 1.3 The button hover is a sub-brand colour hijack

Colour ownership, verified in CSS:

| Family                   | Token                                   | Value                             |
| ------------------------ | --------------------------------------- | --------------------------------- |
| Hirearchy Software       | `--ct-mint`                             | `#b0f0ce`                         |
| Hirearchy IT             | `--ct-coral`                            | `#ff9b88`                         |
| Hirearchy Marketing      | `--ct-purple`                           | `#bb98f4`                         |
| Brand-own (no sub-brand) | `--ct-plum` / `--ct-lilac` / `--ct-ink` | `#291e36` / `#ebe5f2` / `#251a35` |

`.ct-start` ("Start with Software") rests on mint, and the global rule at 1967–1971 repaints it `--ct-coral` — IT's brand colour — on hover. A product-family button is being recoloured with another family's identity.

### 1.4 A single flat hover fill is measurably impossible

`/tmp/opencode/derive-hover.mjs`. Lifting plum toward lilac gives `#473d54`, but ink text on it is **1.61:1** — it fails on a mint resting surface. It is only usable on a dark resting surface. A brand hover must therefore be a **surface-adaptive pair**, and both members must be derived only from plum/lilac/ink.

---

## 2. Decisions

### 2.1 The landing page becomes the reference by promotion, not duplication

The landing page's dual-axis header metric is moved from the `.ct-home`-scoped override into a single shared custom property `--ct-header-h` on `.ct-site`, consumed by `.ct-header` and by the section minimum. The `.ct-home`-scoped overrides are deleted. One definition, one source of truth, identical on every route by construction.

### 2.2 Section fill is a derived minimum plus composition, never a forced height

```css
.ct-inner main > section {
  min-height: calc(100svh - var(--ct-header-h));
}
.ct-site main > section {
  min-height: 100svh;
}
```

`min-height` is a floor, never a clip: a section with more content than the floor keeps its natural height and scrolls. Sections that under-fill grow, and their internal content is centred so the extra space reads as breathing room rather than stretch. Text is never scaled to fill. This is the same dual-axis idiom the hero already uses, and it inherits the same overflow behaviour at ultra-wide and short-landscape sizes rather than introducing a new one.

### 2.3 Brand hover colour, derived and proven

Two tokens, both mixed in oklab from brand-own tokens only:

| Token                       | Derivation           | Value     | vs resting surface | label contrast     |
| --------------------------- | -------------------- | --------- | ------------------ | ------------------ |
| `--ct-brand-hover-on-light` | lilac 80% / plum 20% | `#c0b9c9` | 1.47:1 vs mint     | 8.63:1 ink (AAA)   |
| `--ct-brand-hover-on-dark`  | plum 82% / lilac 18% | `#473d54` | 1.55:1 vs plum     | 10.18:1 white (AA) |

Both sit in the brand's own aubergine band, ≥4.3:1 from every sub-brand hue, and belong to no product family.

### 2.4 Hover is one reusable primitive

A single `::after` paint layer, positioned by `isolation: isolate` + `z-index: -1` so it sits behind the label with **no markup change**, revealed by an animated `clip-path: inset()` sweep. Direction and easing live in one rule set that every button variant inherits.

### 2.5 Arrow shares the same language

`Arrow()` gains `pathLength="1"` so the existing stroke can be dash-animated on the same curve and duration as the sweep, combined with the existing translation.

### 2.6 Navigator theme is derived from the active section, not authored per section

`page-navigator.tsx` already tracks the active section index. It reads that section's own computed background, classifies it light or dark by relative luminance, and sets `data-surface` on the navigator root. CSS maps that to brand-derived surface tokens. No per-section overrides, no copying of the section background, and it works automatically on any route including ones not yet written.

### 2.7 Transitions are real, not instant

The navigator's surface and ink are registered with `@property` so they transition as colours when `data-surface` flips, and a wipe overlay animation is retriggered by the attribute change.

---

## 3. Constraints Held

- No landing-page proportion is altered; the hero stays `height: 100svh` and landing section heights are untouched.
- Navbar dimensions become identical across routes by construction.
- No sub-brand hue is used as a generic hover.
- No crude fixed heights; no clipping; no `overflow: hidden` used to fake a full screen.
- No per-page hover divergence; no duplicated interaction code.
- Reduced motion is honoured for every new animation.

---

## 4. Checks

All checks below were run against a production build (`npm run build`) served by
`npx next start apps/web -p 3105`. The browser probes live in `/tmp/opencode/`
and are not part of the repository.

```bash
npm run verify                       # format:check && lint && typecheck && test && build
npm run format:check
npm run typecheck
npm run build

# then, against the running server:
PLAYWRIGHT_MODULE=<playwright>/index.mjs node /tmp/opencode/section-fit.mjs  http://127.0.0.1:3105
PLAYWRIGHT_MODULE=<playwright>/index.mjs node /tmp/opencode/verify-104.mjs  http://127.0.0.1:3105
PLAYWRIGHT_MODULE=<playwright>/index.mjs node /tmp/opencode/hover-a11y.mjs  http://127.0.0.1:3105
```

### 4.1 Repository gates

| Gate                   | Result                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `npm run format:check` | clean                                                         |
| `npm run typecheck`    | exit 0                                                        |
| `npm run build`        | compiled successfully                                         |
| `npm run test`         | 70 files passed / 5 skipped; **651 tests passed / 6 skipped** |
| `npm run verify`       | **exit 0**                                                    |

### 4.2 Requirement 1 — the landing page is the global reference

`section-fit.mjs` records header height, wordmark, nav and CTA font sizes on all
six routes. After the change every route reports identical metrics:

| Viewport  | Header   | Wordmark | Nav     | Start   | Routes compared                                                           |
| --------- | -------- | -------- | ------- | ------- | ------------------------------------------------------------------------- |
| 1920×1080 | 110.16px | 39.96px  | 17.06px | 15.44px | `/`, `/products`, `/about`, `/thinking`, `/contact`, `/products/software` |
| 1512×860  | 87.72px  | —        | —       | —       | same six                                                                  |
| 1440×900  | 91.80px  | —        | —       | —       | same six                                                                  |
| 1366×768  | 78.33px  | —        | —       | —       | same six                                                                  |

Before, the interior routes reported **140.16px / 50.88px / 21.70px / 19.58px** at
1920×1080 — a uniform 1.27× over the landing page, and identical to each other,
which is the signature of a single shared rule that the landing page alone
overrode.

### 4.3 Requirement 2 — one full section per viewport

`section-fit.mjs` reports, per route and size, `bleeding` = the number of
sections where the **next** section starts above the fold.

| Viewport  | `/` | `/products` | `/about` | `/thinking` | `/contact` | `/products/software` |
| --------- | --- | ----------- | -------- | ----------- | ---------- | -------------------- |
| 1920×1080 | 0/5 | 0/4         | 0/5      | 0/3         | 0/2        | 0/5                  |
| 1512×860  | 0/5 | 0/4         | 0/5      | 0/3         | 0/2        | 0/5                  |
| 1440×900  | 0/5 | 0/4         | 0/5      | 0/3         | 0/2        | 0/5                  |
| 1366×768  | 0/5 | 0/4         | 0/5      | 0/3         | 0/2        | 0/5                  |
| 1280×720  | 0/5 | 0/4         | 0/5      | 0/3         | 0/2        | 0/5                  |

Before, `/products` bled its first section by 154px at 1920×1080 and 124px at
1512×860; `/about` by 267px and 214px. The Hirearchy Family section on `/products`
now fills its viewport.

Three sections still exceed one viewport **by content** and scroll, which the
`min-height` floor deliberately does not clip: `/products` `ct-product-spread`
(−290px at 1920×1080, −230px at 1512×860), `/contact` `ct-contact` (−788px,
−964px), `/thinking` `ct-editorial` (−48px, −38px).

### 4.4 Requirements 3 and 4 — button colour and animation

`verify-104.mjs`, 31 assertions, all passing:

| Assertion                                | Measured                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Start rests on the Software colour       | `rgb(176, 240, 206)` = `--ct-mint`                                                         |
| Hover fill is the brand token            | `rgb(192, 185, 201)` = `#c0b9c9`                                                           |
| Hover fill is **not** a sub-brand colour | asserted ≠ `--ct-coral`                                                                    |
| Fill against its resting surface         | 1.47:1 (visible shift, no label loss)                                                      |
| Label on the filled surface              | 8.63:1, ink — WCAG AAA                                                                     |
| Dark `.ct-button` fill                   | `rgb(71, 61, 84)` = `#473d54`                                                              |
| Dark label on the dark fill              | 10.18:1, white — WCAG AA                                                                   |
| Sweep animates                           | `clip-path: inset(0px 24.97% 0px 0px)` mid-flight → `inset(0px)` at rest of the transition |
| Unhover retracts fully                   | `inset(0px 100% 0px 0px)`                                                                  |
| Repeated hover/unhover cycles reset      | **6/6**                                                                                    |

### 4.5 Requirement 5 — arrows

| Assertion                           | Measured                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `Arrow()` carries a normalised path | `pathLength="1"` present                             |
| Stroke re-inks on hover             | rest `0px` → mid-flight `0.165701px` → settles `0px` |
| Directional movement                | `none` → `matrix(1, 0, 0, 1, 5, 0)`                  |

A static hover `stroke-dashoffset` was implemented first and **rejected**: to be
visible it must settle on a non-zero value, which leaves the arrow part-erased
for as long as it is hovered. The one-shot keyframe ends fully drawn, and the
persistent delta is the 5px translation.

### 4.6 Requirements 6 and 7 — floating navigator

| Assertion                          | Measured                                             |
| ---------------------------------- | ---------------------------------------------------- |
| Both surfaces observed             | `data-surface` takes `light` and `dark`              |
| Light plate legibility             | `rgb(243, 239, 247)` at **14.48:1**                  |
| Dark plate legibility              | `rgb(41, 30, 54)` at **13.82:1**                     |
| Plate is not a copy of the section | asserted against each section's own background       |
| Transition replays on every change | `wipeAnims = ct-nav-wipe:running`                    |
| Direction-independent              | forward and backward surface sequences are identical |

Confirmed visually in `/tmp/opencode/shots/`: `nav-light.png` versus `nav-dark.png`.

### 4.7 Reduced motion

`hover-a11y.mjs` under `prefers-reduced-motion: reduce`: the card hover still
registers with a **persistent** visual delta (opacity 0.34 → 1 and 0.38 → 1)
rather than depending on a transient, and five rapid hover/unhover cycles each
reset to 0.34 with no stale animation state. Every new animation is additionally
suppressed by the existing `prefers-reduced-motion` block.

### 4.8 Correction after review: the section floor broke four designs

The first implementation of the section floor was wrong and was corrected. It
declared more than it needed to:

```css
/* WRONG — reverted */
.ct-site main > section {
  min-height: var(--ct-section-min);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

`.ct-site main > section` is specificity (0,1,2), so it outranked every
section's own layout at (0,1,0). Four defects followed, all reported by
review:

| #   | Symptom                                                                      | Mechanism                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Buttons spanned the full section width on `/thinking`, `/about`, `/products` | `<Button>` is a direct child of `.ct-statement`, `.ct-editorial` and `.ct-contact-cta`. In a column flex container the default `align-items: stretch` widens a flex item to the container's cross size. |
| 2   | `/products` section 2 grew much larger                                       | `.ct-product-spread` is `display:grid; grid-template-columns:1fr 1fr`. Forcing `display:flex` collapsed the two columns into a vertical stack.                                                          |
| 3   | The `/contact` design changed                                                | `.ct-contact` is `display:grid; grid-template-columns:1fr 1.1fr`; the same override destroyed its two-column form layout.                                                                               |
| 4   | The mint thread line was cut off at "Our Philosophy" and "The First Step"    | The rule also matched the landing page's `.ct-process` and `.ct-philosophy`, changing their internal layout and clipping the absolutely positioned thread.                                              |

The corrected rule sets **only** `min-height`, and is scoped to interior routes
so the landing page — the approved reference — is excluded entirely:

```css
.ct-inner main > section {
  min-height: var(--ct-section-min);
}
```

Content is no longer vertically centred. That is deliberate: centring requires
declaring `display`, and every mechanism for doing so overrides a section's own
layout. A section that under-fills keeps its original top-aligned composition and
simply occupies the full viewport, which is what was asked for.

Verified with `/tmp/opencode/verify-regression.mjs`, 35 assertions, one per
reported symptom plus the two original requirements:

| Check                                  | Result                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Buttons not stretched, all five routes | `Explore Software` 376px of 1680px (22%), `Meet the family` 361px (21%), `Get in touch` 324px (19%), `Send message` 293px (17%) — was 100% |
| Header CTA compact                     | 216px of 1920px                                                                                                                            |
| `/products` section 2 two columns      | `display=grid`, `cols="787.359px 787.375px"`, x = 120 / 1013                                                                               |
| `/contact` two columns                 | `display=grid`, `cols="778.469px 856.328px"`, intro x=105, form x=959                                                                      |
| Landing sections not forced to flex    | all five report `display=block`                                                                                                            |
| Landing thread not clipped             | `.ct-process` and `.ct-philosophy` paths all within bounds                                                                                 |
| No next-section bleed                  | 0 on all five interior routes                                                                                                              |
| Navbar identical on every route        | 110.16px at 1920×1080, 91.80px at 1440×900, 78.33px at 1366×768                                                                            |

**Baseline comparison.** To prove the landing page was genuinely restored rather
than merely re-measured, `apps/web/app/home.css` was temporarily replaced with
its `84384f8` version, rebuilt and measured, then restored. The landing thread
geometry is unchanged: `.ct-family`'s leading path measures `top=-13` in both
builds. That 13px overhang is a pre-existing designed bleed — `.ct-family`
declares no `overflow`, so the path paints into the neighbouring section rather
than being clipped — and is not a defect. `git diff 84384f8 -- home.css` also
shows that no rule governing `.ct-process`, `.ct-family`, `.ct-philosophy`,
`.ct-software`, `.ct-hero`, `.ct-thread` or `.ct-paths` was modified.

Two probe defects were corrected here as well: the side-by-side test compared
`y` for equality, which is wrong for an `align-self:center` child, and the
clipping test compared an absolute viewport `Y` against a section _length_.

### 4.9 Two CSS defects found while verifying

1. **Specificity.** The shared `.ct-site :is(.ct-button, .ct-start)` token setter
   (0,2,0) beat a plain `.ct-button` setter (0,1,0), so the dark button painted
   with the **on-light** token. Fixed by prefixing the variant rules with
   `.ct-site` so they tie on specificity and win on source order.
2. **The wipe never played.** Animating `[data-surface='light']::after` does not
   replay when the attribute returns to a value whose rule is already applied, and
   a monotonic `data-wipe` counter did not help either — changing an attribute's
   value leaves the computed `animation-name` unchanged, so the animation cannot
   restart. Proven: no `CSSAnimation` object existed while
   `getComputedStyle(el, '::after').animationName` was already `ct-nav-wipe`.
   Fixed by rendering a real `<span className="ct-nav-wipe" key={wipe}>`, so React
   remounts the element and the animation always runs.

Six probe-side defects were also corrected; all six were measurement artifacts
rather than product bugs, and are recorded here because they invalidated earlier
readings: reading the first `inset()` field instead of the sweep field, sampling
70ms into a 340ms retract, resolving `querySelector('.ct-button')` to the mint
"Explore Software" while hovering the dark button, reading the arrow's rest state
while still hovered, sampling navigator contrast 120ms into a 420ms morph, and one
tautological assertion (`x !== y || x === y`).

### 4.10 Performance pass: load-time prefetch replaced by prefetch-on-intent

A separate, strictly performance-scoped pass. **No visual change of any kind:
`apps/web/app/home.css` is byte-identical across this work, no motion was
removed, and no markup structure changed** — the only edits were a `prefetch`
prop, one new client component, and its mount point.

**Measured before changing anything.** The site was already lean, and the
evidence ruled out the usual suspects:

| Check                | Finding                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payload              | 210 KB over 19 requests, all routes statically prerendered                                                                                                                               |
| Compression          | `Content-Encoding: gzip` on document and CSS                                                                                                                                             |
| Caching              | `public, max-age=31536000, immutable` on `/_next/static`                                                                                                                                 |
| JS payload           | 135.8 KB, entirely `react-dom` + Next.js client runtime; the two large chunks were inspected directly and contain no app code and no server dependency. `better-sqlite3` is server-only. |
| Font                 | 36.4 KB variable font, preloaded, `display: swap`                                                                                                                                        |
| Animations gate FCP? | No. FCP under `prefers-reduced-motion: reduce` (196/180/300 ms) matches FCP normally (200/328 ms) within noise.                                                                          |

**Root cause of the reported 600 ms.** Next issues two RSC prefetch passes over
the same in-view links: a viewport batch sharing a single cache key, plus a
per-`<Link>` pass. Every destination was therefore fetched twice — 10 requests,
18.9 KB. This was proven to be framework behaviour rather than a markup defect
because it occurred identically on `/products` and `/about`, which contain no
duplicate links. Those requests never blocked first paint, but they held the
`load` event past 600 ms, which is what a Network tab displays.

**Change.** Every marketing link sets `prefetch={false}`, and
`apps/web/app/home/intent-prefetch.tsx` performs the same prefetch on intent
instead — one delegated `pointerenter`/`focusin` pair on `document`, covering the
header, footer, in-content calls to action and the page navigator's chapter links
without any link knowing it exists. It ignores external links, the current route
and in-page anchors, and warms each destination at most once per page view.

Two findings worth keeping:

- `prefetch={false}` was verified to remove prefetching entirely on **both** load
  and hover, so the new component is what keeps navigation warm rather than a
  redundant layer over Next's own.
- The component is mounted in `apps/web/app/layout.tsx`, not in the `Site`
  wrapper. Mounted in `Site` it called `useRouter()` during the standalone server
  render that `tests/unit/hirearchy-homepage.test.tsx` performs, which has no App
  Router context, and 7 tests failed with `invariant expected app router to be
mounted`. The root layout is both the correct home for app-wide behaviour and
  always inside the router.

**Results**, 5 warm loads of `/products`, medians:

| Metric                        | Before   | After        |
| ----------------------------- | -------- | ------------ |
| RSC prefetch requests on load | 10       | **0**        |
| Requests                      | 19       | **9**        |
| Transfer                      | 210.4 KB | **191.7 KB** |
| `load`                        | 220 ms   | **186 ms**   |
| TTFB                          | 11 ms    | 20 ms        |
| FCP                           | 176 ms   | 172 ms       |

Cold-load wall time in the measurement sandbox ranged 447–743 ms across runs both
before and after, which is too noisy to support a claim in either direction; the
request-count and byte reductions are deterministic and are the result actually
claimed.

**Checks.** `verify-prefetch.mjs` 10/10 (zero eager prefetch on five routes,
pointer intent warms, keyboard focus warms, navigation after intent 517 ms and
lands on the correct heading, no linear growth across repeated hover cycles,
in-page anchors ignored). `verify-104.mjs` all checks passed, confirming buttons,
arrows, navigator theming and the shared navbar scale are unchanged.
`verify-regression.mjs` 34/35, the single failure being the pre-existing
`.ct-family` thread overhang proven present in the `84384f8` baseline.
`npm run verify` exit 0, 651 tests, 6 skipped.
