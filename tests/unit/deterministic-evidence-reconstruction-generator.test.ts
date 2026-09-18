import { describe, expect, it } from 'vitest';

import {
  buildDeterministicReconstruction,
  DeterministicEvidenceReconstructionGenerator,
  deterministicReconstructionProviderId,
  deterministicReconstructionVersion,
} from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import type {
  CoverageAnchor,
  EvidencePacketV1,
  ModelEvidenceItem,
} from '../../apps/web/src/reconstruction/evidence-packet';
import { renderChronologyFact } from '../../apps/web/src/reconstruction/deterministic-reconstruction-renderer';
import type { TypedEvidenceFact } from '../../apps/web/src/reconstruction/typed-evidence-fact';

const sessionId = 'deterministic-session';

const item = (
  suffix: string,
  chronologyOrder: number,
  fact: TypedEvidenceFact,
): ModelEvidenceItem => ({
  evidenceRef:
    fact.kind === 'submission'
      ? `session:${sessionId}:submitted`
      : fact.kind === 'command_execution'
        ? `command:${sessionId}:${suffix}`
        : fact.kind === 'ai_request_started'
          ? `ai_request:${sessionId}:${suffix}:started`
          : fact.kind === 'ai_response_completed'
            ? `ai_response:${sessionId}:${suffix}:completed`
            : fact.kind === 'ai_request_cancelled'
              ? `ai_request:${sessionId}:${suffix}:cancelled`
              : fact.kind === 'ai_request_failed'
                ? `ai_request:${sessionId}:${suffix}:failed`
                : `event:${sessionId}:${suffix}`,
  role: 'chronology',
  chronologyOrder,
  kind:
    fact.kind === 'submission'
      ? 'submission'
      : fact.kind === 'command_execution'
        ? 'command_execution'
        : fact.kind === 'workspace_change'
          ? 'workspace_change'
          : fact.kind === 'evidence_gap'
            ? 'evidence_gap'
            : fact.kind === 'ai_request_started'
              ? 'ai_request_started'
              : fact.kind === 'ai_response_completed'
                ? 'ai_response_completed'
                : fact.kind === 'ai_request_cancelled'
                  ? 'ai_request_cancelled'
                  : fact.kind === 'ai_request_failed'
                    ? 'ai_request_failed'
                    : 'activation',
  fact,
});

const commandFact = (
  command: string,
  exitCode: number,
  output: Extract<TypedEvidenceFact, { kind: 'command_execution' }>['output'],
  stdoutExcerpt = '',
): Extract<TypedEvidenceFact, { kind: 'command_execution' }> => ({
  kind: 'command_execution',
  command,
  cwd: '/workspace',
  exitCode,
  timedOut: false,
  durationMs: 20,
  output,
  stdoutExcerpt,
  stdoutBytes: Buffer.byteLength(stdoutExcerpt),
  stdoutTruncated: false,
  stderrExcerpt: '',
  stderrBytes: 0,
  stderrTruncated: false,
});

const packet = (
  evidenceItems: readonly ModelEvidenceItem[],
  anchors: readonly Omit<CoverageAnchor, 'id'>[],
  finalDiff = '',
): EvidencePacketV1 => ({
  schemaVersion: 1,
  scenario: {
    title: 'Scenario',
    candidateBrief: 'Brief',
    candidateAcceptanceCriteria: [],
  },
  session: {
    activatedAt: '2026-09-15T10:00:00.000Z',
    submittedAt: '2026-09-15T10:10:00.000Z',
  },
  evidenceItems,
  finalDiff: {
    evidenceRef: `session:${sessionId}:final-diff`,
    excerpt: finalDiff,
    excerptBytes: Buffer.byteLength(finalDiff),
    totalBytes: Buffer.byteLength(finalDiff),
    truncated: false,
    sha256: 'digest',
  },
  integrity: {
    workspaceGapRefs: [],
    outOfBandChangeRefs: [],
    truncatedEvidenceRefs: [],
  },
  coverageAnchors: anchors.map((anchor, index) => ({
    id: `anchor_${index + 1}`,
    ...anchor,
  })),
});

const submission = item('submitted', 99, {
  kind: 'submission',
  timestamp: '2026-09-15T10:10:00.000Z',
});

describe('deterministic evidence reconstruction generator', () => {
  it('renders Scenario A facts atomically and preserves each exact reference', async () => {
    const evidenceItems = [
      item(
        'db',
        1,
        commandFact(
          'psql query',
          0,
          { kind: 'numeric_stdout', value: '150' },
          '150',
        ),
      ),
      item(
        'redis-read',
        2,
        commandFact(
          'redis-cli get inventory:ABC',
          0,
          { kind: 'numeric_stdout', value: '0' },
          '0',
        ),
      ),
      item(
        'pytest-1',
        3,
        commandFact(
          'pytest',
          1,
          { kind: 'test_summary', passed: 0, failed: 3 },
          '3 failed',
        ),
      ),
      item(
        'redis-delete',
        4,
        commandFact(
          'redis-cli del inventory:ABC',
          0,
          { kind: 'numeric_stdout', value: '1' },
          '1',
        ),
      ),
      item(
        'pytest-2',
        5,
        commandFact(
          'pytest',
          1,
          { kind: 'test_summary', passed: 1, failed: 2 },
          '1 passed, 2 failed',
        ),
      ),
      submission,
    ];
    const source = packet(evidenceItems, [
      {
        kind: 'unsuccessful_command_before_further_work',
        evidenceRefs: [evidenceItems[2].evidenceRef],
      },
      {
        kind: 'final_observed_command',
        evidenceRefs: [evidenceItems[4].evidenceRef],
      },
      { kind: 'submission_boundary', evidenceRefs: [submission.evidenceRef] },
    ]);
    const built = buildDeterministicReconstruction(source);
    const generated =
      await new DeterministicEvidenceReconstructionGenerator().generate(
        source,
        {
          signal: new AbortController().signal,
        },
      );

    expect(built.output.statements).toHaveLength(3);
    expect(built.output.statements.map((statement) => statement.text)).toEqual([
      '3 tests failed.',
      '1 passed, 2 failed.',
      'Session submitted.',
    ]);
    expect(
      built.output.statements.map((statement) => statement.detail),
    ).toEqual([undefined, undefined, undefined]);
    expect(
      built.output.statements.every(
        (statement) => statement.evidenceRefs.length === 1,
      ),
    ).toBe(true);
    expect(
      built.output.statements.flatMap((statement) => statement.evidenceRefs),
    ).toEqual([
      evidenceItems[2].evidenceRef,
      evidenceItems[4].evidenceRef,
      submission.evidenceRef,
    ]);
    expect(generated).toMatchObject({
      providerId: deterministicReconstructionProviderId,
      modelId: deterministicReconstructionVersion,
      output: built.output,
    });
  });

  it('does not expose arbitrary command output as factual prose', () => {
    const unsafe = item(
      'unsafe',
      1,
      commandFact(
        'echo text',
        0,
        null,
        'stale because the issue was solved and confirmed',
      ),
    );
    const built = buildDeterministicReconstruction(
      packet(
        [unsafe, submission],
        [
          {
            kind: 'final_observed_command',
            evidenceRefs: [unsafe.evidenceRef],
          },
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      ),
    );
    const prose = JSON.stringify(built.output);

    expect(prose).not.toMatch(
      /stale|outdated|correctly|solved|confirmed|because|in order to|to verify|to confirm/i,
    );
    expect(built.traces[0].fact).toMatchObject({
      kind: 'command_execution',
      stdoutExcerpt: 'stale because the issue was solved and confirmed',
      output: null,
    });
  });

  it('keeps an empty submitted session truthful and minimal', () => {
    const built = buildDeterministicReconstruction(
      packet(
        [submission],
        [
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      ),
    );

    expect(built.output.statements).toEqual([
      expect.objectContaining({
        text: 'Session submitted.',
        evidenceRefs: [submission.evidenceRef],
      }),
    ]);
  });

  it('leaves an unclassified optional command in Technical Chronology only', () => {
    const technicalOnly = item(
      'technical-only',
      1,
      commandFact(`python3 -c '${'x'.repeat(300)}' >/dev/null 2>&1 &`, 0, null),
    );
    const built = buildDeterministicReconstruction(
      packet(
        [technicalOnly, submission],
        [
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      ),
    );

    expect(built.output.statements.map((entry) => entry.text)).toEqual([
      'Session submitted.',
    ]);
  });

  it('bounds long command wording without dropping the typed command fact', () => {
    const longCommand = `psql ${'x'.repeat(180)}`;
    const command = item('long-command', 1, commandFact(longCommand, 0, null));
    const built = buildDeterministicReconstruction(
      packet(
        [command, submission],
        [
          {
            kind: 'final_observed_command',
            evidenceRefs: [command.evidenceRef],
          },
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      ),
    );

    expect(built.output.statements[0].text).toBe(
      'A recorded command exited with status 0.',
    );
    expect(built.output.statements[0].text).not.toContain(longCommand);
    expect(built.traces[0].fact).toMatchObject({
      kind: 'command_execution',
      command: longCommand,
    });
  });

  it('renders workspace, reversion, out-of-band, gap, and final-state facts from their own references', () => {
    const partial = item('partial', 1, {
      kind: 'workspace_change',
      origin: 'browser_save',
      beforeTree: 'tree-a',
      afterTree: 'tree-b',
      files: [
        {
          path: 'inventory/service.py',
          status: 'modified',
          additions: 1,
          deletions: 0,
          patchExcerpt: 'patch',
          patchBytes: 5,
          patchTruncated: false,
        },
      ],
    });
    const reverted = item('reverted', 2, {
      ...partial.fact,
      kind: 'workspace_change',
      beforeTree: 'tree-b',
      afterTree: 'tree-a',
    });
    const outOfBand = item('oob', 3, {
      ...partial.fact,
      kind: 'workspace_change',
      origin: 'out_of_band',
    });
    const gap = item('gap', 4, {
      kind: 'evidence_gap',
      phase: 'post_command',
    });
    const finalDiff =
      'diff --git a/inventory/service.py b/inventory/service.py\n';
    const source = packet(
      [partial, reverted, outOfBand, gap, submission],
      [
        { kind: 'workspace_progression', evidenceRefs: [partial.evidenceRef] },
        { kind: 'reversion', evidenceRefs: [reverted.evidenceRef] },
        { kind: 'out_of_band_change', evidenceRefs: [outOfBand.evidenceRef] },
        { kind: 'workspace_gap', evidenceRefs: [gap.evidenceRef] },
        { kind: 'submission_boundary', evidenceRefs: [submission.evidenceRef] },
        {
          kind: 'final_state',
          evidenceRefs: [`session:${sessionId}:final-diff`],
        },
      ],
      finalDiff,
    );
    const statements =
      buildDeterministicReconstruction(source).output.statements;

    expect(statements.map((statement) => statement.text)).toEqual([
      'Modified `inventory/service.py`.',
      'The workspace returned to a previously recorded state.',
      '`inventory/service.py` changed between recorded actions.',
      'Recorded workspace evidence is incomplete for part of this interval.',
      'Session submitted.',
      'The submitted state includes changes to `inventory/service.py`.',
    ]);
    expect(statements.at(-1)).toMatchObject({
      claimBasis: 'final_state',
      evidenceRefs: [`session:${sessionId}:final-diff`],
    });
  });

  it('keeps Scenario B partial, Scenario C linear, and Scenario D non-linear histories distinguishable', () => {
    const failure = item(
      'failure',
      1,
      commandFact('pytest', 1, { kind: 'test_summary', passed: 0, failed: 3 }),
    );
    const change = item('change', 2, {
      kind: 'workspace_change',
      origin: 'browser_save',
      beforeTree: 'a',
      afterTree: 'b',
      files: [
        {
          path: 'inventory/service.py',
          status: 'modified',
          additions: 1,
          deletions: 0,
          patchExcerpt: '',
          patchBytes: 0,
          patchTruncated: false,
        },
      ],
    });
    const passing = item(
      'passing',
      3,
      commandFact('pytest', 0, { kind: 'test_summary', passed: 3, failed: 0 }),
    );
    const commonAnchors: Omit<CoverageAnchor, 'id'>[] = [
      {
        kind: 'unsuccessful_command_before_further_work',
        evidenceRefs: [failure.evidenceRef],
      },
      { kind: 'workspace_progression', evidenceRefs: [change.evidenceRef] },
      { kind: 'final_observed_command', evidenceRefs: [passing.evidenceRef] },
      { kind: 'submission_boundary', evidenceRefs: [submission.evidenceRef] },
    ];
    const scenarioB = buildDeterministicReconstruction(
      packet([failure, change, passing, submission], commonAnchors),
    ).output;
    const scenarioC = buildDeterministicReconstruction(
      packet(
        [failure, change, passing, submission],
        commonAnchors,
        'diff --git a/inventory/service.py b/inventory/service.py\n',
      ),
    ).output;
    const reversion = item('reversion', 3, {
      ...change.fact,
      kind: 'workspace_change',
      beforeTree: 'b',
      afterTree: 'a',
    });
    const oob = item('oob', 4, {
      ...change.fact,
      kind: 'workspace_change',
      origin: 'out_of_band',
    });
    const scenarioD = buildDeterministicReconstruction(
      packet(
        [failure, change, reversion, oob, passing, submission],
        [
          ...commonAnchors,
          { kind: 'reversion', evidenceRefs: [reversion.evidenceRef] },
          { kind: 'out_of_band_change', evidenceRefs: [oob.evidenceRef] },
        ],
      ),
    ).output;

    expect(JSON.stringify(scenarioB)).not.toMatch(/normalization/i);
    expect(JSON.stringify(scenarioC)).not.toMatch(/solved|correct|successful/i);
    expect(JSON.stringify(scenarioD)).toContain(
      'The workspace returned to a previously recorded state.',
    );
    expect(JSON.stringify(scenarioD)).toContain(
      '`inventory/service.py` changed between recorded actions.',
    );
    expect(scenarioD).not.toEqual(scenarioC);
  });

  describe('Slice 6D — Deterministic AI Statement Rendering', () => {
    it('Matrix C & Case 9: temporal adjacency between AI response and workspace change does not infer causality', () => {
      const aiResponse = item('inter-1', 1, {
        kind: 'ai_response_completed',
        interactionId: 'inter-1',
        reportedModelId: 'mock-model',
        durationMs: 2500,
        responseExcerpt: 'Add return statement',
        responseBytes: 20,
        responseTruncated: false,
      });
      const edit = item('edit-1', 2, {
        kind: 'workspace_change',
        origin: 'browser_save',
        beforeTree: 'tree-1',
        afterTree: 'tree-2',
        files: [
          {
            path: 'inventory/service.py',
            status: 'modified',
            additions: 1,
            deletions: 0,
            patchExcerpt: '+ return True',
            patchBytes: 13,
            patchTruncated: false,
          },
        ],
      });

      const src = packet(
        [aiResponse, edit, submission],
        [
          { kind: 'workspace_progression', evidenceRefs: [edit.evidenceRef] },
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      );

      // Explicitly check direct rendering of chronological facts
      const responseTrace = renderChronologyFact(aiResponse, new Set());
      const editTrace = renderChronologyFact(edit, new Set());

      expect(responseTrace.text).toBe('An AI response was recorded.');
      expect(editTrace.text).toBe('Modified `inventory/service.py`.');

      const built = buildDeterministicReconstruction({
        ...src,
        coverageAnchors: [
          {
            id: 'a1',
            kind: 'submission_boundary' as const,
            evidenceRefs: [submission.evidenceRef],
          },
        ],
      });

      const prose = JSON.stringify(built.output);
      expect(prose).not.toMatch(
        /applied|copied|used ai|ai suggestion|candidate used|based on ai|from ai/i,
      );
    });

    it('Matrix D & Case 11: maps failure reasons neutrally without negative judgment', () => {
      const providerFail = item('fail-1', 1, {
        kind: 'ai_request_failed',
        interactionId: 'fail-1',
        durationMs: 1000,
        failureReason: 'provider_error',
        errorMessageExcerpt: 'Provider unavailable',
      });
      const timeoutFail = item('fail-2', 2, {
        kind: 'ai_request_failed',
        interactionId: 'fail-2',
        durationMs: 30000,
        failureReason: 'server_timeout',
        errorMessageExcerpt: 'Timeout exceeded',
      });
      const serverFail = item('fail-3', 3, {
        kind: 'ai_request_failed',
        interactionId: 'fail-3',
        durationMs: 500,
        failureReason: 'server_error',
        errorMessageExcerpt: 'Internal error',
      });
      const otherFail = item('fail-4', 4, {
        kind: 'ai_request_failed',
        interactionId: 'fail-4',
        durationMs: 500,
        failureReason: 'custom_failure',
        errorMessageExcerpt: 'Unknown',
      });

      expect(renderChronologyFact(providerFail, new Set()).text).toBe(
        'An AI request ended with a provider error.',
      );
      expect(renderChronologyFact(timeoutFail, new Set()).text).toBe(
        'An AI request timed out.',
      );
      expect(renderChronologyFact(serverFail, new Set()).text).toBe(
        'An AI request ended with a server error.',
      );
      expect(renderChronologyFact(otherFail, new Set()).text).toBe(
        'An AI request ended with a recorded error.',
      );

      // Verify each ends with terminal punctuation and contains no evaluative judgment
      for (const failItem of [
        providerFail,
        timeoutFail,
        serverFail,
        otherFail,
      ]) {
        const rendered = renderChronologyFact(failItem, new Set()).text;
        expect(rendered).toMatch(/[.!?]$/);
        expect(rendered).not.toMatch(/poor|mistake|bad|incompetent|wrong/i);
      }
    });

    it('Matrix E & F & Case 12: differentiates candidate cancellation from session closure cancellation', () => {
      const candidateCancel = item('cancel-1', 1, {
        kind: 'ai_request_cancelled',
        interactionId: 'cancel-1',
        durationMs: 500,
        cancelReason: 'candidate_requested_cancel',
      });
      const sessionCancel = item('cancel-2', 2, {
        kind: 'ai_request_cancelled',
        interactionId: 'cancel-2',
        durationMs: 1200,
        cancelReason: 'session_ended',
      });
      const platformCancel = item('cancel-3', 3, {
        kind: 'ai_request_cancelled',
        interactionId: 'cancel-3',
        durationMs: 800,
        cancelReason: 'platform_policy_abort',
      });

      expect(renderChronologyFact(candidateCancel, new Set()).text).toBe(
        'Candidate requested cancellation of the AI request.',
      );
      expect(renderChronologyFact(sessionCancel, new Set()).text).toBe(
        'An AI request was cancelled when the session ended.',
      );
      expect(renderChronologyFact(platformCancel, new Set()).text).toBe(
        'An AI request was cancelled.',
      );
    });

    it('Matrix L: deterministic across repeated execution', () => {
      const aiStart = item('inter-1', 1, {
        kind: 'ai_request_started',
        interactionId: 'inter-1',
        configuredProviderId: 'mock-ai',
        configuredModelId: 'mock-model',
        promptExcerpt: 'Help',
        promptBytes: 4,
        promptTruncated: false,
        contextAttachmentsCount: 0,
      });
      const aiComplete = item('inter-1', 2, {
        kind: 'ai_response_completed',
        interactionId: 'inter-1',
        reportedModelId: 'mock-model',
        durationMs: 1500,
        responseExcerpt: 'Result',
        responseBytes: 6,
        responseTruncated: false,
      });
      const change = item('change-1', 3, {
        kind: 'workspace_change',
        origin: 'browser_save',
        beforeTree: 'tree-a',
        afterTree: 'tree-b',
        files: [
          {
            path: 'app.py',
            status: 'modified',
            additions: 1,
            deletions: 0,
            patchExcerpt: 'patch',
            patchBytes: 5,
            patchTruncated: false,
          },
        ],
      });

      const testPacket = packet(
        [aiStart, aiComplete, change, submission],
        [
          { kind: 'workspace_progression', evidenceRefs: [change.evidenceRef] },
          {
            kind: 'submission_boundary',
            evidenceRefs: [submission.evidenceRef],
          },
        ],
        'diff --git a/app.py b/app.py\n',
      );

      const run1 = buildDeterministicReconstruction(testPacket);
      const run2 = buildDeterministicReconstruction(testPacket);
      const run3 = buildDeterministicReconstruction(testPacket);

      expect(run1).toEqual(run2);
      expect(run2).toEqual(run3);
    });
  });
});
