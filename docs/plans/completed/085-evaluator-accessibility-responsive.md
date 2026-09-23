# E5 evaluator accessibility and responsive hardening

## Scope

This slice hardens existing evaluator markup, CSS, and interactions only. It
does not change evidence, chronology, authorization, role-depth projection, or
the E6 visual-design scope.

## Implemented structure

- The review overview has a visible `h2`; its scenario context and platform
  notice headings are nested `h3`s.
- Queue links retain visible metadata but use concise scenario/session names.
- Engineer hierarchy navigation has one truthful `Technical inspection` target.
- Engineer inspection actions are native buttons in a named group. Evidence
  selection preserves focus; the Technical record action replaces the submitted
  panel.
- Native disclosures remain native. Focus uses the existing shared focus ring.
- Engineer inspection is adjacent and sticky at `70rem` and above, bounded by
  `calc(100dvh - 2rem)` with local vertical scrolling. Below that breakpoint it
  returns to normal single-column page flow.
- Technical code/diff surfaces retain local scrolling; ordinary metadata,
  paths, and evidence references wrap. Controls touched by this slice have a
  practical 2.5rem minimum target height.

## Verification

Focused evaluator tests cover queue naming, hierarchy targets, heading order,
native links/buttons/disclosures, focus preservation, Technical record
selection, sticky CSS, role profiles, discovery, and evaluator rendering.

Local headless Chromium rendered Generalist at 1440x900 and 390x844 and
Engineer at 1440x900, 1024x768, 768x1024, and 390x844. It verified responsive
columns and no normal page-level horizontal overflow with long temporary
command/output content. Its local DevTools session did not hydrate client
controls reliably, so browser-level interaction activation remains an explicit
environment limitation; DOM interaction coverage supplies the focused proof.

E6 visual polish remains deferred.
