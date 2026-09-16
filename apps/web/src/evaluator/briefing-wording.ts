import { semanticSubjectLabels } from '../scenarios/scenario-semantic-snapshot';

export const briefingWordingVersion = 'briefing-wording-v1';
export type NeutralSubject = (typeof semanticSubjectLabels)[number];
export type BriefingWording =
  | {
      key:
        | 'recorded_command'
        | 'workspace_edit'
        | 'prior_tree'
        | 'submission'
        | 'workspace_gap'
        | 'verification_execution'
        | 'no_summary'
        | 'stdout_truncated'
        | 'stderr_truncated'
        | 'patch_truncated'
        | 'missing_context'
        | 'missing_semantics'
        | 'unsupported_semantics'
        | 'unsupported_mapping'
        | 'artifact_unavailable'
        | 'artifact_pending'
        | 'submitted_unsupported';
    }
  | { key: 'bound_read' | 'related_edit'; subject: NeutralSubject }
  | {
      key: 'verification_result';
      position: 'first' | 'later' | 'final' | 'only';
      passed: number;
      failed: number;
    }
  | { key: 'submitted_files'; count: number };

const literalTemplates = {
  submitted_unsupported:
    'The frozen submission diff is available; its file summary is unsupported.',
  recorded_command: 'A command execution was recorded.',
  workspace_edit: 'A workspace edit was recorded.',
  prior_tree: 'The workspace returned to a previously recorded state.',
  submission: 'Submission was recorded.',
  workspace_gap: 'Part of the workspace activity record is incomplete.',
  verification_execution: 'A test execution was recorded.',
  no_summary:
    'No supported test summary is available for this recorded execution.',
  stdout_truncated:
    'Recorded standard output is a captured preview with omitted output.',
  stderr_truncated:
    'Recorded standard error is a captured preview with omitted output.',
  patch_truncated:
    'A recorded patch is a captured preview with omitted content.',
  missing_context:
    'Scenario evaluation context is unavailable for this session.',
  missing_semantics:
    'Scenario semantic metadata is absent; generic evidence wording is used.',
  unsupported_semantics:
    'Scenario semantic metadata is unsupported; generic evidence wording is used.',
  unsupported_mapping:
    'This recorded command has no supported semantic read mapping; generic wording is used.',
  artifact_unavailable:
    'The derived reconstruction is unavailable; recorded evidence remains accessible.',
  artifact_pending:
    'The derived reconstruction is not yet available; recorded evidence remains accessible.',
} as const;

const count = (value: number) => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid wording count.');
  return value;
};

export const renderBriefingWording = (wording: BriefingWording): string => {
  if (
    (wording.key === 'bound_read' || wording.key === 'related_edit') &&
    !semanticSubjectLabels.includes(wording.subject)
  )
    throw new Error('Unsupported wording subject.');
  if (wording.key === 'bound_read')
    return `A recorded command read the ${wording.subject}.`;
  if (wording.key === 'related_edit')
    return `Workspace edits were recorded in ${wording.subject}.`;
  if (wording.key === 'submitted_files') {
    const total = count(wording.count);
    return `The frozen submission diff contains changes to ${total} ${total === 1 ? 'file' : 'files'}.`;
  }
  if (wording.key === 'verification_result') {
    const position = {
      first: 'The first',
      later: 'A later',
      final: 'The final',
      only: 'The',
    }[wording.position];
    const failed = count(wording.failed);
    const passed = count(wording.passed);
    const result =
      failed === 0
        ? `${passed} passes`
        : passed === 0
          ? `${failed} failures`
          : `${failed} failures and ${passed} passes`;
    return `${position} recorded test run reported ${result}.`;
  }
  return literalTemplates[wording.key];
};
