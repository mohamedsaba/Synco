import type {
  EvaluatorBriefing,
  GroundedText,
  EvidenceRefs,
} from './evaluator-briefing';
import { renderBriefingWording } from './briefing-wording';

// Structural/provenance check; entailment comes from the closed builder/templates.
export const validateBriefingGrounding = (briefing: EvaluatorBriefing) => {
  const index = new Map(
    briefing.evidenceIndex.map((entry) => [entry.evidenceRef, entry]),
  );
  if (
    index.size !== briefing.evidenceIndex.length ||
    briefing.evidenceIndex.some(
      (entry) => entry.sessionId !== briefing.sessionId,
    )
  )
    throw new Error('Invalid briefing evidence index.');
  const validateRefs = (refs: EvidenceRefs, basis: GroundedText['basis']) => {
    if (!refs.length || new Set(refs).size !== refs.length)
      throw new Error(
        'A factual statement requires unique evidence references.',
      );
    for (const ref of refs) {
      const entry = index.get(ref);
      if (
        !entry ||
        entry.sessionId !== briefing.sessionId ||
        entry.basis !== basis
      )
        throw new Error(
          'A briefing reference is dangling, foreign or has an invalid basis.',
        );
    }
  };
  const validate = (statement: GroundedText) => {
    validateRefs(statement.evidenceRefs, statement.basis);
    if (statement.text !== renderBriefingWording(statement.wording))
      throw new Error(
        'Briefing copy does not match its deterministic template.',
      );
  };
  briefing.observedActivity.forEach(validate);
  validate(briefing.submittedState);
  validateRefs(
    briefing.artifactAvailability.submittedDiff.evidenceRefs,
    'final_state',
  );
  briefing.recordedVerification.runs.forEach((run) => {
    validateRefs(run.evidenceRefs, 'chronology');
    run.evidenceRefs.forEach((ref) => {
      if (index.get(ref)?.kind !== 'command_execution')
        throw new Error('Verification requires command evidence.');
    });
    if (run.result) validate(run.result);
  });
  briefing.evidenceLimitations.forEach((limitation) => {
    if (limitation.authority === 'evidence') validate(limitation);
    else if (
      !limitation.source.fieldRef ||
      limitation.text !== renderBriefingWording(limitation.wording)
    )
      throw new Error('Invalid metadata limitation.');
  });
  if (
    briefing.taskContext.some(
      (entry) =>
        entry.source.authority !== 'scenario_snapshot' &&
        entry.source.authority !== 'evaluation_context',
    )
  )
    throw new Error('Task context has an invalid authority.');
  if (
    briefing.reviewGuidance.some(
      (entry) => entry.source.authority !== 'evaluation_context',
    )
  )
    throw new Error('Review guidance has an invalid authority.');
  if (
    briefing.sessionDuration.status === 'available' &&
    (briefing.sessionDuration.elapsedMs === null ||
      briefing.sessionDuration.elapsedMs < 0)
  )
    throw new Error('Invalid briefing session duration.');
  return briefing;
};
