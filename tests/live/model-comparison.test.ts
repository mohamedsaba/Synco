import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import {
  buildEvidencePacket,
  digestEvidencePacket,
} from '../../apps/web/src/reconstruction/evidence-packet';
import type { EvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/evidence-reconstruction-generator';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { NvidiaNimEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/nvidia-nim-evidence-reconstruction-generator';
import { OpenRouterEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/openrouter-evidence-reconstruction-generator';
import { validateReconstructionOutput } from '../../apps/web/src/reconstruction/reconstruction-output-validator';
import { reconstructionPromptVersion } from '../../apps/web/src/reconstruction/reconstruction-prompt';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { scenario001 } from '../../apps/web/src/scenarios/scenario-001';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';
import { scenarioAcceptanceHistories } from './scenario-acceptance-histories';

const outputDirectory = '/tmp/delimit-model-experiment';
const databasePath = path.join(outputDirectory, 'scenario-a.sqlite');
const experimentEnabled =
  process.env.DELIMIT_MODEL_EXPERIMENT === '1' &&
  Boolean(process.env.NVIDIA_API_KEY) &&
  Boolean(process.env.OPENROUTER_KEY);

type Candidate = Readonly<{
  providerId: string;
  modelId: string;
  structuredOutputRequested: boolean;
  createGenerator(
    fetchImplementation: typeof fetch,
  ): EvidenceReconstructionGenerator;
}>;

const candidates: readonly Candidate[] = [
  {
    providerId: 'nvidia-nim-hosted',
    modelId: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    structuredOutputRequested: true,
    createGenerator: (fetchImplementation) =>
      new NvidiaNimEvidenceReconstructionGenerator(
        process.env.NVIDIA_API_KEY!,
        fetchImplementation,
      ),
  },
  {
    providerId: 'openrouter',
    modelId: 'nvidia/nemotron-3.5-lightning:free',
    structuredOutputRequested: false,
    createGenerator: (fetchImplementation) =>
      new OpenRouterEvidenceReconstructionGenerator(
        process.env.OPENROUTER_KEY!,
        {
          modelId: 'nvidia/nemotron-3.5-lightning:free',
          supportsStructuredOutput: false,
        },
        fetchImplementation,
      ),
  },
  {
    providerId: 'openrouter',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    structuredOutputRequested: true,
    createGenerator: (fetchImplementation) =>
      new OpenRouterEvidenceReconstructionGenerator(
        process.env.OPENROUTER_KEY!,
        {
          modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
          supportsStructuredOutput: true,
        },
        fetchImplementation,
      ),
  },
  {
    providerId: 'openrouter',
    modelId: 'google/gemma-4-31b-it:free',
    structuredOutputRequested: true,
    createGenerator: (fetchImplementation) =>
      new OpenRouterEvidenceReconstructionGenerator(
        process.env.OPENROUTER_KEY!,
        {
          modelId: 'google/gemma-4-31b-it:free',
          supportsStructuredOutput: true,
        },
        fetchImplementation,
      ),
  },
];

const selectedCandidates = process.env.DELIMIT_MODEL_EXPERIMENT_MODEL
  ? candidates.filter(
      (candidate) =>
        candidate.modelId === process.env.DELIMIT_MODEL_EXPERIMENT_MODEL,
    )
  : candidates;

const safeFailure = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  ) {
    return { code: error.code, message: error.message };
  }
  return {
    code: 'UNEXPECTED_FAILURE',
    message: 'The experimental generation failed unexpectedly.',
  };
};

describe.skipIf(!experimentEnabled)('Slice 5 model comparison', () => {
  it('reuses one Scenario A packet for two runs of every explicit model', async () => {
    mkdirSync(outputDirectory, { recursive: true });
    rmSync(databasePath, { force: true });

    const eventStore = new SqliteEventStore(databasePath);
    const sandbox = new DockerSandboxAdapter({ defaultTimeoutMs: 30_000 });
    const sessions = new SessionService(new SqliteSessionStore(databasePath), {
      eventStore,
      sandboxAdapter: sandbox,
    });
    const created = sessions.createSession({ scenarioId: scenario001.id });
    const results: Record<string, unknown>[] = [];

    try {
      await sessions.activate(created.candidateToken);
      await scenarioAcceptanceHistories.A(sessions, created.candidateToken);
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
      const packetSha256 = digestEvidencePacket(packet);

      for (const candidate of selectedCandidates) {
        for (let run = 1; run <= 2; run += 1) {
          let providerHttpStatus: number | null = null;
          const capturingFetch: typeof fetch = async (...parameters) => {
            const response = await fetch(...parameters);
            providerHttpStatus = response.status;
            return response;
          };
          const generator = candidate.createGenerator(capturingFetch);
          const startedAt = new Date().toISOString();
          const startedAtMs = Date.now();

          try {
            const generated = await generator.generate(packet, {
              signal: AbortSignal.timeout(60_000),
            });
            const latencyMs = Date.now() - startedAtMs;
            try {
              const validated = validateReconstructionOutput(
                generated.output,
                packet,
                catalog,
              );
              results.push({
                providerId: candidate.providerId,
                modelId: candidate.modelId,
                run,
                startedAt,
                latencyMs,
                providerHttpStatus,
                promptVersion: reconstructionPromptVersion,
                packetSha256,
                generationParameters: {
                  temperature: 0.2,
                  maxTokens: 2_048,
                  stream: false,
                  reasoning: 'disabled',
                  structuredOutputRequested:
                    candidate.structuredOutputRequested,
                },
                requestId: generated.requestId,
                output: generated.output,
                structuralValidation: { status: 'passed' },
                validated,
              });
            } catch (error) {
              results.push({
                providerId: candidate.providerId,
                modelId: candidate.modelId,
                run,
                startedAt,
                latencyMs,
                providerHttpStatus,
                promptVersion: reconstructionPromptVersion,
                packetSha256,
                generationParameters: {
                  temperature: 0.2,
                  maxTokens: 2_048,
                  stream: false,
                  reasoning: 'disabled',
                  structuredOutputRequested:
                    candidate.structuredOutputRequested,
                },
                requestId: generated.requestId,
                output: generated.output,
                structuralValidation: {
                  status: 'failed',
                  failure: safeFailure(error),
                },
              });
            }
          } catch (error) {
            results.push({
              providerId: candidate.providerId,
              modelId: candidate.modelId,
              run,
              startedAt,
              latencyMs: Date.now() - startedAtMs,
              providerHttpStatus,
              promptVersion: reconstructionPromptVersion,
              packetSha256,
              generationParameters: {
                temperature: 0.2,
                maxTokens: 2_048,
                stream: false,
                reasoning: 'disabled',
                structuredOutputRequested: candidate.structuredOutputRequested,
              },
              generationFailure: safeFailure(error),
            });
          }
        }
      }

      const resultFileName = process.env.DELIMIT_MODEL_EXPERIMENT_MODEL
        ? `results-${process.env.DELIMIT_MODEL_EXPERIMENT_MODEL.replace(/[^a-z0-9]+/gi, '-')}.json`
        : 'results.json';
      writeFileSync(
        path.join(outputDirectory, resultFileName),
        JSON.stringify(
          {
            scenario: 'A',
            sessionId: created.session.id,
            promptVersion: reconstructionPromptVersion,
            packetSha256,
            packet,
            results,
          },
          null,
          2,
        ),
      );

      expect(selectedCandidates).not.toHaveLength(0);
      expect(results).toHaveLength(selectedCandidates.length * 2);
      expect(new Set(results.map((result) => result.packetSha256))).toEqual(
        new Set([packetSha256]),
      );
    } finally {
      await sandbox.teardown(created.session.id).catch(() => undefined);
    }
  }, 600_000);
});
