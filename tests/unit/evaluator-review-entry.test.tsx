import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { EvaluatorAccessForm } from '../../apps/web/app/evaluator/evaluator-access-form';
import {
  EvaluatorReviewQueueContent,
  type QueueState,
} from '../../apps/web/app/evaluator/evaluator-review-queue';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('evaluator review entry', () => {
  it('renders authorized review entries as a semantic list of direct session links', () => {
    const state: QueueState = {
      kind: 'ready',
      sessions: [
        {
          sessionId: 'session-entry-1',
          scenarioTitle: 'Inventory cache incident',
          submittedAt: '2026-09-22T10:00:00.000Z',
          durationSeconds: 3600,
          closureReason: 'candidate_submission',
        },
      ],
    };

    const html = renderToStaticMarkup(
      <EvaluatorReviewQueueContent state={state} />,
    );

    expect(html).toContain('<ul');
    expect(html).toContain('Inventory cache incident');
    expect(html).toContain('href="/evaluator/sessions/session-entry-1"');
    expect(html).toContain('1h 0m assessment');
    expect(html).toContain('Submitted by candidate');
  });

  it('distinguishes an empty queue from unavailable discovery', () => {
    expect(
      renderToStaticMarkup(
        <EvaluatorReviewQueueContent state={{ kind: 'ready', sessions: [] }} />,
      ),
    ).toContain('No submitted assessments are available for review.');
    expect(
      renderToStaticMarkup(
        <EvaluatorReviewQueueContent state={{ kind: 'service-error' }} />,
      ),
    ).toContain('Submitted assessments could not be loaded.');
  });

  it('keeps known-session access as a semantic form after authentication', () => {
    const html = renderToStaticMarkup(<EvaluatorAccessForm authenticated />);

    expect(html).toContain('Known session reference');
    expect(html).toContain('Open known session');
    expect(html).not.toContain('Evaluator credential');
  });
});
