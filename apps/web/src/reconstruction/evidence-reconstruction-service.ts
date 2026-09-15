import { createHash, randomUUID } from 'node:crypto';

import { buildChronologicalReconstruction } from '../evidence/chronological-reconstruction';
import type { SessionEvent } from '../events/session-event';
import { buildEvidencePacket, digestEvidencePacket } from './evidence-packet';
import type { EvidenceReconstructionGenerator } from './evidence-reconstruction-generator';
import { buildEvidenceReferenceCatalog } from './evidence-reference-catalog';
import {
  EvidenceReconstructionError,
  type EvidenceReconstructionRecord,
  type ReconstructionFailureCode,
} from './evidence-reconstruction';
import { reconstructionPromptVersion } from './reconstruction-prompt';
import { validateReconstructionOutput } from './reconstruction-output-validator';
import type { SqliteEvidenceReconstructionStore } from './sqlite-evidence-reconstruction-store';

export const packetBuilderVersion = 'evidence-packet-v1';

export type SubmittedReconstructionEvidence = Readonly<{
  sessionId: string;
  scenario: Readonly<{
    title: string;
    brief: string;
    acceptanceCriteria: readonly string[];
  }>;
  activatedAt: string | null;
  submittedAt: string;
  diff: string;
  events: readonly SessionEvent[];
}>;

type ServiceOptions = Readonly<{
  now?: () => string;
  createId?: () => string;
  createAttemptToken?: () => string;
  providerTimeoutMs?: number;
  staleGraceMs?: number;
}>;

const failureCode = (error: unknown): ReconstructionFailureCode =>
  error instanceof EvidenceReconstructionError
    ? error.code
    : 'INTERNAL_GENERATION_ERROR';

const failureMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Reconstruction generation failed.';

export class EvidenceReconstructionService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createAttemptToken: () => string;
  private readonly providerTimeoutMs: number;
  private readonly staleGraceMs: number;

  constructor(
    private readonly store: SqliteEvidenceReconstructionStore,
    private readonly generator: EvidenceReconstructionGenerator,
    private readonly loadEvidence: (
      sessionId: string,
    ) => SubmittedReconstructionEvidence,
    options: ServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? randomUUID;
    this.createAttemptToken = options.createAttemptToken ?? randomUUID;
    this.providerTimeoutMs = options.providerTimeoutMs ?? 60_000;
    this.staleGraceMs = options.staleGraceMs ?? 5_000;
  }

  get(sessionId: string) {
    this.loadEvidence(sessionId);
    return this.store.getBySessionId(sessionId);
  }

  async ensure(
    sessionId: string,
    options: Readonly<{ retryFailed?: boolean }> = {},
  ): Promise<EvidenceReconstructionRecord> {
    const evidence = this.loadEvidence(sessionId);
    const existing = this.store.getBySessionId(sessionId);
    const claim = this.claimAttempt(evidence, existing, options.retryFailed);
    if (!claim.claimed) return claim.record;

    const reconstruction = buildChronologicalReconstruction(
      {
        activatedAt: evidence.activatedAt,
        submittedAt: evidence.submittedAt,
        submittedDiff: evidence.diff,
      },
      evidence.events,
    );
    const catalog = buildEvidenceReferenceCatalog(sessionId, reconstruction);
    let packetSha256: string | undefined;
    let providerMetadata:
      | Readonly<{
          providerId: string;
          modelId: string;
          requestId?: string;
        }>
      | undefined;
    if (this.generator.providerId && this.generator.modelId) {
      providerMetadata = {
        providerId: this.generator.providerId,
        modelId: this.generator.modelId,
      };
    }

    try {
      const packet = buildEvidencePacket(evidence, catalog);
      packetSha256 = digestEvidencePacket(packet);
      const generated = await this.generateWithTimeout(packet);
      providerMetadata = generated;
      const content = validateReconstructionOutput(
        generated.output,
        packet,
        catalog,
      );
      return this.store.completeAvailable({
        sessionId,
        attemptCount: claim.record.attemptCount,
        attemptToken: claim.record.attemptToken,
        providerId: generated.providerId,
        modelId: generated.modelId,
        providerRequestId: generated.requestId,
        sourcePacketSha256: packetSha256,
        content,
        now: this.now(),
      }).record;
    } catch (error) {
      return this.store.completeFailed({
        sessionId,
        attemptCount: claim.record.attemptCount,
        attemptToken: claim.record.attemptToken,
        failureCode: failureCode(error),
        failureMessage: failureMessage(error),
        sourcePacketSha256: packetSha256,
        providerId: providerMetadata?.providerId,
        modelId: providerMetadata?.modelId,
        providerRequestId: providerMetadata?.requestId,
        now: this.now(),
      }).record;
    }
  }

  private claimAttempt(
    evidence: SubmittedReconstructionEvidence,
    existing: EvidenceReconstructionRecord | null,
    retryFailed = false,
  ) {
    const now = this.now();
    const attemptToken = this.createAttemptToken();
    if (!existing) {
      const sequences = evidence.events.map((event) => event.sequence);
      return this.store.beginFirstAttempt({
        id: this.createId(),
        sessionId: evidence.sessionId,
        promptVersion: reconstructionPromptVersion,
        packetBuilderVersion,
        sourceFirstSequence:
          sequences.length > 0 ? Math.min(...sequences) : null,
        sourceLastSequence:
          sequences.length > 0 ? Math.max(...sequences) : null,
        sourceEventCount: evidence.events.length,
        finalDiffSha256: createHash('sha256')
          .update(evidence.diff)
          .digest('hex'),
        finalDiffBytes: Buffer.byteLength(evidence.diff, 'utf8'),
        attemptToken,
        now,
      });
    }
    if (existing.status === 'AVAILABLE') {
      return { claimed: false, record: existing };
    }
    if (existing.status === 'FAILED') {
      return retryFailed
        ? this.store.retryFailed(evidence.sessionId, attemptToken, now)
        : { claimed: false, record: existing };
    }

    const staleBefore = new Date(
      new Date(now).getTime() - this.providerTimeoutMs - this.staleGraceMs,
    ).toISOString();
    return this.store.reclaimStale(
      evidence.sessionId,
      staleBefore,
      attemptToken,
      now,
    );
  }

  private async generateWithTimeout(
    packet: Parameters<EvidenceReconstructionGenerator['generate']>[0],
  ) {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(
          new EvidenceReconstructionError(
            'PROVIDER_TIMEOUT',
            'The reconstruction provider timed out.',
          ),
        );
      }, this.providerTimeoutMs);
    });
    try {
      return await Promise.race([
        this.generator.generate(packet, { signal: controller.signal }),
        timedOut,
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
