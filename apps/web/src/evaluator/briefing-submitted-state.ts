import { parsePatch } from 'diff';
import type { ScenarioSemanticSnapshot } from '../scenarios/scenario-semantic-snapshot';
import { renderBriefingWording } from './briefing-wording';
import type { SubmittedStateSummary } from './evaluator-briefing';
import { pathBindingMatches } from './briefing-semantic-mapper';

export const buildBriefingSubmittedState = (
  sessionId: string,
  diff: string,
  snapshot: ScenarioSemanticSnapshot | undefined,
): SubmittedStateSummary => {
  const evidenceRefs = [`session:${sessionId}:final-diff`] as const;
  const unsupported: SubmittedStateSummary = {
    id: 'submitted-state',
    basis: 'final_state',
    evidenceRefs,
    wording: { key: 'submitted_unsupported' },
    text: renderBriefingWording({ key: 'submitted_unsupported' }),
    changedPaths: [],
    fileCount: null,
    additions: null,
    deletions: null,
    parsing: 'unsupported',
    classifiedPaths: [],
  };
  // Git quoted paths, binary content and rename-only metadata need separate support.
  if (
    /^(?:diff --git .*"|Binary files |GIT binary patch|rename from |rename to |copy from |copy to )/m.test(
      diff,
    )
  )
    return unsupported;
  let patches;
  try {
    patches = parsePatch(diff);
  } catch {
    return unsupported;
  }
  if (diff.trim() && patches.length === 0) return unsupported;
  const paths: string[] = [];
  let additions = 0;
  let deletions = 0;
  for (const patch of patches) {
    const filename =
      patch.newFileName === '/dev/null' ? patch.oldFileName : patch.newFileName;
    if (!filename || filename === '/dev/null') return unsupported;
    paths.push(filename.replace(/^[ab]\//, ''));
    for (const hunk of patch.hunks) {
      additions += hunk.lines.filter((line) => line.startsWith('+')).length;
      deletions += hunk.lines.filter((line) => line.startsWith('-')).length;
    }
  }
  const changedPaths = [...new Set(paths)];
  const wording = {
    key: 'submitted_files' as const,
    count: changedPaths.length,
  };
  return {
    id: 'submitted-state',
    basis: 'final_state',
    evidenceRefs,
    wording,
    text: renderBriefingWording(wording),
    changedPaths,
    fileCount: changedPaths.length,
    additions,
    deletions,
    parsing: 'complete',
    classifiedPaths: changedPaths.flatMap((path) => {
      const rules =
        snapshot?.pathBindings.filter((rule) =>
          pathBindingMatches(path, rule.prefix),
        ) ?? [];
      return rules.length === 1
        ? [
            {
              path,
              classification: rules[0].classification,
              ruleId: rules[0].id,
            },
          ]
        : [];
    }),
  };
};
