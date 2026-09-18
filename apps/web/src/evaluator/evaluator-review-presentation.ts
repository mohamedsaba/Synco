import {
  buildChronologicalReconstruction,
  type ReconstructionItem,
} from '../evidence/chronological-reconstruction';
import type { SessionEvent } from '../events/session-event';
import type { EvidenceCatalogEntry } from '../reconstruction/evidence-reference-catalog';
import { buildEvidenceReferenceCatalog } from '../reconstruction/evidence-reference-catalog';
import type {
  EvidenceReconstructionRecord,
  ReconstructionStatement,
} from '../reconstruction/evidence-reconstruction';
import { initialReconstructionLimits } from '../reconstruction/reconstruction-limits';
import {
  buildTypedEvidenceFact,
  type TypedEvidenceFact,
} from '../reconstruction/typed-evidence-fact';
import type { ScenarioSnapshot } from '../scenarios/slice-one-scenario';
import {
  buildScenarioRelatedEvidence,
  type ScenarioRelatedEvidenceArea,
} from './scenario-related-evidence';

type SafeReconstructionRecord = Omit<
  EvidenceReconstructionRecord,
  'attemptToken' | 'promptVersion'
> &
  Readonly<{ generatorVersion: string }>;

export type ReconstructionViewInput = Readonly<{
  status: 'NOT_STARTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
  record: SafeReconstructionRecord | null;
  legacyArtifacts: readonly unknown[];
}>;

export type EvaluatorReviewEvidence = Readonly<{
  sessionId: string;
  scenario: ScenarioSnapshot;
  activatedAt: string | null;
  submittedAt: string;
  diff: string;
  events: readonly SessionEvent[];
  aiCapabilitySnapshot?:
    import('../ai/ai-interaction').AiCapabilitySnapshot | null;
}>;

export type SummaryMilestoneKind =
  | 'verification'
  | 'command'
  | 'code_change'
  | 'changes_reverted'
  | 'between_actions'
  | 'capture_incomplete'
  | 'submitted'
  | 'submitted_state'
  | 'recorded_activity'
  | 'ai_request'
  | 'ai_response'
  | 'ai_cancellation'
  | 'ai_failure';

export type SummaryMilestone = Readonly<{
  id: string;
  kind: SummaryMilestoneKind;
  label: string;
  text: string;
  detail?: string;
  elapsedLabel: string | null;
  evidenceRefs: readonly string[];
}>;

export type EvaluatorReviewPresentation = Readonly<{
  session: Readonly<{
    id: string;
    assessment: string;
    scenarioTitle: string;
    scenarioVersion: string;
    status: 'Submitted';
    duration: string | null;
    submittedAt: string;
  }>;
  scenario: Readonly<{
    context: ScenarioSnapshot['evaluationContext'];
    relatedEvidence: readonly ScenarioRelatedEvidenceArea[];
  }>;
  notices: readonly Readonly<{
    kind: 'capture_incomplete';
    title: string;
    message: string;
  }>[];
  summary: Readonly<{
    status: 'preparing' | 'available' | 'unavailable';
    retryAllowed: boolean;
    milestones: readonly SummaryMilestone[];
  }>;
  chronology: readonly ReconstructionItem[];
  evidenceEntries: readonly EvidenceCatalogEntry[];
  submittedDiff: string;
  aiCapabilitySnapshot?:
    import('../ai/ai-interaction').AiCapabilitySnapshot | null;
}>;

export const notObservedExplanation =
  'No recorded activity was linked to this area by the current evidence relation. Relevant activity may exist elsewhere in the technical chronology. An empty relation does not mean the candidate lacks the underlying capability.';

const formatDuration = (activatedAt: string | null, submittedAt: string) => {
  if (!activatedAt) return null;
  const durationMs = Date.parse(submittedAt) - Date.parse(activatedAt);
  if (!Number.isFinite(durationMs) || durationMs < 0) return null;
  const totalMinutes = Math.floor(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const formatElapsed = (
  activatedAt: string | null,
  timestamp: string | null,
) => {
  if (!activatedAt || !timestamp) return null;
  const elapsedMs = Date.parse(timestamp) - Date.parse(activatedAt);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return null;
  const seconds = Math.floor(elapsedMs / 1_000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `+${minutes}m ${remainingSeconds}s`
    : `+${remainingSeconds}s`;
};

const entryTimestamp = (entry: EvidenceCatalogEntry) => {
  const item = entry.item;
  if (!item) return null;
  if (item.kind === 'COMMAND_EXECUTION') return item.finishedAt;
  return item.timestamp;
};

const entryFact = (entry: EvidenceCatalogEntry): TypedEvidenceFact | null =>
  entry.item
    ? buildTypedEvidenceFact(entry.item, initialReconstructionLimits)
    : null;

const findReversionReferences = (entries: readonly EvidenceCatalogEntry[]) => {
  const references = new Set<string>();
  const seenTrees = new Set<string>();
  for (const entry of entries) {
    if (entry.item?.kind !== 'WORKSPACE_CHANGE') continue;
    if (seenTrees.has(entry.item.afterTree)) references.add(entry.evidenceRef);
    seenTrees.add(entry.item.beforeTree);
    seenTrees.add(entry.item.afterTree);
  }
  return references;
};

const verificationText = (
  fact: Extract<TypedEvidenceFact, { kind: 'command_execution' }>,
) => {
  if (fact.output?.kind !== 'test_summary') return null;
  return `${fact.output.failed} failing · ${fact.output.passed} passing`;
};

const classifyStatement = (
  statement: ReconstructionStatement,
  entries: readonly EvidenceCatalogEntry[],
  reversionReferences: ReadonlySet<string>,
) => {
  const facts = entries.map(entryFact);
  const verification = facts.find(
    (fact): fact is Extract<TypedEvidenceFact, { kind: 'command_execution' }> =>
      fact?.kind === 'command_execution' &&
      fact.output?.kind === 'test_summary',
  );
  if (verification) {
    return {
      kind: 'verification' as const,
      text: verificationText(verification)!,
    };
  }
  if (statement.claimBasis === 'final_state') {
    return { kind: 'submitted_state' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'submission')) {
    return { kind: 'submitted' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'evidence_gap')) {
    return { kind: 'capture_incomplete' as const, text: statement.text };
  }
  if (entries.some((entry) => reversionReferences.has(entry.evidenceRef))) {
    return { kind: 'changes_reverted' as const, text: statement.text };
  }
  if (
    entries.some(
      (entry) =>
        entry.item?.kind === 'WORKSPACE_CHANGE' &&
        entry.item.origin === 'out_of_band',
    )
  ) {
    return { kind: 'between_actions' as const, text: statement.text };
  }
  if (
    entries.length > 0 &&
    entries.every((entry) => entry.kind === 'workspace_change')
  ) {
    return { kind: 'code_change' as const, text: statement.text };
  }
  if (
    entries.length > 0 &&
    entries.every((entry) => entry.kind === 'command_execution')
  ) {
    return { kind: 'command' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'ai_request_started')) {
    return { kind: 'ai_request' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'ai_response_completed')) {
    return { kind: 'ai_response' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'ai_request_cancelled')) {
    return { kind: 'ai_cancellation' as const, text: statement.text };
  }
  if (entries.some((entry) => entry.kind === 'ai_request_failed')) {
    return { kind: 'ai_failure' as const, text: statement.text };
  }
  return { kind: 'recorded_activity' as const, text: statement.text };
};

const milestoneLabel = (
  kind: SummaryMilestoneKind,
  verificationIndex: number,
  verificationCount: number,
) => {
  if (kind === 'verification') {
    if (verificationCount === 1) return 'Recorded verification';
    if (verificationIndex === 0) return 'Initial verification';
    if (verificationIndex === verificationCount - 1) {
      return 'Final recorded verification';
    }
    return 'Later verification';
  }

  const labels: Record<
    Exclude<SummaryMilestoneKind, 'verification'>,
    string
  > = {
    command: 'Recorded command',
    code_change: 'Code change',
    changes_reverted: 'Changes reverted',
    between_actions: 'Changes between recorded actions',
    capture_incomplete: 'Activity capture incomplete',
    submitted: 'Submitted',
    submitted_state: 'Submitted state',
    recorded_activity: 'Recorded activity',
    ai_request: 'AI request',
    ai_response: 'AI response',
    ai_cancellation: 'AI cancellation',
    ai_failure: 'AI failure',
  };
  return labels[kind];
};

const buildMilestones = (
  statements: readonly ReconstructionStatement[],
  entries: readonly EvidenceCatalogEntry[],
  activatedAt: string | null,
) => {
  const byReference = new Map(
    entries.map((entry) => [entry.evidenceRef, entry]),
  );
  const reversionReferences = findReversionReferences(entries);
  const classified = statements.map((statement) => {
    const statementEntries = statement.evidenceRefs.flatMap((reference) => {
      const entry = byReference.get(reference);
      return entry ? [entry] : [];
    });
    return {
      statement,
      entries: statementEntries,
      presentation: classifyStatement(
        statement,
        statementEntries,
        reversionReferences,
      ),
    };
  });
  const verificationCount = classified.filter(
    (item) => item.presentation.kind === 'verification',
  ).length;
  let verificationIndex = 0;

  return classified.map(
    ({ statement, entries: statementEntries, presentation }) => {
      const currentVerificationIndex = verificationIndex;
      if (presentation.kind === 'verification') verificationIndex += 1;
      return {
        id: statement.id,
        kind: presentation.kind,
        label: milestoneLabel(
          presentation.kind,
          currentVerificationIndex,
          verificationCount,
        ),
        text: presentation.text,
        ...(statement.detail ? { detail: statement.detail } : {}),
        elapsedLabel: formatElapsed(
          activatedAt,
          entryTimestamp(statementEntries[0]),
        ),
        evidenceRefs: statement.evidenceRefs,
      };
    },
  );
};

export const buildEvaluatorReviewPresentation = (
  evidence: EvaluatorReviewEvidence,
  reconstruction: ReconstructionViewInput,
): EvaluatorReviewPresentation => {
  const chronology = buildChronologicalReconstruction(
    {
      activatedAt: evidence.activatedAt,
      submittedAt: evidence.submittedAt,
      submittedDiff: evidence.diff,
    },
    evidence.events,
  );
  const catalog = buildEvidenceReferenceCatalog(evidence.sessionId, chronology);
  const relatedEvidence = buildScenarioRelatedEvidence(
    evidence.scenario.evaluationContext,
    catalog,
    evidence.diff,
  );
  const gapCount = catalog.entries.filter(
    (entry) => entry.kind === 'evidence_gap',
  ).length;
  const available =
    reconstruction.status === 'AVAILABLE' && reconstruction.record?.content;

  return {
    session: {
      id: evidence.sessionId,
      assessment: `${evidence.scenario.id} · v${evidence.scenario.version}`,
      scenarioTitle: evidence.scenario.title,
      scenarioVersion: evidence.scenario.version,
      status: 'Submitted',
      duration: formatDuration(evidence.activatedAt, evidence.submittedAt),
      submittedAt: evidence.submittedAt,
    },
    scenario: {
      context: evidence.scenario.evaluationContext,
      relatedEvidence,
    },
    notices:
      gapCount > 0
        ? [
            {
              kind: 'capture_incomplete',
              title: 'Activity capture incomplete',
              message: `${gapCount} recorded interval${gapCount === 1 ? '' : 's'} contain incomplete workspace activity. The available activity and submitted changes remain reviewable.`,
            },
          ]
        : [],
    summary: {
      status: available
        ? 'available'
        : reconstruction.status === 'FAILED'
          ? 'unavailable'
          : 'preparing',
      retryAllowed: reconstruction.status === 'FAILED',
      milestones: available
        ? buildMilestones(
            reconstruction.record!.content!.statements,
            catalog.entries,
            evidence.activatedAt,
          )
        : [],
    },
    chronology,
    evidenceEntries: catalog.entries,
    submittedDiff: evidence.diff,
    aiCapabilitySnapshot: evidence.aiCapabilitySnapshot ?? null,
  };
};
