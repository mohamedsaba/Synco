# 083 — Evaluator Role / Depth Contract

## Scope

Make the established four evaluator depth profiles govern their existing
presentation capabilities. Depth changes default presentation only. It does
not change evidence truth, chronology, session state, or the evaluator-cookie
authorization boundary.

## Existing contract audit

| Flag                     | Current enabled profiles                           | Current consumer                                         | Audit finding |
| ------------------------ | -------------------------------------------------- | -------------------------------------------------------- | ------------- |
| `structuredEvidence`     | Technical Recruiter, Engineer                      | none                                                     | unused        |
| `technicalRecord`        | Engineer                                           | navigation and `TechnicalRecord`                         | active        |
| `scenarioReference`      | Technical Recruiter, Engineer                      | `TaskBrief`                                              | active        |
| `technicalFootprint`     | Technical Recruiter, Engineer                      | paths and technical metadata in `RecordedActivity`       | active        |
| `verificationChronology` | Technical Recruiter, Engineer                      | none                                                     | unused        |
| `conciseSubmissionScope` | Generalist Recruiter, Engineering Manager          | `SubmittedWork` diff disclosure                          | active        |
| `evidenceLimitations`    | Engineer, Engineering Manager                      | none; `PlatformNotice` always receives limitations       | unused        |
| `artifactAvailability`   | Engineer, Engineering Manager                      | `ArtifactAvailabilityCard`                               | active        |
| `reviewGuidance`         | all profiles                                       | `ReviewGuidance`                                         | active        |
| `directEvidenceLinks`    | Technical Recruiter, Engineer, Engineering Manager | none; every timeline item renders its disclosure control | unused        |
| `aiSummary`              | all profiles                                       | `CompactAiSummary`                                       | active        |
| `aiConfiguredModel`      | Technical Recruiter, Engineer, Engineering Manager | AI model fields                                          | active        |
| `aiTokenTelemetry`       | Engineer                                           | AI token fields                                          | active        |

`directEvidenceLinks` and `structuredEvidence` are distinct: the former
permits a per-statement source-evidence disclosure; the latter permits typed
technical records within that disclosure. The Engineering Manager's existing
`directEvidenceLinks: true` and `structuredEvidence: false` combination will
therefore expose the truthful source relationship without raw command, file,
or AI payload detail. `verificationChronology` controls typed verification
metadata embedded at its existing chronology position; all profiles retain the
same factual verification statement and ordering. `evidenceLimitations`
controls overview limitation notices; capture gaps remain factual chronology
items for every profile.

## Implementation

1. Pass explicit depth capabilities into evaluator children. Keep raw review
   evidence as literal rendering input only; no component derives semantics
   from raw payload strings.
2. Gate source-disclosure affordances with `directEvidenceLinks`, and gate
   typed record rendering with `structuredEvidence`.
3. Gate extra verification context and overview limitation notices with their
   existing flags, retaining factual chronology and final submitted state.
4. Replace evaluator closure-reason ternaries with an exhaustive union mapping.
5. Add a table-driven role-depth test matrix and update evaluator architecture
   documentation.

## Explicit deferrals

E4 split workspace, E5 accessibility/responsive hardening, E6 visual polish,
new roles, scoring, and authorization changes are out of scope.

## Final contract

| Profile                | Enabled capabilities                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GENERALIST_RECRUITER` | `conciseSubmissionScope`, `evidenceLimitations`, `reviewGuidance`, `aiSummary`                                                                                       |
| `TECHNICAL_RECRUITER`  | `structuredEvidence`, `scenarioReference`, `technicalFootprint`, `verificationChronology`, `reviewGuidance`, `directEvidenceLinks`, `aiSummary`, `aiConfiguredModel` |
| `ENGINEER`             | every capability                                                                                                                                                     |
| `ENGINEERING_MANAGER`  | `conciseSubmissionScope`, `evidenceLimitations`, `artifactAvailability`, `reviewGuidance`, `directEvidenceLinks`, `aiSummary`, `aiConfiguredModel`                   |

The generalist's correction from no overview limitation notices to
`evidenceLimitations: true` preserves its high-level factual limitation
requirement. Direct evidence controls are absent there, but the same grounded
chronology, source references, and role switch remain available. The manager's
direct-control/structured-record split exposes reference identity without
rendering raw command, file, or AI payloads.

`formatEvaluatorClosureReason` exhaustively maps the current union:
`candidate_submission` is “Submitted by candidate” and `timeout` is
“Assessment time ended.” Typed verification context now renders later workspace
edits and capture gaps only in chronology profiles that enable
`verificationChronology`; it does not claim causality. The page's raw review
input is limited to literal evidence rendering, while capability decisions come
only from `defaultDepth`.

## Verification

- E3 independent review had Docker available and found four stale evaluator
  briefing artifact tests after `evidenceLimitations` changed for the generalist
  profile. The mismatch was artifact snapshots, not a Docker limitation.
- E3A regenerated the C, D, F, and G evaluator briefing artifacts with the
  supported writer, then added focused coverage for minimum-safe evidence
  defaults and factual verification chronology context.
- E3A focused evaluator checks passed. Its final `npm run verify` passed
  formatting, lint, and typechecking, then Docker-backed integration tests
  failed because this Codex environment could not access `/var/run/docker.sock`;
  the chained build did not run.
