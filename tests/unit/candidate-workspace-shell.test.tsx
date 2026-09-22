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
    expect(html).toContain(
      'Run commands and tests inside the assessment environment.',
    );
    expect(html).toContain('Engineering assistant');
    expect(html).toContain('Time remaining');
    expect(html).toContain('Submit assessment');
    expect(html).not.toContain('class="workspace-timer" aria-live');
  });

  it('renders semantic command controls without terminal chrome or output live regions', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace initialSession={activeSession} token="c5-token" />,
    );

    expect(html).toContain('aria-label="Command"');
    expect(html).toContain('>Run</button>');
    expect(html).not.toContain('Sandbox shell command');
    expect(html).not.toContain('role="log"');
  });

  it('represents the active file and selected navigation accessibly', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace initialSession={activeSession} token="c3-token" />,
    );

    expect(html).toContain('inventory/service.py');
    expect(html).toContain('aria-label="Edit inventory/service.py"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Saved');
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

    expect(html).toContain('Assessment submitted</h1>');
    expect(html).toContain(
      'Your assessment has been submitted. Your work is final.',
    );
    expect(html).not.toContain('aria-label="Workspace navigation"');
    expect(html).not.toContain('Submit assessment</button>');
    expect(html).not.toContain('class="workspace-timer');
    expect(html).not.toContain('aria-label="Command"');
    expect(html).not.toContain('candidate-ai-prompt');
  });

  it('presents projected deadline expiry without fabricating submission or clearing work surfaces', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace
        initialSession={{
          ...activeSession,
          deadline: '2026-09-22T10:01:00.000Z',
          serverTime: '2026-09-22T10:01:00.000Z',
        }}
        token="c7-token"
      />,
    );

    expect(html).toContain('data-workspace-state="TIME_LIMIT_REACHED"');
    expect(html).toContain(
      'Time limit reached. New work is no longer accepted.',
    );
    expect(html).toContain('Time limit reached</span>');
    expect(html).toContain('Commands');
    expect(html).toContain('Engineering assistant');
    expect(html).toContain('placeholder="Commands are unavailable"');
    expect(html).toContain('AI is unavailable.');
    expect(html).not.toContain('>Save</button>');
    expect(html).not.toContain('>Submit assessment</button>');
    expect(html).not.toContain('Your assessment has been submitted.');
    expect(html).not.toContain('aria-live="polite" class="workspace-timer');
  });

  it('presents durable ACTIVE finalization without reopening workspace controls', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace
        initialSession={{
          ...activeSession,
          closureReason: 'candidate_submission',
        }}
        token="c8a-token"
      />,
    );

    expect(html).toContain('Finalizing your assessment…');
    expect(html).toContain(
      'Submission has begun. No more changes can be accepted',
    );
    expect(html).not.toContain('aria-label="Workspace navigation"');
    expect(html).not.toContain('>Save</button>');
    expect(html).not.toContain('>Submit assessment</button>');
    expect(html).not.toContain('class="workspace-timer');
    expect(html).not.toContain('aria-label="Command"');
    expect(html).not.toContain('candidate-ai-prompt');
  });

  it('presents timeout completion without claiming candidate submission', () => {
    const html = renderToStaticMarkup(
      <CandidateWorkspace
        initialSession={{
          ...activeSession,
          status: 'SUBMITTED',
          submittedAt: '2026-09-22T10:30:00.000Z',
          closureReason: 'timeout',
        }}
        token="c8-timeout-token"
      />,
    );

    expect(html).toContain('Assessment time ended</h1>');
    expect(html).toContain(
      'Your assessment time ended. Your work was finalized automatically.',
    );
    expect(html).not.toContain('Assessment submitted</h1>');
    expect(html).not.toContain('aria-label="Command"');
    expect(html).not.toContain('candidate-ai-prompt');
  });
});
