import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { buildEvidencePacket } from '../../apps/web/src/reconstruction/evidence-packet';
import type { EvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/evidence-reconstruction-generator';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { NvidiaNimEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/nvidia-nim-evidence-reconstruction-generator';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import {
  applyCompleteFix,
  applyPartialFix,
  resetAndVerify,
} from './nvidia-nim-acceptance-fixtures';

const liveEnabled =
  process.env.DELIMIT_LIVE_NIM_ACCEPTANCE === '1' &&
  Boolean(process.env.NVIDIA_API_KEY);
const liveDirectory = '/tmp/delimit-nvidia-live-acceptance';
const databasePath = path.join(liveDirectory, 'acceptance.sqlite');

class CountingGenerator implements EvidenceReconstructionGenerator {
  readonly providerId: string;
  readonly modelId: string;
  calls = 0;
  lastOutput: unknown;

  constructor(private readonly delegate: EvidenceReconstructionGenerator) {
    this.providerId = delegate.providerId ?? 'unknown';
    this.modelId = delegate.modelId ?? 'unknown';
  }

  async generate(
    ...parameters: Parameters<EvidenceReconstructionGenerator['generate']>
  ) {
    this.calls += 1;
    const generated = await this.delegate.generate(...parameters);
    this.lastOutput = generated.output;
    return generated;
  }
}

const histories: Record<
  string,
  (service: SessionService, token: string) => Promise<void>
> = {
  A: async (service, token) => {
    await service.executeCommand(
      token,
      "psql -h 127.0.0.1 -U delimit -d inventory -t -A -c \"SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';\"",
    );
    await service.executeCommand(
      token,
      'redis-cli get "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
    await service.executeCommand(
      token,
      'redis-cli del "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
  },
  B: async (service, token) => {
    await service.executeCommand(token, 'pytest');
    await applyPartialFix(service, token);
    await service.executeCommand(token, 'pytest');
  },
  C: async (service, token) => {
    await service.executeCommand(
      token,
      "psql -h 127.0.0.1 -U delimit -d inventory -t -A -c \"SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';\"",
    );
    await service.executeCommand(
      token,
      'redis-cli get "stock:wh-east-01:PROD-1001"',
    );
    await service.executeCommand(token, 'pytest');
    await applyCompleteFix(service, token);
    await resetAndVerify(service, token);
  },
  D: async (service, token) => {
    await service.executeCommand(token, 'pytest');
    const original = await applyPartialFix(service, token);
    await service.executeCommand(token, 'pytest');
    await service.saveWorkspaceFile(token, 'inventory/service.py', original);
    await service.executeCommand(
      token,
      'python3 -c \'import time; time.sleep(1); open("notes.txt", "w").write("synthetic note\\n")\' >/dev/null 2>&1 &',
    );
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await service.executeCommand(token, 'pwd');
    await service.executeCommand(token, 'rm notes.txt');
    await applyCompleteFix(service, token);
    await service.executeCommand(token, 'pytest');
    await resetAndVerify(service, token);
  },
};

describe.skipIf(!liveEnabled)('NVIDIA NIM live acceptance', () => {
  it('runs four synthetic Scenario 001 histories through real hosted inference', async () => {
    rmSync(liveDirectory, { recursive: true, force: true });
    mkdirSync(liveDirectory, { recursive: true });
    const eventStore = new SqliteEventStore(databasePath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const sessions = new SessionService(new SqliteSessionStore(databasePath), {
      eventStore,
      sandboxAdapter: sandbox,
    });
    const results: unknown[] = [];

    for (const [label, performHistory] of Object.entries(histories)) {
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
        let rawNimContent: unknown;
        const capturingFetch: typeof fetch = async (...parameters) => {
          const response = await fetch(...parameters);
          const rawEnvelope = await response.clone().text();
          try {
            const envelope = JSON.parse(rawEnvelope) as {
              choices?: { message?: { content?: unknown } }[];
            };
            rawNimContent = {
              status: response.status,
              content: envelope.choices?.[0]?.message?.content,
            };
          } catch {
            rawNimContent = { status: response.status, rawEnvelope };
          }
          return response;
        };
        const generator = new CountingGenerator(
          new NvidiaNimEvidenceReconstructionGenerator(
            process.env.NVIDIA_API_KEY!,
            capturingFetch,
          ),
        );
        const reconstructionService = new EvidenceReconstructionService(
          new SqliteEvidenceReconstructionStore(databasePath),
          generator,
          (sessionId) => sessions.getSubmittedEvidence(sessionId),
          { providerTimeoutMs: 60_000 },
        );
        const first = await reconstructionService.ensure(created.session.id);
        const refreshed = await reconstructionService.ensure(
          created.session.id,
        );
        expect(
          first.status,
          JSON.stringify(
            {
              failure: first.failureMessage,
              anchors: packet.coverageAnchors,
              output: generator.lastOutput,
              rawNimContent,
            },
            null,
            2,
          ),
        ).toBe('AVAILABLE');
        expect(refreshed).toEqual(first);
        expect(generator.calls).toBe(1);
        expect(first.providerId).toBe('nvidia-nim-hosted');
        expect(first.modelId).toBe('nvidia/nemotron-3.5-lightning-30b-a3b');
        expect(
          first.content?.statements.every((statement) =>
            statement.evidenceRefs.every((reference) =>
              catalog.byReference.has(reference),
            ),
          ),
        ).toBe(true);
        results.push({
          label,
          sessionId: created.session.id,
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
          coverageAnchors: packet.coverageAnchors,
          reconstruction: first.content,
          provenance: {
            providerId: first.providerId,
            modelId: first.modelId,
            providerRequestId: first.providerRequestId,
            promptVersion: first.promptVersion,
            packetBuilderVersion: first.packetBuilderVersion,
            sourcePacketSha256: first.sourcePacketSha256,
          },
        });
      } finally {
        await sandbox.teardown(created.session.id).catch(() => undefined);
      }
    }

    writeFileSync(
      path.join(liveDirectory, 'results.json'),
      JSON.stringify(results, null, 2),
    );
    console.log(JSON.stringify(results, null, 2));
  }, 600_000);
});
