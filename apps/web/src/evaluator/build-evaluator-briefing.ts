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
} from './evaluator-briefing';

export const briefingBuilderVersion = 'evaluator-briefing-v1';
export const briefingProjectionVersion = 'briefing-depth-v1';

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
  });
};
