# Hirearchy navigation and detail craft

User request 2026-09-28: pause product design; refine the existing marketing website. Hide the browser scrollbar in favor of branded navigation, make the opening fit the viewport, replace product symbols and add meaningful icon/content motion, and redesign generic form/button interaction details. Product identity colors stay fixed on product cards.

## Scope and decisions

- Keep native scrolling, wheel, touch, keyboard and fragment links. A compact page-thread navigator offers section links, current location and a next-section action. Only hide document scrollbars while this functioning navigation is mounted on marketing routes; restore them on product routes and without JavaScript.
- Fit the hero to the stable viewport height. Scale its type/diagram against both width and height; use a compact composition on short landscape screens. Mobile includes the header in the opening viewport. Prior raster proportions are superseded only for this requested responsive adjustment.
- Software uses code brackets with a moving insertion mark, IT a connected system with a traced connection, Marketing a campaign/megaphone with a short outgoing wave. Hover/focus reveals descriptive link copy without resizing cards or changing product colors. Motion is bounded and reduced-motion safe.
- CTA hover changes to coral with plum text. Nav and form states use explicit brand fills and visible keyboard focus.
- Contact retains native inputs and native radio semantics for topic choice. Custom field-level errors replace browser validation bubbles when JavaScript is available. Server validation/delivery status remains unchanged; failed submission preserves entered text. No external messages sent.
- Reuse existing components, native CSS/SVG/React; no dependency, product-domain or Candidate/Evaluator changes.

## Checks

`npm run verify` passes: 651 tests passed, 6 skipped, with formatting, lint, typecheck and production build clean.

Browser matrix passes across all 13 viewports — 3840x2160, 2560x1080, 1920x1080, 1440x900, 1366x768, 1280x720, 768x1024, 390x844, 320x568, 390x480, 844x390, 667x375, 568x320 — asserting the hero fills the stable viewport exactly, no horizontal overflow, hidden document scrollbar, and no header/copy, copy/card, navigator/card, cue/navigator or card-content overflow at any size. Section navigation, keyboard, product motion, product colors, form states, product isolation and the no-JavaScript fallback all pass with zero axe violations. Evidence: `docs/design/screenshots/common-thread-details/`. The 101 and 102 browser suites were re-run against the same build and still pass.

Two defects were found and fixed while completing these checks:

- The short-landscape compact composition laid the product cards out as a full-width row at `top: 67%` but left the page navigator pinned at its desktop `bottom: 22px; right: 22px`, so the navigator overlapped the Marketing card at 844x390, 667x375 and 568x320. The compact block now lifts the card row to `top: 56%` and drops the navigator to `bottom: 8px`, giving the navigator its own bottom band beside the scroll cue. Scoped to `(min-width: 551px) and (max-height: 550px)`, so no other viewport changed.
- The browser check asserted CTA hover colour after a fixed 250ms sleep. Marketing routes set `scroll-behavior: smooth`, so an autoscrolled action was still animating when the locator hovered: the cursor stayed at a fixed viewport point while content slid underneath, dropping `:hover` mid-transition and returning the button to plum. The product behaviour was correct and was confirmed in isolation; the check now settles the scroll and polls for the settled colour. The assertion is unchanged and still compares against the exact coral value.

Running the browser checks requires a production server and a Playwright module, neither of which is a repository dependency:

```
npm run build
npx next start apps/web -p 3105
PLAYWRIGHT_MODULE=<path to playwright>/index.mjs node tests/browser/hirearchy-detail-craft.mjs http://127.0.0.1:3105
```

Pre-existing dirty work is preserved. No commit or deployment was requested or performed. Contact delivery destination and approved legal copy remain open inputs carried from 101; the 102 Figma product design remains blocked on tool access.
