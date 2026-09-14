import type {
  CommandFinishedPayload,
  CommandStartedPayload,
  SandboxCleanupFailedPayload,
  SessionEvent,
  WorkspaceCaptureFailedPayload,
  WorkspaceChangedPayload,
  WorkspaceFileChange,
} from '../events/session-event';

export type SessionActivationItem = Readonly<{
  kind: 'SESSION_ACTIVATED';
  timestamp: string;
}>;

export type CommandExecutionItem = Readonly<{
  kind: 'COMMAND_EXECUTION';
  commandId: string;
  command: string;
  cwd: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  stdoutPreview: string;
  stderrPreview: string;
  rawStartedEventId: string;
  rawFinishedEventId: string;
  sequence: number;
  rawStartedEvent?: SessionEvent;
  rawFinishedEvent: SessionEvent;
}>;

export type WorkspaceChangeItem = Readonly<{
  kind: 'WORKSPACE_CHANGE';
  changeId: string;
  origin: 'browser_save' | 'command_execution' | 'out_of_band';
  commandId?: string;
  timestamp: string;
  beforeTree: string;
  afterTree: string;
  files: readonly WorkspaceFileChange[];
  totalAdditions: number;
  totalDeletions: number;
  rawEventId: string;
  sequence: number;
  rawEvent: SessionEvent;
}>;

export type WorkspaceGapItem = Readonly<{
  kind: 'WORKSPACE_GAP';
  timestamp: string;
  commandId?: string;
  phase: string;
  errorMessage: string;
  rawEventId: string;
  sequence: number;
  rawEvent: SessionEvent;
}>;

export type SessionSubmittedItem = Readonly<{
  kind: 'SESSION_SUBMITTED';
  timestamp: string;
  submittedDiff: string;
}>;

export type SandboxCleanupFailureItem = Readonly<{
  kind: 'SANDBOX_CLEANUP_FAILURE';
  timestamp: string;
  errorMessage: string;
  rawEventId: string;
  sequence: number;
  rawEvent: SessionEvent;
}>;

export type ReconstructionItem =
  | SessionActivationItem
  | CommandExecutionItem
  | WorkspaceChangeItem
  | WorkspaceGapItem
  | SessionSubmittedItem
  | SandboxCleanupFailureItem;

export type SessionReconstructionInput = Readonly<{
  activatedAt: string | null;
  submittedAt: string | null;
  submittedDiff?: string | null;
}>;

export function buildChronologicalReconstruction(
  session: SessionReconstructionInput,
  events: readonly SessionEvent[],
): readonly ReconstructionItem[] {
  const items: ReconstructionItem[] = [];

  if (session.activatedAt) {
    items.push({
      kind: 'SESSION_ACTIVATED',
      timestamp: session.activatedAt,
    });
  }

  const startedMap = new Map<string, SessionEvent>();
  const middleItems: Array<{
    sequence: number;
    item: CommandExecutionItem | WorkspaceChangeItem | WorkspaceGapItem;
  }> = [];
  const cleanupFailures: SandboxCleanupFailureItem[] = [];

  for (const event of events) {
    if (event.type === 'COMMAND_STARTED') {
      const payload = event.payload as CommandStartedPayload;
      startedMap.set(payload.commandId, event);
    } else if (event.type === 'COMMAND_FINISHED') {
      const finishedPayload = event.payload as CommandFinishedPayload;
      const startedEvent = startedMap.get(finishedPayload.commandId);
      const startedPayload = startedEvent
        ? (startedEvent.payload as CommandStartedPayload)
        : null;

      middleItems.push({
        sequence: event.sequence,
        item: {
          kind: 'COMMAND_EXECUTION',
          commandId: finishedPayload.commandId,
          command: startedPayload?.command ?? '(unknown command)',
          cwd: startedPayload?.cwd ?? '/workspace',
          startedAt: startedEvent?.timestamp ?? event.timestamp,
          finishedAt: event.timestamp,
          durationMs: finishedPayload.durationMs,
          exitCode: finishedPayload.exitCode,
          timedOut: finishedPayload.timedOut,
          stdoutPreview: finishedPayload.stdoutPreview,
          stderrPreview: finishedPayload.stderrPreview,
          rawStartedEventId: startedEvent?.id ?? event.id,
          rawFinishedEventId: event.id,
          sequence: event.sequence,
          rawStartedEvent: startedEvent,
          rawFinishedEvent: event,
        },
      });
    } else if (event.type === 'WORKSPACE_CHANGED') {
      const payload = event.payload as WorkspaceChangedPayload;
      middleItems.push({
        sequence: event.sequence,
        item: {
          kind: 'WORKSPACE_CHANGE',
          changeId: payload.changeId,
          origin: payload.origin,
          commandId: payload.commandId,
          timestamp: event.timestamp,
          beforeTree: payload.beforeTree,
          afterTree: payload.afterTree,
          files: payload.files,
          totalAdditions: payload.totalAdditions,
          totalDeletions: payload.totalDeletions,
          rawEventId: event.id,
          sequence: event.sequence,
          rawEvent: event,
        },
      });
    } else if (event.type === 'WORKSPACE_CAPTURE_FAILED') {
      const payload = event.payload as WorkspaceCaptureFailedPayload;
      middleItems.push({
        sequence: event.sequence,
        item: {
          kind: 'WORKSPACE_GAP',
          timestamp: event.timestamp,
          commandId: payload.commandId,
          phase: payload.phase,
          errorMessage: payload.errorMessage,
          rawEventId: event.id,
          sequence: event.sequence,
          rawEvent: event,
        },
      });
    } else if (event.type === 'SANDBOX_CLEANUP_FAILED') {
      const payload = event.payload as SandboxCleanupFailedPayload;
      cleanupFailures.push({
        kind: 'SANDBOX_CLEANUP_FAILURE',
        timestamp: event.timestamp,
        errorMessage: payload.errorMessage,
        rawEventId: event.id,
        sequence: event.sequence,
        rawEvent: event,
      });
    }
  }

  middleItems.sort((a, b) => a.sequence - b.sequence);
  for (const entry of middleItems) {
    items.push(entry.item);
  }

  if (session.submittedAt) {
    items.push({
      kind: 'SESSION_SUBMITTED',
      timestamp: session.submittedAt,
      submittedDiff: session.submittedDiff ?? '',
    });
  }

  cleanupFailures.sort((a, b) => a.sequence - b.sequence);
  items.push(...cleanupFailures);

  return items;
}
