import { buildChronologicalReconstruction } from '../evidence/chronological-reconstruction';
import { buildEvidenceReferenceCatalog } from '../reconstruction/evidence-reference-catalog';
import { deterministicReconstructionVersion } from '../reconstruction/deterministic-evidence-reconstruction-generator';
import { initialReconstructionLimits } from '../reconstruction/reconstruction-limits';
import { buildTypedEvidenceFact } from '../reconstruction/typed-evidence-fact';
import { readScenarioSemanticSnapshot } from '../scenarios/scenario-semantic-snapshot';
import {
  briefingWordingVersion,
  renderBriefingWording,
} from './briefing-wording';
import { briefingDataSha256, briefingSha256 } from './briefing-provenance';
import {
  briefingMapperVersion,
  mapBriefingObservation,
} from './briefing-semantic-mapper';
import { buildBriefingSubmittedState } from './briefing-submitted-state';
import { buildBriefingVerification } from './briefing-verification';
import { buildBriefingLimitations } from './briefing-limitations';
import {
  buildBriefingTaskContext,
  buildBriefingReviewGuidance,
} from './briefing-context';
import { validateBriefingGrounding } from './briefing-grounding';
import type {
  BriefingEvidenceInput,
  BriefingReconstructionInput,
  ArtifactAvailability,
  EvaluatorBriefing,
  ObservedStatement,
  BriefingSessionDuration,
  BriefingAiSummary,
} from './evaluator-briefing';
import type { ReconstructionItem } from '../evidence/chronological-reconstruction';
import type { EvidenceCatalogEntry } from '../reconstruction/evidence-reference-catalog';
import type { TypedEvidenceFact } from '../reconstruction/typed-evidence-fact';
import type { AiCapabilitySnapshot } from '../ai/ai-interaction';

export const briefingBuilderVersion = 'evaluator-briefing-v2';
export const briefingProjectionVersion = 'briefing-depth-v2';

export const buildBriefingAiSummary = (
  snapshot: AiCapabilitySnapshot | null | undefined,
  facts: readonly {
    entry: EvidenceCatalogEntry;
    fact: TypedEvidenceFact | null;
  }[],
  chronology: readonly ReconstructionItem[],
): BriefingAiSummary => {
  if (snapshot === undefined || snapshot === null) {
    return {
      capabilityState: 'legacy',
      configuredModelId: null,
      configuredProviderId: null,
      totalInteractions: 0,
      completedCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      providerInterruptionNotice: null,
      interleaved: false,
      summaryText: 'AI capture was not available for this session version.',
    };
  }

  if (!snapshot.enabled) {
    return {
      capabilityState: 'disabled',
      configuredModelId: snapshot.configuredModelId ?? null,
      configuredProviderId: snapshot.configuredProviderId ?? null,
      totalInteractions: 0,
      completedCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      providerInterruptionNotice: null,
      interleaved: false,
      summaryText: 'Integrated AI capability was disabled for this assessment.',
    };
  }

  const interactionIds = new Set<string>();
  let completedCount = 0;
  let failedCount = 0;
  let cancelledCount = 0;
  let hasProviderError = false;
  let hasTimeout = false;

  for (const { fact } of facts) {
    if (!fact) continue;
    if (fact.kind === 'ai_request_started') {
      interactionIds.add(fact.interactionId);
    } else if (fact.kind === 'ai_response_completed') {
      interactionIds.add(fact.interactionId);
      completedCount++;
    } else if (fact.kind === 'ai_request_cancelled') {
      interactionIds.add(fact.interactionId);
      cancelledCount++;
    } else if (fact.kind === 'ai_request_failed') {
      interactionIds.add(fact.interactionId);
      failedCount++;
      if (
        fact.failureReason === 'provider_error' ||
        fact.failureReason === 'provider_disconnected'
      ) {
        hasProviderError = true;
      } else if (
        fact.failureReason === 'timeout' ||
        fact.failureReason === 'server_timeout'
      ) {
        hasTimeout = true;
      }
    }
  }

  const totalInteractions = interactionIds.size;
  const providerInterruptionNotice = hasProviderError
    ? 'An external AI provider error was recorded during this session.'
    : hasTimeout
      ? 'An external AI provider timeout was recorded during this session.'
      : null;

  const isAiItem = (item: ReconstructionItem) =>
    item.kind === 'AI_REQUEST_STARTED' ||
    item.kind === 'AI_RESPONSE_COMPLETED' ||
    item.kind === 'AI_REQUEST_CANCELLED' ||
    item.kind === 'AI_REQUEST_FAILED';

  const isCandidateWorkItem = (item: ReconstructionItem) =>
    item.kind === 'WORKSPACE_CHANGE' || item.kind === 'COMMAND_EXECUTION';

  const activityItems = chronology.filter(
    (item) => isAiItem(item) || isCandidateWorkItem(item),
  );
  let transitions = 0;
  for (let i = 1; i < activityItems.length; i++) {
    if (isAiItem(activityItems[i]) !== isAiItem(activityItems[i - 1])) {
      transitions++;
    }
  }
  const interleaved = transitions >= 1 && totalInteractions > 0;

  let summaryText =
    'AI capability was active for this assessment. No integrated AI interactions were recorded.';
  if (totalInteractions > 0) {
    const parts = [
      `${totalInteractions} recorded AI interaction${totalInteractions === 1 ? '' : 's'}`,
      `${completedCount} completed`,
    ];
    if (cancelledCount > 0) {
      parts.push(`${cancelledCount} cancelled`);
    }
    if (failedCount > 0) {
      parts.push(`${failedCount} failed`);
    }
    summaryText = parts.join(' · ');
  }

  return {
    capabilityState: 'active',
    configuredModelId: snapshot.configuredModelId ?? null,
    configuredProviderId: snapshot.configuredProviderId ?? null,
    totalInteractions,
    completedCount,
    failedCount,
    cancelledCount,
    providerInterruptionNotice,
    interleaved,
    summaryText,
  };
};

export const formatSessionDuration = (
  activatedAt: string | null,
  submittedAt: string | null,
  sessionId: string,
): BriefingSessionDuration => {
  const source = {
    authority: 'session_timestamps' as const,
    fieldRef: `session:${sessionId}:duration`,
    activatedAt,
    submittedAt,
  };
  if (!activatedAt || !submittedAt) {
    return {
      status: 'unavailable',
      elapsedMs: null,
      text: 'Session duration is unavailable due to missing timestamps.',
      source,
    };
  }
  const start = Date.parse(activatedAt);
  const end = Date.parse(submittedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return {
      status: 'unavailable',
      elapsedMs: null,
      text: 'Session duration is unavailable due to malformed timestamps.',
      source,
    };
  }
  const elapsedMs = end - start;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let text = '';
  if (hours > 0) {
    text =
      seconds > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    text = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } else {
    text = `${seconds}s`;
  }
  return {
    status: 'available',
    elapsedMs,
    text,
    source,
  };
};

export const buildEvaluatorBriefing = (
  evidence: BriefingEvidenceInput,
  reconstruction: BriefingReconstructionInput,
): EvaluatorBriefing => {
  if (evidence.events.some((event) => event.sessionId !== evidence.sessionId))
    throw new Error('Foreign session events cannot support a briefing.');
  const record = reconstruction.record;
  // Read compatibility only: this is the existing v3 generator identity, not a briefing version.
  const generatorVersion = record?.generatorVersion ?? record?.promptVersion;
  if (
    record &&
    (record.sessionId !== evidence.sessionId ||
      generatorVersion !== deterministicReconstructionVersion ||
      record.finalDiffSha256 !== briefingSha256(evidence.diff))
  )
    throw new Error(
      'Reconstruction provenance does not match briefing evidence.',
    );
  const chronology = buildChronologicalReconstruction(
    {
      activatedAt: evidence.activatedAt,
      submittedAt: evidence.submittedAt,
      submittedDiff: evidence.diff,
    },
    evidence.events,
  );
  const catalog = buildEvidenceReferenceCatalog(evidence.sessionId, chronology);
  const facts = catalog.entries.map((entry) => ({
    entry,
    fact: entry.item
      ? buildTypedEvidenceFact(entry.item, initialReconstructionLimits)
      : null,
  }));
  const semantics = readScenarioSemanticSnapshot(
    evidence.scenario.semanticSnapshot,
  );
  const snapshot =
    semantics.status === 'available' ? semantics.snapshot : undefined;
  const seenTrees = new Set<string>();
  const observedActivity: ObservedStatement[] = [];
  for (const { entry, fact } of facts) {
    if (!fact) continue;
    const reversion =
      fact.kind === 'workspace_change' && seenTrees.has(fact.afterTree);
    if (fact.kind === 'workspace_change') {
      seenTrees.add(fact.beforeTree);
      seenTrees.add(fact.afterTree);
    }
    const mapped = mapBriefingObservation(entry, fact, snapshot, reversion);
    if (!mapped) continue;
    observedActivity.push({
      id: `observation:${entry.evidenceRef}`,
      kind: mapped.kind,
      basis: 'chronology',
      evidenceRefs: [entry.evidenceRef],
      factRef: entry.evidenceRef,
      chronologyOrder: entry.chronologyOrder!,
      scope: mapped.scope,
      wording: mapped.wording,
      text: renderBriefingWording(mapped.wording),
      mapping: mapped.mapping,
      ...(fact.kind === 'workspace_change'
        ? { paths: fact.files.map((file) => file.path) }
        : {}),
    });
  }
  const artifactAvailability: ArtifactAvailability = {
    reconstruction: reconstruction.status,
    briefing: 'available',
    submittedDiff: {
      status: 'available',
      evidenceRefs: [`session:${evidence.sessionId}:final-diff`],
    },
    context: evidence.scenario.evaluationContext ? 'available' : 'absent',
    semantics: semantics.status,
    source: {
      authority: 'artifact_status',
      fieldRef: `reconstruction:${evidence.sessionId}:${deterministicReconstructionVersion}:status`,
      version: deterministicReconstructionVersion,
    },
  };
  const context = evidence.scenario.evaluationContext;
  return validateBriefingGrounding({
    schemaVersion: 1,
    sessionId: evidence.sessionId,
    provenance: {
      sessionId: evidence.sessionId,
      authoritativeEvidenceSha256: briefingDataSha256({
        sessionId: evidence.sessionId,
        activatedAt: evidence.activatedAt,
        submittedAt: evidence.submittedAt,
        events: [...evidence.events].sort((a, b) => a.sequence - b.sequence),
        finalDiff: evidence.diff,
      }),
      finalDiffSha256: briefingSha256(evidence.diff),
      reconstruction: record
        ? { artifactId: record.id, generatorVersion: generatorVersion! }
        : null,
      semanticSnapshot: {
        status: semantics.status,
        contentVersion: snapshot?.contentVersion ?? null,
        sha256:
          evidence.scenario.semanticSnapshot === undefined
            ? null
            : briefingDataSha256(evidence.scenario.semanticSnapshot),
      },
      scenarioVersion: evidence.scenario.version,
      scenarioSnapshotSha256: briefingDataSha256(evidence.scenario),
      evaluationContextSha256: context ? briefingDataSha256(context) : null,
      evaluationContextVersion: context?.version ?? null,
      mapperVersion: briefingMapperVersion,
      wordingVersion: briefingWordingVersion,
      builderVersion: briefingBuilderVersion,
      projectionVersion: briefingProjectionVersion,
    },
    sessionDuration: formatSessionDuration(
      evidence.activatedAt,
      evidence.submittedAt,
      evidence.sessionId,
    ),
    taskContext: buildBriefingTaskContext(
      evidence.sessionId,
      evidence.scenario,
    ),
    observedActivity,
    recordedVerification: buildBriefingVerification(facts),
    submittedState: buildBriefingSubmittedState(
      evidence.sessionId,
      evidence.diff,
      snapshot,
    ),
    evidenceLimitations: buildBriefingLimitations(
      evidence.sessionId,
      facts,
      observedActivity,
      evidence.scenario,
      semantics,
      artifactAvailability,
    ),
    artifactAvailability,
    reviewGuidance: buildBriefingReviewGuidance(
      evidence.sessionId,
      evidence.scenario,
    ),
    evidenceIndex: facts.map(({ entry, fact }) => ({
      evidenceRef: entry.evidenceRef,
      sessionId: entry.sessionId,
      basis: entry.role,
      kind: entry.kind,
      rawEventIds: entry.rawEventIds,
      chronologyOrder: entry.chronologyOrder,
      sourceLocator: `/api/evaluator/sessions/${encodeURIComponent(evidence.sessionId)}`,
      fact,
      sourceData: entry.item
        ? { kind: 'chronology' as const, item: entry.item }
        : { kind: 'submitted_diff' as const, diff: evidence.diff },
    })),
    aiSummary: buildBriefingAiSummary(
      evidence.aiCapabilitySnapshot,
      facts,
      chronology,
    ),
  });
};
