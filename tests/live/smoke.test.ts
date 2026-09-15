import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { buildEvidencePacket } from '../../apps/web/src/reconstruction/evidence-packet';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { NvidiaNimEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/nvidia-nim-evidence-reconstruction-generator';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import { applyPartialFix } from './nvidia-nim-acceptance-fixtures';

const smokeDirectory = '/tmp/delimit-nvidia-smoke';
const databasePath = path.join(smokeDirectory, 'smoke.sqlite');
const liveEnabled = Boolean(process.env.NVIDIA_API_KEY);

describe.skipIf(!liveEnabled)('NVIDIA NIM isolated smoke test', () => {
  it('runs isolated smoke session (Session B) and measures provider, validation, persistence, and reuse', async () => {
    rmSync(smokeDirectory, { recursive: true, force: true });
    mkdirSync(smokeDirectory, { recursive: true });

    const eventStore = new SqliteEventStore(databasePath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const sessions = new SessionService(new SqliteSessionStore(databasePath), {
      eventStore,
      sandboxAdapter: sandbox,
    });

    const created = sessions.createSession({ scenarioId: scenario001.id });
    try {
      await sessions.activate(created.candidateToken);
      // Session B history: pytest -> applyPartialFix -> pytest -> submit
      await sessions.executeCommand(created.candidateToken, 'pytest');
      await applyPartialFix(sessions, created.candidateToken);
      await sessions.executeCommand(created.candidateToken, 'pytest');
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
      const packetBytes = Buffer.byteLength(JSON.stringify(packet), 'utf8');
      const requiredRefs = Array.from(
        new Set(
          packet.coverageAnchors.flatMap((anchor) => anchor.evidenceRefs),
        ),
      );

      let providerHttpStatus = 0;
      let generatorCalls = 0;
      const capturingFetch: typeof fetch = async (...params) => {
        const response = await fetch(...params);
        providerHttpStatus = response.status;
        return response;
      };

      const rawGenerator = new NvidiaNimEvidenceReconstructionGenerator(
        process.env.NVIDIA_API_KEY!,
        capturingFetch,
      );

      const countingGenerator = {
        providerId: rawGenerator.providerId,
        modelId: rawGenerator.modelId,
        async generate(...p: Parameters<typeof rawGenerator.generate>) {
          generatorCalls += 1;
          return rawGenerator.generate(...p);
        },
      };

      const reconstructionStore = new SqliteEvidenceReconstructionStore(
        databasePath,
      );
      const reconstructionService = new EvidenceReconstructionService(
        reconstructionStore,
        countingGenerator,
        (sessionId) => sessions.getSubmittedEvidence(sessionId),
        { providerTimeoutMs: 60_000 },
      );

      const requestStart = new Date();
      const requestStartTime = requestStart.toISOString();
      const startTimeMs = Date.now();

      const firstRecord = await reconstructionService.ensure(
        created.session.id,
      );

      const requestEnd = new Date();
      const requestEndTime = requestEnd.toISOString();
      const providerLatencyMs = Date.now() - startTimeMs;

      // Test refresh reuse: ensures second call does not invoke generator again
      const refreshedRecord = await reconstructionService.ensure(
        created.session.id,
      );
      expect(generatorCalls).toBe(1);
      expect(refreshedRecord).toEqual(firstRecord);
      expect(firstRecord.status).toBe('AVAILABLE');

      // Verify persisted content resolves references against catalog
      const allRefsValid = firstRecord.content?.statements.every((s) =>
        s.evidenceRefs.every((ref) => catalog.byReference.has(ref)),
      );
      expect(allRefsValid).toBe(true);

      const report = {
        sessionId: created.session.id,
        packetSizeBytes: packetBytes,
        coverageAnchorCount: packet.coverageAnchors.length,
        anchors: packet.coverageAnchors,
        requiredReferences: requiredRefs,
        requestStartTime,
        requestEndTime,
        providerLatencyMs,
        providerHttpStatus,
        reconstructionStatus: firstRecord.status,
        generatorCalls,
        refreshReusedPersisted:
          refreshedRecord === firstRecord ||
          JSON.stringify(refreshedRecord) === JSON.stringify(firstRecord),
        allEvidenceRefsResolved: allRefsValid,
        statementsCount: firstRecord.content?.statements.length,
        statements: firstRecord.content?.statements,
      };

      writeFileSync(
        path.join(smokeDirectory, 'report.json'),
        JSON.stringify(report, null, 2),
      );

      expect(firstRecord.status).toBe('AVAILABLE');
      expect(firstRecord.content?.statements.length).toBeGreaterThanOrEqual(3);
    } finally {
      await sandbox.teardown(created.session.id).catch(() => undefined);
    }
  }, 120_000);
});
