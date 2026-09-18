# 060 — Delimit Slice 6E: Evaluator AI Evidence Presentation

Status: completed.
Authorized: 2026-09-18.
Baseline: `db44a27e8c5e80bbf4bff76b88011d197da1733a` (origin/main).

## Objective

Implement the frozen presentation architecture for candidate AI evidence in the Evaluator V2 experience:

- Compact AI Summary inside Observed Activity;
- Chronological AI milestones interleaved with workspace and command activity;
- Progressive disclosure (Level 0 Overview -> Level 1 Interaction Details -> Level 2 Technical Details -> Level 3 Technical Record);
- Presentation-only burst grouping for 3+ consecutive complete successful interactions;
- Role-depth defaults across Generalist Recruiter, Technical Recruiter, Engineer, and Engineering Manager;
- Epistemic invariants strictly preserved: no scores, no reliance metrics, no authorship inference, no causal claims.

## Canonical Architectural Principles

1. **Presentation Contract**:

   > The abstraction level may change. The underlying truth may not.
   > Technical evidence remains available through the technical record even if a role projection does not display every field by default. Role depth controls presentation scan density, not evidence access.

2. **Role Profiles Authority**:
   All four canonical profiles are preserved:
   - `GENERALIST_RECRUITER`
   - `TECHNICAL_RECRUITER`
   - `ENGINEER`
   - `ENGINEERING_MANAGER`

3. **Prompt and Response Excerpt Disclosure**:
   Prompt and response excerpts are never visible in the default timeline scan state for any role (including Engineer). Each milestone card presents neutral metadata (label, neutral statement, timestamp, model where permitted, duration where useful) with an explicit disclosure button (`View prompt excerpt` / `View response excerpt`). Excerpts are rendered only upon one-click disclosure.

4. **Burst Grouping**:
   Applies strictly to 3 or more complete consecutive successful AI interactions (request started -> response completed with matching interaction ID). Any intervening command, workspace change, cancellation, failure, or timeout breaks the group. Expanding the group restores exact chronological milestones.

5. **Capability State Semantics**:
   - `legacy` (`snapshot === null`): `AI capture was not available for this session version.`
   - `disabled` (`snapshot.enabled === false`): `Integrated AI capability was disabled for this assessment.`
   - `active` (`snapshot.enabled === true` + 0 interactions): `AI capability was active for this assessment. No integrated AI interactions were recorded.`
   - `active` with interactions: factual counts (`X recorded AI interactions · Y completed ...`).
     Historical C/D/F/G fixtures are legacy sessions and correctly reflect `legacy` state without fabricating interactions.

## Implementation Details

1. **Briefing Types & Semantic Mapper (`apps/web/src/evaluator/`)**:
   - Added `BriefingAiSummary` and `BriefingAiCapabilityState` to `evaluator-briefing.ts`.
   - Added `ObservationKind` variants (`recorded_ai_request`, `recorded_ai_response`, `recorded_ai_cancellation`, `recorded_ai_failure`).
   - Added wording templates in `briefing-wording.ts`.
   - Mapped AI typed facts in `briefing-semantic-mapper.ts`.
   - Constructed deterministic `aiSummary` in `build-evaluator-briefing.ts`.
   - Preserved all 4 role projection depths in `project-evaluator-briefing.ts`.
   - Included `aiCapabilitySnapshot` in `session-service.ts`.

2. **UI Presentation (`apps/web/app/evaluator/sessions/[sessionId]/`)**:
   - `compact-ai-summary.tsx`: Compact factual card (status, counts, model where permitted, interruption notice, interleaving).
   - `evidence-item-card.tsx`: Native buttons with `aria-expanded` and `aria-controls` collapsing prompt/response excerpts by default across all roles.
   - `recorded-activity.tsx`: Presentation-only burst grouping for 3+ complete consecutive successful interactions with full restoration on expansion.
   - `evaluator-experience.tsx`: Role projection depth wiring.
   - `workspace.css`: Native styling matching Delimit design system.

3. **Verification**:
   - Comprehensive unit and rendering tests covering truth invariance, role depths, default collapsed excerpts, burst grouping, failures, accessibility, and C/D/F/G golden stability.
   - Full `npm run verify` passing with clean production build.
