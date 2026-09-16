export type ScenarioEvidenceSelector =
  | Readonly<{
      kind: 'workspace_path_prefix';
      prefixes: readonly string[];
    }>
  | Readonly<{
      kind: 'submitted_path_prefix';
      prefixes: readonly string[];
    }>
  | Readonly<{
      kind: 'verification_result';
    }>;

export type ScenarioEvidenceArea = Readonly<{
  id: string;
  title: string;
  description: string;
  selectors: readonly ScenarioEvidenceSelector[];
}>;

export type ScenarioEvaluationContextSnapshot = Readonly<{
  schemaVersion: 1;
  version: string;
  purpose: string;
  evidenceAreas: readonly ScenarioEvidenceArea[];
  systemInvariants: readonly string[];
  verificationTargets: readonly string[];
  interpretationWarnings: readonly string[];
  reviewPolicy: readonly string[];
}>;

export const cloneScenarioEvaluationContext = (
  context: ScenarioEvaluationContextSnapshot | undefined,
): ScenarioEvaluationContextSnapshot | undefined =>
  context ? structuredClone(context) : undefined;
