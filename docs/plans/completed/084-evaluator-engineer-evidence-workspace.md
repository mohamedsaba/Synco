# 084 — Evaluator Engineer Evidence Workspace

## Scope and decision

E4 changes only Engineer presentation. `EngineerEvidenceWorkspace` keeps the
existing chronological reconstruction primary and provides a nearby inspection
context. It reuses `RecordedActivity`, `EvidenceItemCard`, `SubmittedWork`, and
`TechnicalRecord`; no evidence, API, backend, authorization, or role-depth
contract changes were needed.

## Interaction model

At desktop widths, chronology and inspection are adjacent. The initial
inspection is the authoritative final submitted state. Selecting an existing
typed `EvidenceCatalogEntry` reference replaces that inspection with its source
record and keeps evidence reference, record kind, and role visible. Engineer
actions can return to the submitted diff or complete technical record.

The client owns only `selectedEvidenceRef` and selected inspection view. It
does not derive chronology, relationships, phase, candidate meaning, or source
semantics. Command, workspace, and AI details render from existing typed items;
an entry without a structured item renders a factual reference fallback.

## Boundaries and deferrals

Chronology ordering remains authoritative. The submitted diff remains the one
authoritative `SubmittedWork` renderer. AI remains neutral. The workspace
introduces no score, rank, recommendation, verdict, raw-string inference,
authorization change, browser evidence fetch, or new API endpoint. Other depth
profiles retain their existing layouts.

The base layout is single column and becomes two-context only at wide desktop
widths. E5 accessibility/responsive hardening and E6 visual polish remain
deferred.

## Verification

Interactive happy-dom coverage verifies Engineer workspace structure, typed
command/workspace/AI selection, reference provenance, deterministic replacement,
truth/order preservation, no-item fallback, submitted-diff reuse, and absence
from non-Engineer profiles. Existing role-depth, evaluator rendering, review,
AI, and evaluator-gate regression tests run with it.
