# 0002 — Reconstruction, not dashboard

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

An evaluator needs to understand what happened while a candidate worked. Splitting logs, AI usage, diff, narrative, and metrics across generic analytics screens fragments the evidence.

## Decision

The evaluator's primary experience will be one continuous chronological reconstruction with expandable underlying evidence.

## Rationale

The evaluator is reconstructing work, not analyzing analytics widgets. Chronology preserves relationships between actions and outcomes.

## Consequences

Tests, commands, AI interactions, file activity, and diff context become timeline detail types. Supporting navigation may exist, but it cannot replace or fragment the primary reconstruction.
