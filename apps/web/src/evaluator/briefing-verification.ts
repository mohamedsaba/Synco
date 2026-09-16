import type { EvidenceCatalogEntry } from '../reconstruction/evidence-reference-catalog';
import type { TypedEvidenceFact } from '../reconstruction/typed-evidence-fact';
import { renderBriefingWording } from './briefing-wording';
import type { BriefingWording } from './briefing-wording';
import type { RecordedVerification } from './evaluator-briefing';
import { mapBriefingObservation } from './briefing-semantic-mapper';

export type BriefingFactEntry = Readonly<{
  entry: EvidenceCatalogEntry;
  fact: TypedEvidenceFact | null;
}>;

export const buildBriefingVerification = (
  facts: readonly BriefingFactEntry[],
): RecordedVerification => {
  const executions = facts.filter(
    ({ entry, fact }) =>
      fact &&
      mapBriefingObservation(entry, fact, undefined, false)?.kind ===
        'recorded_verification_execution',
  );
  return {
    scope: 'recognized_recorded_executions_only',
    runs: executions.map(({ entry, fact }, index) => {
      if (fact?.kind !== 'command_execution')
        throw new Error('Invalid verification execution.');
      const evidenceRefs = [entry.evidenceRef] as const;
      const counts =
        fact.output?.kind === 'test_summary'
          ? { passed: fact.output.passed, failed: fact.output.failed }
          : null;
      const position =
        executions.length === 1
          ? 'only'
          : index === 0
            ? 'first'
            : index === executions.length - 1
              ? 'final'
              : 'later';
      const wording: BriefingWording | null = counts
        ? { key: 'verification_result', position, ...counts }
        : null;
      const later = facts.filter(
        (item) =>
          (item.entry.chronologyOrder ?? -1) > (entry.chronologyOrder ?? -1),
      );
      return {
        id: `verification:${entry.evidenceRef}`,
        evidenceRefs,
        chronologyOrder: entry.chronologyOrder!,
        exitCode: fact.exitCode,
        timedOut: fact.timedOut,
        stdoutTruncated: fact.stdoutTruncated,
        stderrTruncated: fact.stderrTruncated,
        counts,
        testIdentity: 'unknown' as const,
        laterWorkspaceEdits: later.some(
          (item) => item.fact?.kind === 'workspace_change',
        ),
        laterCaptureGaps: later.some(
          (item) => item.fact?.kind === 'evidence_gap',
        ),
        result: wording
          ? {
              id: `result:${entry.evidenceRef}`,
              kind: 'recorded_verification_result' as const,
              basis: 'chronology' as const,
              evidenceRefs,
              wording,
              text: renderBriefingWording(wording),
            }
          : null,
      };
    }),
  };
};
