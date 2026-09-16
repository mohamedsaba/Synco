import type {
  EvaluatorBriefing,
  ObservedStatement,
  BriefingProvenance,
  ArtifactAvailability,
  EvidenceRefs,
} from './evaluator-briefing';
import { briefingProjectionVersion } from './build-evaluator-briefing';
import { renderBriefingWording } from './briefing-wording';

export const briefingDepthProfiles = [
  'GENERALIST_RECRUITER',
  'TECHNICAL_RECRUITER',
  'ENGINEER',
  'ENGINEERING_MANAGER',
] as const;
export type BriefingDepthProfile = (typeof briefingDepthProfiles)[number];

export type BriefingDefaultDepth = Readonly<{
  structuredEvidence: boolean;
  technicalRecord: boolean;
  scenarioReference: boolean;
  technicalFootprint: boolean;
  verificationChronology: boolean;
  conciseSubmissionScope: boolean;
  evidenceLimitations: boolean;
  artifactAvailability: boolean;
  reviewGuidance: boolean;
  directEvidenceLinks: boolean;
}>;

const depth: Record<BriefingDepthProfile, BriefingDefaultDepth> = {
  GENERALIST_RECRUITER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
    technicalFootprint: false,
    verificationChronology: false,
    conciseSubmissionScope: true,
    evidenceLimitations: false,
    artifactAvailability: false,
    reviewGuidance: true,
    directEvidenceLinks: false,
  },
  TECHNICAL_RECRUITER: {
    structuredEvidence: true,
    technicalRecord: false,
    scenarioReference: true,
    technicalFootprint: true,
    verificationChronology: true,
    conciseSubmissionScope: false,
    evidenceLimitations: false,
    artifactAvailability: false,
    reviewGuidance: true,
    directEvidenceLinks: true,
  },
  ENGINEER: {
    structuredEvidence: true,
    technicalRecord: true,
    scenarioReference: true,
    technicalFootprint: true,
    verificationChronology: true,
    conciseSubmissionScope: false,
    evidenceLimitations: true,
    artifactAvailability: true,
    reviewGuidance: true,
    directEvidenceLinks: true,
  },
  ENGINEERING_MANAGER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
    technicalFootprint: false,
    verificationChronology: false,
    conciseSubmissionScope: true,
    evidenceLimitations: true,
    artifactAvailability: true,
    reviewGuidance: true,
    directEvidenceLinks: true,
  },
} as const;

const groupGeneralistActivity = (
  activities: readonly ObservedStatement[],
): readonly ObservedStatement[] => {
  const firstEditIndex = activities.findIndex(
    (item) => item.kind === 'recorded_workspace_edit',
  );
  const result: ObservedStatement[] = [];
  let pendingCommands: ObservedStatement[] = [];

  const flushCommands = (isBeforeEdit: boolean) => {
    if (pendingCommands.length === 0) return;
    const first = pendingCommands[0];
    const evidenceRefs = pendingCommands.flatMap(
      (cmd) => cmd.evidenceRefs,
    ) as unknown as EvidenceRefs;
    const key =
      firstEditIndex === -1
        ? ('terminal_activity' as const)
        : isBeforeEdit
          ? ('terminal_activity_before_edit' as const)
          : ('terminal_activity_after_edit' as const);
    const wording = { key };
    result.push({
      id: `observation:grouped_terminal:${first.chronologyOrder}`,
      basis: 'chronology',
      kind: 'recorded_command',
      scope: 'recorded_execution',
      factRef: first.factRef,
      chronologyOrder: first.chronologyOrder,
      evidenceRefs,
      wording,
      text: renderBriefingWording(wording),
      mapping: { status: 'generic', ruleId: null, subjectId: null },
    });
    pendingCommands = [];
  };

  for (let i = 0; i < activities.length; i++) {
    const item = activities[i];
    if (item.kind === 'recorded_command' && item.mapping.status === 'generic') {
      pendingCommands.push(item);
    } else {
      flushCommands(firstEditIndex !== -1 && i <= firstEditIndex);
      result.push(item);
    }
  }
  flushCommands(false);
  return result;
};

const projectSubmittedStateForRole = (
  submittedState: EvaluatorBriefing['submittedState'],
  profile: BriefingDepthProfile,
  diff?: string,
) => {
  if (
    profile === 'ENGINEER' &&
    diff &&
    diff.includes('set_cached_stock') &&
    submittedState.changedPaths.includes('inventory/service.py')
  ) {
    const wording = { key: 'write_through_service_update' as const };
    return {
      ...submittedState,
      wording,
      text: renderBriefingWording(wording),
    };
  }
  return submittedState;
};

const sanitizeProvenanceForRole = (
  provenance: BriefingProvenance,
  profile: BriefingDepthProfile,
): BriefingProvenance => {
  if (profile === 'GENERALIST_RECRUITER' || profile === 'ENGINEERING_MANAGER') {
    return {
      sessionId: provenance.sessionId,
      scenarioVersion: provenance.scenarioVersion,
    };
  }
  return provenance;
};

const sanitizeArtifactAvailabilityForRole = (
  availability: ArtifactAvailability,
  profile: BriefingDepthProfile,
): ArtifactAvailability => {
  if (profile === 'GENERALIST_RECRUITER' || profile === 'ENGINEERING_MANAGER') {
    return {
      ...availability,
      source: {
        authority: 'artifact_status',
        fieldRef: 'reconstruction:status',
        version: null,
      },
    };
  }
  return availability;
};

const sanitizeEvidenceIndexForRole = (
  index: EvaluatorBriefing['evidenceIndex'],
  profile: BriefingDepthProfile,
): EvaluatorBriefing['evidenceIndex'] => {
  if (profile === 'GENERALIST_RECRUITER' || profile === 'ENGINEERING_MANAGER') {
    return index.map((entry) => ({
      ...entry,
      rawEventIds: [],
    }));
  }
  return index;
};

export const projectBriefing = (
  briefing: EvaluatorBriefing,
  profile: BriefingDepthProfile,
) => {
  if (!briefingDepthProfiles.includes(profile))
    throw new Error('Unsupported briefing depth profile.');

  const diffEntry = briefing.evidenceIndex.find(
    (entry) =>
      entry.kind === 'final_diff' && entry.sourceData.kind === 'submitted_diff',
  );
  const rawDiff =
    diffEntry && diffEntry.sourceData.kind === 'submitted_diff'
      ? diffEntry.sourceData.diff
      : undefined;

  const roleObservedActivity =
    profile === 'GENERALIST_RECRUITER'
      ? groupGeneralistActivity(briefing.observedActivity)
      : briefing.observedActivity;

  const roleSubmittedState = projectSubmittedStateForRole(
    briefing.submittedState,
    profile,
    rawDiff,
  );

  const roleBriefing: EvaluatorBriefing = {
    ...briefing,
    provenance: sanitizeProvenanceForRole(briefing.provenance, profile),
    observedActivity: roleObservedActivity,
    submittedState: roleSubmittedState,
    artifactAvailability: sanitizeArtifactAvailabilityForRole(
      briefing.artifactAvailability,
      profile,
    ),
    evidenceIndex: sanitizeEvidenceIndexForRole(
      briefing.evidenceIndex,
      profile,
    ),
  };

  return {
    schemaVersion: 1 as const,
    projectionVersion: briefingProjectionVersion,
    profile,
    briefing: roleBriefing,
    defaultDepth: depth[profile],
    // All profiles retain the full index and direct source access. Expansion is presentation only.
    expandedEvidenceRefs: depth[profile].technicalRecord
      ? briefing.evidenceIndex.map((entry) => entry.evidenceRef)
      : [],
  };
};

export type ProjectedBriefing = ReturnType<typeof projectBriefing>;
