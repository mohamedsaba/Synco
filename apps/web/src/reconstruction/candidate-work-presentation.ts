import type { EvidenceCatalogEntry } from './evidence-reference-catalog';
import type { ReconstructionStatement } from './evidence-reconstruction';

export const workspaceReversionText =
  'The workspace returned to a previously recorded state.';
export const unobservedWorkspaceReversionText =
  'Between recorded actions, the workspace returned to a previously recorded state.';

export type CandidateWorkCategory = Readonly<{
  label: string;
  className: string;
}>;

const commandCategory = (
  statement: ReconstructionStatement,
): CandidateWorkCategory => {
  if (
    /^\d+ tests? (?:passed|failed)\.$/.test(statement.text) ||
    /^\d+ passed, \d+ failed\.$/.test(statement.text)
  ) {
    return { label: 'Test run', className: 'badge-test' };
  }
  if (statement.text.startsWith('Recorded command output:')) {
    return { label: 'Command output', className: 'badge-command' };
  }
  return { label: 'Command executed', className: 'badge-command' };
};

const workspaceCategory = (
  statement: ReconstructionStatement,
  entries: readonly EvidenceCatalogEntry[],
): CandidateWorkCategory => {
  if (
    statement.text === workspaceReversionText ||
    statement.text === unobservedWorkspaceReversionText
  ) {
    return { label: 'Workspace reversion', className: 'badge-reversion' };
  }
  if (
    entries.some(
      (entry) =>
        entry.item?.kind === 'WORKSPACE_CHANGE' &&
        entry.item.origin === 'out_of_band',
    )
  ) {
    return {
      label: 'Unobserved workspace change',
      className: 'badge-gap',
    };
  }
  const fileCount = entries.reduce(
    (count, entry) =>
      count +
      (entry.item?.kind === 'WORKSPACE_CHANGE' ? entry.item.files.length : 0),
    0,
  );
  return {
    label: entries.length > 1 || fileCount > 1 ? 'Code changes' : 'Code change',
    className: 'badge-workspace',
  };
};

export const presentCandidateWorkStatement = (
  statement: ReconstructionStatement,
  entries: readonly EvidenceCatalogEntry[],
): CandidateWorkCategory => {
  if (statement.claimBasis === 'final_state') {
    return { label: 'Submitted state', className: 'badge-submitted' };
  }
  if (entries.some((entry) => entry.kind === 'submission')) {
    return { label: 'Submitted', className: 'badge-submitted' };
  }
  if (entries.some((entry) => entry.kind === 'evidence_gap')) {
    return { label: 'Evidence gap', className: 'badge-gap' };
  }
  if (
    entries.length > 0 &&
    entries.every((entry) => entry.kind === 'command_execution')
  ) {
    return commandCategory(statement);
  }
  if (
    entries.length > 0 &&
    entries.every((entry) => entry.kind === 'workspace_change')
  ) {
    return workspaceCategory(statement, entries);
  }
  return { label: 'Recorded event', className: 'badge-command' };
};
