# Hirearchy Design Directory — Index & Evidence Record

**Status:** ACTIVE RECORD  
**Scope:** Inventory of the `docs/design/` design documents, the policy governing binary design evidence, and the record of pruned evidence from the discarded visual direction.  
**Authority:** Commit `bd4567e` (`feat(marketing): rebuild the public Hirearchy site`) and plan `docs/plans/active/103-hirearchy-navigation-and-detail-craft.md`.

This file exists because evidence binaries are gitignored and therefore **invisible to `git status`**. Pruning them produces no commit and no diff. Without this record, the removals are unrecoverable and the current evidence base is undiscoverable.

---

## 1. Design Documents (tracked)

| Document                                 | Subject                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `hirearchy-approved-copy.md`             | Approved surface copy and tone constraints.                          |
| `hirearchy-layout-spec.md`               | Deterministic spatial, proportional and responsive geometry.         |
| `hirearchy-motion-spec.md`               | Motion timing, easing and reduced-motion behaviour.                  |
| `hirearchy-brand-tokens-vnext.md`        | Next-generation `--hirearchy-*` token namespace.                     |
| `hirearchy-scene-asset-map.md`           | Scene-to-asset requirements.                                         |
| `hirearchy-asset-manifest.md`            | Full asset manifest.                                                 |
| `hirearchy-asset-gaps.md`                | Known asset gaps (`GAP 00`–`GAP 06`).                                |
| `hirearchy-implementation-contract.md`   | Implementation contract for the site rebuild.                        |
| `hirearchy-implementation-acceptance.md` | Mandatory acceptance criteria before a slice may be called **DONE**. |
| `hirearchy-software-ui-brief.md`         | Product-UI design brief (Figma work blocked on plan limits).         |
| `scene-spec-full.md`                     | Full scene specification.                                            |

`references/hirearchy-website-direction-v1.png` is the masterboard reference and the **only tracked binary** in this directory.

---

## 2. Evidence Policy

Two subdirectories are gitignored (rules added in `bd4567e`) because they held ~195 MB of regenerable rasters:

```gitignore
docs/design/screenshots/
docs/design/assets/
```

Consequences that must be respected by anyone reasoning about this directory:

- Evidence may exist on one machine and not another. Absence from `git status` is not evidence of absence on disk.
- Evidence is **reproducible** from `tests/browser/*.mjs`; it is not authoritative source.
- Deleting evidence cannot be recorded by git. Any deliberate prune must be written down **here**.

Current on-disk inventory after the 2026-09-28 prune:

| Path           | Files | Size   | State                          |
| -------------- | ----- | ------ | ------------------------------ |
| `screenshots/` | 40    | 5.6 MB | Pruned from 406 files / 187 MB |
| `assets/`      | 9     | 7.9 MB | Untouched by the prune         |

---

## 3. Pruned Evidence — Discarded 099/100 Direction

**Pruned:** 2026-09-28. **Reason:** plans `099-hirearchy-website-experience-rebuild` and `100-hirearchy-scene-01-02` describe a visual direction that was **superseded** by the common-thread direction in plans `101`, `102` and `103`. The evidence captured that direction and was no longer decision-relevant.

Exactly four directories were removed. Each was the declared output directory of a browser script, which is what made the inventory verifiable:

| Removed directory                     | Produced by             | Contents                                                                            |
| ------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `screenshots/corrective-scene-01-02/` | `hirearchy-opening.mjs` | `scene-01-*`, `scene-02-*` viewport and reduced-motion captures.                    |
| `screenshots/final-scene-01-02/`      | `capture-final.mjs`     | Final-scene captures, `reference-comparison.html`, `hero-reference-comparison.png`. |
| `screenshots/lease/`                  | `lease.mjs`             | Lease-sequence captures.                                                            |
| `screenshots/scenes/`                 | `scenes.mjs`            | Scene captures.                                                                     |

The discarded direction is **not reproducible**. The four producing scripts were deleted alongside their output, so re-running them is no longer possible and the captures cannot be reproduced from this repository.

### 3.1 Removed Producing Scripts

The scripts that produced the pruned evidence were committed tooling for the discarded direction. They were deleted so that no committed script targets a directory this record declares intentionally absent:

| Deleted script                        | Target directory                                      |
| ------------------------------------- | ----------------------------------------------------- |
| `tests/browser/hirearchy-opening.mjs` | `screenshots/corrective-scene-01-02/`                 |
| `tests/browser/capture-final.mjs`     | `screenshots/final-scene-01-02/`                      |
| `tests/browser/lease.mjs`             | `screenshots/lease/`                                  |
| `tests/browser/scenes.mjs`            | `screenshots/scenes/`                                 |
| `tests/browser/run-craft-qa.mjs`      | drove `hirearchy-opening.mjs` and `capture-final.mjs` |

No plan, `package.json` script, or remaining browser script referenced any of them; the only other referrer was this file. The surviving harness is `shot.mjs` plus the three plan-scoped suites in section 4.

---

## 4. Authoritative Current Evidence

Retained, and the evidence base for the live direction:

| Path                                      | Plan                                             | Files |
| ----------------------------------------- | ------------------------------------------------ | ----- |
| `screenshots/common-thread/`              | `101-hirearchy-common-thread`                    | 19    |
| `screenshots/common-thread-details/`      | `103-hirearchy-navigation-and-detail-craft`      | 16    |
| `screenshots/common-thread-interactions/` | `102-hirearchy-interactions-and-software-design` | 4     |
| `screenshots/browser-validation.json`     | —                                                | 1     |

All three directories are referenced by their plans and all three resolve on disk. `common-thread-details/checks.json` carries the 13-viewport matrix result.

Retained authority raster: `assets/common-thread/03-common-thread-reference.png`. Because `assets/` is gitignored, this file is **local-only**.

---

## 5. Regeneration

Playwright is not a repository dependency, so evidence is regenerated explicitly:

```bash
npm run build
npx next start apps/web -p 3105
PLAYWRIGHT_MODULE=<path-to>/playwright/index.mjs \
  node tests/browser/hirearchy-common-thread.mjs http://127.0.0.1:3105
```

Substitute `hirearchy-interactions.mjs` or `hirearchy-detail-craft.mjs` for plans `102` and `103`.

---

## 6. Pre-Existing Asset Gaps (Not Caused By The Prune)

Tracked design documents cite asset paths that do not exist on disk. These were already missing before 2026-09-28 and belong to the discarded brand/hero asset direction; the prune did not remove them.

- 6 of the cited basenames are recorded in `hirearchy-asset-gaps.md` as `GAP 00`–`GAP 06`.
- 15 are **not** recorded anywhere, including `assets/approved/hirearchy-hero-evidence-spatial-composition.png`, which `hirearchy-implementation-acceptance.md` mandates, and the whole `assets/approved/hero-motion/` and `assets/rejected/` trees.

`docs/design/assets/approved/` currently holds only `hirearchy-mark.svg`. Reconciling the acceptance checklist against reality belongs to a later slice; it is recorded here so the mismatch is not rediscovered as a surprise.

---

## 7. Open Mismatch

`hirearchy-brand-tokens-vnext.md` mandates a `--hirearchy-*` token namespace and requires legacy tokens to be purged. The implementation in `apps/web/app/home.css` uses `--ct-*` tokens. Unresolved and unrecorded elsewhere.
