import { semanticSubjectLabels } from '../scenarios/scenario-semantic-snapshot';

export const briefingWordingVersion = 'briefing-wording-v2';
export type NeutralSubject = (typeof semanticSubjectLabels)[number];
export type BriefingWording =
  | {
      key:
        | 'recorded_command'
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
        | 'submitted_unsupported'
        | 'terminal_activity_before_edit'
        | 'terminal_activity_after_edit'
        | 'terminal_activity'
        | 'test_run_before_submission'
        | 'write_through_service_update';
    }
  | { key: 'workspace_edit'; path?: string }
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
  prior_tree: 'The workspace returned to a previously recorded state.',
  submission: 'The work was submitted.',
  workspace_gap:
    'Delimit did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.',
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
    'This historical session has limited scenario context. Standard recorded activity and submitted changes remain available.',
  missing_semantics:
    'Scenario-specific descriptions are not configured for this session. Standard activity records remain available.',
  unsupported_semantics:
    'Scenario-specific descriptions are not supported for this metadata version. Standard activity records remain available.',
  unsupported_mapping:
    'Some recorded commands do not have scenario-specific descriptions. Their exact technical records remain available.',
  artifact_unavailable:
    'The derived reconstruction is unavailable; recorded evidence remains accessible.',
  artifact_pending:
    'The derived reconstruction is not yet available; recorded evidence remains accessible.',
  terminal_activity_before_edit:
    'Recorded terminal activity occurred before the code change.',
  terminal_activity_after_edit:
    'Recorded terminal activity occurred after the code change.',
  terminal_activity: 'Recorded terminal activity occurred.',
  test_run_before_submission: 'A test run was recorded before submission.',
  write_through_service_update:
    'The submitted diff writes the updated quantity to the storefront Redis key after the database commit.',
} as const;

const count = (value: number) => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid wording count.');
  return value;
};

export const isSafeSourcePath = (path: string) =>
  /^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(path);

export const renderBriefingWording = (wording: BriefingWording): string => {
  if (
    (wording.key === 'bound_read' || wording.key === 'related_edit') &&
    !semanticSubjectLabels.includes(wording.subject)
  )
    throw new Error('Unsupported wording subject.');
  if (wording.key === 'bound_read')
    return `A recorded command read the ${wording.subject}.`;
  if (wording.key === 'related_edit')
    return `Code was modified in ${wording.subject}.`;
  if (wording.key === 'workspace_edit')
    return wording.path && isSafeSourcePath(wording.path)
      ? `Code was modified in ${wording.path}.`
      : 'Code changes were recorded.';
  if (wording.key === 'submitted_files') {
    const total = count(wording.count);
    return `The submission includes changes to ${total} ${total === 1 ? 'file' : 'files'}.`;
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
