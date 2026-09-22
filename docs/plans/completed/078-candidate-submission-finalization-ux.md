# C8 Candidate Submission Finalization UX

## Scope

Candidate submission review, finalization, completion, and ambiguous-response
reconciliation only. C8A finality architecture, backend APIs, schema, and
durable lifecycle remain unchanged.

## Implementation

- Review is ephemeral `submission_review` UI state. It does not persist and
  does not mutate server state when opened.
- The review preserves mounted workspace state. Back restores the existing
  workspace only when canonical projection still permits it.
- Final submission reuses C4 save certainty. Dirty content saves first; save
  failures and newer edits block submit.
- A final submit disables repeat dispatch and projects local finalizing only
  while awaiting authoritative truth. It never fabricates `SUBMITTED`.
- A failed or lost submit response triggers `GET /api/candidate/sessions/[token]`.
  Server `ACTIVE + null` resumes only through canonical projection;
  `ACTIVE + closureReason` is finalizing; `SUBMITTED` is terminal. Failed
  reconciliation remains fail-closed.
- Finalizing and terminal completion are distinct surfaces. Completion wording
  uses authoritative `closureReason`, not local click history. Terminal
  surfaces omit mutable workspace controls and the active timer.

## Accessibility baseline

Review and terminal surfaces use semantic headings and keyboard buttons.
Review, finalizing, and completion heading focus moves once per transition;
repeated timing refreshes do not re-focus it.

## Verification

Focused projection, workspace shell, persistence, and timing-sync tests cover
review projection, C4 save guards, authoritative ambiguous reconciliation,
C8A monotonicity, finalizing, and manual/timeout terminal rendering. Broader
candidate/finality and repository gates are recorded with the implementation
run.

## Deferred

C9 full accessibility/responsive hardening and C10 visual polish.
