# 088 — Dead evaluator code and CSS pruning

## Scope

Remove only evaluator v1 modules and stylesheet selectors proven unreachable
after the accepted E1–E6 evaluator implementation. No live evaluator behavior,
role-depth projection, reconstruction, authorization, Candidate code, or E6
override ordering changed.

## Dead modules removed

| Module                          | Production references before | Test references before | Route references before | Proof                                                        |
| ------------------------------- | ---------------------------: | ---------------------: | ----------------------: | ------------------------------------------------------------ |
| `reconstruction-panel.tsx`      |                            0 |                      1 |                       0 | Only the obsolete rendering test imported it.                |
| `scenario-context.tsx`          |                            0 |                      1 |                       0 | Only the obsolete rendering test imported it.                |
| `summary-lifecycle-control.tsx` |                            1 |                      1 |                       0 | Its sole production importer was dead `ReconstructionPanel`. |
| `evidence-disclosure.tsx`       |                            2 |                      1 |                       0 | Both production importers were dead v1 modules.              |

After removal, production and test reference counts are zero for all four
component symbols. There are no dynamic evaluator component imports or barrel
exports. `/evaluator` reaches access/discovery components; `/evaluator/sessions/[sessionId]`
reaches `EvaluatorExperience`, its v2 hierarchy, `RecordedActivity`,
`SubmittedWork`, `EngineerEvidenceWorkspace`, `TechnicalRecord`, and their
live dependencies.

## CSS pruning

Removed selectors matched only classes emitted by the deleted modules, or no
production class generation at all:

- v1 header/context strip: `review-header*`, `review-context-strip*`;
- v1 scenario evidence grid and policy: `scenario-area*`,
  `scenario-guidance-grid*`, `review-policy`, `not-observed-copy`;
- v1 reconstruction timeline and state: `summary-section`,
  `summary-timeline*`, `summary-milestone*`, `milestone-*`, `summary-state*`,
  `review-action`;
- v1 supporting disclosure: `supporting-activity-*`, `disclosure-count`;
- unreferenced `capture-limitation-notice*`.

Shared selector groups were narrowed rather than removed when their live part
remains in E1–E6. Candidate production source has no reference to any removed
class. Live selectors, including `review-section`, `scenario-context`,
`review-disclosure`, activity, diff, technical-record, loading, and all E6
scoped overrides, remain. Cascade/specificity reconciliation is deferred to G3.

## Test update and verification

Removed obsolete rendering assertions for the deleted v1 components. Kept the
current diff, technical-record, accessibility, v2 rendering, role-depth,
Engineer workspace, AI rendering, discovery, and Candidate workspace coverage.

Focused verification passed: 8 files, 81 tests. Required final quality gates
and one full `npm run verify` run are recorded with the completion commit.
