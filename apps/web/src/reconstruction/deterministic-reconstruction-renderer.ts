import type { EvidencePacketV1, ModelEvidenceItem } from './evidence-packet';
import type { ClaimBasis } from './evidence-reconstruction';
import {
  unobservedWorkspaceReversionText,
  workspaceReversionText,
} from './candidate-work-presentation';
import { initialReconstructionLimits } from './reconstruction-limits';
import type { TypedEvidenceFact } from './typed-evidence-fact';

type FinalDiffFact = Readonly<{
  kind: 'final_diff';
  paths: readonly string[];
}>;

export type WorkspaceProgressionFact = Readonly<{
  kind: 'workspace_progression';
  changes: readonly Extract<TypedEvidenceFact, { kind: 'workspace_change' }>[];
  paths: readonly string[];
}>;

export type DeterministicStatementTrace = Readonly<{
  fact: TypedEvidenceFact | WorkspaceProgressionFact | FinalDiffFact;
  evidenceRefs: readonly string[];
  claimBasis: ClaimBasis;
  text: string;
  detail?: string;
}>;

const inlineValue = (value: string, maximumLength = 140) =>
  value.length <= maximumLength && !/[`\r\n\u0000-\u001f]/.test(value)
    ? `\`${value}\``
    : null;

const countPhrase = (count: number, singular: string) =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

const testSummaryStatement = (
  output: Extract<
    Extract<TypedEvidenceFact, { kind: 'command_execution' }>['output'],
    { kind: 'test_summary' }
  >,
) => {
  if (output.passed > 0 && output.failed > 0) {
    return `${output.passed} passed, ${output.failed} failed.`;
  }
  if (output.failed > 0) {
    return `${countPhrase(output.failed, 'test')} failed.`;
  }
  return `${countPhrase(output.passed, 'test')} passed.`;
};

const commandStatement = (
  fact: Extract<TypedEvidenceFact, { kind: 'command_execution' }>,
) => {
  if (fact.output?.kind === 'test_summary') {
    return testSummaryStatement(fact.output);
  }
  if (fact.output?.kind === 'numeric_stdout') {
    return `Recorded command output: \`${fact.output.value}\`.`;
  }
  if (fact.timedOut) {
    return 'A recorded command timed out.';
  }
  if (fact.exitCode === null) {
    return 'A recorded command completed without a recorded exit status.';
  }
  return `A recorded command exited with status ${fact.exitCode}.`;
};

const fileAction = (
  file: Extract<
    TypedEvidenceFact,
    { kind: 'workspace_change' }
  >['files'][number],
) => {
  const path = inlineValue(file.path, 180);
  if (!path) return null;
  const verb =
    file.status === 'added'
      ? 'Added'
      : file.status === 'deleted'
        ? 'Removed'
        : 'Modified';
  return `${verb} ${path}.`;
};

const outOfBandFileAction = (
  file: Extract<
    TypedEvidenceFact,
    { kind: 'workspace_change' }
  >['files'][number],
) => {
  const path = inlineValue(file.path, 180);
  if (!path) return null;
  if (file.status === 'added') return `${path} appeared`;
  if (file.status === 'deleted') return `${path} was removed`;
  return `${path} changed`;
};

const workspaceDetail = (
  fact: Extract<TypedEvidenceFact, { kind: 'workspace_change' }>,
) => {
  const actions = fact.files.map(fileAction);
  if (actions.some((action) => action === null)) return undefined;
  const detail = actions.join(' ');
  return detail.length <=
    initialReconstructionLimits.maximumStatementDetailLength
    ? detail
    : undefined;
};

export const renderChronologyFact = (
  item: ModelEvidenceItem,
  anchorKinds: ReadonlySet<string>,
): DeterministicStatementTrace => {
  const basis = {
    fact: item.fact,
    evidenceRefs: [item.evidenceRef],
    claimBasis: 'chronology' as const,
  };
  if (item.fact.kind === 'activation') {
    return { ...basis, text: 'The session was activated.' };
  }
  if (item.fact.kind === 'submission') {
    return { ...basis, text: 'Session submitted.' };
  }
  if (item.fact.kind === 'evidence_gap') {
    return {
      ...basis,
      text: 'Recorded workspace evidence is incomplete for part of this interval.',
    };
  }
  if (item.fact.kind === 'command_execution') {
    return {
      ...basis,
      text: commandStatement(item.fact),
    };
  }

  const detail = workspaceDetail(item.fact);
  if (anchorKinds.has('reversion') && item.fact.origin === 'out_of_band') {
    return {
      ...basis,
      text: unobservedWorkspaceReversionText,
      ...(detail ? { detail } : {}),
    };
  }
  if (anchorKinds.has('reversion')) {
    return {
      ...basis,
      text: workspaceReversionText,
      ...(detail ? { detail } : {}),
    };
  }
  if (item.fact.origin === 'out_of_band') {
    const action =
      item.fact.files.length === 1
        ? outOfBandFileAction(item.fact.files[0])
        : null;
    return {
      ...basis,
      text: action
        ? `${action} between recorded actions.`
        : `${countPhrase(item.fact.files.length, 'file')} changed between recorded actions.`,
    };
  }
  if (item.fact.files.length === 1) {
    const action = fileAction(item.fact.files[0]);
    if (action) return { ...basis, text: action };
  }
  return {
    ...basis,
    text: `The workspace change recorded ${countPhrase(item.fact.files.length, 'file')}.`,
    ...(detail ? { detail } : {}),
  };
};

export const renderWorkspaceProgression = (
  items: readonly ModelEvidenceItem[],
): DeterministicStatementTrace => {
  const changes = items.flatMap((item) =>
    item.fact.kind === 'workspace_change' ? [item.fact] : [],
  );
  const paths = Array.from(
    new Set(changes.flatMap((change) => change.files.map((file) => file.path))),
  ).toSorted();
  const listedPaths = paths.map((path) => inlineValue(path, 180));
  const pathList = listedPaths.every((path) => path !== null)
    ? listedPaths.join(' and ')
    : '';
  const prefix = `${countPhrase(changes.length, 'recorded workspace change')} affected`;
  const listedText = `${prefix} ${pathList}.`;
  const text =
    pathList &&
    listedText.length <= initialReconstructionLimits.maximumStatementTextLength
      ? listedText
      : `${prefix} ${countPhrase(paths.length, 'file')}.`;

  return {
    fact: { kind: 'workspace_progression', changes, paths },
    evidenceRefs: items.map((item) => item.evidenceRef),
    claimBasis: 'chronology',
    text,
  };
};

const finalDiffPaths = (excerpt: string) =>
  Array.from(excerpt.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm), (match) =>
    match[2].trim(),
  ).filter((path, index, paths) => paths.indexOf(path) === index);

export const renderFinalDiff = (
  packet: EvidencePacketV1,
): DeterministicStatementTrace => {
  const paths = finalDiffPaths(packet.finalDiff.excerpt);
  const listed = paths.map((path) => inlineValue(path, 180));
  const text =
    paths.length === 1 && listed[0]
      ? `The submitted state includes changes to ${listed[0]}.`
      : paths.length > 1
        ? `The submitted state includes changes across ${countPhrase(paths.length, 'file')}.`
        : 'The submitted state includes repository changes.';
  return {
    fact: { kind: 'final_diff', paths },
    evidenceRefs: [packet.finalDiff.evidenceRef],
    claimBasis: 'final_state',
    text,
  };
};
