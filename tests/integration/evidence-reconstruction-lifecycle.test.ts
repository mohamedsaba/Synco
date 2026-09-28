import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { EvidencePacketV1 } from '../../apps/web/src/reconstruction/evidence-packet';
import {
  DeterministicEvidenceReconstructionGenerator,
  deterministicReconstructionProviderId,
  deterministicReconstructionVersion,
} from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import { EvidenceReconstructionService } from '../../apps/web/src/reconstruction/evidence-reconstruction-service';
import { FakeEvidenceReconstructionGenerator } from '../../apps/web/src/reconstruction/evidence-reconstruction-generator';
import { SqliteEvidenceReconstructionStore } from '../../apps/web/src/reconstruction/sqlite-evidence-reconstruction-store';

const sessionId = 'submitted-session';

const evidence = {
  sessionId,
  scenario: {
    title: 'Scenario',
    brief: 'Investigate observable behavior.',
    acceptanceCriteria: ['Preserve evidence.'],
  },
  activatedAt: '2026-09-15T10:00:00.000Z',
  submittedAt: '2026-09-15T10:02:00.000Z',
  diff: 'diff --git a/a b/a',
  events: [],
};

const validOutput = (packet: EvidencePacketV1) => ({
  output: {
    schemaVersion: 1,
    statements: [
      {
        text: 'The session reached its submission boundary.',
        claimBasis: 'chronology',
        evidenceRefs: [`session:${sessionId}:submitted`],
      },
      {
        text: 'The submitted repository contains a final diff.',
        claimBasis: 'final_state',
        evidenceRefs: [packet.finalDiff.evidenceRef],
      },
    ],
  },
  providerId: 'test-provider',
  modelId: 'test-model',
  requestId: 'request-1',
});

describe('evidence reconstruction persistence lifecycle', () => {
  let directory: string;
  let databasePath: string;
  let tick: number;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'hirearchy-reconstruction-'));
    databasePath = path.join(directory, 'hirearchy.sqlite');
    tick = 0;
  });

  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  const createService = (
    generator: FakeEvidenceReconstructionGenerator,
    now = () => `2026-09-15T10:0${tick++}:00.000Z`,
  ) =>
    new EvidenceReconstructionService(
      new SqliteEvidenceReconstructionStore(databasePath),
      generator,
      () => evidence,
      {
        now,
        createId: () => 'reconstruction-1',
        createAttemptToken: () => `attempt-${tick}`,
        providerTimeoutMs: 1000,
        staleGraceMs: 0,
      },
    );

  it('persists one immutable available reconstruction and reuses it', async () => {
    const generator = new FakeEvidenceReconstructionGenerator(validOutput);
    const service = createService(generator);

    const first = await service.ensure(sessionId);
    const second = await service.ensure(sessionId);

    expect(first.status).toBe('AVAILABLE');
    expect(first.content?.statements).toHaveLength(2);
    expect(first.sourcePacketSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toMatchObject({
      providerId: 'test-provider',
      modelId: 'test-model',
      providerRequestId: 'request-1',
    });
    expect(second).toEqual(first);
    expect(generator.calls).toHaveLength(1);
  });

  it('creates immutable Candidate Work deterministically without provider configuration', async () => {
    const service = new EvidenceReconstructionService(
      new SqliteEvidenceReconstructionStore(databasePath),
      new DeterministicEvidenceReconstructionGenerator(),
      () => evidence,
      {
        now: () => '2026-09-15T10:00:00.000Z',
        createId: () => 'deterministic-reconstruction',
        createAttemptToken: () => 'deterministic-attempt',
      },
    );

    const first = await service.ensure(sessionId);
    const second = await service.ensure(sessionId);

    expect(first).toMatchObject({
      status: 'AVAILABLE',
      providerId: deterministicReconstructionProviderId,
      modelId: deterministicReconstructionVersion,
      promptVersion: deterministicReconstructionVersion,
      providerRequestId: null,
      attemptCount: 1,
    });
    expect(
      first.content?.statements.map((statement) => statement.text),
    ).toEqual([
      'Session submitted.',
      'The submitted state includes changes to `a`.',
    ]);
    expect(second).toEqual(first);
  });

  it('persists failure without touching evidence and retries only explicitly', async () => {
    let shouldFail = true;
    const generator = new FakeEvidenceReconstructionGenerator((packet) =>
      shouldFail
        ? {
            output: { malformed: true },
            providerId: 'test-provider',
            modelId: 'test-model',
          }
        : validOutput(packet),
    );
    const service = createService(generator);

    expect((await service.ensure(sessionId)).status).toBe('FAILED');
    expect((await service.ensure(sessionId)).status).toBe('FAILED');
    expect(generator.calls).toHaveLength(1);

    shouldFail = false;
    const retried = await service.ensure(sessionId, { retryFailed: true });
    expect(retried.status).toBe('AVAILABLE');
    expect(retried.attemptCount).toBe(2);
    expect(generator.calls).toHaveLength(2);
    expect(evidence.diff).toBe('diff --git a/a b/a');
  });

  it('persists bounded provider provenance when the provider is unavailable', async () => {
    const generator = Object.assign(
      new FakeEvidenceReconstructionGenerator(() => {
        throw new Error('sensitive provider detail');
      }),
      { providerId: 'provider-id', modelId: 'model-id' },
    );

    const failed = await createService(generator).ensure(sessionId);

    expect(failed).toMatchObject({
      status: 'FAILED',
      providerId: 'provider-id',
      modelId: 'model-id',
      failureCode: 'INTERNAL_GENERATION_ERROR',
    });
  });

  it('allows only one concurrent provider call for a fresh pending attempt', async () => {
    let release: ((value: ReturnType<typeof validOutput>) => void) | undefined;
    const pending = new Promise<ReturnType<typeof validOutput>>((resolve) => {
      release = resolve;
    });
    const generator = new FakeEvidenceReconstructionGenerator(() => pending);
    const service = createService(generator, () => '2026-09-15T10:00:00.000Z');

    const first = service.ensure(sessionId);
    const second = await service.ensure(sessionId);

    expect(second.status).toBe('PENDING');
    expect(generator.calls).toHaveLength(1);
    release?.(validOutput(generator.calls[0]));
    expect((await first).status).toBe('AVAILABLE');
  });

  it('reclaims stale pending and rejects completion from its former owner', () => {
    const store = new SqliteEvidenceReconstructionStore(databasePath);
    const first = store.beginFirstAttempt({
      id: 'reconstruction-1',
      sessionId,
      promptVersion: 'prompt-v1',
      packetBuilderVersion: 'packet-v1',
      sourceFirstSequence: null,
      sourceLastSequence: null,
      sourceEventCount: 0,
      finalDiffSha256: 'digest',
      finalDiffBytes: 4,
      attemptToken: 'old-token',
      now: '2026-09-15T10:00:00.000Z',
    });
    const reclaimed = store.reclaimStale(
      sessionId,
      'prompt-v1',
      '2026-09-15T10:01:00.000Z',
      'new-token',
      '2026-09-15T10:02:00.000Z',
    );
    const obsolete = store.completeFailed({
      sessionId,
      promptVersion: 'prompt-v1',
      attemptCount: first.record.attemptCount,
      attemptToken: 'old-token',
      failureCode: 'INTERNAL_GENERATION_ERROR',
      failureMessage: 'obsolete',
      now: '2026-09-15T10:03:00.000Z',
    });

    expect(reclaimed.claimed).toBe(true);
    expect(reclaimed.record.attemptCount).toBe(2);
    expect(obsolete.completed).toBe(false);
    expect(obsolete.record.status).toBe('PENDING');
  });

  it('bounds provider execution with a hard timeout', async () => {
    const generator = new FakeEvidenceReconstructionGenerator(
      () => new Promise(() => undefined),
    );
    const service = new EvidenceReconstructionService(
      new SqliteEvidenceReconstructionStore(databasePath),
      generator,
      () => evidence,
      {
        now: () => '2026-09-15T10:00:00.000Z',
        createId: () => 'reconstruction-1',
        createAttemptToken: () => 'attempt-1',
        providerTimeoutMs: 5,
        staleGraceMs: 0,
      },
    );

    const result = await service.ensure(sessionId);
    expect(result.status).toBe('FAILED');
    expect(result.failureCode).toBe('PROVIDER_TIMEOUT');
  });
});
