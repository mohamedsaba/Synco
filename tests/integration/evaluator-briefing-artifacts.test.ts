import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';
import { buildReconstructionView } from '../../apps/web/src/reconstruction/evidence-reconstruction-runtime';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import { briefingSha256 } from '../../apps/web/src/evaluator/briefing-provenance';
import {
  briefingDepthProfiles,
  projectBriefing,
} from '../../apps/web/src/evaluator/project-evaluator-briefing';
import { renderBriefingReview } from '../support/evaluator-briefing-review';
import { readBriefingFixture } from '../support/evaluator-briefing-fixtures';

const manifest = JSON.parse(
  readFileSync('tests/fixtures/evaluator-gate/manifest.json', 'utf8'),
) as Array<{
  caseId: string;
  sessionId: string;
  authoritativeEvents: unknown[];
  submittedDiffSha256: string;
  generatorVersion: string;
}>;

it.skipIf(process.env.DELIMIT_CAPTURE_BRIEFING_C !== '1')(
  'preserves the existing original C record without rerunning or rewriting its history',
  async () => {
    const entry = manifest.find((entry) => entry.caseId === 'C')!;
    const directory = mkdtempSync(path.join(tmpdir(), 'delimit-briefing-c-'));
    const copy = path.join(directory, 'original-copy.sqlite');
    const sourcePath =
      '/tmp/delimit-deterministic-acceptance/acceptance.sqlite';
    const source = new Database(sourcePath, { readonly: true });
    try {
      await source.backup(copy);
      const service = new SessionService(new SqliteSessionStore(copy), {
        eventStore: new SqliteEventStore(copy),
      });
      const evidence = service.getSubmittedEvidence(entry.sessionId);
      const reconstruction = buildReconstructionView(
        new SqliteEvidenceReconstructionStore(copy),
        entry.sessionId,
      );
      expect(
        evidence.events.map(({ sequence, id, type }) => ({
          sequence,
          id,
          type,
        })),
      ).toEqual(entry.authoritativeEvents);
      expect(briefingSha256(evidence.diff)).toBe(entry.submittedDiffSha256);
      const sourceIdentity = reconstruction.record as {
        generatorVersion?: string;
        promptVersion?: string;
      } | null;
      expect(
        sourceIdentity?.generatorVersion ?? sourceIdentity?.promptVersion,
      ).toBe(entry.generatorVersion);
      expect(evidence.scenario.semanticSnapshot).toBeUndefined();
      writeFileSync(
        'tests/fixtures/evaluator-briefing/C.json',
        JSON.stringify(
          {
            source: {
              kind: 'preserved_existing_record',
              database: sourcePath,
              gateCase: 'C',
              acceptanceHistory: 'B',
              portableCapture: true,
            },
            evidence,
            reconstruction,
          },
          null,
          2,
        ) + '\n',
      );
    } finally {
      source.close();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);

describe('serialized briefing review artifacts', () => {
  it.each(['C', 'D', 'F', 'G'] as const)(
    'reproduces base and all depth projections for Case %s',
    (caseId) => {
      const fixture = readBriefingFixture(caseId);
      const briefing = buildEvaluatorBriefing(
        fixture.evidence,
        fixture.reconstruction,
      );
      const output = {
        caseId,
        source:
          caseId === 'C'
            ? 'tests/fixtures/evaluator-briefing/C.json: preserved original gate-C record'
            : `tests/fixtures/evaluator-gate/${caseId}.json`,
        baseBriefing: briefing,
        projections: Object.fromEntries(
          briefingDepthProfiles.map((profile) => [
            profile,
            projectBriefing(briefing, profile),
          ]),
        ),
      };
      const filename = `docs/artifacts/evaluator-briefing/${caseId}.json`;
      const reviewFilename = `docs/artifacts/evaluator-briefing/${caseId}.md`;
      if (process.env.DELIMIT_WRITE_BRIEFING_ARTIFACTS === '1') {
        writeFileSync(filename, JSON.stringify(output, null, 2) + '\n');
        writeFileSync(reviewFilename, renderBriefingReview(caseId, briefing));
      } else {
        expect(JSON.parse(readFileSync(filename, 'utf8'))).toEqual(output);
        // Markdown formatting may be normalized; factual content is checked in JSON.
        expect(readFileSync(reviewFilename, 'utf8')).toContain(
          briefing.provenance.authoritativeEvidenceSha256,
        );
      }
      expect(briefing.provenance.finalDiffSha256).toBe(
        manifest.find((entry) => entry.caseId === caseId)?.submittedDiffSha256,
      );
      expect(briefing.artifactAvailability.semantics).toBe('absent');
      for (const projection of Object.values(output.projections))
        expect(projection.briefing).toEqual(briefing);
      if (caseId === 'C')
        expect(
          briefing.recordedVerification.runs.map((run) => run.counts),
        ).toEqual([
          { passed: 0, failed: 3 },
          { passed: 0, failed: 3 },
        ]);
      if (caseId === 'D')
        expect(briefing.submittedState.changedPaths).toEqual([
          'inventory/service.py',
        ]);
      if (caseId === 'F')
        expect(
          briefing.evidenceLimitations.some(
            (item) => item.kind === 'workspace_capture_gap',
          ),
        ).toBe(true);
      if (caseId === 'G')
        expect(briefing.artifactAvailability.context).toBe('absent');
    },
  );
});
