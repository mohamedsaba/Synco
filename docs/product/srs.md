**SOFTWARE REQUIREMENTS<br />
SPECIFICATION**

**Hirearchy**

**Engineering Assessment Product**

Working product name: Hirearchy Software

| **Document** | Software Requirements Specification (SRS) |
| ------------ | ----------------------------------------- |
| **Version**  | 1.0                                       |
| **Status**   | Prototype / MVP Baseline                  |
| **Date**     | 14 September 2026                         |
| **Owner**    | Hirearchy                                 |

**Baseline principle**

_Real work produces evidence. The system captures and reconstructs that evidence; the human evaluator owns the judgment._

# Document Control

| **Version** | **Date**    | **Status** | **Description**                                                             |
| ----------- | ----------- | ---------- | --------------------------------------------------------------------------- |
| 1.0         | 14 Sep 2026 | Baseline   | Initial SRS based on the settled product structure and prototype decisions. |

This document is the engineering baseline for the first product. It intentionally excludes unvalidated scoring, ranking, ATS integrations, broad scenario libraries, enterprise administration, and future AI-judgment capabilities.

# Table of Contents

1\. Introduction

2\. Product Overview

3\. Stakeholders and User Classes

4\. Product Principles and Constraints

5\. System Context and Architecture

6\. Functional Requirements

7\. Candidate Workspace Requirements

8\. Session Capture and Event Model

9\. AI Assistant Requirements

10\. Reconstruction and Evaluator Review

11\. Scenario Requirements

12\. Data Requirements

13\. External Interface Requirements

14\. Non-Functional Requirements

15\. Security and Sandbox Requirements

16\. Privacy, Auditability, and Explainability

17\. Error Handling and Recovery

18\. MVP Scope and Explicit Non-Goals

19\. Acceptance Criteria and Verification

20\. Risks and Open Questions

Appendix A. Core Data Objects

Appendix B. Event Taxonomy

Appendix C. Prototype Scenario Baseline

Appendix D. Traceability Matrix

# 1. Introduction

## 1.1 Purpose

This SRS specifies the requirements for Hirearchy's first engineering-assessment product, currently referred to as Hirearchy Software. The product allows a candidate to perform a realistic engineering incident inside a controlled workspace containing a code editor, terminal, tests, and an AI assistant. The system captures observable work events and reconstructs the session into a compact, auditable account for a human evaluator.

## 1.2 Product Intent

The product is designed to improve the evidence available to hiring teams. It does not claim to infer candidate competence directly, produce a proprietary intelligence score, or replace human hiring judgment. Its core purpose is to make the candidate's working process inspectable without relying on webcam surveillance, trivia-heavy interviews, or simplistic AI-use policies.

## 1.3 Scope

- One realistic, self-contained engineering incident per assessment session.

- A controlled candidate workspace with editor, terminal, repository, tests, and AI assistant.

- Structured capture of observable in-environment actions.

- Session artifacts including code changes, terminal activity, tests, AI interactions, timestamps, and final state.

- An evidence-grounded reconstruction of the session in chronological order.

- A minimal evaluator review experience that supports human decision-making.

## 1.4 Out of Scope for Version 1.0

- Automatic candidate ranking or recommendation.

- Composite candidate scores or competence scores.

- Validated AI-judgment dimensions or psychometric claims.

- Webcam, biometric, room-scan, or whole-device surveillance.

- Automatic inference that manually typed code was copied from or inspired by AI.

- ATS integrations, broad enterprise permissions, or large scenario marketplaces.

- Multi-stack or multi-role scenario coverage beyond the prototype scope.

## 1.5 Definitions

| **Term**           | **Definition**                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Assessment Session | A bounded candidate work period associated with one scenario and one isolated workspace.                                         |
| Scenario           | A realistic engineering incident containing a task brief, repository state, tests, logs, and acceptance criteria.                |
| Raw Event          | An directly observable event emitted by the controlled environment, such as a command, file change, test run, or AI message.     |
| Derived Signal     | A deterministic relationship computed from raw events, such as elapsed time between an explicit AI insert and the next test run. |
| Reconstruction     | A chronological, evidence-grounded representation of what happened during the session.                                           |
| Evaluator          | A human reviewer who reads the reconstruction and makes or supports a hiring decision.                                           |
| Task Outcome       | A factual description of the resulting software behavior; distinct from test outcome and evaluator decision.                     |
| Test Outcome       | The observed result of one or more automated tests.                                                                              |
| Evaluator Decision | A human-recorded decision such as advance, reject, or needs further review.                                                      |

# 2. Product Overview

## 2.1 Product Thesis

Give a candidate a realistic engineering incident in a controlled environment, capture the work faithfully, and make the resulting process legible to an evaluator. The system creates evidence; it does not manufacture certainty.

## 2.2 Core End-to-End Flow

1.  An assessment session is created from a configured scenario.

2.  A candidate receives access to the session and reads the task brief.

3.  The candidate enters an isolated workspace containing the repository, editor, terminal, test tooling, and AI assistant.

4.  The candidate investigates and modifies the system until they submit or the time limit expires.

5.  The platform records supported raw events and session artifacts.

6.  The platform produces an evidence-grounded chronological reconstruction.

7.  The evaluator reviews the reconstruction and underlying artifacts.

8.  The evaluator records their own decision; the platform does not infer it.

## 2.3 Success Condition for the Prototype

The prototype is successful if a skeptical engineering evaluator can inspect one completed session in minutes, understand the important sequence of investigation and decisions, verify the reconstruction against raw evidence, and conclude that the system provides materially better decision material than a final-code-only take-home or a conventional interview transcript.

# 3. Stakeholders and User Classes

| **User / Stakeholder**           | **Primary Need**                                                               | **System Interaction**                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Candidate                        | A fair, realistic task with real tools and clear boundaries.                   | Reads brief, works in sandbox, uses editor/terminal/AI, submits.                                               |
| Engineering Evaluator            | Understand how the candidate worked, not merely whether a visible test passed. | Reads reconstruction, expands evidence, inspects diff/log as needed, records decision.                         |
| Talent / HR                      | A scalable process with legible output and defensible evidence.                | Tracks completion and views human-readable session output; does not need to interpret raw code for normal use. |
| Scenario Author                  | Create realistic incidents that surface judgment without tricks.               | Defines repository, task brief, acceptance criteria, tests, logs, and expected environment.                    |
| System Administrator / Developer | Operate prototype safely and reliably.                                         | Manages scenarios, sessions, sandbox limits, logs, failures, and technical configuration.                      |

# 4. Product Principles and Constraints

| **ID** | **Principle**                     | **Constraint**                                                                                                                 |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P-01   | Evidence before judgment          | The platform shall prefer observable events and inspectable artifacts over inferred competence claims.                         |
| P-02   | Outcome is not decision           | Task outcome, test outcome, acceptance criteria, evaluator decision, and candidate competence shall remain separate concepts.  |
| P-03   | AI is allowed, not privileged     | Candidates may use the provided AI assistant; usage level shall not automatically increase or reduce a candidate's evaluation. |
| P-04   | No invisible-state claims         | The platform shall not claim to know intent, mental state, authorship influence, or AI adoption unless directly observable.    |
| P-05   | Chronology is factual structure   | Reconstruction shall preserve event order because sequence is necessary to understand the work.                                |
| P-06   | Scenario creates the signal       | Assessment quality depends primarily on scenario design, not on adding more metrics.                                           |
| P-07   | Human evaluator owns the decision | The first product shall not silently convert evidence into a hiring verdict.                                                   |

# 5. System Context and Architecture

## 5.1 Logical Components

- Candidate Web Client — task brief, editor, terminal, AI panel, timer, submission controls, and local event instrumentation.

- Application API — session lifecycle, scenario delivery, authentication, event ingestion, artifact metadata, and evaluator access.

- Sandbox Manager — creates and destroys isolated candidate execution environments.

- Sandbox Runtime — repository, dependencies, shell, tests, and restricted network/file access.

- AI Gateway — sends candidate requests to the configured model and logs request/response metadata.

- Event Store — append-only storage for structured raw events.

- Artifact Store — final repository snapshot/diff and other large session outputs.

- Reconstruction Service — converts events into a concise chronological reconstruction while preserving evidence references.

- Evaluator Web Client — displays the reconstruction and supports expansion into underlying evidence.

## 5.2 Recommended Prototype Topology

The prototype should remain a single deployable application or modular monolith where practical. Candidate and evaluator experiences may be implemented as separate routes within one web application. Sandbox execution should remain isolated as a distinct runtime boundary. Production microservices are not required for the MVP.

# 6. Functional Requirements

## 6.1 Scenario and Session Lifecycle

**FR-001 — Create assessment session.** The system shall create a session from a specific scenario version and associate it with a candidate identifier, start state, time budget, and session status.

> Priority: MUST \| Verification: Inspection/Test

**FR-002 — Immutable scenario version.** Once a candidate session starts, the scenario version bound to that session shall not change.

> Priority: MUST \| Verification: Inspection/Test

**FR-003 — Candidate session states.** Candidate-session state shall remain independent of derived reconstruction status. The durable candidate-session lifecycle is CREATED -> ACTIVE -> SUBMITTED. There is no durable EXPIRED or FINALIZING state; timeout closure is represented as SUBMITTED with closureReason = 'timeout', while manual candidate submission is represented as SUBMITTED with closureReason = 'candidate_submission'. `SUBMITTED` means authoritative final evidence is durably frozen, candidate mutation is closed, and candidate-session completion is finalized. Reconstruction shall use a separate derived-artifact lifecycle with PENDING, AVAILABLE, and FAILED persisted statuses; eligibility without a persisted attempt may be presented as NOT_STARTED. Reconstruction failure or retry shall not reopen or change a submitted candidate session.

> Priority: MUST \| Verification: Inspection/Test

**FR-004 — Start control.** A candidate shall explicitly start the active assessment period after viewing the task brief and environment readiness state.

> Priority: MUST \| Verification: Inspection/Test

**FR-005 — Time budget.** The system shall track the configured session duration and expose remaining time to the candidate.

> Priority: MUST \| Verification: Inspection/Test

**FR-006 — Submission.** The candidate shall be able to submit before timeout. Submission shall freeze the final session artifacts and transition the workspace to a non-editable state.

> Priority: MUST \| Verification: Inspection/Test

**FR-007 — Timeout.** At timeout, the system shall stop further candidate mutation, preserve available artifacts, and transition the session to SUBMITTED with closureReason = 'timeout'.

> Priority: MUST \| Verification: Inspection/Test

**FR-008 — Environment readiness.** The platform shall not start the candidate timer until the sandbox has passed a readiness check.

> Priority: MUST \| Verification: Inspection/Test

## 6.2 Candidate Access

**FR-009 — Candidate session access.** A candidate shall access only the assessment session issued to them.

> Priority: MUST \| Verification: Inspection/Test

**FR-010 — Task brief.** The candidate shall be shown the incident description, acceptance criteria, time limit, permitted tools, and capture/privacy notice before work begins.

> Priority: MUST \| Verification: Inspection/Test

**FR-011 — No forced AI use.** The platform shall make the AI assistant available but shall not require the candidate to use it.

> Priority: MUST \| Verification: Inspection/Test

**FR-012 — No external surveillance.** The product shall not require webcam, microphone, room scan, biometric monitoring, or full-device screen recording for the MVP.

> Priority: MUST \| Verification: Inspection

## 6.3 Workspace

**FR-013 — Editor.** The workspace shall provide a code editor capable of opening, editing, and saving files in the candidate repository.

> Priority: MUST \| Verification: Inspection/Test

**FR-014 — File tree.** The workspace shall expose the files intended to be available for the scenario.

> Priority: MUST \| Verification: Inspection/Test

**FR-015 — Terminal.** The workspace shall provide an interactive terminal connected to the isolated sandbox.

> Priority: MUST \| Verification: Inspection/Test

**FR-016 — Command execution.** The candidate shall be able to run scenario-supported commands, tests, and local application processes subject to sandbox restrictions.

> Priority: MUST \| Verification: Inspection/Test

**FR-017 — Repository persistence.** Candidate file changes shall persist for the duration of the assessment session.

> Priority: MUST \| Verification: Inspection/Test

**FR-018 — Final repository snapshot.** At submission or timeout, the system shall preserve a final repository snapshot or deterministic diff against the scenario baseline.

> Priority: MUST \| Verification: Inspection/Test

**FR-019 — Test execution.** The candidate shall be able to execute the repository's provided test suite from the terminal or supported test action.

> Priority: MUST \| Verification: Inspection/Test

**FR-020 — Test result capture.** The platform shall capture test command, exit status, and available output as raw evidence.

> Priority: MUST \| Verification: Inspection/Test

## 6.4 AI Assistant

**FR-021 — Candidate AI chat.** The workspace shall provide an AI assistant within the assessment environment.

> Priority: MUST \| Verification: Inspection/Test

**FR-022 — AI request logging.** The system shall record each AI prompt sent through the platform with timestamp, session identifier, and message identifier.

> Priority: MUST \| Verification: Inspection/Test

**FR-023 — AI response logging.** The system shall record each AI response returned through the platform with timestamp and correlation to the originating prompt.

> Priority: MUST \| Verification: Inspection/Test

**FR-024 — Explicit context.** The candidate interface should make it clear what code or files are explicitly supplied to the AI for a given request.

> Priority: MUST \| Verification: Inspection/Test

**FR-025 — Explicit insert.** If the product offers an 'insert/apply' AI action, the system shall log the exact AI response or code fragment explicitly inserted into the editor.

> Priority: MUST \| Verification: Inspection/Test

**FR-026 — No implicit AI adoption claim.** The system shall not infer that manually typed candidate code was accepted from, copied from, or inspired by AI merely because it resembles an AI response.

> Priority: MUST \| Verification: Inspection

**FR-027 — No autonomous agent required.** The MVP AI assistant shall not require autonomous shell execution or unrestricted repository mutation. Candidate-mediated actions are sufficient.

> Priority: SHOULD \| Verification: Inspection/Test

## 6.5 Event Capture

**FR-028 — Append-only event stream.** The system shall persist supported session events in append-only form with event ID, session ID, event type, timestamp, sequence number, and payload.

> Priority: MUST \| Verification: Inspection/Test

**FR-029 — File events.** The platform shall capture supported file open and file change events sufficient to reconstruct meaningful repository activity.

> Priority: MUST \| Verification: Inspection/Test

**FR-030 — Terminal events.** The platform shall capture terminal command lifecycle and available command output without relying solely on client-side inference.

> Priority: MUST \| Verification: Inspection/Test

**FR-031 — Test events.** The platform shall distinguish recognized test runs from generic terminal commands when feasible.

> Priority: MUST \| Verification: Inspection/Test

**FR-032 — AI events.** The platform shall capture prompt, response, and explicit AI insertion events.

> Priority: MUST \| Verification: Inspection/Test

**FR-033 — Submission boundary.** The platform shall persist a submission or timeout finalization boundary marking the end of candidate work.

> Priority: MUST \| Verification: Inspection/Test

**FR-034 — Clock ordering.** Events shall include a monotonic session sequence number so chronological order remains stable even when timestamps are equal or client clocks differ.

> Priority: MUST \| Verification: Inspection/Test

**FR-035 — Event provenance.** Each event shall identify whether it originated from the client, application server, sandbox, AI gateway, or reconstruction service.

> Priority: MUST \| Verification: Inspection/Test

**FR-036 — Capture transparency.** The candidate-facing product shall state which in-environment activities are recorded.

> Priority: MUST \| Verification: Inspection/Test

## 6.6 Reconstruction

**FR-037 — Chronological reconstruction.** The system shall produce a session reconstruction that preserves the order of material events.

> Priority: MUST \| Verification: Inspection/Test

**FR-038 — Evidence references.** Each generated interpretive sentence or annotation in the reconstruction shall reference one or more source event IDs or artifact locations.

> Priority: MUST \| Verification: Inspection/Test

**FR-039 — No unsupported claim.** The reconstruction service shall not emit a factual claim that cannot be traced to stored evidence.

> Priority: MUST \| Verification: Inspection/Test

**FR-040 — Evidence-first rendering.** The evaluator view shall prioritize raw or lightly transformed evidence, using generated prose primarily as connective or compressive text.

> Priority: MUST \| Verification: Inspection/Test

**FR-041 — Expandable detail.** The evaluator shall be able to expand summarized reconstruction items to inspect underlying AI messages, diffs, commands, tests, or event details where available.

> Priority: MUST \| Verification: Inspection/Test

**FR-042 — Full evidence access.** An authorized evaluator shall be able to access the full session event record and final code artifact for verification.

> Priority: MUST \| Verification: Inspection/Test

**FR-043 — Regeneration.** The system may regenerate a reconstruction from the application-recorded append-only event stream without changing raw events through the repository API.

> Priority: MUST \| Verification: Inspection/Test

**FR-044 — Reconstruction version.** Each generated reconstruction shall record the reconstruction version, model/provider identifier where applicable, creation time, and source event range.

> Priority: MUST \| Verification: Inspection/Test

## 6.7 Evaluator Review

**FR-045 — Single reconstruction experience.** The primary evaluator experience shall be one continuous session reconstruction rather than separate dashboard tabs for narrative, evidence, diff, and log.

> Priority: MUST \| Verification: Inspection/Test

**FR-046 — Task/test facts.** The evaluator view shall clearly distinguish test results and task-related observations from evaluator decisions.

> Priority: MUST \| Verification: Inspection/Test

**FR-047 — Final diff.** The evaluator shall be able to inspect the final code diff against the scenario baseline.

> Priority: MUST \| Verification: Inspection/Test

**FR-048 — Evaluator decision.** The system may allow an authorized evaluator to record an explicit decision such as ADVANCE, REJECT, or FURTHER_REVIEW; the decision shall be stored as a human action.

> Priority: MUST \| Verification: Inspection/Test

**FR-049 — No automatic verdict.** The platform shall not automatically set a candidate decision from tests, task outcome, AI usage, or reconstruction content.

> Priority: MUST \| Verification: Inspection

**FR-050 — No competence field.** The MVP data model shall not include a system-generated candidate competence score or competence label.

> Priority: MUST \| Verification: Inspection

# 7. Candidate Workspace Requirements

| **Area**      | **Requirement**                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task brief    | Concise incident/ticket description, explicit acceptance criteria, duration, tools available, and capture notice.                                       |
| Editor        | Repository navigation, syntax support, save behavior, and usable diff-producing edits.                                                                  |
| Terminal      | Interactive shell with repository working directory and scenario-specific toolchain available.                                                          |
| Tests         | Candidate can execute relevant test commands; output appears in terminal and is captured.                                                               |
| AI            | Integrated assistant with visible prompt/response history for the active session.                                                                       |
| Timer         | Visible remaining time after the session begins.                                                                                                        |
| Submission    | Deliberate submit action plus timeout handling.                                                                                                         |
| Failure state | If the environment fails for platform reasons, candidate work is preserved where possible and the session is not silently treated as candidate failure. |

The candidate workspace should feel like a working environment, not a questionnaire. The platform shall avoid inserting artificial instrumentation that changes the engineering task merely to create metrics.

# 8. Session Capture and Event Model

## 8.1 Minimum Raw Event Types

| **Event Type**        | **Minimum Payload**                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------- |
| SESSION_STARTED       | session_id, scenario_version, started_at                                                    |
| FILE_OPENED           | path                                                                                        |
| FILE_CHANGED          | path, change reference or diff reference                                                    |
| COMMAND_STARTED       | command_id, command, cwd                                                                    |
| COMMAND_FINISHED      | command_id, exit_code, output_ref, duration                                                 |
| TEST_RUN              | command_id or test_run_id, framework if known, result summary                               |
| AI_REQUEST_STARTED    | interactionId, clientRequestId, provider, model, prompt, candidateContext, hirearchyContext |
| AI_RESPONSE_COMPLETED | interactionId, provider, model, promptTokens, completionTokens, durationMs, responseExcerpt |
| AI_REQUEST_CANCELLED  | interactionId, reason, cancelledAt                                                          |
| AI_REQUEST_FAILED     | interactionId, errorCode, errorMessage, failedAt                                            |
| AI_PROMPT_SENT        | (Legacy conceptual) message_id, text/context refs                                           |
| AI_RESPONSE_RECEIVED  | (Legacy conceptual) message_id, parent prompt id, response text/ref                         |
| AI_CONTENT_INSERTED   | (Deferred) message_id, target path/location, inserted content/ref                           |
| SESSION_SUBMITTED     | submitted_at                                                                                |

## 8.2 Permitted Derived Signals

Derived signals may be used when they are deterministic transformations or correlations of observable events. They shall not be presented as competence scores.

- Elapsed time from session start to first test run.

- Count of test runs and recognized test outcomes.

- Whether a test run occurred after an explicit AI insertion.

- Whether an explicitly AI-inserted change was later edited or reverted, where deterministically observable.

- Files opened or modified before and after selected events.

- Elapsed time between material events.

Derived signals such as 'verified AI correctly' or 'showed strong judgment' are not permitted as factual system outputs in the MVP.

# 9. AI Assistant Requirements

## 9.1 Candidate AI

The candidate AI is treated as a normal tool in the workspace. The system is interested in preserving the interaction, not in rewarding or punishing the amount of AI usage.

## 9.2 Reconstruction AI

**AIR-001 — Grounded input.** The reconstruction model shall receive a bounded, structured representation of source events and artifacts.

> Priority: MUST \| Verification: Inspection/Test

**AIR-002 — Evidence-cited output.** Generated annotations shall include machine-readable evidence references.

> Priority: MUST \| Verification: Inspection/Test

**AIR-003 — No candidate scoring.** The reconstruction model shall not output candidate rankings, competence percentages, or hiring recommendations.

> Priority: MUST \| Verification: Inspection/Test

**AIR-004 — Model failure fallback.** If reconstruction generation fails, the evaluator shall still be able to access raw chronological evidence.

> Priority: MUST \| Verification: Inspection/Test

**AIR-005 — Prompt/version audit.** The system shall retain a version identifier for reconstruction prompts/templates used to create each reconstruction.

> Priority: SHOULD \| Verification: Inspection/Test

# 10. Reconstruction and Evaluator Review

## 10.1 Information Hierarchy

9.  Scenario/task context.

10. Observed task/test outcome facts.

11. Chronological reconstruction of material work.

12. Inline expandable evidence such as AI exchange, command output, code diff, or test result.

13. Final repository diff.

14. Full raw event record for audit.

15. Human evaluator decision, if recorded.

## 10.2 Design Constraint

The reconstruction is one object at multiple levels of detail, not several independent dashboards. Chronological ordering is mandatory because the meaning of investigation, correction, and verification depends on sequence.

## 10.3 Example Reconstruction Item

| 09:14 | TEST RUN — test_stock_reflects_recent_restock → FAIL       |
| ----- | ---------------------------------------------------------- |
| 09:16 | AI — Candidate asks why a restocked item can remain stale. |
| 09:17 | CODE CHANGE — CACHE_TTL changed from 300 to 10.            |
| 09:20 | FILE OPENED — cache.py                                     |

Optional grounded annotation: “Candidate continued investigating after the visible test passed.” Evidence references must point to the relevant events.

# 11. Scenario Requirements

**SCN-001 — Real-world incident.** A scenario shall model a recognizable class of engineering work or production failure rather than an algorithm riddle disguised as a ticket.

> Priority: MUST \| Verification: Inspection/Test

**SCN-002 — Fairness.** A competent candidate shall be able to solve or meaningfully investigate the scenario within the stated time using only provided resources and allowed tools.

> Priority: MUST \| Verification: Inspection/Test

**SCN-003 — Useful ambiguity.** Ambiguity should concern root cause or technical tradeoffs, not ambiguity about what the task itself requires.

> Priority: MUST \| Verification: Inspection/Test

**SCN-004 — No planted metric traps.** A scenario shall not include misleading artifacts whose only purpose is to generate a metric or catch a candidate.

> Priority: MUST \| Verification: Review

**SCN-005 — Multiple legitimate paths.** The scenario should permit more than one defensible investigation or implementation path.

> Priority: MUST \| Verification: Inspection/Test

**SCN-006 — No obscure trivia dependency.** Success shall not depend primarily on memorizing obscure framework syntax or undocumented internal conventions.

> Priority: MUST \| Verification: Inspection/Test

**SCN-007 — Observable fork.** The scenario should naturally contain at least one plausible point where shallow symptom-fixing and deeper root-cause investigation diverge.

> Priority: MUST \| Verification: Inspection/Test

**SCN-008 — Stable baseline.** Scenario repositories, dependencies, tests, and seed data shall be versioned and reproducible.

> Priority: MUST \| Verification: Inspection/Test

**SCN-009 — Acceptance criteria.** Each scenario shall state candidate-visible acceptance criteria separately from hidden evaluator context, if any.

> Priority: MUST \| Verification: Inspection/Test

**SCN-010 — Authoring rationale.** Scenario metadata should document the engineering behavior the scenario is intended to make observable without defining one mandatory workflow.

> Priority: SHOULD \| Verification: Inspection/Test

# 12. Data Requirements

## 12.1 Core Entities

| **Entity**        | **Purpose**                                         | **Key Fields**                                                                                 |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scenario          | Versioned assessment definition.                    | id, version, title, brief, time_limit, repository_ref, acceptance_criteria, environment_config |
| Candidate         | Minimal identity/reference for the assessment.      | id, external_ref/name/email only if required by deployment                                     |
| Session           | One candidate attempt against one scenario version. | id, candidate_id, scenario_id/version, status, start/end, decision                             |
| Event             | Append-only record of an observable session event.  | id, session_id, seq, type, occurred_at, source, payload/ref                                    |
| Artifact          | Large or immutable session output.                  | id, session_id, type, storage_ref, checksum, created_at                                        |
| Reconstruction    | Generated evidence-grounded representation.         | id, session_id, version, model/prompt version, content, evidence_refs                          |
| EvaluatorDecision | Explicit human decision.                            | id, session_id, evaluator_id, decision, note, timestamp                                        |

## 12.2 Data Integrity

**DR-001 — Event immutability.** Stored raw events shall not be edited in place after ingestion. Corrections, if required, shall be represented as additional system events or administrative audit records.

> Priority: MUST \| Verification: Inspection/Test

**DR-002 — Artifact checksum.** Final code artifacts and other immutable session artifacts should include a checksum for integrity verification.

> Priority: SHOULD \| Verification: Inspection/Test

**DR-003 — Evidence referential integrity.** Evidence references in reconstructions shall resolve to valid events or artifacts in the same session.

> Priority: MUST \| Verification: Inspection/Test

**DR-004 — Scenario/session binding.** A session shall retain the exact scenario version used for the attempt.

> Priority: MUST \| Verification: Inspection/Test

**DR-005 — Human decision provenance.** Evaluator decisions shall include evaluator identity/reference and timestamp.

> Priority: MUST \| Verification: Inspection/Test

# 13. External Interface Requirements

## 13.1 User Interfaces

- Candidate task brief route.

- Candidate workspace route.

- Submission/completion state.

- Evaluator session-selection view (plain list is acceptable for MVP).

- Evaluator reconstruction route.

## 13.2 Sandbox Interface

- Create environment from versioned scenario image or reproducible build definition.

- Attach interactive terminal.

- Read/write permitted repository files.

- Execute commands under configured limits.

- Stream terminal output.

- Snapshot final repository state.

- Terminate environment deterministically.

## 13.3 AI Provider Interface

- Stream or return candidate chat responses.

- Accept explicit context supplied by the product.

- Return provider/model metadata required for audit.

- Support a separate reconstruction-generation call or workflow.

## 13.4 No Required Third-Party Integrations for MVP

ATS, calendar, identity-provider SSO, HRIS, and external code-host integrations are explicitly deferred.

# 14. Non-Functional Requirements

| **ID**  | **Category**                | **Requirement**                                                                                                                                                          | **Priority** |
| ------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| NFR-001 | Availability                | A platform failure during an active session shall be distinguishable from candidate behavior and shall not silently produce a negative candidate outcome.                | MUST         |
| NFR-002 | Workspace readiness         | A sandbox should become ready within a target suitable for a prototype experience; target baseline: ≤ 30 seconds for prebuilt scenarios.                                 | SHOULD       |
| NFR-003 | Terminal latency            | Interactive terminal echo and output should feel responsive under normal network conditions; target median round-trip interaction \< 250 ms excluding command execution. | SHOULD       |
| NFR-004 | Event durability            | Accepted server-side events shall be durably persisted before they are acknowledged where practical.                                                                     | MUST         |
| NFR-005 | Ordering                    | The platform shall preserve deterministic event sequence independent of client wall-clock drift.                                                                         | MUST         |
| NFR-006 | Reconstruction auditability | A reviewer shall be able to trace generated annotations to source evidence.                                                                                              | MUST         |
| NFR-007 | Accessibility               | Candidate and evaluator web interfaces should target WCAG 2.2 AA for keyboard navigation, contrast, semantics, and focus behavior.                                       | SHOULD       |
| NFR-008 | Browser support             | The MVP should support current stable Chromium-based desktop browsers; wider browser support may follow.                                                                 | SHOULD       |
| NFR-009 | Maintainability             | Scenario, session, event, AI, reconstruction, and sandbox concerns shall remain modular even if deployed as one application.                                             | SHOULD       |
| NFR-010 | Observability               | System operations shall emit technical logs/metrics for sandbox creation, AI calls, event-ingestion errors, and reconstruction failures.                                 | MUST         |

# 15. Security and Sandbox Requirements

The platform executes untrusted candidate code. Sandbox isolation is therefore a security boundary, not an implementation detail.

**SEC-001 — Per-session isolation.** Each active candidate session shall run in an isolated execution environment.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-002 — No host filesystem access.** Candidate processes shall not receive direct access to host filesystem paths outside explicitly mounted scenario/session volumes.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-003 — Privilege restriction.** Candidate processes shall run without unnecessary privileges and shall not receive host-level administrative capabilities.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-004 — Resource limits.** Each sandbox shall enforce CPU, memory, process-count, storage, and runtime limits.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-005 — Network policy.** Outbound and inbound sandbox network access shall be denied or allowlisted according to scenario requirements.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-006 — Secret isolation.** Application, database, provider, and infrastructure secrets shall not be exposed inside candidate sandboxes.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-007 — Termination.** Timed-out, submitted, or failed sandboxes shall be terminated and cleaned up according to retention policy.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-008 — Authenticated evaluator access.** Only authorized evaluator/admin users shall access candidate session evidence.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-009 — Transport security.** Production traffic shall use encrypted transport.

> Priority: MUST \| Verification: Security Test/Inspection

**SEC-010 — Abuse containment.** Sandbox behavior that exceeds configured safety or resource limits shall be terminated without allowing host compromise.

> Priority: MUST \| Verification: Security Test/Inspection

# 16. Privacy, Auditability, and Explainability

**PRV-001 — Data minimization.** The product shall collect only data necessary to operate the assessment and reconstruct work within the controlled environment.

> Priority: MUST \| Verification: Inspection/Test

**PRV-002 — Candidate notice.** Before the timed session begins, the candidate shall be informed that in-workspace activity, terminal activity, code changes, tests, and AI interactions are recorded.

> Priority: MUST \| Verification: Inspection/Test

**PRV-003 — No biometric capture.** The MVP shall not collect webcam video, face data, room scans, biometrics, or microphone recordings.

> Priority: MUST \| Verification: Inspection

**PRV-004 — Evidence transparency.** System-generated reconstruction text shall be distinguishable from raw evidence and expandable to source evidence.

> Priority: MUST \| Verification: Inspection/Test

**PRV-005 — Retention configurability.** Production deployments should support configurable retention for session events, artifacts, and reconstructions.

> Priority: SHOULD \| Verification: Inspection/Test

**PRV-006 — Decision traceability.** Any stored evaluator decision shall be traceable to a human actor and shall not masquerade as a system verdict.

> Priority: MUST \| Verification: Inspection/Test

# 17. Error Handling and Recovery

| **Failure**                       | **Required Behavior**                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox fails before start        | Do not start timer; show recoverable readiness error and permit recreation.                                                                                       |
| Sandbox fails during session      | Preserve events/artifacts available to date, mark platform failure, prevent automatic negative candidate interpretation.                                          |
| Client disconnect                 | Keep sandbox/session active within policy; reconnect to existing session when possible.                                                                           |
| Event ingestion temporarily fails | Buffer/retry where safe; surface loss explicitly if recovery is impossible.                                                                                       |
| AI provider unavailable           | Candidate should be told AI is unavailable; platform must record the outage. Session policy may pause or allow continuation depending on prototype configuration. |
| Reconstruction generation fails   | Evaluator can still inspect raw chronological evidence and final artifacts; reconstruction may be retried.                                                        |
| Submission request races timeout  | Server-side session state and authoritative time determine a single final state.                                                                                  |

# 18. MVP Scope and Explicit Non-Goals

## 18.1 MVP Must Include

- One stack and one carefully authored scenario.

- Task brief and time-bound assessment session.

- Isolated repository workspace.

- Browser editor and interactive terminal.

- Runnable tests.

- Integrated AI chat.

- Structured event logging.

- Final diff/snapshot.

- Evidence-grounded reconstruction.

- Minimal evaluator review.

## 18.2 Explicitly Deferred

- AI Judgment scoring model.

- Candidate ranking or recommendation engine.

- Composite 0-100 scores.

- Candidate comparison dashboards.

- Scenario generation at scale.

- Large scenario library.

- ATS/HRIS integrations.

- Enterprise SSO and complex role/permission administration.

- Multi-language/multi-stack support.

- Anti-cheat surveillance beyond the controlled environment.

- Automatic inference of manual AI adoption.

## 18.3 Prototype Implementation Guidance

The web product may be one application with candidate and evaluator routes. The data model should remain small. A reasonable first implementation can center on Scenario, Session, Event, Artifact, Reconstruction, and EvaluatorDecision objects.

# 19. Acceptance Criteria and Verification

| **ID** | **Acceptance Criterion**                                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | A candidate can start the scenario only after an isolated environment is ready.                                            |
| AC-002 | The candidate can inspect and modify repository files, execute tests, and use a terminal.                                  |
| AC-003 | The candidate can interact with the integrated AI assistant without being required to use it.                              |
| AC-004 | The system records supported file, command, test, and AI events with deterministic session ordering.                       |
| AC-005 | The system preserves a final repository diff/snapshot at submission or timeout.                                            |
| AC-006 | The system can display one submitted candidate session as a chronological reconstruction.                                  |
| AC-007 | Generated reconstruction annotations can be traced to source events/artifacts.                                             |
| AC-008 | An evaluator can inspect the underlying AI exchange, command output, diff, or raw event for a reconstruction item.         |
| AC-009 | The product does not automatically convert test success into a candidate pass/advance decision.                            |
| AC-010 | The MVP exposes no system-generated competence score, AI-usage score, or candidate ranking.                                |
| AC-011 | Candidate work occurs within a resource-limited isolated sandbox without access to application secrets or host filesystem. |
| AC-012 | A reconstruction failure does not make the underlying session evidence unavailable.                                        |

## 19.2 Prototype Demo Acceptance

The prototype shall be demoable using one pre-completed scenario in which the evaluator can see a consequential engineering fork, inspect the relevant AI interaction and subsequent action, and understand why the candidate's process is more informative than a final answer alone.

# 20. Risks and Open Questions

| **Risk / Question**         | **Impact**                                                            | **Current Position**                                                                             |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Scenario quality            | Poor scenarios produce weak evidence regardless of UI quality.        | Highest product risk. Hand-author and validate the first scenario before scaling.                |
| Evaluator time              | If reconstructions are too long, hiring teams will not use them.      | Measure time-to-understanding during prototype tests; optimize compression, not scoring.         |
| Goodhart behavior           | Candidates may learn visible 'good behaviors' and perform rituals.    | Avoid converting behaviors into public scores; preserve raw context.                             |
| AI outage or model drift    | Candidate experience may vary.                                        | Version provider/model and record outages; do not build core evidence solely on AI availability. |
| Sandbox abuse               | Untrusted code can attack infrastructure.                             | Treat sandbox as a strict security boundary with resource/network/secret controls.               |
| Task outcome classification | Automatically labeling root-cause success can become hidden judgment. | Prefer factual observations and tests; human evaluator owns broader conclusion.                  |
| Predictive validity         | Evidence may be interesting without predicting job performance.       | Do not claim validated predictive outcomes until real data exists.                               |
| Candidate trust             | Capture may be perceived as surveillance.                             | Record only in-workspace actions, disclose clearly, and avoid webcam/biometric collection.       |

# Appendix A. Core Data Objects

Illustrative fields; exact database design remains an implementation decision.

**Scenario:** id, version, title, brief, acceptance_criteria, time_limit_seconds, repo_image_ref, environment_config, created_at

**Session:** id, candidate_id, scenario_id, scenario_version, status, started_at, ended_at, sandbox_ref

**Event:** id, session_id, seq, type, source, occurred_at, payload, artifact_refs

**Artifact:** id, session_id, type, storage_ref, sha256, created_at

**Reconstruction:** id, session_id, version, generated_at, model_ref, prompt_version, content, evidence_refs

**EvaluatorDecision:** id, session_id, evaluator_id, decision, note, created_at

# Appendix B. Event Taxonomy

- Session: SESSION_CREATED, SESSION_STARTED, SESSION_SUBMITTED

- File: FILE_OPENED, FILE_CHANGED, FILE_SAVED (if save is meaningful in the editor model)

- Terminal: TERMINAL_CONNECTED, COMMAND_STARTED, COMMAND_FINISHED

- Tests: TEST_RUN, TEST_RESULT or normalized test metadata attached to command completion

- AI: AI_REQUEST_STARTED, AI_RESPONSE_COMPLETED, AI_REQUEST_CANCELLED, AI_REQUEST_FAILED (Slice 6B frozen runtime events; legacy conceptual: AI_PROMPT_SENT, AI_RESPONSE_RECEIVED, AI_CONTENT_INSERTED)

- System: SANDBOX_READY, SANDBOX_TERMINATED, PLATFORM_ERROR

- Review: RECONSTRUCTION_CREATED, EVALUATOR_DECISION_RECORDED

# Appendix C. Prototype Scenario Baseline

The baseline scenario is a small Flask service using Postgres as source of truth and Redis as a read-through cache. A restocked item may remain stale because update_stock() writes to Postgres without invalidating the cache. A deeper edge case involves inconsistent warehouse-ID normalization in cache-key construction. A tempting shallow response is to shorten the TTL; a stronger investigation addresses invalidation and may discover normalization inconsistency. The scenario is valuable because the wrong-ish shortcut emerges naturally from the bug rather than being planted solely as an assessment trap.

- Candidate-visible: ticket, repository, failing test, logs, README, time limit.

- Primary visible failure: stale cached stock after restock.

- Root cause layer 1: missing cache invalidation on write.

- Deeper edge case: warehouse ID casing mismatch across paths.

- Valid solution approaches: invalidate on write or update cache on write.

- Tempting band-aid: reduce TTL without addressing stale-write behavior.

- Useful evidence: investigation sequence, AI context quality, test behavior, whether the candidate stops at green or continues investigating.

# Appendix D. Traceability Matrix

| **Product Objective**                   | **Mapped Requirements**        |
| --------------------------------------- | ------------------------------ |
| Make real work observable               | FR-013–FR-036, SCN-001–SCN-010 |
| Allow AI as a real tool                 | FR-021–FR-027                  |
| Preserve evidence without fake judgment | FR-028–FR-050, AIR-001–AIR-005 |
| Human owns final decision               | FR-048–FR-050, PRV-006         |
| One continuous reconstruction           | FR-037–FR-045                  |
| Secure untrusted execution              | SEC-001–SEC-010                |
| Keep MVP intentionally small            | Section 18, AC-001–AC-012      |
