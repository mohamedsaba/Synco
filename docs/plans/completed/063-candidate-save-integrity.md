# 063 — Delimit Architecture Correction F03: Candidate Save Integrity

Status: completed.
Baseline: `0896d90a7b07e8572f0caa40392dab06d909e4b6` (correction/a1-a2).

## Objective

Correct architectural finding F03:

- Candidate writes can currently be lost, acknowledged incompletely, or bypassed when switching files, submitting, or when sandbox mirror persistence fails.

Strictly out of scope: F04 through F16 (except allowed A1/A2 documentation/test closeouts).

## Architectural Boundaries & Invariants

1. **Save Contract**:
   - A save operation is only considered successful when every authoritative and mirror write required for that operation has completed.
   - For single-file scenarios, this requires both durable SQLite persistence and container mirror synchronization.
   - If the sandbox mirror write fails, SQLite persistence is rolled back to the pre-save state (`current.workingContent`), an explicit error is thrown, and the API returns a factual failure (e.g. HTTP 503).
   - No silent divergence or stale execution state is tolerated.

2. **File Switching Invariant**:
   - The candidate must never transition away from an edited file if saving that file fails.
   - When a file switch is initiated on a dirty buffer, auto-save is attempted.
   - If save fails:
     - The editor content remains intact.
     - The selected file remains the current file.
     - The destination file is not loaded or displayed.
     - A factual failure message is displayed.
     - The candidate can explicitly retry saving or re-attempting the switch.
   - Duplicate concurrent switch requests during an in-flight operation are rejected via `isBusy`.

3. **Submission Gating**:
   - Submission must never proceed with unsaved or failed edits.
   - If the current buffer is dirty, saving is attempted first.
   - If save fails:
     - Submission is blocked.
     - The session remains `ACTIVE`.
     - Current edits remain preserved in the editor.
     - A factual message informs the candidate that edits could not be saved and the assessment was not submitted.
   - Final submission capture and closure semantics remain authoritative on the server.

4. **Concurrency & Same-Session Coordination**:
   - The server-side `SessionOperationCoordinator` serializes mutations per session across process boundaries.
   - The client coordinates UI operations locally with minimal, robust `isBusy` action locking, preventing duplicate requests and click storms.
