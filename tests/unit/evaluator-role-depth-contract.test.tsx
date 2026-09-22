// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EvaluatorExperience } from '../../apps/web/app/evaluator/sessions/[sessionId]/evaluator-experience';
import { RecordedActivity } from '../../apps/web/app/evaluator/sessions/[sessionId]/recorded-activity';
import { buildEvaluatorBriefing } from '../../apps/web/src/evaluator/build-evaluator-briefing';
import {
  briefingDepthProfiles,
  projectBriefing,
  resolveBriefingDepthProfile,
  type BriefingDefaultDepth,
} from '../../apps/web/src/evaluator/project-evaluator-briefing';
import {
  buildEvaluatorReviewPresentation,
  formatEvaluatorClosureReason,
} from '../../apps/web/src/evaluator/evaluator-review-presentation';
import {
  commandEvents,
  noReconstruction,
  testEvidence,
} from '../support/briefing-test-evidence';

const expectedDepth: Record<string, BriefingDefaultDepth> = {
  GENERALIST_RECRUITER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
    technicalFootprint: false,
    verificationChronology: false,
    conciseSubmissionScope: true,
    evidenceLimitations: true,
    artifactAvailability: false,
    reviewGuidance: true,
    directEvidenceLinks: false,
    aiSummary: true,
    aiConfiguredModel: false,
    aiTokenTelemetry: false,
  },
  TECHNICAL_RECRUITER: {
    structuredEvidence: true,
    technicalRecord: false,
    scenarioReference: true,
    technicalFootprint: true,
    verificationChronology: true,
    conciseSubmissionScope: false,
    evidenceLimitations: false,
    artifactAvailability: false,
    reviewGuidance: true,
    directEvidenceLinks: true,
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: false,
  },
  ENGINEER: {
    structuredEvidence: true,
    technicalRecord: true,
    scenarioReference: true,
    technicalFootprint: true,
    verificationChronology: true,
    conciseSubmissionScope: false,
    evidenceLimitations: true,
    artifactAvailability: true,
    reviewGuidance: true,
    directEvidenceLinks: true,
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: true,
  },
  ENGINEERING_MANAGER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
    technicalFootprint: false,
    verificationChronology: false,
    conciseSubmissionScope: true,
    evidenceLimitations: true,
    artifactAvailability: true,
    reviewGuidance: true,
    directEvidenceLinks: true,
    aiSummary: true,
    aiConfiguredModel: true,
    aiTokenTelemetry: false,
  },
};

const evidence = {
  ...testEvidence(
    commandEvents('pytest', {
      stdoutPreview: '===== 3 passed in 0.1s =====',
    }),
  ),
  closureReason: 'candidate_submission' as const,
};
const briefing = buildEvaluatorBriefing(evidence, noReconstruction);
const review = buildEvaluatorReviewPresentation(evidence, noReconstruction);

describe('E3 evaluator role-depth contract', () => {
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

  it('resolves the default, all supported profiles, legacy role values, and unknown values deterministically', () => {
    expect(resolveBriefingDepthProfile(undefined)).toBe('GENERALIST_RECRUITER');
    expect(resolveBriefingDepthProfile('unknown')).toBe('GENERALIST_RECRUITER');
    for (const profile of briefingDepthProfiles) {
      expect(resolveBriefingDepthProfile(profile)).toBe(profile);
    }
    expect(resolveBriefingDepthProfile('ENGINEER')).toBe('ENGINEER');
  });

  it.each(briefingDepthProfiles)(
    '%s has a complete deterministic capability contract and preserves factual source references',
    (profile) => {
      const projection = projectBriefing(briefing, profile);

      expect(projection.defaultDepth).toEqual(expectedDepth[profile]);
      expect(Object.keys(projection.defaultDepth)).toHaveLength(13);
      expect(
        projection.briefing.evidenceIndex.map((entry) => entry.evidenceRef),
      ).toEqual(briefing.evidenceIndex.map((entry) => entry.evidenceRef));
      expect(projection.briefing.recordedVerification).toEqual(
        briefing.recordedVerification,
      );
      expect(review.chronology).toEqual(
        buildEvaluatorReviewPresentation(evidence, noReconstruction).chronology,
      );
    },
  );

  it.each(briefingDepthProfiles)(
    '%s renders only its configured depth surfaces without a candidate verdict',
    (profile) => {
      const projection = projectBriefing(briefing, profile);
      const html = renderToStaticMarkup(
        <EvaluatorExperience
          sessionId={evidence.sessionId}
          activeRole={profile}
          projection={projection}
          review={review}
          evidence={evidence}
        />,
      );
      const depth = projection.defaultDepth;

      expect(html.includes('View evidence')).toBe(depth.directEvidenceLinks);
      expect(html.includes('View submitted changes')).toBe(
        depth.conciseSubmissionScope,
      );
      expect(html.includes('Open technical chronology')).toBe(
        depth.technicalRecord,
      );
      expect(html.includes('Artifact availability')).toBe(
        depth.artifactAvailability,
      );
      expect(html.includes('Relevant system context')).toBe(
        depth.scenarioReference,
      );
      expect(html.includes('Review guidance')).toBe(depth.reviewGuidance);
      expect(html.includes('Candidate rank:')).toBe(false);
      expect(html.includes('Performance score:')).toBe(false);
    },
  );

  it.each([
    ['GENERALIST_RECRUITER', false, false],
    ['TECHNICAL_RECRUITER', true, true],
    ['ENGINEER', true, true],
    ['ENGINEERING_MANAGER', true, false],
  ] as const)(
    '%s applies direct links and structured records independently',
    async (profile, directEvidenceLinks, structuredEvidence) => {
      const depth = projectBriefing(briefing, profile).defaultDepth;
      await act(async () => {
        root?.render(
          <RecordedActivity
            activities={briefing.observedActivity}
            verification={briefing.recordedVerification}
            evidenceEntries={review.evidenceEntries}
            showDetailedTechnical={depth.technicalFootprint}
            showStructuredEvidence={depth.structuredEvidence}
            showDirectEvidenceLinks={depth.directEvidenceLinks}
            showVerificationChronology={depth.verificationChronology}
          />,
        );
      });

      const button = Array.from(
        container!.querySelectorAll<HTMLButtonElement>('button'),
      ).find((item) => item.textContent?.includes('View evidence'));
      expect(Boolean(button)).toBe(directEvidenceLinks);
      if (!button) return;

      await act(async () => button.click());
      expect(
        container!.textContent?.includes('Source evidence reference'),
      ).toBe(!structuredEvidence);
      expect(container!.textContent?.includes('Terminal activity')).toBe(
        structuredEvidence,
      );
    },
  );

  it('uses factual, exhaustive closure-reason labels', () => {
    expect(formatEvaluatorClosureReason('candidate_submission')).toBe(
      'Submitted by candidate',
    );
    expect(formatEvaluatorClosureReason('timeout')).toBe(
      'Assessment time ended',
    );
  });
});
