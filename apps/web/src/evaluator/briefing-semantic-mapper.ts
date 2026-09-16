import type { EvidenceCatalogEntry } from '../reconstruction/evidence-reference-catalog';
import type { TypedEvidenceFact } from '../reconstruction/typed-evidence-fact';
import {
  conservativeReadTarget,
  directCommandArgv,
  isDirectPytest,
} from '../scenarios/conservative-command-binding';
import type { ScenarioSemanticSnapshot } from '../scenarios/scenario-semantic-snapshot';
import { isSafeSourcePath, type BriefingWording } from './briefing-wording';
import type { ObservedStatement } from './evaluator-briefing';

export const briefingMapperVersion = 'briefing-mapper-v1';
export const pathBindingMatches = (path: string, prefix: string) =>
  path === prefix ||
  path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);

const genericMapping = {
  status: 'generic' as const,
  ruleId: null,
  subjectId: null,
};
export type MappedObservation = Pick<
  ObservedStatement,
  'kind' | 'scope' | 'mapping'
> & { wording: BriefingWording; unsupportedReadMapping: boolean };

export const mapBriefingObservation = (
  entry: EvidenceCatalogEntry,
  fact: TypedEvidenceFact,
  snapshot: ScenarioSemanticSnapshot | undefined,
  returnedToPriorTree: boolean,
): MappedObservation | null => {
  if (fact.kind === 'activation') return null;
  if (fact.kind === 'submission')
    return {
      kind: 'recorded_submission',
      scope: 'submission_boundary',
      mapping: genericMapping,
      wording: { key: 'submission' },
      unsupportedReadMapping: false,
    };
  if (fact.kind === 'evidence_gap')
    return {
      kind: 'workspace_capture_gap',
      scope: 'workspace_interval',
      mapping: genericMapping,
      wording: { key: 'workspace_gap' },
      unsupportedReadMapping: false,
    };
  if (fact.kind === 'workspace_change') {
    if (returnedToPriorTree)
      return {
        kind: 'recorded_return_to_prior_tree',
        scope: 'recorded_workspace_transition',
        mapping: genericMapping,
        wording: { key: 'prior_tree' },
        unsupportedReadMapping: false,
      };
    const bindings =
      snapshot?.pathBindings.filter((rule) =>
        fact.files.every((file) => pathBindingMatches(file.path, rule.prefix)),
      ) ?? [];
    const rule = bindings.length === 1 ? bindings[0] : undefined;
    const subject = snapshot?.subjects.find(
      (subject) => subject.id === rule?.subjectId,
    );
    const singlePath =
      fact.files.length === 1 && isSafeSourcePath(fact.files[0].path)
        ? fact.files[0].path
        : undefined;
    return {
      kind: 'recorded_workspace_edit',
      scope: 'recorded_workspace_transition',
      mapping:
        rule && subject
          ? { status: 'bound', ruleId: rule.id, subjectId: subject.id }
          : genericMapping,
      wording: subject
        ? { key: 'related_edit', subject: subject.label }
        : {
            key: 'workspace_edit',
            ...(singlePath ? { path: singlePath } : {}),
          },
      unsupportedReadMapping: false,
    };
  }
  const argv = directCommandArgv(fact.command);
  if (
    isDirectPytest(argv) &&
    entry.item?.kind === 'COMMAND_EXECUTION' &&
    entry.item.rawStartedEvent
  ) {
    return {
      kind: 'recorded_verification_execution',
      scope: 'recorded_execution',
      mapping: genericMapping,
      wording: { key: 'verification_execution' },
      unsupportedReadMapping: false,
    };
  }
  const bindings =
    argv && conservativeReadTarget(argv)
      ? (snapshot?.commandBindings.filter(
          (rule) =>
            rule.cwd === fact.cwd &&
            rule.argv.length === argv.length &&
            rule.argv.every((token, index) =>
              index === 1 && argv[0] === 'redis-cli'
                ? token.toLowerCase() === argv[index].toLowerCase()
                : token === argv[index],
            ),
        ) ?? [])
      : [];
  const rule = bindings.length === 1 ? bindings[0] : undefined;
  const subject = snapshot?.subjects.find(
    (subject) => subject.id === rule?.subjectId,
  );
  const completeRead =
    subject &&
    rule &&
    entry.item?.kind === 'COMMAND_EXECUTION' &&
    entry.item.rawStartedEvent &&
    fact.exitCode === 0 &&
    !fact.timedOut &&
    !fact.stdoutTruncated &&
    !fact.stderrTruncated &&
    fact.output?.kind === 'numeric_stdout' &&
    /^-?\d+$/.test(fact.output.value);
  if (completeRead)
    return {
      kind: 'recorded_read_command',
      scope: 'recorded_execution',
      mapping: { status: 'bound', ruleId: rule.id, subjectId: subject.id },
      wording: { key: 'bound_read', subject: subject.label },
      unsupportedReadMapping: false,
    };
  return {
    kind: 'recorded_command',
    scope: 'recorded_execution',
    mapping: genericMapping,
    wording: { key: 'recorded_command' },
    unsupportedReadMapping: true,
  };
};
