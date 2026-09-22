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

export const resolveBriefingDepthProfile = (
  requestedProfile: string | null | undefined,
): BriefingDepthProfile =>
  requestedProfile &&
  briefingDepthProfiles.includes(requestedProfile as BriefingDepthProfile)
    ? (requestedProfile as BriefingDepthProfile)
    : 'GENERALIST_RECRUITER';

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
  aiSummary: boolean;
  aiConfiguredModel: boolean;
  aiTokenTelemetry: boolean;
}>;

const depth: Record<BriefingDepthProfile, BriefingDefaultDepth> = {
  GENERALIST_RECRUITER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
    technicalFootprint: false,
    verificationChronology: false,
    conciseSubmissionScope: true,
    evidenceLimitations: true,
    artifactAvailability: false,
    reviewGuidance: true,
    directEvidenceLinks: false,
    aiSummary: true,
    aiConfiguredModel: false,
    aiTokenTelemetry: false,
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
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: false,
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
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: true,
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
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: false,
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

const sanitizeAiSummaryForRole = (
  summary: EvaluatorBriefing['aiSummary'],
  profile: BriefingDepthProfile,
): EvaluatorBriefing['aiSummary'] => {
  if (profile === 'GENERALIST_RECRUITER') {
    return {
      ...summary,
      configuredModelId: null,
      configuredProviderId: null,
    };
  }
  if (profile === 'TECHNICAL_RECRUITER' || profile === 'ENGINEERING_MANAGER') {
    return {
      ...summary,
      configuredProviderId: null,
    };
  }
  return summary;
};

export const projectBriefing = (
  briefing: EvaluatorBriefing,
  profile: BriefingDepthProfile,
) => {
  if (!briefingDepthProfiles.includes(profile))
    throw new Error('Unsupported briefing depth profile.');

  const roleObservedActivity =
    profile === 'GENERALIST_RECRUITER'
      ? groupGeneralistActivity(briefing.observedActivity)
      : briefing.observedActivity;

  const roleBriefing: EvaluatorBriefing = {
    ...briefing,
    provenance: sanitizeProvenanceForRole(briefing.provenance, profile),
    observedActivity: roleObservedActivity,
    submittedState: briefing.submittedState,
    artifactAvailability: sanitizeArtifactAvailabilityForRole(
      briefing.artifactAvailability,
      profile,
    ),
    evidenceIndex: sanitizeEvidenceIndexForRole(
      briefing.evidenceIndex,
      profile,
    ),
    aiSummary: sanitizeAiSummaryForRole(briefing.aiSummary, profile),
  };

  return {
    schemaVersion: 1 as const,
    projectionVersion: briefingProjectionVersion,
    profile,
    briefing: roleBriefing,
    defaultDepth: depth[profile],
    // Presentation contract: The abstraction level may change. The underlying truth may not.
    // Every projection retains source references; its depth controls whether it renders direct source affordances.
    expandedEvidenceRefs: depth[profile].technicalRecord
      ? briefing.evidenceIndex.map((entry) => entry.evidenceRef)
      : [],
  };
};

export type ProjectedBriefing = ReturnType<typeof projectBriefing>;
