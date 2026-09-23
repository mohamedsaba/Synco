// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EngineerEvidenceWorkspace } from '../../apps/web/app/evaluator/sessions/[sessionId]/engineer-evidence-workspace';
import { EvaluatorExperience } from '../../apps/web/app/evaluator/sessions/[sessionId]/evaluator-experience';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import { buildEvaluatorReviewPresentation } from '../../apps/web/src/evaluator/evaluator-review-presentation';
import { projectBriefing } from '../../apps/web/src/evaluator/project-evaluator-briefing';
import type { SessionEvent } from '../../apps/web/src/events/session-event';
import {
  commandEvents,
  noReconstruction,
  testEvidence,
} from '../support/briefing-test-evidence';

const events: readonly SessionEvent[] = [
  ...commandEvents('npm test', {
    stdoutPreview: 'tests passed',
    stdoutBytes: 12,
  }),
  {
    id: 'workspace-change',
    sessionId: 'briefing-test',
    sequence: 3,
    type: 'WORKSPACE_CHANGED',
    timestamp: '2026-09-17T00:01:02Z',
    source: 'server',
    payload: {
      changeId: 'change-1',
      origin: 'browser_save',
      beforeTree: 'before',
      afterTree: 'after',
      files: [
        {
          path: 'src/cache.ts',
          status: 'modified',
          additions: 1,
          deletions: 0,
          patchPreview: '+export const cache = true;',
          patchPreviewBytes: 27,
          patchBytes: 27,
          patchTruncated: false,
        },
      ],
      totalAdditions: 1,
      totalDeletions: 0,
    },
  },
  {
    id: 'ai-start',
    sessionId: 'briefing-test',
    sequence: 4,
    type: 'AI_REQUEST_STARTED',
    timestamp: '2026-09-17T00:01:03Z',
    source: 'server',
    payload: {
      interactionId: 'ai-1',
      clientRequestId: 'request-1',
      configuredProviderId: 'provider-1',
      configuredModelId: 'model-1',
      candidateInputExcerpt: 'Show recorded cache evidence.',
      candidateInputBytes: 29,
    },
  },
  {
    id: 'ai-response',
    sessionId: 'briefing-test',
    sequence: 5,
    type: 'AI_RESPONSE_COMPLETED',
    timestamp: '2026-09-17T00:01:04Z',
    source: 'server',
    payload: {
      interactionId: 'ai-1',
      durationMs: 1000,
      reportedModelId: 'model-1',
      responseExcerpt: 'Recorded response.',
      responseBytes: 18,
      tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    },
  },
];

const evidence = {
  ...testEvidence(events),
  diff: '--- a/src/cache.ts\n+++ b/src/cache.ts\n+export const cache = true;',
  closureReason: 'candidate_submission' as const,
};
const briefing = buildEvaluatorBriefing(evidence, noReconstruction);
const review = buildEvaluatorReviewPresentation(evidence, noReconstruction);

const findSourceButton = (evidenceRef: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) =>
      button.getAttribute('aria-label') ===
      `View source evidence ${evidenceRef}`,
  );

describe('E4 Engineer evidence workspace', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    (
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    container = null;
    root = null;
  });

  const renderWorkspace = async () => {
    await act(async () => {
      root?.render(
        <EngineerEvidenceWorkspace
          activities={briefing.observedActivity}
          verification={briefing.recordedVerification}
          evidenceEntries={review.evidenceEntries}
          review={review}
          submittedState={briefing.submittedState}
          activatedAt={evidence.activatedAt}
          aiSummary={briefing.aiSummary}
        />,
      );
    });
  };

  it('keeps chronology primary, selects typed command, workspace, and AI records, and preserves review truth', async () => {
    const command = review.evidenceEntries.find(
      (entry) => entry.kind === 'command_execution',
    )!;
    const workspace = review.evidenceEntries.find(
      (entry) => entry.kind === 'workspace_change',
    )!;
    const ai = review.evidenceEntries.find(
      (entry) => entry.kind === 'ai_response_completed',
    )!;
    const beforeReview = structuredClone(review);
    const beforeOrder = briefing.observedActivity.map(
      (activity) => activity.chronologyOrder,
    );

    await renderWorkspace();

    expect(container?.querySelector('.activity-timeline')).not.toBeNull();
    expect(
      container?.querySelector('.engineer-inspection-panel'),
    ).not.toBeNull();
    expect(
      findSourceButton(command.evidenceRef)?.getAttribute('aria-pressed'),
    ).toBe('false');

    await act(async () => findSourceButton(command.evidenceRef)?.click());
    expect(container?.textContent).toContain(command.evidenceRef);
    expect(container?.textContent).toContain('Terminal activity');
    expect(
      findSourceButton(command.evidenceRef)?.getAttribute('aria-pressed'),
    ).toBe('true');

    await act(async () => findSourceButton(workspace.evidenceRef)?.click());
    expect(container?.textContent).toContain(workspace.evidenceRef);
    expect(container?.textContent).toContain('Workspace change');

    await act(async () => findSourceButton(ai.evidenceRef)?.click());
    expect(container?.textContent).toContain(ai.evidenceRef);
    expect(container?.textContent).toContain('AI response');
    expect(container?.textContent).toContain(
      '15 total (10 prompt · 5 completion)',
    );
    expect(
      briefing.observedActivity.map((activity) => activity.chronologyOrder),
    ).toEqual(beforeOrder);
    expect(review).toEqual(beforeReview);
  });

  it('uses the existing submitted diff and a truthful fallback for an entry without a structured item', async () => {
    const finalDiff = review.evidenceEntries.find(
      (entry) => entry.kind === 'final_diff',
    )!;
    const fallbackActivity = {
      ...briefing.observedActivity[0],
      id: 'final-diff-reference',
      evidenceRefs: [finalDiff.evidenceRef] as const,
      text: 'Final submitted state was recorded.',
    };

    await act(async () => {
      root?.render(
        <EngineerEvidenceWorkspace
          activities={[fallbackActivity]}
          verification={briefing.recordedVerification}
          evidenceEntries={review.evidenceEntries}
          review={review}
          submittedState={briefing.submittedState}
          activatedAt={evidence.activatedAt}
          aiSummary={briefing.aiSummary}
        />,
      );
    });

    await act(async () => findSourceButton(finalDiff.evidenceRef)?.click());
    expect(container?.textContent).toContain(
      `Source evidence reference: ${finalDiff.evidenceRef}.`,
    );

    const finalStateButton = Array.from(
      container!.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent === 'Final submitted state');
    await act(async () => finalStateButton?.click());
    expect(container?.querySelector('#submitted-changes')).not.toBeNull();
    expect(container?.querySelector('.submitted-diff')?.textContent).toContain(
      '+export const cache = true;',
    );
    expect(review.submittedDiff).toBe(evidence.diff);
  });

  it.each([
    'GENERALIST_RECRUITER',
    'TECHNICAL_RECRUITER',
    'ENGINEERING_MANAGER',
  ] as const)('does not mount the workspace for %s', (profile) => {
    const html = renderToStaticMarkup(
      <EvaluatorExperience
        sessionId={evidence.sessionId}
        activeRole={profile}
        projection={projectBriefing(briefing, profile)}
        review={review}
        evidence={evidence}
      />,
    );

    expect(html).not.toContain('engineer-evidence-workspace');
  });
});
