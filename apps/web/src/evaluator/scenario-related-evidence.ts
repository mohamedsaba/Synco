import { submittedEvidencePaths } from '../evidence/submitted-diff-facts';
import type { EvidenceReferenceCatalog } from '../reconstruction/evidence-reference-catalog';
import { initialReconstructionLimits } from '../reconstruction/reconstruction-limits';
import {
  buildTypedEvidenceFact,
  type TypedEvidenceFact,
} from '../reconstruction/typed-evidence-fact';
import type {
  ScenarioEvaluationContextSnapshot,
  ScenarioEvidenceSelector,
} from '../scenarios/scenario-evaluation-context';

export type ScenarioRelatedEvidenceArea = Readonly<{
  id: string;
  title: string;
  description: string;
  evidenceRefs: readonly string[];
}>;

const pathMatches = (path: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return path === prefix || path.startsWith(normalizedPrefix);
  });

const selectorMatches = (
  selector: ScenarioEvidenceSelector,
  fact: TypedEvidenceFact | null,
  submittedPaths: readonly string[],
) => {
  if (selector.kind === 'verification_result') {
    return (
      fact?.kind === 'command_execution' && fact.output?.kind === 'test_summary'
    );
  }

  if (selector.kind === 'workspace_path_prefix') {
    return (
      fact?.kind === 'workspace_change' &&
      fact.files.some((file) => pathMatches(file.path, selector.prefixes))
    );
  }

  return submittedPaths.some((path) => pathMatches(path, selector.prefixes));
};

export const buildScenarioRelatedEvidence = (
  context: ScenarioEvaluationContextSnapshot | undefined,
  catalog: EvidenceReferenceCatalog,
  submittedDiff: string,
): readonly ScenarioRelatedEvidenceArea[] => {
  if (!context) return [];

  const submittedPaths = submittedEvidencePaths(submittedDiff);
  return context.evidenceAreas.map((area) => {
    const evidenceRefs = catalog.entries.flatMap((entry) => {
      const fact = entry.item
        ? buildTypedEvidenceFact(entry.item, initialReconstructionLimits)
        : null;
      const paths = entry.kind === 'final_diff' ? submittedPaths : [];
      return area.selectors.some((selector) =>
        selectorMatches(selector, fact, paths),
      )
        ? [entry.evidenceRef]
        : [];
    });

    return {
      id: area.id,
      title: area.title,
      description: area.description,
      evidenceRefs,
    };
  });
};
