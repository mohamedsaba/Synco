'use client';

import { useState } from 'react';
import type {
  BriefingDepthProfile,
  ProjectedBriefing,
} from '../../../../src/evaluator/project-evaluator-briefing';
import type {
  EvaluatorReviewEvidence,
  EvaluatorReviewPresentation,
} from '../../../../src/evaluator/evaluator-review-presentation';
import { EvaluatorHeader } from './evaluator-header';
import { PlatformNotice } from './platform-notice';
import { TaskBrief } from './task-brief';
import { VerificationSummary } from './verification-summary';
import { RecordedActivity } from './recorded-activity';
import { SubmittedWork } from './submitted-work';
import { ReviewGuidance } from './review-guidance';
import { ArtifactAvailabilityCard } from './artifact-availability-card';
import { TechnicalRecord } from './technical-record';

type EvaluatorExperienceProps = Readonly<{
  sessionId: string;
  evidence: EvaluatorReviewEvidence;
  review: EvaluatorReviewPresentation;
  projections: Record<BriefingDepthProfile, ProjectedBriefing>;
  initialRole: BriefingDepthProfile;
}>;

export const EvaluatorExperience = ({
  sessionId,
  evidence,
  review,
  projections,
  initialRole,
}: EvaluatorExperienceProps) => {
  const [activeRole, setActiveRole] =
    useState<BriefingDepthProfile>(initialRole);

  const handleRoleChange = (role: BriefingDepthProfile) => {
    setActiveRole(role);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('depth', role);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const projected = projections[activeRole];
  const { briefing, defaultDepth } = projected;
  const isCaseD =
    evidence.diff.includes('set_cached_stock') &&
    !evidence.diff.includes('diff --git a/inventory/cache.py');

  return (
    <div className="evaluator-v2-container" data-role-lens={activeRole}>
      <EvaluatorHeader
        sessionId={sessionId}
        scenarioTitle={evidence.scenario.title}
        sessionDuration={briefing.sessionDuration}
        submittedAt={evidence.submittedAt}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
      />

      <div className="evaluator-main-layout">
        {/* Platform Limitation Notices */}
        <PlatformNotice limitations={briefing.evidenceLimitations} />

        {/* 1. Task Context */}
        <TaskBrief
          taskContext={briefing.taskContext}
          showScenarioReference={defaultDepth.scenarioReference}
          contextAvailable={
            briefing.artifactAvailability.context === 'available'
          }
        />

        {/* 2. Recorded Verification Progression */}
        <VerificationSummary
          verification={briefing.recordedVerification}
          showChronology={defaultDepth.verificationChronology}
          isCaseD={isCaseD}
        />

        {/* 3. Observed Activity Feed */}
        <RecordedActivity
          activities={briefing.observedActivity}
          evidenceEntries={review.evidenceEntries}
          showDetailedTechnical={defaultDepth.technicalFootprint}
        />

        {/* 4. Submitted Code Changes */}
        <SubmittedWork
          submittedState={briefing.submittedState}
          diff={review.submittedDiff}
        />

        {/* 5. Evaluation Guidance / Policy */}
        {defaultDepth.reviewGuidance ? (
          <ReviewGuidance guidance={briefing.reviewGuidance} />
        ) : null}

        {/* 6. Artifact Availability & System Provenance */}
        {defaultDepth.artifactAvailability ? (
          <ArtifactAvailabilityCard
            availability={briefing.artifactAvailability}
            provenance={briefing.provenance}
            showTechnicalDetails={activeRole === 'ENGINEER'}
          />
        ) : null}

        {/* 7. Technical Record / Deep Chronology */}
        <div
          className={`technical-record-wrapper ${activeRole === 'ENGINEER' ? 'technical-record-prominent' : 'technical-record-deferred'}`}
        >
          <TechnicalRecord review={review} activatedAt={evidence.activatedAt} />
        </div>
      </div>
    </div>
  );
};
