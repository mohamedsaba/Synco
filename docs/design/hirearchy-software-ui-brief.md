# Hirearchy Software — product UI design brief

Status: source-grounded design preparation. No product screens have been created in Figma. On 2026-09-28 the first read-only Figma MCP call was rejected because the account had reached its Starter-plan tool-call limit. Existing marketing designs are unchanged. This document records the design direction and screen coverage for continuation; it is not a completed visual design or an implementation approval.

## Direction

**A calm workbench for candidates; an inspectable work record for evaluators.** Carry the marketing brand into a useful working environment: DM Sans, plum identity, mint as the Software accent, pale lilac for context. The broad marketing thread becomes a restrained continuity line: orientation steps for the candidate and recorded chronology for the evaluator. No decorative motion across code, output or evidence.

The Software product uses a compact wordmark with a mint discipline tab. Neutral work surfaces, fine rules and readable mono text distinguish the application from the expressive landing page. Shared typography and geometry connect the two without bringing oversized headlines into tools. Coral is a labelled attention state, never a judgement about a person. Mint denotes selected controls or confirmed operations, never candidate quality. Color always has a text counterpart.

Candidate desktop composition: 64px identity/session bar; small navigation for Brief, Files, Commands and AI; central editor with adjacent context/tools. At 1440px, reserve roughly 240px for the brief/files, at least 620px for editing and 320px for tools. Keep Save and its real persistence status beside the editor. The timer is stable and readable, not a progress score or an animated urgency device. Submission remains a separate, deliberate action.

Evaluator desktop composition: compact session header and four perspective controls; task context followed by chronological reconstruction. Engineer view retains chronology beside source inspection. Other perspectives adjust disclosure, not evidence or permission. Keep selected evidence highlighted in both chronology and inspector. Avoid disconnected metric cards, candidate rankings, or dashboard summary tiles.

## Candidate frames to design

| ID  | Screen/state                  | Required content and behavior                                                                                                                                                                     | Source                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| C01 | Entry                         | Scenario title, session reference, actual duration, one Continue to orientation action. No countdown before activation.                                                                           | `candidate-prestart.tsx`                                                        |
| C02 | Orientation                   | Duration, tools, recording scope, explicit save behavior, AI policy/capability, submission/expiry. Readable groups and a clear next step.                                                         | `candidate-prestart.tsx`                                                        |
| C03 | Ready to start                | Explain that setup time is not deducted. Start assessment and Back to orientation.                                                                                                                | `candidate-prestart.tsx`                                                        |
| C04 | Preparing / setup failure     | Honest indeterminate progress; duplicate activation unavailable; retry and return options on failure. No invented percentage.                                                                     | `candidate-prestart.tsx`                                                        |
| C05 | Active workbench              | Brief, criteria, file list, editor, Save/status, command input/history, integrated assistant, time remaining and Submit. Use the actual scenario as a labelled design fixture.                    | `candidate-workspace.tsx`                                                       |
| C06 | Editor state sheet            | Saved, unsaved, saving, save failed, file switching, empty file tree. Keep edits on failure; no fabricated autosave promise.                                                                      | `editor-persistence.ts`, `candidate-workspace.tsx`                              |
| C07 | Commands / AI state sheet     | Running, completed, nonzero exit, platform failure, bounded/truncated output. AI enabled, disabled, pending, completed, failed/uncertain and retry. File references do not include unsaved edits. | `candidate-command-state.ts`, `candidate-ai-panel.tsx`, `candidate-ai-state.ts` |
| C08 | Submission review             | Finality explanation, real persistence state, Back and explicit confirmation. Workspace behind review is inert. No request to rate oneself.                                                       | `candidate-workspace.tsx`                                                       |
| C09 | Finalizing / deadline reached | Disable mutations; clearly distinguish waiting for server finalization from confirmed completion. No claim of successful submission yet.                                                          | `candidate-experience-state.ts`, `candidate-workspace.tsx`                      |
| C10 | Completion variants           | Separate voluntary submission from timeout. Confirm finality and read-only state without grading the work.                                                                                        | `candidate-workspace.tsx`                                                       |
| C11 | Unavailable / unsupported     | Actionable safe error state with controls disabled as dictated by server truth.                                                                                                                   | `candidate-experience-state.ts`, candidate route                                |
| C12 | Narrow workbench              | Same Brief/Files/Commands/AI functions in a single active panel with reachable controls; local horizontal code scrolling. Never force a miniature desktop canvas.                                 | Existing workspace navigation                                                   |

Candidate records are observed work, not hidden activity tracking. Display the real capture scope plainly. AI is neutral and cannot introduce Apply/Agent/Model picker controls that do not exist. Session time is server-calibrated and an untimed session has no fabricated timer.

## Evaluator frames to design

| ID  | Screen/state                    | Required content and behavior                                                                                                                                                                                                                    | Source                                                                                                     |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| E01 | Access                          | Evaluator credential and optional known session reference. Busy and invalid-access states. No fabricated account login/SSO.                                                                                                                      | `evaluator-access-form.tsx`                                                                                |
| E02 | Submitted review queue          | Scenario title, session reference, submitted timestamp/UTC, duration if present, closure reason. Loading, empty, access-error and service-error variants. No completion-rate dashboard, search/filter or assignments without a product decision. | `evaluator-review-queue.tsx`                                                                               |
| E03 | Generalist perspective          | Task, plain-language recorded activity, neutral verification, final submitted state, guidance and visible limitations.                                                                                                                           | `evaluator-experience.tsx`, `project-evaluator-briefing.ts`                                                |
| E04 | Technical recruiter perspective | Same evidence with technical footprint, recorded commands, chronology and direct evidence disclosure where configured.                                                                                                                           | `role-lens-switcher.tsx`, briefing projection                                                              |
| E05 | Engineer perspective            | Chronology alongside inspection. Final submitted state and Technical record controls; selected source evidence, reference, type, provenance, stdout/stderr or diff.                                                                              | `engineer-evidence-workspace.tsx`                                                                          |
| E06 | Engineering manager perspective | Same evidence with submission scope, limitations and review guidance at its configured depth. No inferred intent or automatic management recommendation.                                                                                         | Briefing projection                                                                                        |
| E07 | Evidence disclosure states      | Collapsed/expanded chronology, grouped AI interactions, selected event, diff/source inspection, missing artifact, truncated output and platform recording gap. Preserve the distinction between absent evidence and recorded failure.            | `recorded-activity.tsx`, `evidence-item-card.tsx`, `platform-notice.tsx`, `artifact-availability-card.tsx` |
| E08 | Narrow review                   | Single-column chronology, accessible perspective controls, source inspection below or in a dismissible panel with focus return. Preserve chronology context and disclosure state.                                                                | Existing semantic evidence structure                                                                       |
| E09 | Route boundary states           | Loading, not found, unauthorized and service error. Do not reveal unauthorized session details.                                                                                                                                                  | Evaluator route/loading/error/not-found                                                                    |

Test results, task outcomes and evaluator judgement stay separate. No new hiring-decision storage or pass/reject buttons are invented: the existing route is a read-only evidence surface. All sample records in design must be labelled synthetic and internally consistent.

## Reusable component scope

1. Software identity/session header: Candidate and Evaluator contexts.
2. Buttons: primary/secondary/quiet; default, hover, focus, pressed, disabled, busy.
3. Labelled fields and message composer: empty, filled, focus, invalid, disabled; password masking.
4. Workspace navigation / file selection and evaluator perspective controls: idle, hover, focused, selected, unavailable.
5. Persistence indicator and session timer: semantic text, actual supported states, no color-only communication.
6. Notice row: contextual information, save/service error, recording limitation, pending finalization.
7. Source/evidence row: timestamp, observable event, source reference, selection and disclosure.
8. Code/output panel: line text, file identity, overflow, truncation and copy affordance only where supported or explicitly proposed.
9. Submission review dialog: focus entry/trap/return, inert background, disabled confirmation while pending.
10. Empty/loading/failure composition: meaningful text, available next action, no invented data.

No matching `*.figma.*` Code Connect files were found in the current worktree. Figma library/component discovery could not complete because of the external tool limit; do not infer absent components or create duplicates until discovery succeeds.

## Interaction and accessibility contract

Use pointer for actionable controls, text cursor and selection for editing/code/output and inspectable evidence, default cursor for decorative branding. The marketing display-selection restriction does not apply to product evidence. All useful records remain copyable.

Hover may tint the control surface, show a directional arrow or emphasize an evidence connection; it must not resize or displace text. Keyboard focus remains distinct from hover/selection. A disabled control communicates why when relevant; loading controls keep their label and prevent duplicate requests. Never replace a pointer with a custom cursor that obscures code.

Panels use short opacity/position transitions (roughly 120–180ms); dialogs are calm and predictable. Reduced motion removes spatial animation. No pulsing during an assessment, animated ticking digits, scroll hijacking, or hidden content waiting for motion.

Design validation targets: 1440×960 and 1280×800 working layouts; 390px adaptations; 44px primary touch controls, readable body/mono text, AA contrast, keyboard focus and error states. Use ordinary text copy rather than rasterized interface labels. Figma deliverables require native auto-layout, reusable components and actual font verification.

## Resume in Figma

Existing file: https://www.figma.com/design/k38lbuJLA0v3X8CARrfxGA

First finish read-only discovery of pages, styles, variables and reusable components. Then add Software foundations, Candidate flow and Evaluator flow separately from the marketing boards. Build native components and variants, compose the state frames above, wire primary prototype paths, and inspect screenshots for clipping, contrast and type consistency. Record returned node IDs and link the finished frames only after creation and verification.
