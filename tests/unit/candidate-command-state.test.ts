import { describe, expect, it } from 'vitest';

import type { CommandExecResult } from '../../apps/web/src/sandbox/sandbox';
import {
  beginCommand,
  canBeginCommand,
  commandPlatformError,
  completeCommand,
  failCommand,
  generateCommandEntryId,
  isCommandExecResult,
} from '../../apps/web/app/candidate/[token]/candidate-command-state';

const result = (
  overrides: Partial<CommandExecResult> = {},
): CommandExecResult => ({
  commandId: 'cmd-1',
  exitCode: 0,
  timedOut: false,
  durationMs: 20,
  stdoutPreview: 'done\n',
  stdoutBytes: 5,
  stdoutTruncated: false,
  stderrPreview: '',
  stderrBytes: 0,
  stderrTruncated: false,
  ...overrides,
});

describe('C5 command presentation state', () => {
  it('blocks duplicate, empty, and inactive command admission', () => {
    expect(canBeginCommand('npm test', true, true)).toBe(false);
    expect(canBeginCommand('   ', false, true)).toBe(false);
    expect(canBeginCommand('npm test', false, false)).toBe(false);
    expect(canBeginCommand('npm test', false, true)).toBe(true);
  });

  it('creates a unique local identity for each history entry', () => {
    expect(generateCommandEntryId()).not.toBe(generateCommandEntryId());
  });

  it('keeps a running command in chronological history until its exact response completes', () => {
    const started = beginCommand([], 'one', 'npm test');
    const withSecond = beginCommand(started, 'two', 'npm run lint');
    const completed = completeCommand(
      withSecond,
      'two',
      result({ commandId: 'cmd-2' }),
    );

    expect(completed).toMatchObject([
      { id: 'one', command: 'npm test', state: 'RUNNING' },
      {
        id: 'two',
        command: 'npm run lint',
        state: 'COMPLETED_SUCCESS',
        result: { commandId: 'cmd-2', stdoutPreview: 'done\n' },
      },
    ]);
  });

  it('keeps stdout, stderr, and truncation facts with their command', () => {
    const history = completeCommand(
      beginCommand([], 'one', 'npm test'),
      'one',
      result({
        stdoutPreview: 'standard output',
        stderrPreview: 'standard error',
        stdoutTruncated: true,
        stderrTruncated: true,
      }),
    );

    expect(history[0].result).toMatchObject({
      stdoutPreview: 'standard output',
      stderrPreview: 'standard error',
      stdoutTruncated: true,
      stderrTruncated: true,
    });
  });

  it('represents non-zero exit, timeout, and platform error as different outcomes', () => {
    const started = beginCommand([], 'one', 'npm test');

    expect(
      completeCommand(started, 'one', result({ exitCode: 1 }))[0].state,
    ).toBe('COMPLETED_FAILURE');
    expect(
      completeCommand(started, 'one', result({ timedOut: true }))[0].state,
    ).toBe('TIMED_OUT');
    expect(
      failCommand(started, 'one', 'Delimit could not run the command.')[0],
    ).toMatchObject({
      state: 'PLATFORM_ERROR',
      platformError: 'Delimit could not run the command.',
    });
  });

  it('rejects malformed results and gives non-active and deadline rejections factual messages', () => {
    expect(isCommandExecResult({ commandId: 'cmd-1' })).toBe(false);
    expect(commandPlatformError(409, 'SESSION_NOT_ACTIVE', undefined)).toBe(
      'Command could not be run because the assessment is not active.',
    );
    expect(
      commandPlatformError(409, 'SESSION_DEADLINE_EXCEEDED', undefined),
    ).toBe(
      'Command could not be run because the assessment time limit has been reached.',
    );
  });
});
