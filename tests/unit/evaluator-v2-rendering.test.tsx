import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RoleLensSwitcher } from '../../apps/web/app/evaluator/sessions/[sessionId]/role-lens-switcher';
import { EvaluatorHeader } from '../../apps/web/app/evaluator/sessions/[sessionId]/evaluator-header';
import { PlatformNotice } from '../../apps/web/app/evaluator/sessions/[sessionId]/platform-notice';
import { TaskBrief } from '../../apps/web/app/evaluator/sessions/[sessionId]/task-brief';
import { VerificationSummary } from '../../apps/web/app/evaluator/sessions/[sessionId]/verification-summary';
import { RecordedActivity } from '../../apps/web/app/evaluator/sessions/[sessionId]/recorded-activity';
import { SubmittedWork } from '../../apps/web/app/evaluator/sessions/[sessionId]/submitted-work';
import { ReviewGuidance } from '../../apps/web/app/evaluator/sessions/[sessionId]/review-guidance';
import { ArtifactAvailabilityCard } from '../../apps/web/app/evaluator/sessions/[sessionId]/artifact-availability-card';
import { EvaluatorExperience } from '../../apps/web/app/evaluator/sessions/[sessionId]/evaluator-experience';
import { projectBriefing } from '../../apps/web/src/evaluator/project-evaluator-briefing';
import type { EvaluatorBriefing } from '../../apps/web/src/evaluator/evaluator-briefing';
import type { EvaluatorReviewPresentation } from '../../apps/web/src/evaluator/evaluator-review-presentation';

const mockBriefing: EvaluatorBriefing = {
  schemaVersion: 1,
  sessionId: 'session-c-12345678',
  scenarioVersion: '1.0.0',
  builderVersion: 'evaluator-briefing-v2',
  provenance: {
    sessionId: 'session-c-12345678',
    scenarioVersion: '1.0.0',
    authoritativeEvidenceSha256: 'a'.repeat(64),
    finalDiffSha256: 'b'.repeat(64),
    scenarioSnapshotSha256: 'c'.repeat(64),
    evaluationContextSha256: 'd'.repeat(64),
    evaluationContextVersion: '1.0.0',
    mapperVersion: 'evaluator-mapper-v2',
    wordingVersion: 'evaluator-wording-v2',
    builderVersion: 'evaluator-briefing-v2',
    projectionVersion: 'briefing-depth-v2',
    reconstruction: {
      artifactId: 'recon-1',
      generatorVersion: 'deterministic-v3',
    },
    semanticSnapshot: {
      status: 'available',
      sha256: 'e'.repeat(64),
    },
  },
  sessionDuration: {
    status: 'available',
    elapsedMs: 754000,
    text: '12m 34s',
    source: {
      authority: 'session_timestamps',
      fieldRef: 'session:session-c-12345678:duration',
      activatedAt: '2026-09-16T17:00:00.000Z',
      submittedAt: '2026-09-16T17:12:34.000Z',
    },
  },
  taskContext: [
    {
      id: 'task-brief',
      category: 'task_context',
      kind: 'task_brief',
      source: {
        authority: 'scenario_snapshot',
        fieldRef: 'brief',
        version: '1.0.0',
        sessionId: 'session-c-12345678',
      },
      authoredText: 'Investigate and resolve stale inventory cache reads.',
    },
    {
      id: 'context:systemInvariants:0',
      category: 'task_context',
      kind: 'system_invariant',
      source: {
        authority: 'evaluation_context',
        fieldRef: 'evaluationContext.systemInvariants[0]',
        version: '1.0.0',
        sessionId: 'session-c-12345678',
      },
      authoredText: 'Stock reads must reflect committed DB transactions.',
    },
    {
      id: 'context:verificationTargets:0',
      category: 'task_context',
      kind: 'verification_area',
      source: {
        authority: 'evaluation_context',
        fieldRef: 'evaluationContext.verificationTargets[0]',
        version: '1.0.0',
        sessionId: 'session-c-12345678',
      },
      authoredText: 'Storefront cache write-through or invalidation.',
    },
  ],
  observedActivity: [
    {
      id: 'act-1',
      basis: 'chronology',
      evidenceRefs: ['session:session-c-12345678:cmd-1'],
      factRef: 'fact:1',
      kind: 'recorded_verification_execution',
      scope: 'recorded_execution',
      chronologyOrder: 1,
      wording: {
        template: 'Test run: 0 passed, 3 failed.',
        variables: {},
      },
      text: 'Test run: 0 passed, 3 failed.',
      mapping: {
        status: 'bound',
        ruleId: 'pytest_run',
        subjectId: 'pytest',
      },
    },
    {
      id: 'act-2',
      basis: 'chronology',
      evidenceRefs: ['session:session-c-12345678:edit-1'],
      factRef: 'fact:2',
      kind: 'recorded_workspace_edit',
      scope: 'recorded_workspace_transition',
      chronologyOrder: 2,
      wording: {
        template: 'Edited inventory/service.py.',
        variables: {},
      },
      text: 'Edited inventory/service.py.',
      mapping: {
        status: 'bound',
        ruleId: 'file_edit',
        subjectId: 'inventory/service.py',
      },
      paths: ['inventory/service.py'],
    },
    {
      id: 'act-3',
      basis: 'chronology',
      evidenceRefs: ['session:session-c-12345678:cmd-2'],
      factRef: 'fact:3',
      kind: 'recorded_verification_execution',
      scope: 'recorded_execution',
      chronologyOrder: 3,
      wording: {
        template: 'Test run: 0 passed, 3 failed.',
        variables: {},
      },
      text: 'Test run: 0 passed, 3 failed.',
      mapping: {
        status: 'bound',
        ruleId: 'pytest_run',
        subjectId: 'pytest',
      },
    },
  ],
  recordedVerification: {
    runs: [
      {
        id: 'run-1',
        evidenceRefs: ['session:session-c-12345678:cmd-1'],
        chronologyOrder: 1,
        exitCode: 1,
        timedOut: false,
        stdoutTruncated: false,
        stderrTruncated: false,
        result: {
          id: 'res-1',
          basis: 'chronology',
          evidenceRefs: ['session:session-c-12345678:cmd-1'],
          text: '0 passed, 3 failed',
          wording: {
            template: '0 passed, 3 failed',
            variables: {},
          },
          kind: 'recorded_verification_result',
        },
        counts: { passed: 0, failed: 3 },
        laterWorkspaceEdits: true,
        laterCaptureGaps: false,
        testIdentity: 'unknown',
      },
      {
        id: 'run-2',
        evidenceRefs: ['session:session-c-12345678:cmd-2'],
        chronologyOrder: 3,
        exitCode: 1,
        timedOut: false,
        stdoutTruncated: false,
        stderrTruncated: false,
        result: {
          id: 'res-2',
          basis: 'chronology',
          evidenceRefs: ['session:session-c-12345678:cmd-2'],
          text: '0 passed, 3 failed',
          wording: {
            template: '0 passed, 3 failed',
            variables: {},
          },
          kind: 'recorded_verification_result',
        },
        counts: { passed: 0, failed: 3 },
        laterWorkspaceEdits: false,
        laterCaptureGaps: false,
        testIdentity: 'unknown',
      },
    ],
    scope: 'recognized_recorded_executions_only',
  },
  submittedState: {
    id: 'sub-1',
    basis: 'final_state',
    evidenceRefs: ['session:session-c-12345678:final-diff'],
    wording: {
      template: 'Modified 1 file with 5 additions and 1 deletion.',
      variables: {},
    },
    text: 'Modified 1 file with 5 additions and 1 deletion.',
    changedPaths: ['inventory/service.py'],
    fileCount: 1,
    additions: 5,
    deletions: 1,
    parsing: 'complete',
    classifiedPaths: [
      {
        path: 'inventory/service.py',
        classification: 'application',
        ruleId: 'python_service',
      },
    ],
  },
  evidenceLimitations: [],
  artifactAvailability: {
    reconstruction: 'AVAILABLE',
    briefing: 'available',
    submittedDiff: {
      status: 'available',
      evidenceRefs: ['session:session-c-12345678:final-diff'],
    },
    context: 'available',
    semantics: 'available',
    source: {
      authority: 'artifact_status',
      fieldRef: 'status',
      version: null,
    },
  },
  reviewGuidance: [
    {
      id: 'policy:0',
      category: 'static_policy_context',
      source: {
        authority: 'evaluation_context',
        fieldRef: 'evaluationContext.reviewPolicy[0]',
        version: '1.0.0',
      },
      authoredText:
        'Final automated verification alone is not a hiring decision.',
    },
  ],
  evidenceIndex: [
    {
      evidenceRef: 'session:session-c-12345678:cmd-1',
      sessionId: 'session-c-12345678',
      basis: 'chronology',
      kind: 'test_run',
      rawEventIds: ['evt_1'],
      chronologyOrder: 1,
      sourceLocator: 'events/1',
      fact: null,
      sourceData: {
        kind: 'chronology',
        item: {
          kind: 'COMMAND_EXECUTION',
          commandId: 'cmd_1',
          command: 'pytest',
          cwd: '/workspace',
          startedAt: '2026-09-16T17:01:00Z',
          finishedAt: '2026-09-16T17:01:05Z',
          durationMs: 5000,
          exitCode: 1,
          timedOut: false,
          stdoutPreview: '3 failed',
          stderrPreview: '',
          rawStartedEventId: 'evt_1',
          rawFinishedEventId: 'evt_2',
          sequence: 1,
          rawFinishedEvent: {
            id: 'evt_2',
            sessionId: 'session-c-12345678',
            sequence: 2,
            type: 'COMMAND_FINISHED',
            timestamp: '2026-09-16T17:01:05Z',
            source: 'server',
            payload: {
              commandId: 'cmd_1',
              exitCode: 1,
              timedOut: false,
              durationMs: 5000,
              stdoutPreview: '3 failed',
              stdoutBytes: 100,
              stdoutTruncated: false,
              stderrPreview: '',
              stderrBytes: 0,
              stderrTruncated: false,
            },
          },
        },
      },
    },
    {
      evidenceRef: 'session:session-c-12345678:final-diff',
      sessionId: 'session-c-12345678',
      basis: 'final_state',
      kind: 'final_diff',
      rawEventIds: [],
      chronologyOrder: null,
      sourceLocator: 'diff',
      fact: null,
      sourceData: {
        kind: 'submitted_diff',
        diff: '--- a/inventory/service.py\n+++ b/inventory/service.py\n@@ -10,3 +10,7 @@\n+    invalidate_cached_stock(product_id)\n',
      },
    },
  ],
  aiSummary: {
    capabilityState: 'active',
    configuredModelId: 'claude-3-5-sonnet',
    configuredProviderId: 'mock-provider',
    totalInteractions: 0,
    completedCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    providerInterruptionNotice: null,
    interleaved: false,
    summaryText:
      'AI capability was active for this assessment. No integrated AI interactions were recorded.',
  },
};

const mockReview: EvaluatorReviewPresentation = {
  session: {
    id: 'session-c-12345678',
    assessment: 'scenario · v1',
    scenarioTitle: 'Cache Staleness Investigation',
    scenarioVersion: '1.0.0',
    status: 'Submitted',
    duration: '12m 34s',
    submittedAt: '2026-09-16T17:12:34.000Z',
  },
  scenario: {
    context: {
      schemaVersion: 1,
      version: '1.0.0',
      purpose: 'Investigate and resolve stale inventory cache reads.',
      evidenceAreas: [],
      systemInvariants: ['Stock reads must reflect committed DB transactions.'],
      verificationTargets: ['Storefront cache write-through or invalidation.'],
      interpretationWarnings: [],
      reviewPolicy: [
        'Final automated verification alone is not a hiring decision.',
      ],
    },
    relatedEvidence: [],
  },
  notices: [],
  summary: {
    status: 'available',
    retryAllowed: false,
    milestones: [],
  },
  chronology: [],
  evidenceEntries: [
    {
      evidenceRef: 'session:session-c-12345678:cmd-1',
      sessionId: 'session-c-12345678',
      role: 'chronology',
      kind: 'command',
      chronologyOrder: 1,
      firstSequence: 1,
      lastSequence: 2,
      rawEventIds: ['evt_1', 'evt_2'],
      item: {
        kind: 'COMMAND_EXECUTION',
        commandId: 'cmd_1',
        command: 'pytest',
        cwd: '/workspace',
        startedAt: '2026-09-16T17:01:00Z',
        finishedAt: '2026-09-16T17:01:05Z',
        durationMs: 5000,
        exitCode: 1,
        timedOut: false,
        stdoutPreview: '3 failed',
        stderrPreview: '',
        rawStartedEventId: 'evt_1',
        rawFinishedEventId: 'evt_2',
        sequence: 1,
        rawFinishedEvent: {
          id: 'evt_2',
          sessionId: 'session-c-12345678',
          sequence: 2,
          type: 'COMMAND_FINISHED',
          timestamp: '2026-09-16T17:01:05Z',
          source: 'server',
          payload: {
            commandId: 'cmd_1',
            exitCode: 1,
            timedOut: false,
            durationMs: 5000,
            stdoutPreview: '3 failed',
            stdoutBytes: 100,
            stdoutTruncated: false,
            stderrPreview: '',
            stderrBytes: 0,
            stderrTruncated: false,
          },
        },
      },
    },
  ],
  submittedDiff:
    '--- a/inventory/service.py\n+++ b/inventory/service.py\n@@ -10,3 +10,7 @@\n+    invalidate_cached_stock(product_id)\n',
};

describe('Evaluator Experience V2 Component & Projection Suite', () => {
  describe('RoleLensSwitcher', () => {
    it('renders all 4 depth profiles as navigation links with session pathname and correct ?depth=', () => {
      const html = renderToStaticMarkup(
        <RoleLensSwitcher
          activeRole="GENERALIST_RECRUITER"
          sessionId="session-c-12345678"
        />,
      );

      expect(html).toContain('aria-label="Evaluator perspective"');
      expect(html).toContain('Generalist Recruiter');
      expect(html).toContain('Technical Recruiter');
      expect(html).toContain('Engineer');
      expect(html).toContain('Engineering Manager');
      // Navigation links for all 4 profiles
      expect(html).toContain(
        'href="/evaluator/sessions/session-c-12345678?depth=GENERALIST_RECRUITER"',
      );
      expect(html).toContain(
        'href="/evaluator/sessions/session-c-12345678?depth=TECHNICAL_RECRUITER"',
      );
      expect(html).toContain(
        'href="/evaluator/sessions/session-c-12345678?depth=ENGINEER"',
      );
      expect(html).toContain(
        'href="/evaluator/sessions/session-c-12345678?depth=ENGINEERING_MANAGER"',
      );
      // Active role has aria-current="page"
      expect(html).toContain('aria-current="page"');
      expect(html).toContain('lens-tab-active');
      // Inactive roles do NOT have aria-current
      expect(html).not.toMatch(/href="[^"]*depth=ENGINEER"[^>]*aria-current/);
      expect(html).not.toMatch(
        /href="[^"]*depth=TECHNICAL_RECRUITER"[^>]*aria-current/,
      );
      expect(html).not.toMatch(
        /href="[^"]*depth=ENGINEERING_MANAGER"[^>]*aria-current/,
      );
      // Copy requirement: "recorded tooling" rather than "verified tooling"
      expect(html).toContain('recorded tooling');
      expect(html).not.toContain('verified tooling');
      // Strict removal of tab widget semantics
      expect(html).not.toContain('role="tablist"');
      expect(html).not.toContain('role="tab"');
      expect(html).not.toContain('role="tabpanel"');
      expect(html).not.toContain('aria-controls');
      expect(html).not.toContain('aria-selected');
      expect(html).not.toContain('tabindex');
    });

    it('renders native relative query links when sessionId is omitted', () => {
      const html = renderToStaticMarkup(
        <RoleLensSwitcher activeRole="ENGINEER" />,
      );

      expect(html).toContain('href="?depth=GENERALIST_RECRUITER"');
      expect(html).toContain('href="?depth=TECHNICAL_RECRUITER"');
      expect(html).toContain('href="?depth=ENGINEER"');
      expect(html).toContain('href="?depth=ENGINEERING_MANAGER"');

      // Engineer is active, others are not
      expect(html).toMatch(
        /href="\?depth=ENGINEER"[^>]*aria-current="page"|aria-current="page"[^>]*href="\?depth=ENGINEER"/,
      );
      expect(html).not.toMatch(
        /href="\?depth=GENERALIST_RECRUITER"[^>]*aria-current/,
      );
    });

    it('preserves unrelated query parameters and strips obsolete role param when switching profiles', () => {
      const html = renderToStaticMarkup(
        <RoleLensSwitcher
          activeRole="TECHNICAL_RECRUITER"
          sessionId="session-c-12345678"
          searchParams={{
            filter: 'failed',
            view: 'compact',
            role: 'ENGINEER',
          }}
        />,
      );

      // Preserves existing query params
      expect(html).toContain('filter=failed');
      expect(html).toContain('view=compact');
      // Strips deprecated role param
      expect(html).not.toContain('role=');
      // Active role is Technical Recruiter with aria-current="page"
      expect(html).toContain(
        'href="/evaluator/sessions/session-c-12345678?filter=failed&amp;view=compact&amp;depth=TECHNICAL_RECRUITER"',
      );
      expect(html).toMatch(
        /<a\s+(?:[^>]*?\s+)?aria-current="page"(?:[^>]*?\s+)?href="\/evaluator\/sessions\/session-c-12345678\?[^"]*depth=TECHNICAL_RECRUITER"/,
      );
      // Inactive role (Generalist) does not have aria-current
      expect(html).toMatch(
        /<a\s+(?!aria-current)[^>]*href="\/evaluator\/sessions\/session-c-12345678\?[^"]*depth=GENERALIST_RECRUITER"/,
      );
    });
  });

  describe('EvaluatorHeader', () => {
    it('renders Delimit branding, session reference, scenario title, and duration', () => {
      const html = renderToStaticMarkup(
        <EvaluatorHeader
          sessionId="session-c-12345678"
          scenarioTitle="Cache Staleness Investigation"
          sessionDuration={mockBriefing.sessionDuration}
          submittedAt="2026-09-16T17:12:34.000Z"
          activeRole="GENERALIST_RECRUITER"
        />,
      );

      expect(html).toContain('Delimit');
      expect(html).toContain('Evaluator Briefing');
      expect(html).toContain('Cache Staleness Investigation');
      expect(html).toContain('12m 34s recorded');
      expect(html).toContain('Session session-…');
      expect(html).toContain('Submitted');
      // Must NOT contain scorecard, score numbers, or grade
      expect(html).not.toContain('/ 100');
      expect(html).not.toContain('Score:');
      expect(html).not.toContain('Pass/Fail');
    });
  });

  describe('TaskBrief', () => {
    it('renders scenario context without capability claims', () => {
      const html = renderToStaticMarkup(
        <TaskBrief
          taskContext={mockBriefing.taskContext}
          showScenarioReference={true}
          contextAvailable={true}
        />,
      );

      expect(html).toContain('What this scenario examines');
      expect(html).toContain(
        'Investigate and resolve stale inventory cache reads.',
      );
      expect(html).toContain('Relevant system context');
      expect(html).toContain(
        'Stock reads must reflect committed DB transactions.',
      );
      expect(html).toContain('Relevant verification areas');
      expect(html).toContain('Storefront cache write-through or invalidation.');
    });

    it('renders Case G legacy context fallback message when context is absent', () => {
      const html = renderToStaticMarkup(
        <TaskBrief
          taskContext={mockBriefing.taskContext}
          showScenarioReference={true}
          contextAvailable={false}
        />,
      );

      expect(html).toContain(
        'Scenario evaluation context is not available for this earlier session.',
      );
      expect(html).toContain(
        'Recorded activity and submitted changes remain available.',
      );
    });
  });

  describe('VerificationSummary & Case C Truthfulness', () => {
    it('renders factual Case C runs: 0 passed, 3 failed -> edit -> 0 passed, 3 failed without verdict label', () => {
      const html = renderToStaticMarkup(
        <VerificationSummary
          verification={mockBriefing.recordedVerification}
          showChronology={true}
          isCaseD={false}
        />,
      );

      expect(html).toContain('Verification progression');
      expect(html).toContain('0 passed, 3 failed');
      expect(html).toContain('First recorded test run');
      expect(html).toContain('Final recorded test run');
      expect(html).toContain('Later workspace changes recorded');
      // Must NOT contain verdict labeling
      expect(html).not.toContain('FAILED CANDIDATE');
      expect(html).not.toContain('UNSATISFACTORY');
      expect(html).not.toContain('GRADE: F');
      // No synthetic invariant card
      expect(html).not.toContain('Additional invariant checks passed');
    });
  });

  describe('PlatformNotice & Case F Coverage', () => {
    it('renders Case F platform-owned capture gap notice with authoritative copy and heading', () => {
      const limitations: EvaluatorBriefing['evidenceLimitations'] = [
        {
          id: 'lim-1',
          authority: 'evidence',
          kind: 'workspace_capture_gap',
          basis: 'chronology',
          evidenceRefs: ['session:session-c:gap'],
          wording: {
            key: 'workspace_gap',
          },
          text: 'Delimit did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.',
        },
      ];

      const html = renderToStaticMarkup(
        <PlatformNotice limitations={limitations} />,
      );

      expect(html).toContain('Platform and observation notices');
      expect(html).toContain('Platform recording limitation');
      expect(html).toContain('Activity capture incomplete');
      expect(html).toContain(
        'Delimit did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.',
      );
    });
  });

  describe('RecordedActivity', () => {
    it('renders activity feed with timeline role and items', () => {
      const html = renderToStaticMarkup(
        <RecordedActivity
          activities={mockBriefing.observedActivity}
          evidenceEntries={mockReview.evidenceEntries}
          showDetailedTechnical={true}
        />,
      );

      expect(html).toContain('Recorded activity');
      expect(html).toContain('What happened');
      expect(html).toContain('role="feed"');
      expect(html).toContain('Test run: 0 passed, 3 failed.');
      expect(html).toContain('Edited inventory/service.py.');
    });
  });

  describe('SubmittedWork', () => {
    it('renders submitted changes header with anchor, line counts, and files', () => {
      const html = renderToStaticMarkup(
        <SubmittedWork
          submittedState={mockBriefing.submittedState}
          diff={mockReview.submittedDiff}
        />,
      );

      expect(html).toContain('id="submitted-changes"');
      expect(html).toContain('Submitted changes');
      expect(html).toContain('+5 lines');
      expect(html).toContain('−1 lines');
      expect(html).toContain('inventory/service.py');
    });

    it('renders diff behind progressive disclosure toggle when prominentDiff is false', () => {
      const html = renderToStaticMarkup(
        <SubmittedWork
          submittedState={mockBriefing.submittedState}
          diff={mockReview.submittedDiff}
          prominentDiff={false}
        />,
      );

      expect(html).toContain('submitted-diff-disclosure');
      expect(html).toContain('View submitted changes');
    });

    it('renders diff directly when prominentDiff is true', () => {
      const html = renderToStaticMarkup(
        <SubmittedWork
          submittedState={mockBriefing.submittedState}
          diff={mockReview.submittedDiff}
          prominentDiff={true}
        />,
      );

      expect(html).not.toContain('submitted-diff-disclosure');
      expect(html).not.toContain('View submitted changes');
      expect(html).toContain('submitted-diff-container');
    });
  });

  describe('ReviewGuidance', () => {
    it('renders factual policy text without a non-operational handoff action', () => {
      const html = renderToStaticMarkup(
        <ReviewGuidance guidance={mockBriefing.reviewGuidance} />,
      );

      expect(html).toContain('Review guidance');
      expect(html).toContain(
        'Final automated verification alone is not a hiring decision.',
      );
      expect(html).toContain(
        'Technical judgment remains a human evaluator decision.',
      );
      expect(html).not.toContain('Request engineering review');
      expect(html).not.toContain('disabled');
    });
  });

  describe('ArtifactAvailabilityCard', () => {
    it('renders clean status badges for Generalist Recruiter without SHA hashes', () => {
      const html = renderToStaticMarkup(
        <ArtifactAvailabilityCard
          availability={mockBriefing.artifactAvailability}
          provenance={mockBriefing.provenance}
          showTechnicalDetails={false}
        />,
      );

      expect(html).toContain('Artifact availability');
      expect(html).toContain('available');
      // No SHA-256 hashes
      expect(html).not.toContain(
        mockBriefing.provenance.authoritativeEvidenceSha256!,
      );
    });

    it('renders cryptographic SHA-256 and version provenance for Engineer', () => {
      const html = renderToStaticMarkup(
        <ArtifactAvailabilityCard
          availability={mockBriefing.artifactAvailability}
          provenance={mockBriefing.provenance}
          showTechnicalDetails={true}
        />,
      );

      expect(html).toContain('Artifact availability');
      expect(html).toContain('Evidence SHA-256');
      expect(html).toContain(
        mockBriefing.provenance.authoritativeEvidenceSha256!,
      );
      expect(html).toContain('deterministic-v3');
    });
  });

  describe('Role Projections via EvaluatorExperience', () => {
    const projectedGeneralist = projectBriefing(
      mockBriefing,
      'GENERALIST_RECRUITER',
    );
    const projectedTechnicalRecruiter = projectBriefing(
      mockBriefing,
      'TECHNICAL_RECRUITER',
    );
    const projectedEngineer = projectBriefing(mockBriefing, 'ENGINEER');
    const projectedEM = projectBriefing(mockBriefing, 'ENGINEERING_MANAGER');

    const evidence = {
      sessionId: 'session-c-12345678',
      activatedAt: '2026-09-16T17:00:00.000Z',
      submittedAt: '2026-09-16T17:12:34.000Z',
      diff: mockReview.submittedDiff,
      scenario: {
        id: '001',
        title: 'Cache Staleness Investigation',
        version: '1.0.0',
        brief: 'Investigate and resolve stale inventory cache reads.',
        evaluationContext: {
          version: '1.0.0',
          purpose: 'Context',
          systemInvariants: ['Invariant 1'],
          verificationTargets: ['Target 1'],
          interpretationWarnings: [],
          reviewPolicy: ['Policy 1'],
        },
      },
    };

    it('Generalist Recruiter: grouped activity, no raw event IDs, no SHA hashes, progressive diff disclosure, and unmounted technical record', () => {
      const html = renderToStaticMarkup(
        <EvaluatorExperience
          sessionId="session-c-12345678"
          activeRole="GENERALIST_RECRUITER"
          projection={projectedGeneralist}
          review={mockReview}
          evidence={evidence}
        />,
      );

      expect(html).toContain('Generalist Recruiter');
      expect(html).toContain('What happened');
      // No tab/tabpanel semantics in layout
      expect(html).not.toContain('role="tabpanel"');
      expect(html).not.toContain('role="tablist"');
      expect(html).not.toContain('role="tab"');
      expect(html).not.toContain('lens-panel');
      expect(html).not.toContain('aria-controls="lens-panel');
      // Progressive disclosure: diff behind toggle
      expect(html).toContain('View submitted changes');
      // Technical record must NOT be mounted
      expect(html).not.toContain('Open technical chronology');
      expect(html).not.toContain('technical-record-prominent');
      // No raw event IDs
      expect(html).not.toContain('evt_');
      // No raw SHA-256 hashes
      expect(html).not.toContain(
        mockBriefing.provenance.authoritativeEvidenceSha256!,
      );
      // No synthetic invariant checks
      expect(html).not.toContain('Additional invariant checks passed');
    });

    it('Engineer: prominent technical record, direct diff view, and navigation semantics', () => {
      const html = renderToStaticMarkup(
        <EvaluatorExperience
          sessionId="session-c-12345678"
          activeRole="ENGINEER"
          projection={projectedEngineer}
          review={mockReview}
          evidence={evidence}
        />,
      );

      // No tab/tabpanel semantics
      expect(html).not.toContain('role="tabpanel"');
      expect(html).not.toContain('role="tablist"');
      expect(html).not.toContain('role="tab"');
      expect(html).not.toContain('lens-panel');
      expect(html).not.toContain('aria-controls="lens-panel');
      // Prominent diff directly visible
      expect(html).not.toContain('View submitted changes');
      expect(html).toContain('Submitted changes');
      // Technical record mounted prominently
      expect(html).toContain('technical-record-prominent');
      expect(html).toContain('Open technical chronology');
      expect(html).toContain('Evidence SHA-256');
    });

    it('Technical Recruiter: technical footprint and verification progression', () => {
      const html = renderToStaticMarkup(
        <EvaluatorExperience
          sessionId="session-c-12345678"
          activeRole="TECHNICAL_RECRUITER"
          projection={projectedTechnicalRecruiter}
          review={mockReview}
          evidence={evidence}
        />,
      );

      expect(html).toContain('Verification progression');
      expect(html).toContain('View evidence');
      expect(html).not.toContain('Open technical chronology');
      expect(html).not.toContain('role="tabpanel"');
    });

    it('Engineering Manager: review guidance and synthesis without capability scores', () => {
      const html = renderToStaticMarkup(
        <EvaluatorExperience
          sessionId="session-c-12345678"
          activeRole="ENGINEERING_MANAGER"
          projection={projectedEM}
          review={mockReview}
          evidence={evidence}
        />,
      );

      expect(html).toContain('Review guidance');
      expect(html).not.toContain('Open technical chronology');
      expect(html).not.toContain('Candidate rank:');
      expect(html).not.toContain('Performance score:');
      expect(html).not.toContain('role="tabpanel"');
    });
  });
});
