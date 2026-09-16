export type ReconstructionLimits = Readonly<{
  maximumEvidenceItems: number;
  maximumCommandOutputBytes: number;
  maximumPatchBytes: number;
  maximumFinalDiffBytes: number;
  maximumPacketBytes: number;
  maximumStatements: number;
  maximumStatementTextLength: number;
  maximumStatementDetailLength: number;
  maximumReferencesPerStatement: number;
  maximumOutputBytes: number;
}>;

const maximumEvidenceItems = 250;

export const initialReconstructionLimits: ReconstructionLimits = {
  maximumEvidenceItems,
  maximumCommandOutputBytes: 4 * 1024,
  maximumPatchBytes: 8 * 1024,
  maximumFinalDiffBytes: 16 * 1024,
  maximumPacketBytes: 256 * 1024,
  maximumStatements: 12,
  maximumStatementTextLength: 280,
  maximumStatementDetailLength: 480,
  // An aggregate can cite every member of the bounded input chronology.
  maximumReferencesPerStatement: maximumEvidenceItems,
  maximumOutputBytes: 16 * 1024,
};
