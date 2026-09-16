import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { EvidenceReconstructionRecord } from '../../apps/web/src/reconstruction/evidence-reconstruction';
import type {
  BriefingEvidenceInput as EvaluatorReviewEvidence,
  BriefingReconstructionInput as ReconstructionViewInput,
} from '../../apps/web/src/evaluator/evaluator-briefing';

export type BriefingFixture = Readonly<{
  evidence: EvaluatorReviewEvidence;
  reconstruction: ReconstructionViewInput;
}>;

export const readBriefingFixture = (
  caseId: 'C' | 'D' | 'F' | 'G',
): BriefingFixture => {
  if (caseId === 'C')
    return JSON.parse(
      readFileSync(
        path.join(process.cwd(), 'tests/fixtures/evaluator-briefing/C.json'),
        'utf8',
      ),
    ) as BriefingFixture;
  const fixture = JSON.parse(
    readFileSync(
      path.join(process.cwd(), `tests/fixtures/evaluator-gate/${caseId}.json`),
      'utf8',
    ),
  ) as {
    evidence: EvaluatorReviewEvidence;
    record: EvidenceReconstructionRecord;
  };
  const { attemptToken, promptVersion, ...safeRecord } = fixture.record;
  void attemptToken;
  return {
    evidence: fixture.evidence,
    reconstruction: {
      status: safeRecord.status,
      record: { ...safeRecord, generatorVersion: promptVersion },
      legacyArtifacts: [],
    },
  };
};
