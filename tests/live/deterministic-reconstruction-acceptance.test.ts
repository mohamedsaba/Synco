import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import {
  buildDeterministicReconstruction,
  DeterministicEvidenceReconstructionGenerator,
  deterministicReconstructionProviderId,
  deterministicReconstructionVersion,
} from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import { buildEvidencePacket } from '../../apps/web/src/reconstruction/evidence-packet';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import { scenarioAcceptanceHistories } from './scenario-acceptance-histories';

const liveEnabled = process.env.DELIMIT_DETERMINISTIC_ACCEPTANCE === '1';
const outputDirectory = '/tmp/delimit-deterministic-acceptance';
const databasePath = path.join(outputDirectory, 'acceptance.sqlite');
const forbiddenSemanticLanguage =
  /\bstale\b|\boutdated\b|\bcorrectly\b|\bsolved\b|\bconfirmed\b|\bbecause\b|\bin order to\b|\bto verify\b|\bto confirm\b/i;

describe.skipIf(!liveEnabled)('deterministic reconstruction acceptance', () => {
  it('renders fresh Scenario A-D histories from typed evidence', async () => {
    rmSync(outputDirectory, { recursive: true, force: true });
    mkdirSync(outputDirectory, { recursive: true });

    const eventStore = new SqliteEventStore(databasePath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const sessions = new SessionService(new SqliteSessionStore(databasePath), {
      eventStore,
      sandboxAdapter: sandbox,
    });
    const results: Record<string, unknown>[] = [];

    for (const [label, performHistory] of Object.entries(
      scenarioAcceptanceHistories,
    )) {
      const created = sessions.createSession({ scenarioId: scenario001.id });
      try {
        await sessions.activate(created.candidateToken);
        await performHistory(sessions, created.candidateToken);
        await sessions.submit(created.candidateToken);

        const evidence = sessions.getSubmittedEvidence(created.session.id);
        const chronology = buildChronologicalReconstruction(
          {
            activatedAt: evidence.activatedAt,
            submittedAt: evidence.submittedAt,
            submittedDiff: evidence.diff,
          },
          evidence.events,
        );
        const catalog = buildEvidenceReferenceCatalog(
          created.session.id,
          chronology,
        );
        const packet = buildEvidencePacket(evidence, catalog);
        const deterministic = buildDeterministicReconstruction(packet);
        const service = new EvidenceReconstructionService(
          new SqliteEvidenceReconstructionStore(databasePath),
          new DeterministicEvidenceReconstructionGenerator(),
          (sessionId) => sessions.getSubmittedEvidence(sessionId),
        );
        const record = await service.ensure(created.session.id);
        const prose = record.content?.statements
          .flatMap((statement) => [statement.text, statement.detail ?? ''])
          .join(' ');

        expect(record.status).toBe('AVAILABLE');
        expect(record).toMatchObject({
          providerId: deterministicReconstructionProviderId,
          modelId: deterministicReconstructionVersion,
          promptVersion: deterministicReconstructionVersion,
          providerRequestId: null,
        });
        expect(prose).not.toMatch(forbiddenSemanticLanguage);
        expect(
          record.content?.statements.every(
            (statement) =>
              statement.evidenceRefs.length > 0 &&
              statement.evidenceRefs.every((reference) =>
                catalog.byReference.has(reference),
              ),
          ),
        ).toBe(true);
        expect(
          record.content?.statements.some(
            (statement) => statement.text === 'Session submitted.',
          ),
        ).toBe(true);

        if (label === 'A') {
          expect(prose).toContain('3 tests failed.');
          expect(prose).toContain('1 passed, 2 failed.');
          expect(prose).not.toContain('Recorded command output:');
          expect(record.content?.statements).toHaveLength(3);
        }
        if (label === 'B') {
          expect(prose).not.toMatch(/normalization/i);
          expect(prose).toContain('Modified `inventory/service.py`.');
          expect(prose).toContain('The submitted state includes changes');
        }
        if (label === 'C') {
          expect(prose).toContain('3 tests passed.');
          expect(prose).toContain('`inventory/cache.py`');
          expect(prose).toContain('`inventory/service.py`');
          expect(prose).not.toMatch(/successful fix|resolved|correct/i);
        }
        if (label === 'D') {
          expect(prose).toContain(
            'The workspace returned to a previously recorded state.',
          );
          expect(prose).toContain('between recorded actions.');
          expect(prose.match(/tests? failed/g)?.length).toBeGreaterThanOrEqual(
            2,
          );
        }

        results.push({
          label,
          sessionId: created.session.id,
          workHistory: chronology.map((entry) =>
            entry.kind === 'COMMAND_EXECUTION'
              ? {
                  kind: entry.kind,
                  command: entry.command,
                  exitCode: entry.exitCode,
                }
              : entry.kind === 'WORKSPACE_CHANGE'
                ? {
                    kind: entry.kind,
                    origin: entry.origin,
                    files: entry.files.map((file) => file.path),
                  }
                : { kind: entry.kind },
          ),
          coverageAnchors: packet.coverageAnchors,
          audit: deterministic.traces.map((trace) => ({
            statement: trace.text,
            detail: trace.detail,
            typedFact: trace.fact,
            supportingRefs: trace.evidenceRefs,
            deterministicallySupported: true,
          })),
          record,
        });
      } finally {
        await sandbox.teardown(created.session.id).catch(() => undefined);
      }
    }

    const scenarioC = results.find((result) => result.label === 'C');
    const scenarioD = results.find((result) => result.label === 'D');
    expect(scenarioC?.audit).not.toEqual(scenarioD?.audit);

    writeFileSync(
      path.join(outputDirectory, 'results.json'),
      JSON.stringify(results, null, 2),
    );
  }, 600_000);
});
