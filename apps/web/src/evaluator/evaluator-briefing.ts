import type { SessionService } from '../sessions/session-service';
import type { EvidenceReconstructionRecord } from '../reconstruction/evidence-reconstruction';
import type { ReconstructionItem } from '../evidence/chronological-reconstruction';
import type { TypedEvidenceFact } from '../reconstruction/typed-evidence-fact';
import type { BriefingWording } from './briefing-wording';

export type BriefingEvidenceInput = Pick<
  ReturnType<SessionService['getSubmittedEvidence']>,
  'sessionId' | 'scenario' | 'activatedAt' | 'submittedAt' | 'diff' | 'events'
>;
export type BriefingReconstructionInput = Readonly<{
  status: 'NOT_STARTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
  record:
    | (Omit<EvidenceReconstructionRecord, 'attemptToken' | 'promptVersion'> &
        Readonly<{
          generatorVersion?: string;
          promptVersion?: string;
        }>)
    | null;
  legacyArtifacts: readonly unknown[];
}>;

export type EvidenceRefs = readonly [string, ...string[]];
export type ContextSource = Readonly<{
  authority:
    | 'scenario_snapshot'
    | 'evaluation_context'
    | 'semantic_snapshot'
    | 'artifact_status';
  fieldRef: string;
  version: string | null;
}>;
export type GroundedText = Readonly<{
  id: string;
  basis: 'chronology' | 'final_state';
  evidenceRefs: EvidenceRefs;
  wording: BriefingWording;
  text: string;
}>;
export type ObservationKind =
  | 'recorded_command'
  | 'recorded_read_command'
  | 'recorded_verification_execution'
  | 'recorded_workspace_edit'
  | 'recorded_return_to_prior_tree'
  | 'recorded_submission'
  | 'workspace_capture_gap';
export type ObservedStatement = GroundedText &
  Readonly<{
    kind: ObservationKind;
    factRef: string;
    chronologyOrder: number;
    scope:
      | 'recorded_execution'
      | 'recorded_workspace_transition'
      | 'workspace_interval'
      | 'submission_boundary';
    paths?: readonly string[];
    mapping: Readonly<{
      status: 'bound' | 'generic';
      ruleId: string | null;
      subjectId: string | null;
    }>;
  }>;
export type ContextEntry = Readonly<{
  id: string;
  category: 'task_context';
  kind:
    | 'task_brief'
    | 'system_invariant'
    | 'verification_area'
    | 'interpretation_warning';
  source: ContextSource;
  // Attributed authored data, not generated factual narrative.
  authoredText: string;
}>;
export type VerificationRun = Readonly<{
  id: string;
  evidenceRefs: EvidenceRefs;
  chronologyOrder: number;
  exitCode: number | null;
  timedOut: boolean;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  result:
    (GroundedText & Readonly<{ kind: 'recorded_verification_result' }>) | null;
  counts: Readonly<{ passed: number; failed: number }> | null;
  laterWorkspaceEdits: boolean;
  laterCaptureGaps: boolean;
  testIdentity: 'unknown';
}>;
export type RecordedVerification = Readonly<{
  runs: readonly VerificationRun[];
  scope: 'recognized_recorded_executions_only';
}>;
export type SubmittedStateSummary = GroundedText &
  Readonly<{
    changedPaths: readonly string[];
    fileCount: number | null;
    additions: number | null;
    deletions: number | null;
    parsing: 'complete' | 'unsupported';
    classifiedPaths: readonly Readonly<{
      path: string;
      classification: 'application' | 'test' | 'documentation';
      ruleId: string;
    }>[];
  }>;
export type EvidenceLimitation =
  | (GroundedText &
      Readonly<{
        authority: 'evidence';
        kind:
          | 'workspace_capture_gap'
          | 'stdout_truncation'
          | 'stderr_truncation'
          | 'patch_truncation'
          | 'unsupported_semantic_mapping';
      }>)
  | Readonly<{
      id: string;
      authority: 'metadata';
      kind:
        | 'missing_context'
        | 'missing_semantics'
        | 'unsupported_semantics'
        | 'unavailable_derived_artifact';
      source: ContextSource;
      wording: BriefingWording;
      text: string;
    }>;
export type ArtifactAvailability = Readonly<{
  reconstruction: 'NOT_STARTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
  briefing: 'available';
  submittedDiff: Readonly<{ status: 'available'; evidenceRefs: EvidenceRefs }>;
  context: 'available' | 'absent';
  semantics: 'available' | 'absent' | 'unsupported';
  source: ContextSource;
}>;
export type PolicyGuidance = Readonly<{
  id: string;
  category: 'static_policy_context';
  source: ContextSource;
  authoredText: string;
}>;
export type EvidenceReferenceIndex = readonly Readonly<{
  evidenceRef: string;
  sessionId: string;
  basis: 'chronology' | 'final_state';
  kind: string;
  rawEventIds: readonly string[];
  chronologyOrder: number | null;
  sourceLocator: string;
  fact: TypedEvidenceFact | null;
  sourceData:
    | Readonly<{ kind: 'chronology'; item: ReconstructionItem }>
    | Readonly<{ kind: 'submitted_diff'; diff: string }>;
}>[];
export type BriefingSessionDuration = Readonly<{
  status: 'available' | 'unavailable';
  elapsedMs: number | null;
  text: string;
  source: Readonly<{
    authority: 'session_timestamps';
    fieldRef: string;
    activatedAt: string | null;
    submittedAt: string | null;
  }>;
}>;
export type BriefingProvenance = Readonly<{
  sessionId: string;
  scenarioVersion: string;
  authoritativeEvidenceSha256?: string;
  finalDiffSha256?: string;
  reconstruction?: Readonly<{
    artifactId: string;
    generatorVersion: string;
  }> | null;
  semanticSnapshot?: Readonly<{
    status: 'available' | 'absent' | 'unsupported';
    contentVersion: string | null;
    sha256: string | null;
  }>;
  scenarioSnapshotSha256?: string;
  evaluationContextSha256?: string | null;
  evaluationContextVersion?: string | null;
  mapperVersion?: string;
  wordingVersion?: string;
  builderVersion?: string;
  projectionVersion?: string;
}>;
export type EvaluatorBriefing = Readonly<{
  schemaVersion: 1;
  sessionId: string;
  provenance: BriefingProvenance;
  sessionDuration: BriefingSessionDuration;
  taskContext: readonly ContextEntry[];
  observedActivity: readonly ObservedStatement[];
  recordedVerification: RecordedVerification;
  submittedState: SubmittedStateSummary;
  evidenceLimitations: readonly EvidenceLimitation[];
  artifactAvailability: ArtifactAvailability;
  reviewGuidance: readonly PolicyGuidance[];
  evidenceIndex: EvidenceReferenceIndex;
}>;
