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
import { scenarioAcceptanceHistories } from './scenario-acceptance-histories';

const outputDir = '/tmp/hirearchy-nvidia-single';

const liveEnabled = Boolean(process.env.NVIDIA_API_KEY);

describe.skipIf(!liveEnabled)('NVIDIA NIM single acceptance runner', () => {
  it('runs the requested synthetic history through live NIM inference', async () => {
    const sessionLabel = (process.env.ACCEPTANCE_SESSION || 'A').toUpperCase();
    const performHistory =
      scenarioAcceptanceHistories[
        sessionLabel as keyof typeof scenarioAcceptanceHistories
      ];
    if (!performHistory) {
      throw new Error(`Unknown session label: ${sessionLabel}`);
    }

    const databasePath = path.join(outputDir, `single-${sessionLabel}.sqlite`);
    mkdirSync(outputDir, { recursive: true });
    rmSync(databasePath, { force: true });

    const eventStore = new SqliteEventStore(databasePath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const sessions = new SessionService(new SqliteSessionStore(databasePath), {
      eventStore,
      sandboxAdapter: sandbox,
    });

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

      let lastOutput: unknown = null;
      const countingGenerator = {
        providerId: rawGenerator.providerId,
        modelId: rawGenerator.modelId,
        async generate(...p: Parameters<typeof rawGenerator.generate>) {
          generatorCalls += 1;
          const res = await rawGenerator.generate(...p);
          lastOutput = res.output;
          return res;
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
      expect(
        firstRecord.status,
        JSON.stringify(
          {
            failure: firstRecord.failureMessage,
            lastOutput,
          },
          null,
          2,
        ),
      ).toBe('AVAILABLE');

      const allRefsValid = firstRecord.content?.statements.every((s) =>
        s.evidenceRefs.every((ref) => catalog.byReference.has(ref)),
      );
      expect(allRefsValid).toBe(true);

      const result = {
        label: sessionLabel,
        sessionId: created.session.id,
        packetSizeBytes: packetBytes,
        coverageAnchorCount: packet.coverageAnchors.length,
        anchors: packet.coverageAnchors,
        requiredReferences: requiredRefs,
        workHistory: chronology.map((item) =>
          item.kind === 'COMMAND_EXECUTION'
            ? {
                kind: item.kind,
                command: item.command,
                exitCode: item.exitCode,
                timedOut: item.timedOut,
              }
            : item.kind === 'WORKSPACE_CHANGE'
              ? {
                  kind: item.kind,
                  origin: item.origin,
                  files: item.files.map((file) => file.path),
                }
              : { kind: item.kind },
        ),
        finalDiffExcerpt: packet.finalDiff.excerpt,
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
        provenance: {
          providerId: firstRecord.providerId,
          modelId: firstRecord.modelId,
          providerRequestId: firstRecord.providerRequestId,
          promptVersion: firstRecord.promptVersion,
          packetBuilderVersion: firstRecord.packetBuilderVersion,
          sourcePacketSha256: firstRecord.sourcePacketSha256,
        },
      };

      writeFileSync(
        path.join(outputDir, `result-${sessionLabel}.json`),
        JSON.stringify(result, null, 2),
      );
      writeFileSync(
        path.join(outputDir, 'result.json'),
        JSON.stringify(result, null, 2),
      );

      expect(firstRecord.status).toBe('AVAILABLE');
      expect(firstRecord.content?.statements.length).toBeGreaterThanOrEqual(3);
    } finally {
      await sandbox.teardown(created.session.id).catch(() => undefined);
    }
  }, 120_000);
});
