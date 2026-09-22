import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CandidateWorkspace } from '../../apps/web/app/candidate/[token]/candidate-workspace';
import type { CandidateSessionView } from '../../apps/web/src/sessions/candidate-session-view';

const activeSession: CandidateSessionView = {
  id: 'session-c3-test',
  scenario: {
    id: 'scenario-001',
    title: 'Distributed Inventory Cache',
    version: '1.0.0',
    type: 'single_file',
    brief: 'Correct stale inventory reads.',
    acceptanceCriteria: ['Keep cache entries current.'],
    filePath: 'inventory/service.py',
  },
  status: 'ACTIVE',
  workingContent: 'def get_inventory():\n    return []\n',
  createdAt: '2026-09-22T10:00:00.000Z',
  activatedAt: '2026-09-22T10:01:00.000Z',
  submittedAt: null,
  durationSeconds: 3600,
  deadline: '2026-09-23T10:01:00.000Z',
  serverTime: '2026-09-22T10:01:00.000Z',
  closureReason: null,
  scenarioType: 'single_file',
  aiCapability: { enabled: true },
};

describe('C3 — Candidate workspace shell', () => {
  it('renders active workspace navigation and all existing work surfaces', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace initialSession={activeSession} token="c3-token" />,
    );

    expect(html).toContain('data-workspace-state="ACTIVE_WORKSPACE"');
    expect(html).toContain('aria-label="Workspace navigation"');
    expect(html).toContain('Scenario');
    expect(html).toContain('Files');
    expect(html).toContain('Editor');
    expect(html).toContain('Commands');
    expect(html).toContain('AI');
    expect(html).toContain('Sandbox command console');
    expect(html).toContain('Engineering assistant');
    expect(html).toContain('Time remaining');
    expect(html).toContain('Submit assessment');
    expect(html).not.toContain('class="workspace-timer" aria-live');
  });

  it('represents the active file and selected navigation accessibly', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace initialSession={activeSession} token="c3-token" />,
    );

    expect(html).toContain('inventory/service.py');
    expect(html).toContain('aria-label="Edit inventory/service.py"');
    expect(html).toContain('aria-pressed="true"');
  });

  it('does not expose active workspace navigation after authoritative submission', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace
        initialSession={{
          ...activeSession,
          status: 'SUBMITTED',
          submittedAt: '2026-09-22T10:30:00.000Z',
          closureReason: 'candidate_submission',
        }}
        token="c3-token"
      />,
    );

    expect(html).toContain('data-workspace-state="COMPLETED"');
    expect(html).not.toContain('aria-label="Workspace navigation"');
    expect(html).not.toContain('Submit assessment</button>');
  });
});
