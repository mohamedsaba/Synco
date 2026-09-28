import type { CommandExecResult } from '../../../src/sandbox/sandbox';

export type CommandPresentationState =
  | 'RUNNING'
  | 'COMPLETED_SUCCESS'
  | 'COMPLETED_FAILURE'
  | 'TIMED_OUT'
  | 'PLATFORM_ERROR';

export type CommandHistoryEntry = Readonly<{
  id: string;
  command: string;
  state: CommandPresentationState;
  result: CommandExecResult | null;
  platformError: string | null;
}>;

export const canBeginCommand = (
  command: string,
  isInFlight: boolean,
  canRunCommands: boolean,
): boolean => Boolean(command.trim()) && !isInFlight && canRunCommands;

export const generateCommandEntryId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `command_${crypto.randomUUID()}`;
  }
  return `command_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const beginCommand = (
  history: readonly CommandHistoryEntry[],
  id: string,
  command: string,
): readonly CommandHistoryEntry[] => [
  ...history,
  { id, command, state: 'RUNNING', result: null, platformError: null },
];

const resultState = (result: CommandExecResult): CommandPresentationState => {
  if (result.timedOut) return 'TIMED_OUT';
  return result.exitCode === 0 ? 'COMPLETED_SUCCESS' : 'COMPLETED_FAILURE';
};

export const completeCommand = (
  history: readonly CommandHistoryEntry[],
  id: string,
  result: CommandExecResult,
): readonly CommandHistoryEntry[] =>
  history.map((entry) =>
    entry.id === id
      ? { ...entry, state: resultState(result), result, platformError: null }
      : entry,
  );

export const failCommand = (
  history: readonly CommandHistoryEntry[],
  id: string,
  platformError: string,
): readonly CommandHistoryEntry[] =>
  history.map((entry) =>
    entry.id === id
      ? { ...entry, state: 'PLATFORM_ERROR', platformError }
      : entry,
  );

export const isCommandExecResult = (
  value: unknown,
): value is CommandExecResult => {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.commandId === 'string' &&
    (typeof result.exitCode === 'number' || result.exitCode === null) &&
    typeof result.timedOut === 'boolean' &&
    typeof result.durationMs === 'number' &&
    typeof result.stdoutPreview === 'string' &&
    typeof result.stdoutBytes === 'number' &&
    typeof result.stdoutTruncated === 'boolean' &&
    typeof result.stderrPreview === 'string' &&
    typeof result.stderrBytes === 'number' &&
    typeof result.stderrTruncated === 'boolean'
  );
};

export const commandPlatformError = (
  status: number | null,
  code: string | undefined,
  message: string | undefined,
): string => {
  if (code === 'SESSION_NOT_ACTIVE') {
    return 'Command could not be run because the assessment is not active.';
  }
  if (code === 'SESSION_DEADLINE_EXCEEDED') {
    return 'Command could not be run because the assessment time limit has been reached.';
  }
  if (code === 'SESSION_FINALIZATION_STARTED') {
    return 'Command could not be run because finalization has started.';
  }
  if (message) return message;
  if (status === null)
    return 'Hirearchy Software could not run the command. Try again.';
  return 'Hirearchy Software could not run the command.';
};
