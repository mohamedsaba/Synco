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

## 7. Explicit C2 Provisioning Boundary

Slice C1 implements only the projection state primitives (`PROVISIONING` UX state and in-flight tracking). It explicitly defers:

- Pre-start briefing and orientation screens.
- Container warm-up / pre-provisioning semantics before timing activation.
- The exact provisioning/start boundary orchestration.

These belong strictly to Slice C2.
