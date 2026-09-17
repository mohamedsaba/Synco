import type { CommandExecutionItem } from '../../apps/web/src/evidence/chronological-reconstruction';
import { EvidenceItemCard } from '../../apps/web/app/evaluator/sessions/[sessionId]/evidence-item-card';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { SubmittedDiff } from '../../apps/web/app/evaluator/sessions/[sessionId]/submitted-diff';
import { EvidenceDisclosure } from '../../apps/web/app/evaluator/sessions/[sessionId]/evidence-disclosure';
import { ReconstructionPanel } from '../../apps/web/app/evaluator/sessions/[sessionId]/reconstruction-panel';
import { ScenarioContext } from '../../apps/web/app/evaluator/sessions/[sessionId]/scenario-context';
import { SummaryLifecycleControl } from '../../apps/web/app/evaluator/sessions/[sessionId]/summary-lifecycle-control';
import { TechnicalRecord } from '../../apps/web/app/evaluator/sessions/[sessionId]/technical-record';
import type { EvaluatorReviewPresentation } from '../../apps/web/src/evaluator/evaluator-review-presentation';
import type { EvidenceCatalogEntry } from '../../apps/web/src/reconstruction/evidence-reference-catalog';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const activationEntry: EvidenceCatalogEntry = {
  evidenceRef: 'session:one:activated',
  sessionId: 'one',
  role: 'chronology',
  kind: 'activation',
  chronologyOrder: 0,
  firstSequence: null,
  lastSequence: null,
  rawEventIds: [],
  item: {
    kind: 'SESSION_ACTIVATED',
    timestamp: '2026-09-16T10:00:00.000Z',
  },
};

const review: EvaluatorReviewPresentation = {
  session: {
    id: 'one',
    assessment: 'scenario · v1',
    scenarioTitle: 'Scenario',
    scenarioVersion: '1',
    status: 'Submitted',
    duration: '2m',
    submittedAt: '2026-09-16T10:02:00.000Z',
  },
  scenario: {
    context: {
      schemaVersion: 1,
      version: '1',
      purpose: 'Organize the recorded evidence for review.',
      evidenceAreas: [
        {
          id: 'area',
          title: 'Relevant activity',
          description: 'Recorded activity related to the scenario.',
          selectors: [],
        },
      ],
      systemInvariants: ['The submitted state is authoritative.'],
      verificationTargets: ['Review recorded verification where available.'],
      interpretationWarnings: ['Related evidence is not a candidate verdict.'],
      reviewPolicy: [
        'Final automated verification alone is not a hiring decision.',
      ],
    },
    relatedEvidence: [
      {
        id: 'area',
        title: 'Relevant activity',
        description: 'Recorded activity related to the scenario.',
        evidenceRefs: ['session:one:activated'],
      },
    ],
  },
  notices: [],
  summary: {
    status: 'available',
    retryAllowed: false,
    milestones: [
      {
        id: 'statement',
        kind: 'recorded_activity',
        label: 'Recorded activity',
        text: 'The session was activated.',
        elapsedLabel: '+0s',
        evidenceRefs: ['session:one:activated'],
      },
    ],
  },
  chronology: [activationEntry.item!],
  evidenceEntries: [activationEntry],
  submittedDiff: '',
};

describe('evaluator review rendering', () => {
  it('uses a native, one-step disclosure for supporting activity', () => {
    const html = renderToStaticMarkup(
      <EvidenceDisclosure
        activatedAt="2026-09-16T10:00:00.000Z"
        entries={[activationEntry]}
        submittedDiff=""
      />,
    );

    expect(html).toContain('<details');
    expect(html).toContain('<summary>');
    expect(html).toContain('View supporting activity');
    expect(html).toContain('class="disclosure-chevron"');
    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/<details/g)).toHaveLength(1);
    expect(html).not.toContain('rawEvent');
  });

  it.each([
    [true, false],
    [false, true],
    [true, true],
    [false, false],
  ])(
    'discloses stdout=%s and stderr=%s preview truncation separately',
    (stdoutTruncated, stderrTruncated) => {
      const item: CommandExecutionItem = {
        kind: 'COMMAND_EXECUTION',
        commandId: 'cmd',
        command: 'cat file',
        cwd: '/workspace',
        startedAt: '2026-09-16T10:00:00Z',
        finishedAt: '2026-09-16T10:00:01Z',
        durationMs: 1000,
        exitCode: 0,
        timedOut: false,
        stdoutPreview: 'output',
        stderrPreview: 'diagnostic',
        rawStartedEventId: 'start',
        rawFinishedEventId: 'finish',
        sequence: 1,
        rawFinishedEvent: {
          id: 'finish',
          sessionId: 'one',
          sequence: 2,
          type: 'COMMAND_FINISHED',
          timestamp: '2026-09-16T10:00:01Z',
          source: 'server',
          payload: {
            commandId: 'cmd',
            exitCode: 0,
            timedOut: false,
            durationMs: 1000,
            stdoutPreview: 'output',
            stdoutBytes: 100,
            stdoutTruncated,
            stderrPreview: 'diagnostic',
            stderrBytes: 100,
            stderrTruncated,
          },
        },
      };
      const html = renderToStaticMarkup(<EvidenceItemCard item={item} />);
      expect(
        html.includes(
          'Standard output is a captured preview. Additional output was omitted.',
        ),
      ).toBe(stdoutTruncated);
      expect(
        html.includes(
          'Standard error is a captured preview. Additional output was omitted.',
        ),
      ).toBe(stderrTruncated);
      expect(html).not.toMatch(/stdoutTruncated|stderrTruncated|role="alert"/);
      expect(html).toContain('Exit status 0');
    },
  );

  it('links a truncated compact diff to the stable submitted-changes anchor', () => {
    const longDiff = Array.from(
      { length: 90 },
      (_, index) => `+line ${index}`,
    ).join('\n');
    const html = renderToStaticMarkup(
      <SubmittedDiff compact diff={longDiff} />,
    );
    const pageSource = readFileSync(
      path.join(
        process.cwd(),
        'apps/web/app/evaluator/sessions/[sessionId]/submitted-work.tsx',
      ),
      'utf8',
    );

    expect(html).toContain('href="#submitted-changes"');
    expect(html).toContain('View full submitted changes →');
    expect(html).not.toContain('additional lines');
    expect(pageSource).toContain('id={submittedChangesAnchor}');
  });

  it('renders diff semantics in text as well as color', () => {
    const html = renderToStaticMarkup(
      <SubmittedDiff diff={'--- a/file.ts\n+++ b/file.ts\n-old\n+new'} />,
    );

    expect(html).toContain('aria-label="Submitted code changes"');
    expect(html).toContain('Deleted line:');
    expect(html).toContain('Added line:');
    expect(html).toContain('-old');
    expect(html).toContain('+new');
    expect(html).toContain('tabindex="0"');
  });

  it('renders scenario context and direct summary traceability without nested disclosures', () => {
    const scenarioHtml = renderToStaticMarkup(
      <ScenarioContext
        activatedAt="2026-09-16T10:00:00.000Z"
        review={review}
      />,
    );
    const summaryHtml = renderToStaticMarkup(
      <ReconstructionPanel
        activatedAt="2026-09-16T10:00:00.000Z"
        reconstructionStatus="AVAILABLE"
        review={review}
        sessionId="one"
      />,
    );

    expect(scenarioHtml).toContain('What this scenario examines');
    expect(scenarioHtml).toContain('Relevant verification areas');
    expect(scenarioHtml).toContain(
      'They are not a pass/fail checklist, and valid work may address them in different ways.',
    );
    expect(scenarioHtml).not.toContain('Verification targets');
    expect(scenarioHtml).toContain('View related recorded activity');
    expect(summaryHtml).toContain('What happened');
    expect(summaryHtml).toContain('View supporting activity');
    expect(summaryHtml.match(/<details/g)).toHaveLength(1);
    expect(summaryHtml).not.toContain('provider');
    expect(summaryHtml).not.toContain('claimBasis');
  });

  it('renders empty area copy as relation-relative absence rather than global absence', () => {
    const emptyAreaReview = {
      ...review,
      scenario: {
        ...review.scenario,
        relatedEvidence: review.scenario.relatedEvidence.map((area) => ({
          ...area,
          evidenceRefs: [],
        })),
      },
    };
    const html = renderToStaticMarkup(
      <ScenarioContext
        review={emptyAreaReview}
        activatedAt="2026-09-16T10:00:00.000Z"
      />,
    );
    expect(html).toContain(
      'No recorded activity was linked to this area by the current evidence relation.',
    );
    expect(html).toContain(
      'Relevant activity may exist elsewhere in the technical chronology.',
    );
    expect(html).toContain('does not mean the candidate lacks');
    expect(html).not.toContain('recorded no evidence');
  });

  it('renders explicit affordances for technical and raw-record disclosures', () => {
    const html = renderToStaticMarkup(
      <TechnicalRecord
        activatedAt="2026-09-16T10:00:00.000Z"
        review={review}
      />,
    );

    expect(html).toContain('Open technical chronology');
    expect(html).toContain('Inspect raw records');
    expect(html.match(/class="disclosure-chevron"/g)).toHaveLength(2);
    expect(html.match(/<details/g)).toHaveLength(2);
  });

  it('renders safe preparing and retry states without internal failure details', () => {
    const preparing = renderToStaticMarkup(
      <SummaryLifecycleControl
        reconstructionStatus="NOT_STARTED"
        sessionId="one"
      />,
    );
    const unavailable = renderToStaticMarkup(
      <SummaryLifecycleControl reconstructionStatus="FAILED" sessionId="one" />,
    );

    expect(preparing).toContain('role="status"');
    expect(preparing).toContain('Preparing the session summary…');
    expect(unavailable).toContain('role="alert"');
    expect(unavailable).toContain(
      'The session summary isn&#x27;t available right now.',
    );
    expect(unavailable).toContain('Try again');
    expect(unavailable).not.toMatch(/provider|failure_code|attempt/i);
  });

  it('keeps focus, reduced-motion, overflow, and responsive contracts in CSS', () => {
    const styles = readFileSync(
      path.join(process.cwd(), 'apps/web/app/workspace.css'),
      'utf8',
    );
    const globalStyles = readFileSync(
      path.join(process.cwd(), 'apps/web/app/styles.css'),
      'utf8',
    );

    expect(styles).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(styles).toContain('@media (max-width: 900px)');
    expect(styles).toContain('@media (max-width: 620px)');
    expect(styles).toContain('overflow-x: auto');
    expect(styles).toContain('details[open] > summary > .disclosure-chevron');
    expect(styles).toContain('.supporting-activity-disclosure > summary:hover');
    expect(styles).toContain('transition: transform 120ms ease-out');
    expect(globalStyles).toContain('summary:focus-visible');
  });
});
