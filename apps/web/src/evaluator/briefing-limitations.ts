import type { ScenarioSnapshot } from '../scenarios/slice-one-scenario';
import type { SemanticSnapshotRead } from '../scenarios/scenario-semantic-snapshot';
import type { BriefingWording } from './briefing-wording';
import { renderBriefingWording } from './briefing-wording';
import type {
  ArtifactAvailability,
  ContextSource,
  EvidenceLimitation,
  ObservedStatement,
} from './evaluator-briefing';
import type { BriefingFactEntry } from './briefing-verification';

export const briefingContextSource = (
  sessionId: string,
  authority: ContextSource['authority'],
  field: string,
  version: string | null,
): ContextSource => ({
  authority,
  fieldRef: `scenario:${sessionId}:${field}`,
  version,
});

export const buildBriefingLimitations = (
  sessionId: string,
  facts: readonly BriefingFactEntry[],
  observations: readonly ObservedStatement[],
  scenario: ScenarioSnapshot,
  semantics: SemanticSnapshotRead,
  availability: ArtifactAvailability,
): readonly EvidenceLimitation[] => {
  const limitations: EvidenceLimitation[] = [];
  const metadata = (
    kind:
      | 'missing_context'
      | 'missing_semantics'
      | 'unsupported_semantics'
      | 'unavailable_derived_artifact',
    wording: BriefingWording,
    source: ContextSource,
  ) =>
    limitations.push({
      id: kind,
      authority: 'metadata',
      kind,
      wording,
      text: renderBriefingWording(wording),
      source,
    });
  if (!scenario.evaluationContext)
    metadata(
      'missing_context',
      { key: 'missing_context' },
      briefingContextSource(
        sessionId,
        'evaluation_context',
        'evaluationContext',
        null,
      ),
    );
  if (semantics.status !== 'available')
    metadata(
      semantics.status === 'absent'
        ? 'missing_semantics'
        : 'unsupported_semantics',
      {
        key:
          semantics.status === 'absent'
            ? 'missing_semantics'
            : 'unsupported_semantics',
      },
      briefingContextSource(
        sessionId,
        'semantic_snapshot',
        'semanticSnapshot',
        null,
      ),
    );
  if (availability.reconstruction !== 'AVAILABLE')
    metadata(
      'unavailable_derived_artifact',
      {
        key:
          availability.reconstruction === 'FAILED'
            ? 'artifact_unavailable'
            : 'artifact_pending',
      },
      availability.source,
    );
  for (const { entry, fact } of facts) {
    const evidence = (
      kind: Extract<EvidenceLimitation, { authority: 'evidence' }>['kind'],
      wording: BriefingWording,
    ) =>
      limitations.push({
        id: `${kind}:${entry.evidenceRef}`,
        authority: 'evidence',
        kind,
        basis: 'chronology',
        evidenceRefs: [entry.evidenceRef],
        wording,
        text: renderBriefingWording(wording),
      });
    if (fact?.kind === 'evidence_gap')
      evidence('workspace_capture_gap', { key: 'workspace_gap' });
    if (
      fact?.kind === 'workspace_change' &&
      fact.files.some((file) => file.patchTruncated)
    )
      evidence('patch_truncation', { key: 'patch_truncated' });
    if (fact?.kind !== 'command_execution') continue;
    if (fact.stdoutTruncated)
      evidence('stdout_truncation', { key: 'stdout_truncated' });
    if (fact.stderrTruncated)
      evidence('stderr_truncation', { key: 'stderr_truncated' });
    if (
      observations.some(
        (observation) =>
          observation.factRef === entry.evidenceRef &&
          observation.kind === 'recorded_command',
      )
    )
      evidence('unsupported_semantic_mapping', { key: 'unsupported_mapping' });
  }
  return limitations;
};
