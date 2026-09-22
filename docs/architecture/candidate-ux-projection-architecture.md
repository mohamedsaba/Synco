# Candidate UX Projection Architecture

Status: Canonical Architecture (Slice C1)

## 1. Architectural Core Principles

The Delimit Candidate Experience must feel like a truthful, professional engineering environment. The client interface never maintains a parallel or competing state machine against the backend domain. Instead, the candidate interface is constructed as a deterministic projection over server truth, calibrated time, and ephemeral UI mode:

$$\text{Server Truth} + \text{Calibrated Time} + \text{Ephemeral UI Mode} \Longrightarrow \text{Candidate UX State}$$

## 2. State Classification & Ownership

Candidate state is strictly partitioned into three non-overlapping categories:

### 1. Server Authoritative

- **Ownership**: The backend domain service and SQLite store.
- **Examples**: `status` (`CREATED` | `ACTIVE` | `SUBMITTED`), `closureReason` (`candidate_submission` | `timeout` | `null`), `durationSeconds`, `activatedAt`, `submittedAt`, `deadline`, `serverTime`, persisted file content, command outcomes, AI interaction states.
- **Contract**: The client never stores a second mutable authoritative copy of these fields (e.g. `useState(session.status)` is forbidden). The client holds only the authoritative snapshot returned by server responses.

### 2. Derived Client Projection

- **Ownership**: The pure projection function (`projectCandidateExperience`).
- **Examples**: `remainingMs`, `isDeadlineReached`, `completionVariant`, `completionMessage`, `capabilities` (`canEdit`, `canRunCommands`, `canUseAi`, `canSubmit`, `canActivate`), and the derived `CandidateUxState`.
- **Contract**: Must be a pure projection without internal side effects.

### 3. Ephemeral UI State

- **Ownership**: Local React component state.
- **Examples**: Active orientation step, submission-review modal open/closed, panel drawer collapse, local unsaved editor text buffer, temporary in-flight network requests.
- **Contract**: Ephemeral UI state cannot mutate backend lifecycle or alter session durability.

## 3. Clock Calibration & Timekeeping

Browser system clocks are untrusted and susceptible to skew, user adjustment, or drift.

### Network Midpoint Calibration

When candidate requests complete, the client computes an offset:
$$\text{roundTripMs} = \text{responseReceivedAt} - \text{requestStartedAt}$$
$$\text{estimatedLocalAtResponse} = \text{requestStartedAt} + \frac{\text{roundTripMs}}{2}$$
$$\text{offsetMs} = \text{parsedServerTimeMs} - \text{estimatedLocalAtResponse}$$

Calibrated time is then:
$$\text{calibratedNow} = \text{Date.now()} + \text{offsetMs}$$

### Invariants

1. **Never Decrement as Counter**: Remaining time is strictly derived from $\max(0, \text{deadline} - \text{calibratedNow})$. No `remainingSeconds = remainingSeconds - 1`.
2. **Backgrounding & Sleep Resilient**: Tab throttling or laptop suspension naturally accounts for elapsed time upon waking because evaluation reads `Date.now()`.
3. **Clamping**: Derived `remainingMs` clamps at 0 and never returns negative values.
4. **Legacy Compatibility**: Untimed sessions (`durationSeconds = null`) have `deadline = null` and `remainingMs = null`; no countdown or artificial cutoff is fabricated.

## 4. Candidate UX State Projection Rules

The pure projection function maps inputs to canonical UX states:

| Durable Backend Status | Conditions / Ephemeral Mode                                                 | Projected Candidate UX State         | Capabilities                                           |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `CREATED`              | `uiMode = 'entry'` (default)                                                | `ENTRY`                              | No edit, no commands, no AI, activate enabled          |
| `CREATED`              | `uiMode = 'orientation'`                                                    | `ORIENTATION`                        | No edit, no commands, no AI, activate enabled          |
| `CREATED`              | `uiMode = 'ready_to_start'`                                                 | `READY_TO_START`                     | No edit, no commands, no AI, activate enabled          |
| `CREATED`              | `finalizationState = 'in_flight'` or `uiMode = 'provisioning'`              | `PROVISIONING`                       | All disabled, duplicate activate blocked               |
| `ACTIVE`               | $\text{calibratedNow} < \text{deadline}$ and `uiMode = 'workspace'`         | `ACTIVE_WORKSPACE`                   | Full edit, commands, AI, submit allowed                |
| `ACTIVE`               | $\text{calibratedNow} < \text{deadline}$ and `uiMode = 'submission_review'` | `SUBMISSION_REVIEW`                  | Edit paused for review, submit allowed, Back allowed   |
| `ACTIVE`               | $\text{calibratedNow} \ge \text{deadline}$                                  | `TIME_LIMIT_REACHED`                 | All mutations disabled; awaits sweeper convergence     |
| `ACTIVE`               | `finalizationState = 'in_flight'`                                           | `FINALIZING`                         | All mutations disabled; awaits server response         |
| `SUBMITTED`            | `closureReason = 'candidate_submission'`                                    | `COMPLETED` (`candidate_submission`) | Readonly; message: "Assessment submitted successfully" |
| `SUBMITTED`            | `closureReason = 'timeout'`                                                 | `COMPLETED` (`timeout`)              | Readonly; message: "Your assessment time has ended"    |
| Unknown / Corrupt      | Data missing or status invalid                                              | `UNKNOWN_OR_UNSUPPORTED`             | Safe fallback error display; all actions disabled      |

## 5. Deadline Presentation vs. Backend Authority

- **Presentation**: When $\text{calibratedNow} \ge \text{deadline}$, the candidate interface enters `TIME_LIMIT_REACHED`, disabling input fields and command forms to prevent confusing failed requests.
- **Authoritative Invariant**: Client deadline projection does **NOT** alter the durable backend status locally. The session remains `status = ACTIVE` until the shared finalization engine (via background timeout sweeper or admitted manual submit) transitions the database to `SUBMITTED`.
- **Server Guard**: The server transaction coordinator independently checks `now >= deadline` on every mutation request (HTTP 409 `SESSION_DEADLINE_EXCEEDED`).

## 6. Refresh Reconstruction

Upon browser refresh, the server renders the candidate route (`page.tsx`) with an authoritative snapshot containing `deadline` and `serverTime`. The client calculates clock calibration on receipt and projects the exact same UX state deterministically, ensuring seamless continuity.

## 7. C2 Candidate Pre-Start, Orientation, and Provisioning Architecture

Slice C2 establishes the candidate experience from first valid token load until the session transitions to `ACTIVE_WORKSPACE`.

### Pre-Start States & Invariants

Pre-active sessions (`status = 'CREATED'`) project deterministically across four canonical UX states:

- **ENTRY**: Landing experience establishing assessment identity, expected duration ("You'll have 60 minutes once the assessment begins"), and professional neutral framing.
- **ORIENTATION**: Single structured orientation presenting the factual information contract:
  1. Assessment duration (factual, no running countdown before activation)
  2. Tools available (file editor, terminal command console, integrated AI assistant if enabled, scenario brief)
  3. AI policy (permitted within environment, candidate remains responsible, neutral phrasing)
  4. Observable activity (all edits, commands, and AI prompts captured as technical evidence)
  5. Persistence (workspace saves persist, save failures surfaced immediately, Delimit manages infrastructure)
  6. Submission (may submit at any time, submission is final, review step provided before confirmation)
  7. Time expiry (modifications stop automatically upon timeout, Delimit finalizes automatically)
- **READY_TO_START**: Final confirmation reiterating that assessment time begins only after workspace setup completes. Prevents double-triggers while in-flight.
- **PROVISIONING**: Truthful platform state ("Preparing your assessment environment…") equipped with accessible live status semantics (`role="status"`, `aria-live="polite"`). Displays no countdown timer.

### Scenario Leakage Boundary

Candidate integrity requires that untimed candidates cannot gain an unfair advantage before assessment time begins.

- In `toCandidateSessionView`, when `session.status === 'CREATED'`, scenario-specific problem details (`brief`, `prompt`, `acceptanceCriteria`, `filePath`, `originalContent`) and `workingContent` are strictly redacted.
- Pre-active sessions receive only non-sensitive metadata (`id`, `title`, `version`, `durationSeconds`, `type`, `aiCapability`).
- Candidate mutation and workspace read endpoints (`/file`, `/workspace/file`, `/workspace/tree`, `/terminal/exec`, `/ai/interactions`) reject pre-active requests with HTTP 409 `SESSION_NOT_ACTIVE`.
- Full scenario requirements and workspace file content are delivered only once activation succeeds and `status` reaches `ACTIVE`.

### Provisioning Timing Boundary

Platform provisioning does **not** consume candidate assessment time:

1. Candidate confirms start.
2. Client projection enters `PROVISIONING`.
3. Backend readiness gate executes `sandboxAdapter.createAndVerify()`.
4. Only upon successful container readiness check is `this.store.activate(tokenHash, this.now())` executed.
5. `activatedAt` is established strictly after verification.
6. Assessment timer begins counting down only from this verified `activatedAt`.

### Activation Failure & Ambiguous-Response Reconciliation

- **Platform Failure**: If container creation or readiness check fails, the exception propagates before `store.activate` is called. The session remains in `CREATED` status with `activatedAt = null`. The failure is presented as a platform issue without blaming the candidate, and safe retry is permitted.
- **Ambiguous Network Recovery**: If the candidate clicks Start and the HTTP request or response drops due to network interruption:
  1. The client immediately issues a read query (`GET /api/candidate/sessions/[token]`) to fetch canonical server truth.
  2. If the server reports `ACTIVE`: the client transitions to `ACTIVE_WORKSPACE` without re-creating infrastructure or resetting `activatedAt`.
  3. If the server reports `CREATED`: the client surfaces the platform failure with safe retry.
  4. The client never infers durable state solely from a transport failure.
- **Idempotency**: Repeated activation requests on an already `ACTIVE` session safely return the existing session without re-creating sandboxes or modifying `activatedAt`.

### Refresh & Back Navigation

- **Refresh while CREATED**: Returns safely to the pre-start experience (`ENTRY`).
- **Refresh while ACTIVE**: Canonical server status wins; client projects directly into `ACTIVE_WORKSPACE`, completely bypassing pre-start screens.
- **Refresh while SUBMITTED**: Projects `COMPLETED` without reopening pre-start.
- **Browser Back**: Once a session reaches `ACTIVE`, server truth prevents reopening pre-start states.

### Accessibility Standards

- All pre-start flows are fully operable via keyboard with visible focus indicators.
- Semantic heading hierarchy (`<h1>`, `<h2>`) and landmark regions.
- Provisioning and error states use `role="status"` and `role="alert"` with `aria-live="polite"`.
- Animations and transitions respect `prefers-reduced-motion`.
- Upon transitioning from `PROVISIONING` to `ACTIVE_WORKSPACE`, focus is programmatically moved to the primary workspace heading (`tabIndex={-1}`) without surprising jumping.

## 8. C4 Editor Persistence

The editor retains a local content buffer and a separate baseline of the exact
content confirmed by the save response. The client derives `SAVED`, `DIRTY`,
`SAVING`, and `SAVE_FAILED` from those values and the active save request; it
does not create another session lifecycle.

- A save serializes in the browser. Its request captures one file and content
  snapshot. A response advances only the persisted baseline for that snapshot.
- If the candidate types while a save is in flight, newer content remains
  `DIRTY`; an older response cannot mark it as saved or replace it.
- A failed save keeps the editor buffer, retains dirty truth, and gives an
  accessible factual retry message. Browser refresh does not preserve unsaved
  text.
- Dirty file switches and manual submission save first. If a save fails, or
  newer edits remain after it, the switch or submission does not proceed.
- Server mutation authority remains unchanged: active-session and deadline
  checks are still enforced by existing routes and `SessionService`.

## 9. Deferred Work

The following areas are explicitly deferred to future slices:

- **C6**: Integrated AI experience redesign.
- **C8**: Submission review modal and completion screens.
- **Practice Environment**: Interactive sandbox tutorial/playground.

## 10. C5 Commands

Commands uses the existing one-request execution endpoint. The browser creates
one local history entry before each admitted request and updates that same entry
on completion or failure. History is chronological by request start and remains
mounted with the C3 workspace surface; results never replace an earlier entry.

The server remains authoritative for command outcomes. A valid response carries
the command ID, exit code (which may be null), timeout flag, duration, separate
stdout/stderr previews and byte/truncation facts. The client presents timeout,
non-zero completion, and failure to run as distinct outcomes. It validates the
response shape; a malformed response is a platform error, not a command result.

Only one browser command request is in flight at a time. The existing server
session coordinator still serializes operations and independently enforces
ACTIVE status, request-bound deadline admission, and remaining runtime. The
client sends no cancellation request, has no PTY semantics, and does not alter
editor persistence state.

History and command text are local UI state. They survive workspace panel
navigation but do not survive a browser refresh. C5 adds no browser storage or
backend API changes. Output is labeled standard output or standard error and is
not placed in a live output region; only the brief running status uses status
semantics.
