export type ReconstructionStatus = 'PENDING' | 'AVAILABLE' | 'FAILED';
export type ReconstructionViewStatus = 'NOT_STARTED' | ReconstructionStatus;
export type EvidenceRole = 'chronology' | 'final_state';
export type ClaimBasis = EvidenceRole;

export type ReconstructionStatement = Readonly<{
  id: string;
  text: string;
  detail?: string;
  claimBasis: ClaimBasis;
  evidenceRefs: readonly string[];
  firstEvidenceOrder: number;
}>;

export type EvidenceReconstructionContentV1 = Readonly<{
  schemaVersion: 1;
  statements: readonly ReconstructionStatement[];
}>;

export type EvidenceReconstructionRecord = Readonly<{
  id: string;
  sessionId: string;
  status: ReconstructionStatus;
  schemaVersion: 1;
  promptVersion: string;
  packetBuilderVersion: string;
  providerId: string | null;
  modelId: string | null;
  providerRequestId: string | null;
  sourceFirstSequence: number | null;
  sourceLastSequence: number | null;
  sourceEventCount: number;
  sourcePacketSha256: string | null;
  finalDiffSha256: string;
  finalDiffBytes: number;
  content: EvidenceReconstructionContentV1 | null;
  failureCode: ReconstructionFailureCode | null;
  failureMessage: string | null;
  attemptCount: number;
  attemptToken: string;
  createdAt: string;
  attemptStartedAt: string;
  completedAt: string | null;
  updatedAt: string;
}>;

export type ReconstructionFailureCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RATE_LIMITED'
  | 'MALFORMED_OUTPUT'
  | 'FORBIDDEN_OUTPUT_FIELD'
  | 'INVALID_EVIDENCE_REFERENCE'
  | 'SYNTHETIC_SCENARIO_REQUIRED'
  | 'INPUT_TOO_LARGE'
  | 'COVERAGE_UNSATISFIABLE'
  | 'INTERNAL_GENERATION_ERROR';

export class EvidenceReconstructionError extends Error {
  constructor(
    readonly code: ReconstructionFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'EvidenceReconstructionError';
  }
}
