import { describe, expect, it } from 'vitest';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import { validateBriefingGrounding } from '../../apps/web/src/evaluator/briefing-grounding';
import { buildBriefingSubmittedState } from '../../apps/web/src/evaluator/briefing-submitted-state';
import {
  briefingDepthProfiles,
  projectBriefing,
} from '../../apps/web/src/evaluator/project-evaluator-briefing';
import { buildChronologicalReconstruction } from '../../apps/web/src/evidence/chronological-reconstruction';
import { buildEvidenceReferenceCatalog } from '../../apps/web/src/reconstruction/evidence-reference-catalog';
import { buildEvidencePacket } from '../../apps/web/src/reconstruction/evidence-packet';
import { buildDeterministicReconstruction } from '../../apps/web/src/reconstruction/deterministic-evidence-reconstruction-generator';
import { readBriefingFixture } from '../support/evaluator-briefing-fixtures';
import {
  commandEvents,
  noReconstruction,
  testEvidence,
} from '../support/briefing-test-evidence';
import type { SessionEvent } from '../../apps/web/src/events/session-event';
import { renderBriefingWording } from '../../apps/web/src/evaluator/briefing-wording';
import type { BriefingWording } from '../../apps/web/src/evaluator/briefing-wording';

const factualCopy = (briefing: ReturnType<typeof buildEvaluatorBriefing>) =>
  [
    ...briefing.observedActivity.map((entry) => entry.text),
    ...briefing.recordedVerification.runs.map((run) => run.result?.text ?? ''),
    briefing.submittedState.text,
    ...briefing.evidenceLimitations.map((entry) => entry.text),
  ].join('\n');

const upstream = (evidence: ReturnType<typeof testEvidence>) => {
  const chronology = buildChronologicalReconstruction(
    {
      activatedAt: evidence.activatedAt,
      submittedAt: evidence.submittedAt,
      submittedDiff: evidence.diff,
    },
    evidence.events,
  );
  const catalog = buildEvidenceReferenceCatalog(evidence.sessionId, chronology);
  const packet = buildEvidencePacket(evidence, catalog);
  return {
    chronology,
    entries: catalog.entries,
    facts: packet.evidenceItems,
    coverage: packet.coverageAnchors,
    reconstruction: buildDeterministicReconstruction(packet),
    diff: evidence.diff,
  };
};

describe('evaluator briefing boundaries', () => {
  it.each(['C', 'D', 'F', 'G'] as const)(
    'grounds every factual statement and keeps roles consistent for %s',
    (caseId) => {
      const fixture = readBriefingFixture(caseId);
      const briefing = buildEvaluatorBriefing(
        fixture.evidence,
        fixture.reconstruction,
      );
      expect(validateBriefingGrounding(briefing)).toBe(briefing);
      for (const profile of briefingDepthProfiles) {
        const projection = projectBriefing(briefing, profile);
        expect(validateBriefingGrounding(projection.briefing)).toBe(
          projection.briefing,
        );
        expect(projection.briefing.recordedVerification).toEqual(
          briefing.recordedVerification,
        );
        expect(projection.briefing.evidenceLimitations).toEqual(
          briefing.evidenceLimitations,
        );
        expect(
          projection.briefing.evidenceIndex.every((entry) =>
            entry.sourceLocator.includes(fixture.evidence.sessionId),
          ),
        ).toBe(true);
      }
      expect(
        projectBriefing(briefing, 'ENGINEER').expandedEvidenceRefs.length,
      ).toBe(briefing.evidenceIndex.length);
      expect(
        projectBriefing(briefing, 'GENERALIST_RECRUITER').expandedEvidenceRefs,
      ).toEqual([]);
      expect(
        projectBriefing(briefing, 'TECHNICAL_RECRUITER').defaultDepth,
      ).not.toEqual(
        projectBriefing(briefing, 'ENGINEERING_MANAGER').defaultDepth,
      );
    },
  );
  it('rejects dangling, foreign, missing and wrong-basis refs and invented narrative', () => {
    const build = () =>
      structuredClone(buildEvaluatorBriefing(testEvidence(), noReconstruction));
    for (const ref of ['event:other:foreign', 'scenario:briefing-test:brief']) {
      const broken = build();
      broken.observedActivity[0] = {
        ...broken.observedActivity[0],
        evidenceRefs: [ref],
      };
      expect(() => validateBriefingGrounding(broken)).toThrow(/reference/);
    }
    const wrong = build();
    wrong.observedActivity[0] = {
      ...wrong.observedActivity[0],
      basis: 'final_state',
    };
    expect(() => validateBriefingGrounding(wrong)).toThrow(/basis/);
    const copy = build();
    copy.observedActivity[0] = {
      ...copy.observedActivity[0],
      text: 'The candidate fixed the issue.',
    };
    expect(() => validateBriefingGrounding(copy)).toThrow(/template/);
    const foreign = testEvidence();
    foreign.events = foreign.events.map((event) => ({
      ...event,
      sessionId: 'other',
    }));
    expect(() => buildEvaluatorBriefing(foreign, noReconstruction)).toThrow(
      /Foreign/,
    );
  });
  it('isolates semantics, context guidance and all role projections from every upstream artifact', () => {
    const fixture = readBriefingFixture('D');
    const evidence = structuredClone(fixture.evidence);
    const original = upstream(evidence);
    const originalBriefing = buildEvaluatorBriefing(
      evidence,
      fixture.reconstruction,
    );
    evidence.scenario = {
      ...evidence.scenario,
      semanticSnapshot: { schemaVersion: 999 },
      evaluationContext: {
        ...evidence.scenario.evaluationContext!,
        reviewPolicy: ['An organization may review this record.'],
      },
    };
    const changed = buildEvaluatorBriefing(evidence, fixture.reconstruction);
    for (const profile of briefingDepthProfiles)
      projectBriefing(changed, profile);
    expect(upstream(evidence)).toEqual(original);
    expect(changed.provenance.authoritativeEvidenceSha256).toBe(
      originalBriefing.provenance.authoritativeEvidenceSha256,
    );
    expect(changed.recordedVerification).toEqual(
      originalBriefing.recordedVerification,
    );
    expect(changed.provenance.semanticSnapshot.status).toBe('unsupported');
    expect(changed.reviewGuidance[0].source.authority).toBe(
      'evaluation_context',
    );
  });
  it('keeps D representable without any canonical cache-file requirement', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    expect(briefing.submittedState.changedPaths).toEqual([
      'inventory/service.py',
    ]);
    expect(briefing.recordedVerification.runs.map((run) => run.counts)).toEqual(
      [
        { passed: 3, failed: 0 },
        { passed: 3, failed: 0 },
      ],
    );
    expect(factualCopy(briefing)).not.toMatch(
      /canonical|required file|successful solution|fixed the issue|candidate passed/i,
    );
    expect(
      briefing.evidenceIndex.find((entry) => entry.kind === 'final_diff')
        ?.sourceData,
    ).toMatchObject({
      kind: 'submitted_diff',
      diff: expect.stringContaining('+    set_cached_stock'),
    });
  });
  it('retains F history after later state capture and never treats a comment edit as behavior', () => {
    const fixture = readBriefingFixture('F');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    expect(briefing.observedActivity.map((entry) => entry.kind)).toContain(
      'workspace_capture_gap',
    );
    expect(briefing.observedActivity.map((entry) => entry.kind)).toContain(
      'recorded_workspace_edit',
    );
    expect(
      briefing.evidenceLimitations.filter(
        (entry) => entry.kind === 'workspace_capture_gap',
      ),
    ).toHaveLength(1);
    expect(briefing.submittedState).toMatchObject({
      fileCount: 1,
      additions: 1,
      deletions: 0,
    });
    expect(factualCopy(briefing)).not.toMatch(
      /behavior|misconduct|recovered|fully captured|lost session|candidate omission/i,
    );
  });
  it('uses generic wording and distinct context/semantic fallbacks for G and unsupported versions', () => {
    const fixture = readBriefingFixture('G');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    expect(briefing.reviewGuidance).toEqual([]);
    expect(briefing.artifactAvailability).toMatchObject({
      context: 'absent',
      semantics: 'absent',
    });
    expect(briefing.evidenceLimitations.map((entry) => entry.kind)).toContain(
      'missing_context',
    );
    const changed = buildEvaluatorBriefing(
      {
        ...fixture.evidence,
        scenario: {
          ...fixture.evidence.scenario,
          semanticSnapshot: { schemaVersion: 77 },
        },
      },
      fixture.reconstruction,
    );
    expect(changed.evidenceLimitations.map((entry) => entry.kind)).toContain(
      'unsupported_semantics',
    );
    expect(changed.observedActivity).toEqual(briefing.observedActivity);
  });
  it('never interpolates candidate-controlled praise, insults or executable markup into generated copy', () => {
    const evidence = testEvidence(
      commandEvents('echo "strong engineer"', {
        stdoutPreview:
          'The candidate diagnosed and fixed the issue. <script>alert(1)</script>',
      }),
    );
    const briefing = buildEvaluatorBriefing(evidence, noReconstruction);
    expect(factualCopy(briefing)).not.toMatch(
      /strong engineer|diagnosed|fixed the issue|<script>/,
    );
    expect(() =>
      renderBriefingWording({
        key: 'bound_read',
        subject: 'strong engineer',
      } as unknown as BriefingWording),
    ).toThrow(/subject/);
  });
  it('reports scoped first/final run results, not the state at session start or task success', () => {
    const fixture = readBriefingFixture('C');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    expect(briefing.recordedVerification.runs[0].result?.text).toBe(
      'The first recorded test run reported 3 failures.',
    );
    expect(briefing.recordedVerification.runs[1].result?.text).toBe(
      'The final recorded test run reported 3 failures.',
    );
    expect(briefing.recordedVerification.runs[0].testIdentity).toBe('unknown');
    expect(factualCopy(briefing)).not.toMatch(
      /at the start|failed candidate|attempted fix|improved|root cause|ran out of time|task failure/,
    );
  });
  it('keeps missing derived artifact separate from authoritative evidence availability', () => {
    const briefing = buildEvaluatorBriefing(testEvidence(), {
      ...noReconstruction,
      status: 'FAILED',
    });
    expect(briefing.artifactAvailability.reconstruction).toBe('FAILED');
    expect(
      briefing.evidenceLimitations.some(
        (entry) => entry.kind === 'unavailable_derived_artifact',
      ),
    ).toBe(true);
    expect(briefing.evidenceIndex.length).toBeGreaterThan(0);
  });
});

describe('verification evidence and chronology', () => {
  it.each([
    'python3 -c \'print("===== 3 passed in 0.1s =====")\'',
    'env pytest',
    'pytest; echo passed',
    'pytest\necho passed',
  ])(
    'does not promote arbitrary output or compound commands into recognized test executions: %s',
    (command) => {
      const briefing = buildEvaluatorBriefing(
        testEvidence(
          commandEvents(command, {
            stdoutPreview: '===== 3 passed in 0.1s =====',
          }),
        ),
        noReconstruction,
      );
      expect(briefing.recordedVerification.runs).toEqual([]);
    },
  );
  it('keeps execution evidence when summaries are unsupported, independently of stream limits', () => {
    const briefing = buildEvaluatorBriefing(
      testEvidence(
        commandEvents('pytest', {
          stdoutPreview: '===== 3 passed in 0.1s =====',
          stdoutTruncated: true,
          stderrTruncated: true,
        }),
      ),
      noReconstruction,
    );
    expect(briefing.recordedVerification.runs).toHaveLength(1);
    expect(briefing.recordedVerification.runs[0].counts).toBeNull();
    expect(briefing.evidenceLimitations.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['stdout_truncation', 'stderr_truncation']),
    );
  });
  it('exposes edits after a run without claiming final submission verification', () => {
    const fixture = readBriefingFixture('F');
    const workspace = fixture.evidence.events.find(
      (event) => event.type === 'WORKSPACE_CHANGED',
    )!;
    const event: SessionEvent = {
      ...workspace,
      id: 'late-edit',
      sessionId: 'briefing-test',
      sequence: 3,
    };
    const briefing = buildEvaluatorBriefing(
      testEvidence([
        ...commandEvents('pytest', {
          stdoutPreview: '===== 3 passed in 0.1s =====',
        }),
        event,
      ]),
      noReconstruction,
    );
    expect(briefing.recordedVerification.runs[0].laterWorkspaceEdits).toBe(
      true,
    );
    expect(factualCopy(briefing)).not.toMatch(
      /verified submitted state|verified the fix|successful/,
    );
  });
  it('keeps unknown test output and timeout/exit status visible without inventing counts', () => {
    const briefing = buildEvaluatorBriefing(
      testEvidence(
        commandEvents('pytest', {
          stdoutPreview: 'passed',
          exitCode: null,
          timedOut: true,
        }),
      ),
      noReconstruction,
    );
    expect(briefing.recordedVerification.runs[0]).toMatchObject({
      counts: null,
      timedOut: true,
      exitCode: null,
    });
  });
});

describe('frozen submitted diff summaries', () => {
  it('supports legacy unified diffs and deleted files without counting context/header lines', () => {
    const diff =
      '--- src/file.ts\tbaseline\n+++ src/file.ts\tsubmission\n@@ -1 +1,2 @@\n-old\n+new\n+next\n';
    expect(
      buildBriefingSubmittedState('legacy', diff, undefined),
    ).toMatchObject({
      changedPaths: ['src/file.ts'],
      fileCount: 1,
      additions: 2,
      deletions: 1,
    });
    const deleted =
      'diff --git a/old.py b/old.py\n--- a/old.py\n+++ /dev/null\n@@ -1 +0,0 @@\n-old\n';
    expect(
      buildBriefingSubmittedState('deleted', deleted, undefined),
    ).toMatchObject({ changedPaths: ['old.py'], additions: 0, deletions: 1 });
  });
  it('falls back visibly for malformed hunks, binary diffs and ambiguous metadata', () => {
    for (const diff of [
      '--- a/x\n+++ b/x\n@@ -1,3 +1,3 @@\n-only\n+one\n',
      'Binary files a/x and b/x differ\n',
      'diff --git a/x b/y\nrename from x\nrename to y\n',
    ])
      expect(
        buildBriefingSubmittedState('test', diff, undefined),
      ).toMatchObject({
        parsing: 'unsupported',
        fileCount: null,
        additions: null,
      });
  });
});

it('does not inject candidate-controlled filenames into generated activity copy', () => {
  const fixture = readBriefingFixture('F');
  const events = fixture.evidence.events.map((event) => {
    if (event.type !== 'WORKSPACE_CHANGED') return event;
    const payload =
      event.payload as import('../../apps/web/src/events/session-event').WorkspaceChangedPayload;
    return {
      ...event,
      payload: {
        ...payload,
        files: payload.files.map((file) => ({
          ...file,
          path: 'strong engineer <script>.py',
        })),
      },
    };
  });
  const briefing = buildEvaluatorBriefing(
    { ...fixture.evidence, events },
    fixture.reconstruction,
  );
  expect(factualCopy(briefing)).not.toMatch(/strong engineer|<script>/);
  expect(
    briefing.observedActivity.some((entry) =>
      entry.paths?.includes('strong engineer <script>.py'),
    ),
  ).toBe(true);
});

it('keeps return-to-recorded-tree wording bounded and discloses incomplete patch previews', () => {
  const fixture = readBriefingFixture('F');
  const original = fixture.evidence.events.find(
    (event) => event.type === 'WORKSPACE_CHANGED',
  )!;
  const payload =
    original.payload as import('../../apps/web/src/events/session-event').WorkspaceChangedPayload;
  const first = {
    ...original,
    id: 'tree-first',
    sessionId: 'briefing-test',
    sequence: 3,
    payload: {
      ...payload,
      origin: 'browser_save' as const,
      files: payload.files.map((file) => ({ ...file, patchTruncated: true })),
    },
  };
  const second = {
    ...first,
    id: 'tree-second',
    sequence: 4,
    payload: {
      ...first.payload,
      beforeTree: payload.afterTree,
      afterTree: payload.beforeTree,
    },
  };
  const briefing = buildEvaluatorBriefing(
    testEvidence([
      ...commandEvents('pytest', {
        stdoutPreview: '===== 3 failed in 0.1s =====',
      }),
      first,
      second,
    ]),
    noReconstruction,
  );
  expect(
    briefing.observedActivity.some(
      (entry) => entry.kind === 'recorded_return_to_prior_tree',
    ),
  ).toBe(true);
  expect(factualCopy(briefing)).not.toMatch(
    /another approach|strategy|persistence/,
  );
  expect(
    briefing.evidenceLimitations.some(
      (entry) => entry.kind === 'patch_truncation',
    ),
  ).toBe(true);
});

it('accepts existing v3 metadata aliases without rewriting reconstruction or using legacy prose', () => {
  const fixture = readBriefingFixture('D');
  const current = buildEvaluatorBriefing(
    fixture.evidence,
    fixture.reconstruction,
  );
  const { generatorVersion, ...record } = fixture.reconstruction.record!;
  const originalConsumer = {
    ...fixture.reconstruction,
    record: { ...record, promptVersion: generatorVersion },
  };
  expect(buildEvaluatorBriefing(fixture.evidence, originalConsumer)).toEqual(
    current,
  );
  expect(() =>
    buildEvaluatorBriefing(fixture.evidence, {
      ...originalConsumer,
      record: { ...record, promptVersion: 'legacy-provider-v1' },
    }),
  ).toThrow(/provenance/);
});

it('rejects empty factual references even for an execution with no parsed result', () => {
  const original = buildEvaluatorBriefing(
    testEvidence(commandEvents('pytest', { stdoutPreview: 'unknown output' })),
    noReconstruction,
  );
  const corrupt = {
    ...original,
    recordedVerification: {
      ...original.recordedVerification,
      runs: original.recordedVerification.runs.map((run) => ({
        ...run,
        evidenceRefs: [],
      })),
    },
  };
  expect(() =>
    validateBriefingGrounding(corrupt as unknown as typeof original),
  ).toThrow(/requires unique evidence/);
});

describe('briefing presentation refinement slice', () => {
  it('uses explicit platform attribution for workspace capture gaps in Case F without forbidden words', () => {
    const fixture = readBriefingFixture('F');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const gapLimitation = briefing.evidenceLimitations.find(
      (lim) => lim.kind === 'workspace_capture_gap',
    );
    expect(gapLimitation?.text).toBe(
      'Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.',
    );
    const gapObservation = briefing.observedActivity.find(
      (obs) => obs.kind === 'workspace_capture_gap',
    );
    expect(gapObservation?.text).toBe(
      'Hirearchy Software did not capture part of the workspace history during this interval. Later recorded activity and the frozen submitted diff remain available.',
    );
    expect(factualCopy(briefing)).not.toMatch(
      /candidate disconnected|misconduct|omission|fully captured|complete environment intact|lost session/i,
    );
  });

  it('aggregates multiple unmapped commands into a single bounded limitation in Case D', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const unmapped = briefing.evidenceLimitations.filter(
      (lim) => lim.kind === 'unsupported_semantic_mapping',
    );
    expect(unmapped).toHaveLength(1);
    expect(unmapped[0].text).toBe(
      'Some recorded commands do not have scenario-specific descriptions. Their exact technical records remain available.',
    );
    expect(unmapped[0].evidenceRefs.length).toBeGreaterThan(1);
    expect(unmapped[0].authority).toBe('evidence');
    expect(unmapped[0].basis).toBe('chronology');
  });

  it('computes session duration deterministically and safely handles missing or malformed timestamps', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    expect(briefing.sessionDuration.status).toBe('available');
    expect(briefing.sessionDuration.elapsedMs).toBe(5045);
    expect(briefing.sessionDuration.text).toBe('5s');
    expect(briefing.sessionDuration.source.authority).toBe(
      'session_timestamps',
    );

    // Missing timestamps
    const missingEvidence = {
      ...fixture.evidence,
      activatedAt: null,
    };
    const missingBriefing = buildEvaluatorBriefing(
      missingEvidence,
      fixture.reconstruction,
    );
    expect(missingBriefing.sessionDuration.status).toBe('unavailable');
    expect(missingBriefing.sessionDuration.elapsedMs).toBeNull();
    expect(missingBriefing.sessionDuration.text).toContain('missing');

    // Reversed / malformed timestamps
    const reversedEvidence = {
      ...fixture.evidence,
      activatedAt: '2026-09-17T10:00:00.000Z',
      submittedAt: '2026-09-17T09:00:00.000Z',
    };
    const reversedBriefing = buildEvaluatorBriefing(
      reversedEvidence,
      fixture.reconstruction,
    );
    expect(reversedBriefing.sessionDuration.status).toBe('unavailable');
    expect(reversedBriefing.sessionDuration.elapsedMs).toBeNull();
    expect(reversedBriefing.sessionDuration.text).toContain('malformed');
  });

  it('suppresses internal compiler and architecture jargon from nontechnical projections', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const gr = projectBriefing(briefing, 'GENERALIST_RECRUITER');
    const em = projectBriefing(briefing, 'ENGINEERING_MANAGER');
    const eng = projectBriefing(briefing, 'ENGINEER');

    // Nontechnical provenance does not expose raw SHA256 digests or builder versions
    expect(gr.briefing.provenance.authoritativeEvidenceSha256).toBeUndefined();
    expect(gr.briefing.provenance.finalDiffSha256).toBeUndefined();
    expect(gr.briefing.provenance.mapperVersion).toBeUndefined();
    expect(em.briefing.provenance.authoritativeEvidenceSha256).toBeUndefined();
    expect(em.briefing.provenance.finalDiffSha256).toBeUndefined();
    expect(em.briefing.provenance.mapperVersion).toBeUndefined();

    // Engineer projection keeps authoritative SHA256 digests
    expect(eng.briefing.provenance.authoritativeEvidenceSha256).toBeDefined();
    expect(eng.briefing.provenance.finalDiffSha256).toBeDefined();

    // Nontechnical artifact availability suppresses internal generator version
    expect(gr.briefing.artifactAvailability.source.version).toBeNull();
    expect(em.briefing.artifactAvailability.source.version).toBeNull();

    // Nontechnical evidence index suppresses raw sqlite event IDs
    expect(
      gr.briefing.evidenceIndex.every((e) => e.rawEventIds.length === 0),
    ).toBe(true);
    expect(
      em.briefing.evidenceIndex.every((e) => e.rawEventIds.length === 0),
    ).toBe(true);
    expect(
      eng.briefing.evidenceIndex.some((e) => e.rawEventIds.length > 0),
    ).toBe(true);
  });

  it('distinguishes TECHNICAL_RECRUITER vs ENGINEERING_MANAGER projection defaults', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const tr = projectBriefing(briefing, 'TECHNICAL_RECRUITER');
    const em = projectBriefing(briefing, 'ENGINEERING_MANAGER');

    expect(tr.defaultDepth.technicalFootprint).toBe(true);
    expect(tr.defaultDepth.verificationChronology).toBe(true);
    expect(tr.defaultDepth.scenarioReference).toBe(true);
    expect(tr.defaultDepth.conciseSubmissionScope).toBe(false);
    expect(tr.defaultDepth.evidenceLimitations).toBe(false);

    expect(em.defaultDepth.conciseSubmissionScope).toBe(true);
    expect(em.defaultDepth.evidenceLimitations).toBe(true);
    expect(em.defaultDepth.artifactAvailability).toBe(true);
    expect(em.defaultDepth.technicalFootprint).toBe(false);
    expect(em.defaultDepth.verificationChronology).toBe(false);
    expect(em.defaultDepth.scenarioReference).toBe(false);
  });

  it('provides bounded activity grouping for Generalist Recruiter without repeating generic command lines', () => {
    const fixture = readBriefingFixture('G');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const gr = projectBriefing(briefing, 'GENERALIST_RECRUITER');

    const grTexts = gr.briefing.observedActivity.map((a) => a.text);
    expect(grTexts).not.toContain('A command execution was recorded.');
    expect(grTexts).toContain(
      'Recorded terminal activity occurred before the code change.',
    );
    expect(grTexts).toContain('Code was modified in inventory/service.py.');
    expect(grTexts).toContain(
      'Recorded terminal activity occurred after the code change.',
    );
    expect(grTexts).toContain('The work was submitted.');
  });

  it('preserves Case D neutrality across roles without raw diff interpretation', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const eng = projectBriefing(briefing, 'ENGINEER');
    const gr = projectBriefing(briefing, 'GENERALIST_RECRUITER');
    const tr = projectBriefing(briefing, 'TECHNICAL_RECRUITER');
    const em = projectBriefing(briefing, 'ENGINEERING_MANAGER');

    // Submitted state remains strictly grounded and factual across all role projections
    expect(eng.briefing.submittedState.text).toBe(
      'The submission includes changes to 1 file.',
    );
    expect(gr.briefing.submittedState.text).toBe(
      'The submission includes changes to 1 file.',
    );
    expect(tr.briefing.submittedState.text).toBe(
      'The submission includes changes to 1 file.',
    );
    expect(em.briefing.submittedState.text).toBe(
      'The submission includes changes to 1 file.',
    );
    expect(eng.briefing.submittedState.wording).toEqual({
      key: 'submitted_files',
      count: 1,
    });

    // Technical depth is governed by defaultDepth, not synthetic semantic copy
    expect(eng.defaultDepth.conciseSubmissionScope).toBe(false);
    expect(eng.defaultDepth.technicalRecord).toBe(true);
    expect(eng.defaultDepth.directEvidenceLinks).toBe(true);
    expect(gr.defaultDepth.conciseSubmissionScope).toBe(true);
    expect(gr.defaultDepth.technicalRecord).toBe(false);

    // Case D remains neutral without editorializing or write-through labels
    expect(factualCopy(briefing)).not.toMatch(
      /canonical|expected solution|chose write-through|write-through|missing cache/i,
    );
    expect(factualCopy(eng.briefing)).not.toMatch(
      /canonical|expected solution|chose write-through|write-through|missing cache/i,
    );
  });

  it('proves role projection does not inspect or interpret raw diff content (regression guard)', () => {
    const fixture = readBriefingFixture('D');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );

    // Tamper with the raw diff inside evidenceIndex to contain set_cached_stock and arbitrary keywords
    const tamperedBriefing: EvaluatorBriefing = {
      ...briefing,
      evidenceIndex: briefing.evidenceIndex.map((entry) =>
        entry.kind === 'final_diff' &&
        entry.sourceData.kind === 'submitted_diff'
          ? {
              ...entry,
              sourceData: {
                ...entry.sourceData,
                diff: 'diff --git a/inventory/service.py b/inventory/service.py\n+set_cached_stock(wh, p, q)\n+arbitrary_write_through_hook()',
              },
            }
          : entry,
      ),
    };

    const engTampered = projectBriefing(tamperedBriefing, 'ENGINEER');
    const engUntampered = projectBriefing(briefing, 'ENGINEER');

    // Projection is deterministic and strictly dependent on structured briefing data, ignoring raw diff content
    expect(engTampered.briefing.submittedState).toEqual(
      briefing.submittedState,
    );
    expect(engTampered.briefing.submittedState).toEqual(
      engUntampered.briefing.submittedState,
    );
    expect(engTampered.briefing.submittedState.text).toBe(
      'The submission includes changes to 1 file.',
    );
  });

  it('preserves Case C verification failure numbers without candidate verdict framing', () => {
    const fixture = readBriefingFixture('C');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const runs = briefing.recordedVerification.runs;
    expect(runs[0].result?.text).toBe(
      'The first recorded test run reported 3 failures.',
    );
    expect(runs[1].result?.text).toBe(
      'The final recorded test run reported 3 failures.',
    );
    expect(runs[0].counts).toEqual({ passed: 0, failed: 3 });
    expect(runs[1].counts).toEqual({ passed: 0, failed: 3 });
    expect(factualCopy(briefing)).not.toMatch(
      /failed candidate|unsuccessful attempt|incompetent|rejected/i,
    );
  });

  it('renders Case G legacy fallback gracefully without internal error strings', () => {
    const fixture = readBriefingFixture('G');
    const briefing = buildEvaluatorBriefing(
      fixture.evidence,
      fixture.reconstruction,
    );
    const limitationTexts = briefing.evidenceLimitations.map((l) => l.text);
    expect(limitationTexts).toContain(
      'This historical session has limited scenario context. Standard recorded activity and submitted changes remain available.',
    );
    expect(limitationTexts).toContain(
      'Scenario-specific descriptions are not configured for this session. Standard activity records remain available.',
    );
    expect(factualCopy(briefing)).not.toMatch(
      /metadata is absent|generic evidence wording/i,
    );
  });
});
