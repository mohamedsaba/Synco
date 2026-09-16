import type { EvaluatorBriefing } from '../../apps/web/src/evaluator/evaluator-briefing';
import {
  briefingDepthProfiles,
  projectBriefing,
} from '../../apps/web/src/evaluator/project-evaluator-briefing';

export const renderBriefingReview = (
  caseId: string,
  briefing: EvaluatorBriefing,
) => {
  const lines = [
    `# Case ${caseId} — serialized briefing review`,
    '',
    'This artifact is generated from recorded evidence. It is not a candidate-quality judgment.',
    '',
    `Full base and all four projections: [${caseId}.json](${caseId}.json).`,
    '',
    '## Base briefing',
    '',
    '### Task context',
    '',
  ];
  for (const context of briefing.taskContext)
    lines.push(
      `- ${context.kind}: attributed scenario data at \`${context.source.fieldRef}\` (version ${context.source.version}).`,
      '',
      '```json',
      JSON.stringify(context.authoredText),
      '```',
      '',
    );
  lines.push('### Observed activity', '');
  for (const activity of briefing.observedActivity)
    lines.push(
      `- ${activity.text}`,
      `  - Statement ID: \`${activity.id}\`; source: ${activity.evidenceRefs.map((ref) => `\`${ref}\``).join(', ')}.`,
      `  - Scope: \`${activity.scope}\`; mapping: \`${activity.mapping.status}\`.`,
      '',
    );
  lines.push('### Recorded verification', '');
  for (const run of briefing.recordedVerification.runs)
    lines.push(
      `- ${run.result?.text ?? 'No supported test summary is available for this recorded execution.'}`,
      `  - Source: ${run.evidenceRefs.map((ref) => `\`${ref}\``).join(', ')}; exit status: ${run.exitCode}; timeout: ${run.timedOut}; test identity: ${run.testIdentity}.`,
      `  - Later workspace edits: ${run.laterWorkspaceEdits}; later capture gaps: ${run.laterCaptureGaps}.`,
      '',
    );
  if (briefing.recordedVerification.runs.length === 0)
    lines.push(
      'No recognized recorded test executions appear in this bounded record. This does not establish absence of other verification.',
      '',
    );
  lines.push(
    '### Submitted state',
    '',
    briefing.submittedState.text,
    '',
    `Source: \`${briefing.submittedState.evidenceRefs[0]}\`. Additions: ${briefing.submittedState.additions}; deletions: ${briefing.submittedState.deletions}. Paths are evidence data:`,
    '',
    '```json',
    JSON.stringify(briefing.submittedState.changedPaths),
    '```',
    '',
    '### Evidence limitations',
    '',
  );
  for (const limitation of briefing.evidenceLimitations)
    lines.push(
      `- ${limitation.text}`,
      `  - Authority: ${limitation.authority}; source: ${limitation.authority === 'evidence' ? limitation.evidenceRefs.map((ref) => `\`${ref}\``).join(', ') : `\`${limitation.source.fieldRef}\``}.`,
      '',
    );
  lines.push(
    '### Artifact availability',
    '',
    '```json',
    JSON.stringify(briefing.artifactAvailability, null, 2),
    '```',
    '',
    '### Review guidance',
    '',
  );
  for (const policy of briefing.reviewGuidance)
    lines.push(
      `Attributed static policy context: \`${policy.source.fieldRef}\` (version ${policy.source.version}).`,
      '',
      '```json',
      JSON.stringify(policy.authoredText),
      '```',
      '',
    );
  if (briefing.reviewGuidance.length === 0)
    lines.push('No static policy context is available for this session.', '');
  lines.push('### Evidence index', '');
  for (const entry of briefing.evidenceIndex)
    lines.push(
      `- \`${entry.evidenceRef}\` — ${entry.kind}, ${entry.basis}; raw IDs: ${entry.rawEventIds.map((id) => `\`${id}\``).join(', ') || 'session/artifact reference'}.`,
    );
  lines.push(
    '',
    '### Provenance',
    '',
    '```json',
    JSON.stringify(briefing.provenance, null, 2),
    '```',
    '',
  );
  for (const profile of briefingDepthProfiles) {
    const projection = projectBriefing(briefing, profile);
    lines.push(
      `## ${profile}`,
      '',
      'The projection retains every base statement ID, factual parameter, qualification, evidence reference and limitation above. The JSON artifact serializes the full projected briefing.',
      '',
      'Default detail:',
      '',
      '```json',
      JSON.stringify(projection.defaultDepth, null, 2),
      '```',
      '',
      'Core recorded activity and verification copy:',
      '',
    );
    for (const activity of projection.briefing.observedActivity)
      lines.push(
        `- ${activity.text} Source: ${activity.evidenceRefs.map((ref) => `\`${ref}\``).join(', ')}.`,
      );
    for (const run of projection.briefing.recordedVerification.runs)
      lines.push(
        `- ${run.result?.text ?? 'No supported test summary is available for this recorded execution.'} Source: ${run.evidenceRefs.map((ref) => `\`${ref}\``).join(', ')}.`,
      );
    lines.push(
      '',
      `All ${projection.briefing.evidenceIndex.length} source entries remain accessible. Material limitations and attributed guidance remain identical to the base briefing.`,
      '',
    );
  }
  return lines.join('\n');
};
