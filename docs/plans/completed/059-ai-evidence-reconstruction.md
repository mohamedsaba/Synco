# 059 — Hirearchy Software Slice 6D: AI Evidence Reconstruction Integration

Status: completed.
Authorized: 2026-09-18.
Baseline: `12588c82b516c89d847d0630178c241eb9533a54` (origin/main).

## Objective

Integrate candidate AI interaction events into Hirearchy Software's evidence reconstruction pipeline while preserving the frozen epistemic contract:

- Observable facts only;
- AI use is neutral;
- Chronology establishes order, not causality;
- Preserves both start and terminal boundaries as distinct milestones;
- No evaluator or candidate UI modifications;
- Zero causality, competence, reliance, or authorship inferences.

## Implementation Details

1. **Chronological Reconstruction (`chronological-reconstruction.ts`)**:
   - Added distinct item types: `AiRequestStartedItem` (`AI_REQUEST_STARTED`), `AiResponseCompletedItem` (`AI_RESPONSE_COMPLETED`), `AiRequestCancelledItem` (`AI_REQUEST_CANCELLED`), and `AiRequestFailedItem` (`AI_REQUEST_FAILED`).
   - Sorted items into the timeline strictly by `assessment_events.sequence`.
   - Never collapses start and completion into a single item. Both boundaries are preserved as distinct milestones.
   - Natural resilience to unterminated requests without inventing false terminal states.

2. **Evidence Reference Catalog (`evidence-reference-catalog.ts`)**:
   - Added `EvidenceCatalogKind` variants: `'ai_request_started' | 'ai_response_completed' | 'ai_request_cancelled' | 'ai_request_failed'`.
   - Generates inspectable deterministic references:
     - `ai_request:${sessionId}:${interactionId}:started`
     - `ai_response:${sessionId}:${interactionId}:completed`
     - `ai_request:${sessionId}:${interactionId}:cancelled`
     - `ai_request:${sessionId}:${interactionId}:failed`
   - Retains raw event ID provenance and sequence numbers for every reference.

3. **Typed Evidence Facts (`typed-evidence-fact.ts`)**:
   - Added `TypedEvidenceFact` variants: `ai_request_started`, `ai_response_completed`, `ai_request_cancelled`, `ai_request_failed`.
   - Bounded excerpts (`candidateInputExcerpt`, `responseExcerpt`, `errorMessageExcerpt`) enforced via `boundEvidenceText`.
   - Sets truncation indicators (`promptTruncated`, `responseTruncated`) when total bytes exceed bounded text.
   - Evaluative, psychological, and competence fields strictly absent.

4. **Deterministic Rendering & Adjacency Protection (`deterministic-reconstruction-renderer.ts`)**:
   - Added neutral statement templates ending with terminal punctuation:
     - Start: `"An AI request was recorded."`
     - Completion: `"An AI response was recorded."`
     - Failure: `"An AI request ended with a provider error."`, `"An AI request timed out."`, etc.
     - Cancellation: `"Candidate requested cancellation of the AI request."` for `candidate_requested_cancel`, `"An AI request was cancelled when the session ended."` for `session_ended`, and `"An AI request was cancelled."` otherwise.
   - Adjacency protection: when an edit immediately follows an AI response, independent statements are produced with zero causality or application inference.

5. **Verification & Regression**:
   - Unit tests covering Matrix A through M:
     - Normal start → completion
     - In-flight interleaved events (start → workspace change → command → completion)
     - Temporal adjacency (completion → workspace change without causality inference)
     - Terminal failure (start → failure)
     - Candidate cancellation vs platform cancellation
     - Unterminated request
     - Legacy session compatibility (0 AI events)
     - Interleaved interactions
     - Reference ID resolution
     - Bounded excerpts & truncation flags
     - Deterministic reproducibility across repeated runs
     - Evaluator and AI regression suites all passing
