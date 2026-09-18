import type { ReconstructionItem } from '../evidence/chronological-reconstruction';
import type { CommandFinishedPayload } from '../events/session-event';
import type { ReconstructionLimits } from './reconstruction-limits';

export type CommandOutputFact =
  | Readonly<{
      kind: 'test_summary';
      passed: number;
      failed: number;
    }>
  | Readonly<{
      kind: 'numeric_stdout';
      value: string;
    }>;

export type TypedEvidenceFact =
  | Readonly<{
      kind: 'activation';
      timestamp: string;
    }>
  | Readonly<{
      kind: 'submission';
      timestamp: string;
    }>
  | Readonly<{
      kind: 'command_execution';
      command: string;
      cwd: string;
      exitCode: number | null;
      timedOut: boolean;
      durationMs: number;
      output: CommandOutputFact | null;
      stdoutExcerpt: string;
      stdoutBytes: number;
      stdoutTruncated: boolean;
      stderrExcerpt: string;
      stderrBytes: number;
      stderrTruncated: boolean;
    }>
  | Readonly<{
      kind: 'workspace_change';
      origin: 'browser_save' | 'command_execution' | 'out_of_band';
      beforeTree: string;
      afterTree: string;
      files: readonly Readonly<{
        path: string;
        status: 'modified' | 'added' | 'deleted';
        additions: number;
        deletions: number;
        patchExcerpt: string;
        patchBytes: number;
        patchTruncated: boolean;
      }>[];
    }>
  | Readonly<{
      kind: 'evidence_gap';
      phase: string;
      commandId?: string;
    }>
  | Readonly<{
      kind: 'ai_request_started';
      interactionId: string;
      configuredProviderId: string;
      configuredModelId: string;
      promptExcerpt: string;
      promptBytes: number;
      promptTruncated: boolean;
      contextAttachmentsCount: number;
    }>
  | Readonly<{
      kind: 'ai_response_completed';
      interactionId: string;
      reportedModelId: string;
      durationMs: number;
      responseExcerpt: string;
      responseBytes: number;
      responseTruncated: boolean;
      tokenUsage?: Readonly<{
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      }>;
    }>
  | Readonly<{
      kind: 'ai_request_cancelled';
      interactionId: string;
      durationMs: number;
      cancelReason: string;
    }>
  | Readonly<{
      kind: 'ai_request_failed';
      interactionId: string;
      durationMs: number;
      failureReason: string;
      errorMessageExcerpt: string;
    }>;

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8');

export const boundEvidenceText = (value: string, maximumBytes: number) => {
  if (byteLength(value) <= maximumBytes) {
    return { excerpt: value, totalBytes: byteLength(value) };
  }

  let excerpt = '';
  for (const character of value) {
    if (byteLength(excerpt + character) > maximumBytes) break;
    excerpt += character;
  }
  return { excerpt, totalBytes: byteLength(value) };
};

const stripAnsi = (value: string) =>
  value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');

const pytestSummary = (output: string): CommandOutputFact | null => {
  const summaries = stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .flatMap((line) => {
      const match = line.match(
        /^={5,}\s+(.+?)\s+in\s+(?:\d+(?:\.\d+)?s|\d+:\d{2}:\d{2})\s+={5,}$/,
      );
      if (!match) return [];
      const resultTokens = match[1].split(/,\s*/);
      if (
        resultTokens.length === 0 ||
        resultTokens.some((token) => !/^\d+\s+(?:passed|failed)$/.test(token))
      ) {
        return [];
      }
      const counts = { passed: 0, failed: 0 };
      for (const token of resultTokens) {
        const tokenMatch = token.match(/^(\d+)\s+(passed|failed)$/);
        if (!tokenMatch) return [];
        counts[tokenMatch[2] as 'passed' | 'failed'] = Number(tokenMatch[1]);
      }
      return counts.passed > 0 || counts.failed > 0 ? [counts] : [];
    });

  return summaries.length === 1
    ? { kind: 'test_summary', ...summaries[0] }
    : null;
};

export const parseCommandOutputFact = (
  command: string,
  stdout: string,
  stderr: string,
  outputComplete = true,
): CommandOutputFact | null => {
  const output = `${stdout}\n${stderr}`;
  const executable = command.trim().split(/\s+/, 1)[0]?.split('/').at(-1);
  if (executable === 'pytest' && outputComplete) {
    const summary = pytestSummary(output);
    if (summary) return summary;
  }

  const numericStdout = stdout.trim();
  if (outputComplete && /^-?\d+(?:\.\d+)?$/.test(numericStdout)) {
    return { kind: 'numeric_stdout', value: numericStdout };
  }
  return null;
};

export const buildTypedEvidenceFact = (
  item: ReconstructionItem,
  limits: ReconstructionLimits,
): TypedEvidenceFact | null => {
  if (item.kind === 'SESSION_ACTIVATED') {
    return { kind: 'activation', timestamp: item.timestamp };
  }
  if (item.kind === 'SESSION_SUBMITTED') {
    return { kind: 'submission', timestamp: item.timestamp };
  }
  if (item.kind === 'COMMAND_EXECUTION') {
    const raw = item.rawFinishedEvent.payload as CommandFinishedPayload;
    const stdout = boundEvidenceText(
      item.stdoutPreview,
      limits.maximumCommandOutputBytes,
    );
    const stderr = boundEvidenceText(
      item.stderrPreview,
      limits.maximumCommandOutputBytes,
    );
    const outputComplete =
      !raw.stdoutTruncated &&
      !raw.stderrTruncated &&
      stdout.excerpt === item.stdoutPreview &&
      stderr.excerpt === item.stderrPreview;
    return {
      kind: 'command_execution',
      command: item.command,
      cwd: item.cwd,
      exitCode: item.exitCode,
      timedOut: item.timedOut,
      durationMs: item.durationMs,
      output: parseCommandOutputFact(
        item.command,
        stdout.excerpt,
        stderr.excerpt,
        outputComplete,
      ),
      stdoutExcerpt: stdout.excerpt,
      stdoutBytes: raw.stdoutBytes,
      stdoutTruncated:
        raw.stdoutTruncated || stdout.excerpt !== item.stdoutPreview,
      stderrExcerpt: stderr.excerpt,
      stderrBytes: raw.stderrBytes,
      stderrTruncated:
        raw.stderrTruncated || stderr.excerpt !== item.stderrPreview,
    };
  }
  if (item.kind === 'WORKSPACE_CHANGE') {
    return {
      kind: 'workspace_change',
      origin: item.origin,
      beforeTree: item.beforeTree,
      afterTree: item.afterTree,
      files: item.files.map((file) => {
        const patch = boundEvidenceText(
          file.patchPreview,
          limits.maximumPatchBytes,
        );
        return {
          path: file.path,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patchExcerpt: patch.excerpt,
          patchBytes: file.patchBytes,
          patchTruncated:
            file.patchTruncated || patch.excerpt !== file.patchPreview,
        };
      }),
    };
  }
  if (item.kind === 'WORKSPACE_GAP') {
    return {
      kind: 'evidence_gap',
      phase: item.phase,
      ...(item.commandId ? { commandId: item.commandId } : {}),
    };
  }
  if (item.kind === 'AI_REQUEST_STARTED') {
    const prompt = boundEvidenceText(
      item.candidateInputExcerpt,
      limits.maximumCommandOutputBytes,
    );
    return {
      kind: 'ai_request_started',
      interactionId: item.interactionId,
      configuredProviderId: item.configuredProviderId,
      configuredModelId: item.configuredModelId,
      promptExcerpt: prompt.excerpt,
      promptBytes: item.candidateInputBytes,
      promptTruncated:
        item.candidateInputBytes > prompt.totalBytes ||
        prompt.excerpt !== item.candidateInputExcerpt,
      contextAttachmentsCount: item.contextAttachmentsCount,
    };
  }
  if (item.kind === 'AI_RESPONSE_COMPLETED') {
    const response = boundEvidenceText(
      item.responseExcerpt,
      limits.maximumCommandOutputBytes,
    );
    return {
      kind: 'ai_response_completed',
      interactionId: item.interactionId,
      reportedModelId: item.reportedModelId,
      durationMs: item.durationMs,
      responseExcerpt: response.excerpt,
      responseBytes: item.responseBytes,
      responseTruncated:
        item.responseBytes > response.totalBytes ||
        response.excerpt !== item.responseExcerpt,
      ...(item.tokenUsage ? { tokenUsage: item.tokenUsage } : {}),
    };
  }
  if (item.kind === 'AI_REQUEST_CANCELLED') {
    return {
      kind: 'ai_request_cancelled',
      interactionId: item.interactionId,
      durationMs: item.durationMs,
      cancelReason: item.cancelReason,
    };
  }
  if (item.kind === 'AI_REQUEST_FAILED') {
    const err = boundEvidenceText(
      item.errorMessageExcerpt,
      limits.maximumCommandOutputBytes,
    );
    return {
      kind: 'ai_request_failed',
      interactionId: item.interactionId,
      durationMs: item.durationMs,
      failureReason: item.failureReason,
      errorMessageExcerpt: err.excerpt,
    };
  }
  return null;
};
